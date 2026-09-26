"""Customer dashboard trip routes.

Implements:
  POST   /api/trips/create
  GET    /api/trips/active
  PATCH  /api/trips/{trip_id}/state
  POST   /api/trips/{trip_id}/interactions
  GET    /api/trips/{trip_id}/interactions

Security (hackathon scope):
  - All endpoints verify user_id exists in the `users` collection (401 if not).
  - All trip-specific endpoints verify trip.user_id == request.user_id (403 if mismatch).
  - The token is a static mock — full JWT is the production upgrade path.
  - This is documented as an accepted hackathon limitation. Ownership is enforced
    server-side; frontend-only checks are NOT relied upon.

Idempotency:
  - POST /interactions uses upsert on payload.client_event_id to prevent
    duplicate records on retry.
"""

import uuid
import datetime

from fastapi import APIRouter, HTTPException, Query, status

from app.db.mongo import get_db
from app.models.trips import (
    TripCreateRequest,
    TripCreateResponse,
    TripDocument,
    TripWeights,
    ActiveTripResponse,
    TripStatePatch,
    TripStatePatchResponse,
    TravelerInteractionRequest,
    TravelerInteractionResponse,
    InteractionRecord,
    TripInteractionsResponse,
    DashboardPhase,
)

router = APIRouter(prefix="/api/trips", tags=["Trips"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _verify_user(user_id: str) -> None:
    """Raise 401 if user_id is not in the users collection."""
    db = get_db()
    user = db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown user_id — please log in again",
        )


def _get_trip_or_404(trip_id: str) -> dict:
    db = get_db()
    trip = db.traveler_trips.find_one({"_id": trip_id})
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


def _verify_trip_ownership(trip: dict, user_id: str) -> None:
    if trip.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this trip",
        )


def _trip_doc_to_model(doc: dict) -> TripDocument:
    weights_raw = doc.get("weights", {})
    weights = TripWeights(**weights_raw) if isinstance(weights_raw, dict) else TripWeights()
    return TripDocument(
        trip_id=doc["_id"],
        user_id=doc["user_id"],
        destination=doc.get("destination", ""),
        adults=doc.get("adults", 1),
        children=doc.get("children", 0),
        rooms=doc.get("rooms", 1),
        arrival_date=doc.get("arrival_date", ""),
        departure_date=doc.get("departure_date", ""),
        accessibility_required=doc.get("accessibility_required", []),
        sustainability_preferred=doc.get("sustainability_preferred", []),
        budget_max=doc.get("budget_max"),
        weights=weights,
        include_unverified=doc.get("include_unverified", False),
        phase=DashboardPhase(doc.get("phase", "BASICS_SAVED")),
        last_search_result_count=doc.get("last_search_result_count"),
        created_at=doc.get("created_at", ""),
        last_updated=doc.get("last_updated", ""),
    )


# ---------------------------------------------------------------------------
# POST /api/trips/create
# ---------------------------------------------------------------------------

@router.post("/create", response_model=TripCreateResponse, status_code=201)
async def create_trip(req: TripCreateRequest) -> TripCreateResponse:
    """Create a new trip planning session for an authenticated customer."""
    _verify_user(req.user_id)

    db = get_db()
    trip_id = f"trip_{uuid.uuid4().hex[:8]}"
    now = _now_iso()

    doc = {
        "_id": trip_id,
        "user_id": req.user_id,
        "destination": req.destination,
        "adults": req.adults,
        "children": req.children,
        "rooms": req.rooms,
        "arrival_date": req.arrival_date,
        "departure_date": req.departure_date,
        "accessibility_required": [],
        "sustainability_preferred": [],
        "budget_max": None,
        "weights": {"environmental": 0.25, "accessibility": 0.25, "affordability": 0.25, "convenience": 0.25},
        "include_unverified": False,
        "phase": DashboardPhase.BASICS_SAVED.value,
        "last_search_result_count": None,
        "created_at": now,
        "last_updated": now,
    }

    db.traveler_trips.insert_one(doc)

    return TripCreateResponse(
        trip_id=trip_id,
        phase=DashboardPhase.BASICS_SAVED,
        created_at=now,
    )


# ---------------------------------------------------------------------------
# GET /api/trips/active
# ---------------------------------------------------------------------------

@router.get("/active", response_model=ActiveTripResponse)
async def get_active_trip(user_id: str = Query(...)) -> ActiveTripResponse:
    """Return the customer's most recently updated trip, or null."""
    _verify_user(user_id)

    db = get_db()
    doc = db.traveler_trips.find_one(
        {"user_id": user_id},
        sort=[("last_updated", -1)],
    )

    if not doc:
        return ActiveTripResponse(trip=None)

    return ActiveTripResponse(trip=_trip_doc_to_model(doc))


# ---------------------------------------------------------------------------
# PATCH /api/trips/{trip_id}/state
# ---------------------------------------------------------------------------

@router.patch("/{trip_id}/state", response_model=TripStatePatchResponse)
async def patch_trip_state(trip_id: str, req: TripStatePatch) -> TripStatePatchResponse:
    """Partial update of current trip planning state."""
    _verify_user(req.user_id)
    trip = _get_trip_or_404(trip_id)
    _verify_trip_ownership(trip, req.user_id)

    now = _now_iso()
    update_fields: dict = {"last_updated": now}

    # Only apply fields that were explicitly supplied (not None)
    if req.destination is not None:
        update_fields["destination"] = req.destination
    if req.adults is not None:
        update_fields["adults"] = req.adults
    if req.children is not None:
        update_fields["children"] = req.children
    if req.rooms is not None:
        update_fields["rooms"] = req.rooms
    if req.arrival_date is not None:
        update_fields["arrival_date"] = req.arrival_date
    if req.departure_date is not None:
        update_fields["departure_date"] = req.departure_date
    if req.accessibility_required is not None:
        update_fields["accessibility_required"] = req.accessibility_required
    if req.sustainability_preferred is not None:
        update_fields["sustainability_preferred"] = req.sustainability_preferred
    if req.budget_max is not None:
        update_fields["budget_max"] = req.budget_max
    if req.weights is not None:
        update_fields["weights"] = req.weights.model_dump()
    if req.include_unverified is not None:
        update_fields["include_unverified"] = req.include_unverified
    if req.phase is not None:
        update_fields["phase"] = req.phase.value
    if req.last_search_result_count is not None:
        update_fields["last_search_result_count"] = req.last_search_result_count

    db = get_db()
    db.traveler_trips.update_one({"_id": trip_id}, {"$set": update_fields})

    return TripStatePatchResponse(trip_id=trip_id, last_updated=now)


# ---------------------------------------------------------------------------
# POST /api/trips/{trip_id}/interactions
# ---------------------------------------------------------------------------

@router.post("/{trip_id}/interactions", response_model=TravelerInteractionResponse, status_code=201)
async def post_interaction(trip_id: str, req: TravelerInteractionRequest) -> TravelerInteractionResponse:
    """Record one immutable customer planning-memory event. Idempotent via client_event_id."""
    _verify_user(req.user_id)
    trip = _get_trip_or_404(trip_id)
    _verify_trip_ownership(trip, req.user_id)

    client_event_id = req.payload.get("client_event_id", "")
    now = _now_iso()
    interaction_id = f"int_{uuid.uuid4().hex[:8]}"

    doc = {
        "_id": interaction_id,
        "trip_id": trip_id,
        "user_id": req.user_id,
        "session_id": req.session_id,
        "event_type": req.event_type.value,
        "timestamp": now,
        "payload": req.payload,
    }

    db = get_db()
    # Idempotent upsert: if a doc with this client_event_id already exists, do nothing.
    if client_event_id:
        existing = db.traveler_interactions.find_one(
            {"payload.client_event_id": client_event_id, "trip_id": trip_id}
        )
        if existing:
            # Already recorded — return the existing interaction_id
            return TravelerInteractionResponse(
                interaction_id=existing["_id"],
                status="recorded",
            )

    db.traveler_interactions.insert_one(doc)

    return TravelerInteractionResponse(interaction_id=interaction_id, status="recorded")


# ---------------------------------------------------------------------------
# GET /api/trips/{trip_id}/interactions
# ---------------------------------------------------------------------------

@router.get("/{trip_id}/interactions", response_model=TripInteractionsResponse)
async def get_interactions(
    trip_id: str,
    user_id: str = Query(...),
) -> TripInteractionsResponse:
    """Return all planning-memory events for a trip in chronological order."""
    _verify_user(user_id)
    trip = _get_trip_or_404(trip_id)
    _verify_trip_ownership(trip, user_id)

    db = get_db()
    cursor = db.traveler_interactions.find(
        {"trip_id": trip_id, "user_id": user_id},
        sort=[("timestamp", 1)],
    )

    records = []
    for doc in cursor:
        records.append(
            InteractionRecord(
                interaction_id=doc["_id"],
                event_type=doc.get("event_type", ""),
                timestamp=doc.get("timestamp", ""),
                payload=doc.get("payload", {}),
            )
        )

    return TripInteractionsResponse(interactions=records)
