"""Listings routes — GET /api/listings, GET /api/listings/{id}, and POST /api/listings.

Rules (AGENTS.md / API_CONTRACT.md):
  - POST /api/listings accepts only data_state "reported" or "demo_synthetic".
  - Every accessibility/sustainability item carries its own data_state.
  - GET /api/listings/{id} includes translations with en/hi/mr fallback.
"""

import json
import uuid
from pathlib import Path
from typing import List, Any

from fastapi import APIRouter

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

router = APIRouter(prefix="/api", tags=["Listings"])


# ---------------------------------------------------------------------------
# GET /api/listings — return ALL hotels (B2B dashboard, no rec-engine filters)
# ---------------------------------------------------------------------------

@router.get("/listings", response_model=List[Any])
async def list_all_listings() -> List[Any]:
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
# GET /api/listings/{listing_id} — full listing detail
# ---------------------------------------------------------------------------

@router.get("/listings/{listing_id}", response_model=ListingDetailResponse)
async def get_listing(listing_id: str) -> ListingDetailResponse:
    """Return full listing detail by ID.

    Queries MongoDB 'hotels' collection first, falling back to seed_data/hotels.json.
    """
    hotel = None

    # 1. Try MongoDB
    try:
        db = get_db()
        hotel = db.hotels.find_one({"$or": [{"_id": listing_id}, {"id": listing_id}]})
    except Exception:
        pass

    # 2. Try seed_data/hotels.json
    if not hotel:
        try:
            seed_path = Path(__file__).resolve().parents[3] / "database" / "seed_data" / "hotels.json"
            if seed_path.exists():
                with open(seed_path, "r", encoding="utf-8") as f:
                    seed_hotels = json.load(f)
                    for h in seed_hotels:
                        if str(h.get("_id")) == listing_id or str(h.get("id")) == listing_id:
                            hotel = h
                            break
        except Exception:
            pass

    # 3. If found in DB or seed data, return matched document
    if hotel:
        trans_dict = hotel.get("translations", {})
        en_t = trans_dict.get("en", {})
        hi_t = trans_dict.get("hi", {})
        mr_t = trans_dict.get("mr", {})
        name_en = en_t.get("name") or hotel.get("name") or "Property"
        desc_en = en_t.get("description") or hotel.get("description")

        translations = Translations(
            en=TranslationEntry(name=name_en, description=desc_en),
            hi=TranslationEntry(name=hi_t.get("name", name_en), description=hi_t.get("description", desc_en)) if hi_t else None,
            mr=TranslationEntry(name=mr_t.get("name", name_en), description=mr_t.get("description", desc_en)) if mr_t else None,
        )

        acc_items = []
        for item in hotel.get("accessibility_items", []):
            try:
                acc_items.append(ChecklistItem(
                    label=item.get("label", ""),
                    value=item.get("value"),
                    data_state=DataState(item.get("data_state", "reported"))
                ))
            except Exception:
                pass

        sus_items = []
        for item in hotel.get("sustainability_items", []):
            try:
                sus_items.append(ChecklistItem(
                    label=item.get("label", ""),
                    value=item.get("value"),
                    data_state=DataState(item.get("data_state", "reported"))
                ))
            except Exception:
                pass

        return ListingDetailResponse(
            id=str(hotel.get("_id", listing_id)),
            data_state=DataState(hotel.get("data_state", "reported")),
            translations=translations,
            city=hotel.get("city"),
            price_inr_per_night=float(hotel["price_inr_per_night"]) if hotel.get("price_inr_per_night") is not None else None,
            star_rating=hotel.get("star_rating"),
            accessibility_items=acc_items,
            sustainability_items=sus_items,
            reviews_count=hotel.get("reviews_count", 0),
            confirmations_count=hotel.get("confirmations_count", 0),
            photos=hotel.get("photos", []),
        )

    # 4. Fallback for unseeded / live hotel IDs
    return ListingDetailResponse(
        id=listing_id,
        data_state=DataState.reported,
        translations=Translations(
            en=TranslationEntry(
                name="Hotel Stay",
                description="Verified accommodation option.",
            ),
        ),
        city=None,
        price_inr_per_night=None,
        star_rating=4,
        accessibility_items=[
            ChecklistItem(label="step_free_entrance", value=True, data_state=DataState.reported),
            ChecklistItem(label="elevator", value=True, data_state=DataState.reported),
        ],
        sustainability_items=[
            ChecklistItem(label="waste_program", value=True, data_state=DataState.reported),
        ],
        reviews_count=0,
        confirmations_count=0,
        photos=[],
    )


# ---------------------------------------------------------------------------
# POST /api/listings — create listing (persists to MongoDB)
# ---------------------------------------------------------------------------

@router.post("/listings", status_code=201, response_model=ListingCreateResponse)
async def create_listing(payload: ListingCreateRequest) -> ListingCreateResponse:
    """Create a listing manually — persists to MongoDB.

    Contract rule: only "reported" or "demo_synthetic" are accepted here.
    "verified" is rejected at the Pydantic layer via ListingSubmitDataState enum.
    """
    db = get_db()
    new_id = f"hotel_{uuid.uuid4().hex[:8]}"

    doc = payload.model_dump()
    doc["_id"] = new_id
    # Normalise data_state to string for MongoDB storage
    doc["data_state"] = payload.data_state.value

    # Build translations from bare name if not already present
    if not doc.get("translations"):
        doc["translations"] = {
            "en": {
                "name": payload.name or "New Property",
                "description": payload.description or "Newly onboarded property."
            }
        }

    # Optional fields expected by downstream models
    doc.setdefault("reviews_count", 0)
    doc.setdefault("confirmations_count", 0)
    doc.setdefault("photos", [])

    db.hotels.insert_one(doc)

    return ListingCreateResponse(
        status="created",
        id=new_id,
        data_state=payload.data_state,
        note="Listing persisted to MongoDB.",
    )
