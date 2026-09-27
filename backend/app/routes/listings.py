"""Listings routes — GET /api/listings/{id} and POST /api/listings.

C1 stubs: return deterministic contract-shaped responses.
Real MongoDB CRUD is implemented in later C tasks.

Rules (AGENTS.md / API_CONTRACT.md):
  - POST /api/listings accepts only data_state "reported" or "demo_synthetic".
  - Every accessibility/sustainability item carries its own data_state.
  - GET /api/listings/{id} includes translations with en/hi/mr fallback.
"""

from fastapi import APIRouter

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
from app.db.mongo import get_db

from typing import List, Any

router = APIRouter(prefix="/api", tags=["Listings"])


# ---------------------------------------------------------------------------
# GET /api/listings — return ALL hotels (B2B use, no recommendation filters)
# ---------------------------------------------------------------------------

@router.get("/listings", response_model=List[Any])
async def list_all_listings():
    """Return all hotel documents from MongoDB.

    Used by the B2B Listings page so business owners see every property
    they have created, regardless of price/accessibility filter eligibility.
    """
    db = get_db()
    hotels = []
    for doc in db["hotels"].find({}):
        doc["id"] = str(doc.pop("_id"))
        # Build a minimal translations block from bare `name` field if missing
        if "translations" not in doc or not doc["translations"]:
            doc["translations"] = {
                "en": {"name": doc.get("name", "Unnamed Property"), "description": ""}
            }
        hotels.append(doc)
    return hotels


# ---------------------------------------------------------------------------
# C1 STUBS — replace with MongoDB logic in later C tasks
# ---------------------------------------------------------------------------

@router.get("/listings/{listing_id}", response_model=ListingDetailResponse)
async def get_listing(listing_id: str) -> ListingDetailResponse:
    """Return full listing detail by ID.

    C1 stub: ignores listing_id and returns a hardcoded full-detail object.
    Real MongoDB lookup implemented in later C tasks.
    Each accessibility/sustainability item carries its own data_state per contract.
    """
    return ListingDetailResponse(
        id=listing_id,  # echo back the requested id
        data_state=DataState.reported,
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
        accessibility_items=[
            ChecklistItem(label="step_free_entrance", value=True, data_state=DataState.reported),
            ChecklistItem(label="roll_in_shower", value=None, data_state=DataState.not_verified),
            ChecklistItem(label="elevator", value=True, data_state=DataState.reported),
            ChecklistItem(label="accessible_toilet", value=True, data_state=DataState.community_confirmed),
        ],
        sustainability_items=[
            ChecklistItem(label="solar_power", value=None, data_state=DataState.not_verified),
            ChecklistItem(label="waste_program", value=True, data_state=DataState.reported),
        ],
        reviews_count=12,
        confirmations_count=4,
        photos=["https://example.com/photo1.jpg"],
    )


@router.post("/listings", status_code=201, response_model=ListingCreateResponse)
async def create_listing(payload: ListingCreateRequest) -> ListingCreateResponse:
    """Create a listing manually (admin tool).

    C1 stub: validates data_state value (Pydantic enum handles it) but does not
    persist to MongoDB. Real persistence implemented in later C tasks.

    Contract rule: only "reported" or "demo_synthetic" are accepted here.
    "verified" is rejected at the Pydantic layer via ListingSubmitDataState enum.
    """
    db = get_db()
    hotels_coll = db["hotels"]
    
    # Generate a new ID
    import uuid
    new_id = f"hotel_{uuid.uuid4().hex[:8]}"
    
    # Build document
    doc = payload.model_dump()
    doc["_id"] = new_id
    
    # We must have translations to show up properly
    if "translations" not in doc or not doc["translations"]:
        doc["translations"] = {
            "en": {
                "name": doc.get("name", "New Property"),
                "description": ""
            }
        }
        
    hotels_coll.insert_one(doc)

    return ListingCreateResponse(
        status="created",
        id=new_id,
        data_state=payload.data_state,
        note="Persisted to MongoDB.",
    )
