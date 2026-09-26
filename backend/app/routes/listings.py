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

router = APIRouter(prefix="/api", tags=["Listings"])


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
    # C1 stub — no MongoDB write yet
    return ListingCreateResponse(
        status="stub_created",
        id="listing_stub_001",
        data_state=payload.data_state,
        note="C1 stub — not persisted to MongoDB. Real write implemented in later C tasks.",
    )
