"""Business routes — onboarding, opportunities, analytics, demand, explore.

C1 stubs: return deterministic contract-shaped responses.

Routes:
    POST /api/business/onboard
    GET  /api/business/{id}/analytics
    GET  /api/business/{id}/demand
    GET  /api/business/{id}/opportunities
    GET  /api/explore/{city}

Rules (AGENTS.md / API_CONTRACT.md):
  - All onboarding items stored with data_state "reported" (never "verified").
  - analytics signals state correlations only — never causal claims.
  - is_demo_data must be prominently exposed on all demo analytics.
  - demand gaps feed the Opportunity Detector.
"""

from fastapi import APIRouter

from app.models.schemas import (
    AnalyticsFunnel,
    AnalyticsSignal,
    AttributeWithState,
    BusinessAnalyticsResponse,
    BusinessDemandResponse,
    ChecklistItem,
    DataState,
    DemandGap,
    ExperienceCard,
    ExperienceTranslationEntry,
    ExperienceTranslations,
    ExploreResponse,
    OnboardRequest,
    OnboardResponse,
    Opportunity,
    OpportunitiesResponse,
    RequirementSearchCount,
)

router = APIRouter(tags=["Business & Explore"])


# ---------------------------------------------------------------------------
# C1 STUBS — real MongoDB + aggregation logic in later C tasks
# ---------------------------------------------------------------------------

@router.post("/api/business/onboard", status_code=201, response_model=OnboardResponse)
async def onboard_business(payload: OnboardRequest) -> OnboardResponse:
    """Business self-assessment submission.

    C1 stub: accepts payload but does not persist.
    Contract rule: all submitted items are stored with data_state "reported".
    Real persistence + "verified" rejection implemented in later C tasks.
    """
    return OnboardResponse(
        status="stub_onboarded",
        business_id="biz_stub_001",
        data_state=DataState.reported,
        note="C1 stub — not persisted. All items will be stored as 'reported' per contract.",
    )


from fastapi import HTTPException
from datetime import datetime, timedelta, timezone
from app.db.mongo import get_db

@router.get("/api/business/{business_id}/analytics", response_model=BusinessAnalyticsResponse)
async def get_analytics(business_id: str) -> BusinessAnalyticsResponse:
    """Weekly Pro analytics dashboard data.
    C15 implementation: Aggregates analytics_events using MongoDB.
    """
    db = get_db()
    business = db["businesses"].find_one({"_id": business_id})
    if not business:
        raise HTTPException(status_code=404, detail={"code": "ERR_BUSINESS_NOT_FOUND", "detail": "Business not found"})
        
    is_demo_data = False
    hotel_id = business.get("hotel_id")
    if hotel_id:
        hotel = db["hotels"].find_one({"_id": hotel_id})
        if hotel and hotel.get("data_state") == "demo_synthetic":
            is_demo_data = True
    
    # "this_week" window
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    week_ago = week_ago.replace("+00:00", "Z")

    pipeline = [
        {"$match": {
            "business_id": business_id,
            "timestamp": {"$gte": week_ago}
        }},
        {"$group": {
            "_id": "$session_id",
            "listing_impressions": {"$sum": {"$cond": [{"$eq": ["$event_type", "listing_impression"]}, 1, 0]}},
            "listing_opens": {"$sum": {"$cond": [{"$eq": ["$event_type", "listing_open"]}, 1, 0]}},
            "detail_opens": {"$sum": {"$cond": [{"$eq": ["$event_type", "detail_open"]}, 1, 0]}},
            "saves": {"$sum": {"$cond": [{"$eq": ["$event_type", "save"]}, 1, 0]}},
            "booking_starts": {"$sum": {"$cond": [{"$eq": ["$event_type", "booking_start"]}, 1, 0]}},
            "bookings": {"$sum": {"$cond": [{"$eq": ["$event_type", "booking_complete"]}, 1, 0]}},
            
            "accessibility_view": {"$max": {"$cond": [{"$eq": ["$event_type", "accessibility_view"]}, 1, 0]}}
        }},
        {"$group": {
            "_id": None,
            "listing_impressions": {"$sum": "$listing_impressions"},
            "listing_opens": {"$sum": "$listing_opens"},
            "detail_opens": {"$sum": "$detail_opens"},
            "saves": {"$sum": "$saves"},
            "booking_starts": {"$sum": "$booking_starts"},
            "bookings": {"$sum": "$bookings"},
            
            "acc_detail_opens": {"$sum": {"$cond": [{"$eq": ["$accessibility_view", 1]}, "$detail_opens", 0]}},
            "acc_bookings": {"$sum": {"$cond": [{"$eq": ["$accessibility_view", 1]}, "$bookings", 0]}},
            "non_acc_detail_opens": {"$sum": {"$cond": [{"$eq": ["$accessibility_view", 0]}, "$detail_opens", 0]}},
            "non_acc_bookings": {"$sum": {"$cond": [{"$eq": ["$accessibility_view", 0]}, "$bookings", 0]}},
        }}
    ]
    
    cursor = list(db["analytics_events"].aggregate(pipeline))
    
    if not cursor:
        funnel = AnalyticsFunnel(
            listing_impressions=0, listing_opens=0, detail_opens=0,
            saves=0, booking_starts=0, bookings=0
        )
        signals = []
    else:
        data = cursor[0]
        funnel = AnalyticsFunnel(
            listing_impressions=data.get("listing_impressions", 0),
            listing_opens=data.get("listing_opens", 0),
            detail_opens=data.get("detail_opens", 0),
            saves=data.get("saves", 0),
            booking_starts=data.get("booking_starts", 0),
            bookings=data.get("bookings", 0)
        )
        
        signals = []
        acc_do = data.get("acc_detail_opens", 0)
        acc_bk = data.get("acc_bookings", 0)
        non_do = data.get("non_acc_detail_opens", 0)
        non_bk = data.get("non_acc_bookings", 0)
        
        if acc_do > 0 and non_do > 0:
            acc_dropoff = 1.0 - (acc_bk / acc_do)
            non_dropoff = 1.0 - (non_bk / non_do)
            
            if acc_dropoff > non_dropoff:
                signals.append(AnalyticsSignal(
                    type="drop_off_correlation",
                    text="Users who viewed accessibility information showed a higher drop-off."
                ))

    return BusinessAnalyticsResponse(
        period="this_week",
        is_demo_data=is_demo_data,
        funnel=funnel,
        signals=signals
    )


@router.get("/api/business/{business_id}/demand", response_model=BusinessDemandResponse)
async def get_demand(business_id: str) -> BusinessDemandResponse:
    """Traveler demand analytics — search counts + property gaps.
    C16 implementation: Aggregates search_requests using MongoDB.
    """
    db = get_db()
    business = db["businesses"].find_one({"_id": business_id})
    if not business:
        raise HTTPException(status_code=404, detail={"code": "ERR_BUSINESS_NOT_FOUND", "detail": "Business not found"})
        
    is_demo_data = False
    hotel_id = business.get("hotel_id")
    hotel = None
    if hotel_id:
        hotel = db["hotels"].find_one({"_id": hotel_id})
        if hotel and hotel.get("data_state") == "demo_synthetic":
            is_demo_data = True
            
    # "this_week" window
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    week_ago = week_ago.replace("+00:00", "Z")

    pipeline = [
        {"$match": {"timestamp": {"$gte": week_ago}}},
        {"$unwind": "$accessibility_required"},
        {"$group": {"_id": "$accessibility_required", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    
    cursor = list(db["search_requests"].aggregate(pipeline))
    
    counts = []
    gaps = []
    
    checklist_map = {}
    if hotel and "accessibility_items" in hotel:
        for item in hotel["accessibility_items"]:
            checklist_map[item.get("label")] = item.get("data_state", "not_verified")
            
    for doc in cursor:
        label = doc["_id"]
        count = doc["count"]
        counts.append(RequirementSearchCount(label=label, count=count))
        
        # Check gap
        state = checklist_map.get(label, "not_verified")
        if state == "not_verified":
            gaps.append(DemandGap(label=label, count=count, property_data_state=DataState.not_verified))

    return BusinessDemandResponse(
        period="this_week",
        is_demo_data=is_demo_data,
        requirement_search_counts=counts,
        gaps=gaps
    )


@router.get("/api/business/{business_id}/opportunities", response_model=OpportunitiesResponse)
async def get_opportunities(business_id: str) -> OpportunitiesResponse:
    """Opportunity Detector feed — resource + demand-gap opportunities.

    C1 stub: returns hardcoded opportunities matching
    docs/API_CONTRACT.md §GET /api/business/{id}/opportunities.
    Both resource-based and demand-gap types are included.
    Real logic (connecting analytics demand gaps to the feed) implemented in C15/C16.
    """
    return OpportunitiesResponse(
        opportunities=[
            Opportunity(
                severity="red",
                title="Food Waste",
                estimate="18 kg/day",
                suggested_action="Reduce buffet production by ~10%",
                is_demo_data=True,
                type="resource",
            ),
            Opportunity(
                severity="red",
                title="Demand gap: roll-in shower",
                suggested_action="Confirm or add this feature — 214 recent traveler searches",
                is_demo_data=True,
                type="demand_gap",
            ),
        ]
    )


@router.get("/api/explore/{city}", response_model=ExploreResponse)
async def explore_city(city: str) -> ExploreResponse:
    """Experience cards for a given city.

    C1 stub: returns hardcoded experience cards matching
    docs/API_CONTRACT.md §GET /api/explore/{city}.
    Each card carries data_state per contract.
    Real MongoDB lookup implemented in later C tasks.
    """
    return ExploreResponse(
        city=city,
        experiences=[
            ExperienceCard(
                id="exp_001",
                translations=ExperienceTranslations(
                    en=ExperienceTranslationEntry(name="Accessible beach walk — Miramar"),
                    hi=ExperienceTranslationEntry(name="shown in English"),
                    mr=ExperienceTranslationEntry(name="shown in English"),
                ),
                accessibility=AttributeWithState(
                    value="step_free_path",
                    data_state=DataState.community_confirmed,
                ),
                environmental_impact=AttributeWithState(
                    value="low",
                    data_state=DataState.reported,
                ),
                cost_inr=0,
                duration_minutes=60,
                distance_km=2.1,
                data_state=DataState.community_confirmed,
            ),
            ExperienceCard(
                id="exp_002",
                translations=ExperienceTranslations(
                    en=ExperienceTranslationEntry(name="Eco cycling tour"),
                    hi=ExperienceTranslationEntry(name="shown in English"),
                    mr=ExperienceTranslationEntry(name="shown in English"),
                ),
                accessibility=AttributeWithState(
                    value=None,
                    data_state=DataState.not_verified,
                ),
                environmental_impact=AttributeWithState(
                    value="low",
                    data_state=DataState.reported,
                ),
                cost_inr=500,
                duration_minutes=120,
                distance_km=15.0,
                data_state=DataState.reported,
            ),
        ],
    )
