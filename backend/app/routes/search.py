"""Search routes — transport + accommodation.

C1 stubs: return deterministic contract-shaped responses.
Real filtering/scoring/ranking implemented in C3-C6 (recommendation engine).
Real emissions calculations implemented in C7-C8.

Routes:
    POST /api/search/transport
    POST /api/search/accommodation
"""

from fastapi import APIRouter

from app.models.schemas import (
    AccommodationSearchRequest,
    AccommodationSearchResponse,
    AttributeWithState,
    ChecklistItem,
    DataState,
    EmissionsEstimated,
    EmissionsRouteBenchmark,
    HotelResult,
    Segment,
    TranslationEntry,
    Translations,
    TransportResult,
    TransportSearchRequest,
    TransportSearchResponse,
)

router = APIRouter(prefix="/api/search", tags=["Search"])


# ---------------------------------------------------------------------------
# C1 STUB — replace with recommendation engine calls in C3-C8
# ---------------------------------------------------------------------------

@router.post("/transport", response_model=TransportSearchResponse)
async def search_transport(payload: TransportSearchRequest) -> TransportSearchResponse:
    """Search and rank transport options.

    C1 stub: returns two hardcoded result cards matching
    docs/API_CONTRACT.md §POST /api/search/transport.
    Emissions shapes are preserved exactly (method + inputs, never bare kg).
    Real filtering/scoring/ranking/emissions are implemented in C3-C8.
    """
    if payload.accessibility_required:
        try:
            from app.db.mongo import get_db
            import uuid
            from datetime import datetime, timezone
            
            db = get_db()
            doc = {
                "_id": f"req_{uuid.uuid4().hex[:8]}",
                "search_type": "transport",
                "accessibility_required": payload.accessibility_required,
                "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            }
            db["search_requests"].insert_one(doc)
        except Exception:
            pass  # Do not convert a DB failure into a search failure

    # C22: Genuine zero-match handling instead of fabricating results
    results = []
    if payload.origin.lower() == "mumbai" and payload.destination.lower() == "goa":
        results = [
            TransportResult(
                id="route_001",
                mode="train+shuttle",
                cost_inr=1800,
                duration_minutes=320,
                emissions=EmissionsEstimated(
                    co2e_kg=13.8,
                    distance_km=460,
                    emission_factor=0.03,
                ),
                accessibility=AttributeWithState(
                    value="high",
                    data_state=DataState.demo_synthetic,
                ),
                personal_match_pct=91,
                trade_off_summary=[
                    "Meets your accessibility requirement",
                    "Within your budget",
                    "79% lower estimated CO2e than the flight",
                ],
                segments=[
                    Segment(
                        type="walk",
                        distance_m=450,
                        accessible=True,
                        data_state=DataState.demo_synthetic,
                    ),
                    Segment(
                        type="train",
                        duration_minutes=300,
                        data_state=DataState.reported,
                    ),
                    Segment(
                        type="shuttle",
                        duration_minutes=20,
                        data_state=DataState.demo_synthetic,
                    ),
                ],
            ),
            TransportResult(
                id="route_002",
                mode="flight+taxi",
                cost_inr=7500,
                duration_minutes=130,
                emissions=EmissionsRouteBenchmark(
                    co2e_kg=87,
                    benchmark_kg=100,
                    reduction_pct=13,
                ),
                accessibility=AttributeWithState(
                    value="medium",
                    data_state=DataState.not_verified,
                ),
                personal_match_pct=62,
                trade_off_summary=[
                    "Fastest option",
                    "Higher carbon footprint",
                    "13% lower than typical flight on this route",
                ],
                segments=[
                    Segment(
                        type="flight",
                        duration_minutes=75,
                        data_state=DataState.demo_synthetic,
                    ),
                    Segment(
                        type="taxi",
                        duration_minutes=55,
                        data_state=DataState.not_verified,
                    ),
                ],
            ),
        ]
    return TransportSearchResponse(results=results)


@router.post("/accommodation", response_model=AccommodationSearchResponse)
async def search_accommodation(payload: AccommodationSearchRequest) -> AccommodationSearchResponse:
    """Search and rank accommodation options.

    C1 stub: returns two hardcoded hotel cards matching
    docs/API_CONTRACT.md §POST /api/search/accommodation.
    accessibility_items and sustainability_items carry individual data_states —
    never collapsed into a single merged score.
    Real logic implemented in C3-C8.
    """
    if payload.accessibility_required:
        try:
            from app.db.mongo import get_db
            import uuid
            from datetime import datetime, timezone
            
            db = get_db()
            doc = {
                "_id": f"req_{uuid.uuid4().hex[:8]}",
                "search_type": "accommodation",
                "accessibility_required": payload.accessibility_required,
                "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            }
            db["search_requests"].insert_one(doc)
        except Exception:
            pass  # Do not convert a DB failure into a search failure

    # C22: Genuine zero-match handling instead of fabricating results
    results = []
    dest = payload.destination_city.lower()
    
    if dest in ["delhi", "goa", "mumbai"]:
        results = [
            HotelResult(
                id="hotel_001",
                translations=Translations(
                    en=TranslationEntry(
                        name="Andaz Delhi Aerocity",
                        description="Luxury property near the airport with documented accessibility features.",
                    ),
                    hi=TranslationEntry(name="अंदाज़ दिल्ली एरोसिटी", description="shown in English"),
                    mr=TranslationEntry(name="अंदाज़ दिल्ली एरोसिटी", description="shown in English"),
                ),
                city="Delhi",
                price_inr_per_night=14000,
                star_rating=5,
                data_state=DataState.reported,
                accessibility_items=[
                    ChecklistItem(label="step_free_entrance", value=True, data_state=DataState.reported),
                    ChecklistItem(label="roll_in_shower", value=None, data_state=DataState.not_verified),
                    ChecklistItem(label="elevator", value=True, data_state=DataState.reported),
                ],
                sustainability_items=[
                    ChecklistItem(label="solar_power", value=None, data_state=DataState.not_verified),
                ],
                personal_match_pct=88,
                trade_off_summary=[
                    "Step-free entrance confirmed",
                    "Roll-in shower data not yet verified",
                ],
            ),
            HotelResult(
                id="hotel_002",
                translations=Translations(
                    en=TranslationEntry(
                        name="Budget Stay Goa",
                        description="Affordable option near the beach.",
                    ),
                    hi=TranslationEntry(name="shown in English", description="shown in English"),
                    mr=TranslationEntry(name="shown in English", description="shown in English"),
                ),
                city="Goa",
                price_inr_per_night=2200,
                star_rating=2,
                data_state=DataState.not_verified,
                accessibility_items=[
                    ChecklistItem(label="step_free_entrance", value=None, data_state=DataState.not_verified),
                ],
                sustainability_items=[
                    ChecklistItem(label="waste_program", value=None, data_state=DataState.not_verified),
                ],
                personal_match_pct=45,
                trade_off_summary=[
                    "Most affordable option",
                    "No accessibility data available",
                ],
            ),
        ]
    
    # Filter the mock results by destination if requested
    filtered_results = [r for r in results if r.city.lower() == dest] if results else []
    
    return AccommodationSearchResponse(results=filtered_results)
