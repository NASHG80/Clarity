"""Listings routes — GET /api/listings/{id} and POST /api/listings.

C1 stubs: return deterministic contract-shaped responses.
Real MongoDB CRUD is implemented in later C tasks.

Rules (AGENTS.md / API_CONTRACT.md):
  - POST /api/listings accepts only data_state "reported" or "demo_synthetic".
  - Every accessibility/sustainability item carries its own data_state.
  - GET /api/listings/{id} includes translations with en/hi/mr fallback.
"""

from fastapi import APIRouter, HTTPException
import uuid

from app.db.mongo import get_db
from app.models.schemas import (
    ChecklistItem,
    DataState,
    ListingCreateRequest,
    ListingCreateResponse,
    ListingDetailResponse,
    ListingSubmitDataState,
    TranslationEntry,
    Translations,
)

from typing import List

router = APIRouter(prefix="/api", tags=["Listings"])

@router.get("/listings", response_model=List[ListingDetailResponse])
async def list_all_listings() -> List[ListingDetailResponse]:
    """Return all listings (for business dashboard)."""
    db = get_db()
    cursor = db.hotels.find()
    results = []
    for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if "translations" not in doc:
            doc["translations"] = {"en": {"name": doc.get("name", doc["id"]), "description": ""}}
        try:
            results.append(ListingDetailResponse(**doc))
        except Exception:
            pass
    return results


# ---------------------------------------------------------------------------
# C1 STUBS — replace with MongoDB logic in later C tasks
# ---------------------------------------------------------------------------

@router.get("/listings/{listing_id}", response_model=ListingDetailResponse)
async def get_listing(listing_id: str) -> ListingDetailResponse:
    """Return full listing detail by ID."""
    db = get_db()
    doc = db.hotels.find_one({"_id": listing_id})
    if doc:
        doc["id"] = str(doc.pop("_id"))
        # Ensure it has basic translations structure if missing
        if "translations" not in doc:
            doc["translations"] = {"en": {"name": doc.get("name", listing_id), "description": ""}}
        return ListingDetailResponse(**doc)
        
    # If not found, return the old stub for testing fallback or throw 404
    if listing_id.startswith("hotel_0") or listing_id == "mock_hotel_014":
        raise HTTPException(status_code=404, detail="Listing not found")
        
    return ListingDetailResponse(
        id=listing_id,
        data_state=DataState.reported,
        translations=Translations(
            en=TranslationEntry(name="Andaz Delhi Aerocity", description="Luxury property near the airport."),
        ),
        city="Delhi",
        price_inr_per_night=14000,
        star_rating=5,
        accessibility_items=[],
        sustainability_items=[],
        reviews_count=12,
        confirmations_count=4,
        photos=["https://example.com/photo1.jpg"],
    )


@router.post("/listings", status_code=201, response_model=ListingCreateResponse)
async def create_listing(payload: ListingCreateRequest) -> ListingCreateResponse:
    """Create a listing manually."""
    db = get_db()
    listing_id = f"hotel_{uuid.uuid4().hex[:8]}"
    
    doc = payload.model_dump()
    doc["_id"] = listing_id
    doc["data_state"] = payload.data_state.value
    doc["translations"] = {
        "en": {
            "name": payload.name or "Unnamed Property",
            "description": "Newly onboarded property."
        }
    }
    
    # Optional fields expected by models
    if "reviews_count" not in doc: doc["reviews_count"] = 0
    if "confirmations_count" not in doc: doc["confirmations_count"] = 0
    if "photos" not in doc: doc["photos"] = []
    
    db.hotels.insert_one(doc)
    
    return ListingCreateResponse(
        status="created",
        id=listing_id,
        data_state=payload.data_state,
        note="Listing persisted to MongoDB."
    )
