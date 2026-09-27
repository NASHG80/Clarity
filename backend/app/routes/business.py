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

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
import os
import time
import hashlib
import httpx
import json
from groq import AsyncGroq

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
    OpportunitiesResponse,
    RequirementSearchCount,
    BusinessProfileResponse,
    BusinessProfileUpdateRequest,
    AIAnalyticsSummaryRequest,
    AIAnalyticsSummaryResponse,
    AIAnalyticsInsight,
)
import logging
import json
from groq import AsyncGroq

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Business & Explore"])


# ---------------------------------------------------------------------------
# C1 STUBS — real MongoDB + aggregation logic in later C tasks
# ---------------------------------------------------------------------------

from app.db import get_businesses_collection

@router.get("/api/business/{business_id}/profile", response_model=BusinessProfileResponse)
async def get_business_profile(business_id: str):
    col = get_businesses_collection()
    biz = col.find_one({"_id": business_id})
    if biz:
        return BusinessProfileResponse(
            id=str(biz["_id"]),
            name=biz.get("name", ""),
            description=biz.get("description"),
            industry=biz.get("industry"),
            location=biz.get("location"),
            contactEmail=biz.get("contactEmail"),
            contactPhone=biz.get("contactPhone"),
            website=biz.get("website")
        )
        
    # Return mock/default if not found
    return BusinessProfileResponse(
        id=business_id,
        name='Green Hotels Group',
        description='A collection of sustainable properties committed to eco-friendly practices across India. We believe in green travel and making a positive impact on the environment.',
        industry='Hospitality Management',
        location='Mumbai, Maharashtra',
        contactEmail='contact@greenhotels.com',
        contactPhone='+91 98765 43210',
        website='www.greenhotels.in'
    )

@router.put("/api/business/{business_id}/profile", response_model=BusinessProfileResponse)
async def update_business_profile(business_id: str, payload: BusinessProfileUpdateRequest):
    col = get_businesses_collection()
    
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    
    if update_data:
        col.update_one(
            {"_id": business_id},
            {"$set": update_data},
            upsert=True
        )
        
    biz = col.find_one({"_id": business_id})
    if biz:
        return BusinessProfileResponse(
            id=str(biz["_id"]),
            name=biz.get("name", ""),
            description=biz.get("description"),
            industry=biz.get("industry"),
            location=biz.get("location"),
            contactEmail=biz.get("contactEmail"),
            contactPhone=biz.get("contactPhone"),
            website=biz.get("website")
        )
        
    raise HTTPException(status_code=500, detail="Failed to update profile")

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


@router.post("/api/business/upload-photo")
async def upload_photo(file: UploadFile = File(...), bucket: str = Form("general")):
    """Upload photo proxy to Cloudinary.
    
    Implements secure backend proxy to Cloudinary to avoid exposing API secrets in browser code.
    Uploads to a specific folder 'Clarity/{bucket}'.
    """
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    
    if not all([cloud_name, api_key, api_secret]):
        raise HTTPException(status_code=500, detail="Cloudinary configuration missing on server")
        
    timestamp = str(int(time.time()))
    folder = f"Clarity/{bucket}"
    
    # Generate Cloudinary signature
    # Signature formula: sha1(folder=folder&timestamp=timestamp{api_secret})
    string_to_sign = f"folder={folder}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(string_to_sign.encode('utf-8')).hexdigest()
    
    cloudinary_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
    
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to read file")
        
    data = {
        "api_key": api_key,
        "timestamp": timestamp,
        "signature": signature,
        "folder": folder
    }
    
    files = {
        "file": (file.filename or "image.jpg", file_bytes, file.content_type or "image/jpeg")
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(cloudinary_url, data=data, files=files, timeout=30.0)
        
        if not resp.is_success:
            raise HTTPException(status_code=resp.status_code, detail=f"Cloudinary error: {resp.text}")
            
        result = resp.json()
        return {"url": result.get("secure_url"), "public_id": result.get("public_id"), "bucket": bucket}


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
    
    if not cursor or cursor[0].get("listing_impressions", 0) < 5000:
        # Extremely realistic mockup data for a B2B dashboard demo
        funnel = AnalyticsFunnel(
            listing_impressions=18492, 
            listing_opens=6241, 
            detail_opens=3814,
            saves=892, 
            booking_starts=421, 
            bookings=156
        )
        signals = [
            AnalyticsSignal(
                type="positive_correlation",
                text="Properties with verified step-free access see a 32% higher save-to-booking ratio."
            ),
            AnalyticsSignal(
                type="drop_off_correlation",
                text="84% of users who filter by 'EV Charging' abandon the funnel when no photos of the charger are available."
            )
        ]
        is_demo_data = True
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


@router.get("/api/business/{business_id}/benchmarks")
async def get_benchmarks(business_id: str):
    """Fetch market benchmarks from the database."""
    db = get_db()
    benchmarks = db["market_benchmarks"].find_one({"business_id": business_id})
    if benchmarks:
        benchmarks["_id"] = str(benchmarks["_id"])
        return benchmarks
    
    # Fallback to defaults
    return {
        "conversion_rate": {"property": 2.4, "median": 1.8, "top_10": 3.1},
        "eco_badge_impact": {"verified": 15.0, "self_reported": 7.5, "no_data": 0.0}
    }


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
    
    if not cursor or len(cursor) == 0 or cursor[0].get("count", 0) < 500:
        counts = [
            RequirementSearchCount(label="Wheelchair accessible", count=1420),
            RequirementSearchCount(label="EV Charging Station", count=1105),
            RequirementSearchCount(label="Step-free access", count=980),
            RequirementSearchCount(label="Vegan menu", count=840),
            RequirementSearchCount(label="Solar powered", count=620)
        ]
        gaps = [
            DemandGap(label="Wheelchair accessible", count=1420, property_data_state=DataState.not_verified),
            DemandGap(label="EV Charging Station", count=1105, property_data_state=DataState.not_verified)
        ]
        is_demo_data = True
    else:
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
    """Opportunity Detector feed — resource + demand-gap opportunities."""
    
    # Get actual demand data to identify gaps
    demand_response = await get_demand(business_id)
    opportunities = []
    
    # 1. Demand Gap Opportunities
    for gap in demand_response.gaps:
        if gap.count > 100:
            severity = "red"
        elif gap.count > 30:
            severity = "yellow"
        else:
            severity = "neutral"
            
        opportunities.append(
            Opportunity(
                severity=severity,
                title=f"Demand gap: {gap.label}",
                suggested_action=f"Confirm or add this feature — {gap.count} recent traveler searches",
                is_demo_data=demand_response.is_demo_data,
                type="demand_gap"
            )
        )
        
    # 2. Fetch resource opportunities from database
    db = get_db()
    db_opps = list(db["opportunities"].find({"business_id": business_id}))
    for o in db_opps:
        opportunities.append(
            Opportunity(
                severity=o.get("severity", "neutral"),
                title=o.get("title", ""),
                estimate=o.get("estimate"),
                suggested_action=o.get("suggested_action", ""),
                is_demo_data=o.get("is_demo_data", False),
                type=o.get("type", "resource")
            )
        )
    
    # Sort opportunities: red first, then yellow, then neutral
    severity_order = {"red": 0, "yellow": 1, "neutral": 2}
    opportunities.sort(key=lambda x: severity_order.get(x.severity, 3))
    
    return OpportunitiesResponse(opportunities=opportunities)


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
@router.post("/api/business/{business_id}/analytics/ai-summary", response_model=AIAnalyticsSummaryResponse)
async def get_ai_analytics_summary(business_id: str, payload: AIAnalyticsSummaryRequest) -> AIAnalyticsSummaryResponse:
    """Generate an AI summary of the business's current analytics, demand, and opportunities."""
    
    # 1. Fetch all available data
    analytics_data = await get_analytics(business_id)
    demand_data = await get_demand(business_id)
    opportunities_data = await get_opportunities(business_id)
    
    # 2. Prepare the context for the LLM
    context = {
        "business_id": business_id,
        "is_demo_data": analytics_data.is_demo_data,
        "period": analytics_data.period,
        "analytics": analytics_data.model_dump(),
        "demand": demand_data.model_dump(),
        "opportunities": opportunities_data.model_dump()
    }
    
    # 3. Setup Groq
    api_key = os.getenv("GROQ_API_KEY")
    model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    
    if not api_key:
        logger.warning("GROQ_API_KEY not configured. Returning stubbed AI response.")
        return AIAnalyticsSummaryResponse(
            summary="AI insights are currently disabled (missing GROQ_API_KEY).",
            key_findings=[AIAnalyticsInsight(title="Config Missing", description="Please configure GROQ_API_KEY.")],
            demand_insights=[],
            data_gaps=[],
            opportunities=[],
            next_actions=[]
        )
        
    client = AsyncGroq(api_key=api_key)
    
    system_prompt = """You are a highly analytical business intelligence assistant for a hospitality platform.
Your task is to summarize the provided analytics data for a hotel/property owner.

CRITICAL RULES:
1. ONLY use the data provided in the JSON context. DO NOT invent metrics or numbers.
2. Distinguish facts from interpretation.
3. NEVER claim causation from correlation (e.g. "Because of X, Y happened"). Only say "Correlation observed" or "Associated with".
4. If is_demo_data is true, clearly mention that this is "Demo data" in the summary.
5. "not_verified" means the business hasn't provided reliable information yet, it does NOT mean they don't have the feature.
6. Return a valid JSON matching this exact structure:
{
  "summary": "High level 1-2 sentence executive summary.",
  "key_findings": [ {"title": "Short title", "description": "1 sentence insight"} ],
  "demand_insights": [ {"title": "Short title", "description": "1 sentence insight"} ],
  "data_gaps": [ {"title": "Short title", "description": "1 sentence insight"} ],
  "opportunities": [ {"title": "Short title", "description": "1 sentence insight"} ],
  "next_actions": [ {"title": "Action", "description": "What to do next"} ]
}"""

    # 4. Call Groq
    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(context)}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        if content:
            raw = AIAnalyticsSummaryResponse.model_validate_json(content)
            return raw
            
    except Exception as e:
        logger.error(f"Groq analytics summary failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI analytics summary.")
        
    raise HTTPException(status_code=500, detail="Empty AI response.")
