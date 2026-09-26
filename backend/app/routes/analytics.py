"""Analytics event ingestion route — POST /api/analytics/events

C1 stub: accepts the event payload and returns a lightweight success response.
Real aggregation (weekly funnel, demand counts) implemented in C14/C15/C16.

event_type enum (from docs/API_CONTRACT.md):
    listing_impression, listing_open, detail_open, accessibility_view,
    sustainability_view, map_open, save, booking_start, booking_complete
"""

from fastapi import APIRouter

from app.models.schemas import (
    AnalyticsEventRequest,
    AnalyticsEventResponse,
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


# ---------------------------------------------------------------------------
# C1 STUB — real MongoDB write implemented in C14
# ---------------------------------------------------------------------------

from app.db.mongo import get_db

@router.post("/events", status_code=202, response_model=AnalyticsEventResponse)
async def ingest_event(payload: AnalyticsEventRequest) -> AnalyticsEventResponse:
    """Ingest a single traveler interaction event.
    C14 implementation: Persists lightweight events directly to MongoDB.
    """
    db = get_db()
    
    doc = payload.model_dump()
    db["analytics_events"].insert_one(doc)

    return AnalyticsEventResponse(
        status="processed",
        event_type=payload.event_type,
        note="C14 processed: Event persisted to analytics_events collection.",
    )
