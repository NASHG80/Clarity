"""
Seed script for Green & Inclusive Travel MongoDB database (Task D2: hotels, Task D3: transport_routes).

Loads:
- database/seed_data/hotels.json
- database/seed_data/transport_routes.json

Idempotent: uses upsert on _id.
Enforces strict 5-state data integrity:
- verified, reported, community_confirmed, not_verified, demo_synthetic
- not_verified fields must have value: null
- emissions.method strictly separated: 'estimated' vs 'route_benchmark'
"""

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from pymongo.database import Database

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.db.mongo import (
    get_db,
    COLLECTION_HOTELS,
    COLLECTION_TRANSPORT_ROUTES,
    COLLECTION_EXPERIENCES,
    COLLECTION_BUSINESSES,
    COLLECTION_CONFIRMATIONS,
)
from backend.app.db.init import init_db
from backend.recommendation_engine.config import CONFIRMATION_THRESHOLD

DATA_DIR = Path(__file__).resolve().parent / "seed_data"
HOTELS_FILE = DATA_DIR / "hotels.json"
ROUTES_FILE = DATA_DIR / "transport_routes.json"
EXPERIENCES_FILE = DATA_DIR / "experiences.json"
BUSINESSES_FILE = DATA_DIR / "businesses.json"
CONFIRMATIONS_FILE = DATA_DIR / "confirmations.json"

VALID_DATA_STATES = {
    "verified",
    "reported",
    "community_confirmed",
    "not_verified",
    "demo_synthetic",
}


def validate_hotel_document(doc: Dict[str, Any]) -> None:
    """Validate data integrity invariants for a hotel document."""
    state = doc.get("data_state")
    if state not in VALID_DATA_STATES:
        raise ValueError(f"Hotel {doc.get('_id')} has invalid data_state '{state}'")

    translations = doc.get("translations", {})
    for lang in ("en", "hi", "mr"):
        if lang not in translations:
            raise ValueError(f"Hotel {doc.get('_id')} missing translation '{lang}'")
        if not translations[lang].get("name") or not translations[lang].get("description"):
            raise ValueError(f"Hotel {doc.get('_id')} translation '{lang}' missing name or description")

    for item in doc.get("accessibility_items", []):
        istate = item.get("data_state")
        if istate not in VALID_DATA_STATES:
            raise ValueError(f"Hotel {doc.get('_id')} accessibility item '{item.get('label')}' invalid state '{istate}'")
        if istate == "not_verified" and item.get("value") is not None:
            raise ValueError(
                f"Integrity violation in hotel {doc.get('_id')}: "
                f"item '{item.get('label')}' is 'not_verified' but has non-null value {item.get('value')}"
            )

    for item in doc.get("sustainability_items", []):
        istate = item.get("data_state")
        if istate not in VALID_DATA_STATES:
            raise ValueError(f"Hotel {doc.get('_id')} sustainability item '{item.get('label')}' invalid state '{istate}'")
        if istate == "not_verified" and item.get("value") is not None:
            raise ValueError(
                f"Integrity violation in hotel {doc.get('_id')}: "
                f"item '{item.get('label')}' is 'not_verified' but has non-null value {item.get('value')}"
            )


def validate_route_document(doc: Dict[str, Any]) -> None:
    """Validate data integrity invariants for a transport route document."""
    doc_id = doc.get("_id")
    if not doc_id:
        raise ValueError("Route document missing _id")

    origin = doc.get("origin")
    destination = doc.get("destination")
    mode = doc.get("mode")

    if not origin or not destination or not mode:
        raise ValueError(f"Route {doc_id} must have origin, destination, and mode")

    distance_km = doc.get("distance_km")
    cost_inr = doc.get("cost_inr")
    duration_minutes = doc.get("duration_minutes")

    if not isinstance(distance_km, (int, float)) or distance_km <= 0:
        raise ValueError(f"Route {doc_id} distance_km must be > 0")

    if not isinstance(cost_inr, (int, float)) or cost_inr < 0:
        raise ValueError(f"Route {doc_id} cost_inr must be >= 0")

    if not isinstance(duration_minutes, (int, float)) or duration_minutes <= 0:
        raise ValueError(f"Route {doc_id} duration_minutes must be > 0")

    emissions = doc.get("emissions")
    if not isinstance(emissions, dict):
        raise ValueError(f"Route {doc_id} missing emissions object")

    method = emissions.get("method")
    if method not in ("estimated", "route_benchmark"):
        raise ValueError(f"Route {doc_id} invalid emissions method '{method}'")

    if method == "estimated":
        ef = emissions.get("emission_factor")
        d_km = emissions.get("distance_km")
        co2e = emissions.get("co2e_kg")
        if ef is None or d_km is None or co2e is None:
            raise ValueError(f"Route {doc_id} estimated emissions must contain emission_factor, distance_km, and co2e_kg")
        if "benchmark_kg" in emissions and emissions["benchmark_kg"] is not None:
            raise ValueError(f"Route {doc_id} estimated emissions must not contain benchmark_kg")
        if "reduction_pct" in emissions and emissions["reduction_pct"] is not None:
            raise ValueError(f"Route {doc_id} estimated emissions must not contain reduction_pct")
        expected_co2e = round(d_km * ef, 2)
        if abs(co2e - expected_co2e) > 0.05:
            raise ValueError(f"Route {doc_id} co2e_kg {co2e} does not match distance_km * emission_factor ({expected_co2e})")

    elif method == "route_benchmark":
        bench = emissions.get("benchmark_kg")
        red_pct = emissions.get("reduction_pct")
        co2e = emissions.get("co2e_kg")
        if bench is None or red_pct is None or co2e is None:
            raise ValueError(f"Route {doc_id} route_benchmark must contain benchmark_kg, reduction_pct, and co2e_kg")
        if "emission_factor" in emissions and emissions["emission_factor"] is not None:
            raise ValueError(f"Route {doc_id} route_benchmark emissions must not contain emission_factor")

    acc = doc.get("accessibility")
    if acc:
        astate = acc.get("data_state")
        if astate not in VALID_DATA_STATES:
            raise ValueError(f"Route {doc_id} accessibility has invalid data_state '{astate}'")
        if astate == "not_verified" and acc.get("value") is not None:
            raise ValueError(f"Route {doc_id} accessibility is not_verified but has non-null value")

    for seg in doc.get("segments", []):
        sstate = seg.get("data_state")
        if sstate and sstate not in VALID_DATA_STATES:
            raise ValueError(f"Route {doc_id} segment has invalid data_state '{sstate}'")
        if sstate == "not_verified" and seg.get("accessible") is not None:
            raise ValueError(f"Route {doc_id} segment is not_verified but has non-null accessible value")


def validate_experience_document(doc: Dict[str, Any]) -> None:
    """Validate data integrity invariants for an experience document."""
    doc_id = doc.get("_id")
    if not doc_id:
        raise ValueError("Experience document missing _id")

    translations = doc.get("translations", {})
    for lang in ("en", "hi", "mr"):
        if lang not in translations:
            raise ValueError(f"Experience {doc_id} missing translation '{lang}'")
        if not translations[lang].get("name"):
            raise ValueError(f"Experience {doc_id} translation '{lang}' missing name")

    acc = doc.get("accessibility")
    if acc:
        astate = acc.get("data_state")
        if astate not in VALID_DATA_STATES:
            raise ValueError(f"Experience {doc_id} accessibility has invalid data_state '{astate}'")
        if astate == "not_verified" and acc.get("value") is not None:
            raise ValueError(f"Integrity violation in experience {doc_id}: accessibility is 'not_verified' but has non-null value")

    env = doc.get("environmental_impact")
    if env:
        estate = env.get("data_state")
        if estate not in VALID_DATA_STATES:
            raise ValueError(f"Experience {doc_id} environmental_impact has invalid data_state '{estate}'")
        if estate == "not_verified" and env.get("value") is not None:
            raise ValueError(f"Integrity violation in experience {doc_id}: environmental_impact is 'not_verified' but has non-null value")


def validate_business_document(doc: Dict[str, Any], valid_hotel_ids: set) -> None:
    """Validate data integrity invariants for a business document."""
    doc_id = doc.get("_id")
    if not doc_id:
        raise ValueError("Business document missing _id")
    
    hotel_id = doc.get("hotel_id")
    if not hotel_id:
        raise ValueError(f"Business {doc_id} missing hotel_id")
    
    if hotel_id not in valid_hotel_ids:
        raise ValueError(f"Business {doc_id} references unknown hotel_id: {hotel_id}")

    if "onboarding_complete" in doc:
        if not isinstance(doc["onboarding_complete"], bool):
            raise ValueError(f"Business {doc_id} onboarding_complete must be a boolean")

    for opp in doc.get("opportunities", []):
        if not opp.get("title") or not opp.get("suggested_action"):
            raise ValueError(f"Business {doc_id} opportunity missing title or suggested_action")
        
        severity = opp.get("severity")
        if severity not in ("red", "yellow", "green"):
            raise ValueError(f"Business {doc_id} opportunity has invalid severity '{severity}'")
            
        if opp.get("is_demo_data") is not True:
            raise ValueError(f"Business {doc_id} demo opportunity must explicitly set 'is_demo_data': true")


def validate_confirmation_document(doc: Dict[str, Any], valid_hotel_item_map: Dict[str, set]) -> None:
    """Validate data integrity invariants for a confirmation document."""
    doc_id = doc.get("_id")
    if not isinstance(doc_id, str) or not doc_id:
        raise ValueError("Confirmation missing _id")
    
    hotel_id = doc.get("hotel_id")
    if not hotel_id:
        raise ValueError(f"Confirmation {doc_id} missing hotel_id")
    
    if hotel_id not in valid_hotel_item_map:
        raise ValueError(f"Confirmation {doc_id} references unknown hotel_id '{hotel_id}'")
        
    item_label = doc.get("item_label")
    if not item_label or not isinstance(item_label, str):
        raise ValueError(f"Confirmation {doc_id} missing item_label")
        
    if item_label not in valid_hotel_item_map[hotel_id]:
        raise ValueError(f"Confirmation {doc_id} references unknown item_label '{item_label}' for hotel '{hotel_id}'")
        
    conf_count = doc.get("confirmed_by_count")
    if not isinstance(conf_count, int) or conf_count < 0:
        raise ValueError(f"Confirmation {doc_id} confirmed_by_count must be integer >= 0")
        
    disp_count = doc.get("disputed_count")
    if not isinstance(disp_count, int) or disp_count < 0:
        raise ValueError(f"Confirmation {doc_id} disputed_count must be integer >= 0")
        
    if doc.get("data_state") == "verified" or "data_state" in doc:
        # Confirmations represent evidence, not data states themselves
        raise ValueError(f"Confirmation {doc_id} cannot set data_state directly")


def load_hotels_data(file_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Load and validate hotel documents from JSON file."""
    path = file_path or HOTELS_FILE
    if not path.exists():
        raise FileNotFoundError(f"Hotels seed file not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        hotels = json.load(f)

    for hotel in hotels:
        validate_hotel_document(hotel)

    return hotels


def load_routes_data(file_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Load and validate transport route documents from JSON file."""
    path = file_path or ROUTES_FILE
    if not path.exists():
        raise FileNotFoundError(f"Transport routes seed file not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        routes = json.load(f)

    seen_ids = set()
    for route in routes:
        doc_id = route.get("_id")
        if doc_id in seen_ids:
            raise ValueError(f"Duplicate route _id found in dataset: {doc_id}")
        seen_ids.add(doc_id)
        validate_route_document(route)

    return routes


def load_experiences_data(file_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Load and validate experiences documents from JSON file."""
    path = file_path or EXPERIENCES_FILE
    if not path.exists():
        raise FileNotFoundError(f"Experiences seed file not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        experiences = json.load(f)

    seen_ids = set()
    for exp in experiences:
        doc_id = exp.get("_id")
        if doc_id in seen_ids:
            raise ValueError(f"Duplicate experience _id found in dataset: {doc_id}")
        seen_ids.add(doc_id)
        validate_experience_document(exp)

    return experiences


def load_businesses_data(valid_hotel_ids: set, file_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Load and validate businesses documents from JSON file."""
    path = file_path or BUSINESSES_FILE
    if not path.exists():
        raise FileNotFoundError(f"Businesses seed file not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        businesses = json.load(f)

    seen_ids = set()
    for biz in businesses:
        doc_id = biz.get("_id")
        if doc_id in seen_ids:
            raise ValueError(f"Duplicate business _id found in dataset: {doc_id}")
        seen_ids.add(doc_id)
        validate_business_document(biz, valid_hotel_ids)

    return businesses


def load_confirmations_data(valid_hotel_item_map: Dict[str, set], file_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Load and validate confirmations documents from JSON file."""
    path = file_path or CONFIRMATIONS_FILE
    if not path.exists():
        raise FileNotFoundError(f"Confirmations seed file not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        confirmations = json.load(f)

    seen_ids = set()
    has_below_threshold = False
    has_above_threshold = False
    
    for conf in confirmations:
        doc_id = conf.get("_id")
        if doc_id in seen_ids:
            raise ValueError(f"Duplicate confirmation _id found in dataset: {doc_id}")
        seen_ids.add(doc_id)
        validate_confirmation_document(conf, valid_hotel_item_map)
        
        count = conf.get("confirmed_by_count", 0)
        if count >= CONFIRMATION_THRESHOLD:
            has_above_threshold = True
        else:
            has_below_threshold = True

    if not has_below_threshold:
        raise ValueError(f"Confirmations dataset must include at least one record below the threshold ({CONFIRMATION_THRESHOLD})")
    if not has_above_threshold:
        raise ValueError(f"Confirmations dataset must include at least one record meeting/exceeding the threshold ({CONFIRMATION_THRESHOLD})")

    return confirmations


def seed_hotels(db: Optional[Database] = None, file_path: Optional[Path] = None) -> Tuple[int, int, int, int]:
    """
    Idempotently upsert hotel seed records into MongoDB.

    Returns:
        Tuple of (total_count, anchor_count, budget_count, synthetic_count)
    """
    target_db = db if db is not None else get_db()
    init_db(target_db)

    hotels = load_hotels_data(file_path)
    collection = target_db[COLLECTION_HOTELS]

    anchor_count = 0
    budget_count = 0
    synthetic_count = 0

    for hotel in hotels:
        doc_id = hotel["_id"]
        state = hotel.get("data_state")

        if state == "demo_synthetic" or "[DEMO SYNTHETIC]" in hotel.get("translations", {}).get("en", {}).get("name", ""):
            synthetic_count += 1
        elif doc_id in ("hotel_001", "hotel_002", "hotel_003", "hotel_004", "hotel_005"):
            anchor_count += 1
        else:
            budget_count += 1

        collection.replace_one({"_id": doc_id}, hotel, upsert=True)

    return len(hotels), anchor_count, budget_count, synthetic_count


def seed_transport_routes(db: Optional[Database] = None, file_path: Optional[Path] = None) -> Tuple[int, int, int, int]:
    """
    Idempotently upsert transport route seed records into MongoDB.

    Returns:
        Tuple of (total_count, estimated_count, benchmark_count, synthetic_count)
    """
    target_db = db if db is not None else get_db()
    init_db(target_db)

    routes = load_routes_data(file_path)
    collection = target_db[COLLECTION_TRANSPORT_ROUTES]

    estimated_count = 0
    benchmark_count = 0
    synthetic_count = 0

    for route in routes:
        doc_id = route["_id"]
        emissions = route.get("emissions", {})
        method = emissions.get("method")

        if method == "estimated":
            estimated_count += 1
        elif method == "route_benchmark":
            benchmark_count += 1

        if route.get("data_state") == "demo_synthetic":
            synthetic_count += 1

        collection.replace_one({"_id": doc_id}, route, upsert=True)

    return len(routes), estimated_count, benchmark_count, synthetic_count


def seed_experiences(db: Optional[Database] = None, file_path: Optional[Path] = None) -> int:
    """
    Idempotently upsert experience seed records into MongoDB.
    Returns: total_count
    """
    target_db = db if db is not None else get_db()
    init_db(target_db)

    experiences = load_experiences_data(file_path)
    collection = target_db[COLLECTION_EXPERIENCES]

    for exp in experiences:
        collection.replace_one({"_id": exp["_id"]}, exp, upsert=True)

    return len(experiences)


def seed_businesses(db: Optional[Database] = None, file_path: Optional[Path] = None) -> int:
    """
    Idempotently upsert business seed records into MongoDB.
    Returns: total_count
    """
    target_db = db if db is not None else get_db()
    init_db(target_db)

    # Need valid hotel IDs for referential integrity
    hotels_coll = target_db[COLLECTION_HOTELS]
    valid_hotel_ids = {doc["_id"] for doc in hotels_coll.find({}, {"_id": 1})}
    
    # If hotels aren't in DB yet (e.g. running standalone test), fallback to file
    if not valid_hotel_ids:
        hotels = load_hotels_data()
        valid_hotel_ids = {h["_id"] for h in hotels}

    businesses = load_businesses_data(valid_hotel_ids, file_path)
    collection = target_db[COLLECTION_BUSINESSES]

    for biz in businesses:
        collection.replace_one({"_id": biz["_id"]}, biz, upsert=True)

    return len(businesses)


def seed_confirmations(db: Optional[Database] = None, file_path: Optional[Path] = None) -> int:
    """
    Idempotently upsert confirmations seed records into MongoDB.
    Returns: total_count
    """
    target_db = db if db is not None else get_db()
    init_db(target_db)

    # Reconstruct valid_hotel_item_map directly from hotels data file
    # so we validate against intended schema
    hotels = load_hotels_data()
    valid_hotel_item_map = {}
    for h in hotels:
        items = set()
        for acc in h.get("accessibility_items", []):
            items.add(acc["label"])
        for sus in h.get("sustainability_items", []):
            items.add(sus["label"])
        valid_hotel_item_map[h["_id"]] = items

    confirmations = load_confirmations_data(valid_hotel_item_map, file_path)
    collection = target_db[COLLECTION_CONFIRMATIONS]

    for conf in confirmations:
        collection.replace_one({"_id": conf["_id"]}, conf, upsert=True)

    return len(confirmations)


def main() -> None:
    """CLI entrypoint for seeding database."""
    print("=== Seeding Green & Inclusive Travel Database ===")
    try:
        db = get_db()

        # Seed Hotels (Task D2)
        total_h, anchors, budget, syn_h = seed_hotels(db)
        print(f"[Hotels] Successfully seeded {total_h} hotels into collection '{COLLECTION_HOTELS}':")
        print(f"  - Real Anchor properties: {anchors}")
        print(f"  - Real Budget properties: {budget}")
        print(f"  - Demo Synthetic properties: {syn_h}")

        # Seed Transport Routes (Task D3)
        total_r, est, bench, syn_r = seed_transport_routes(db)
        print(f"[Transport Routes] Successfully seeded {total_r} routes into collection '{COLLECTION_TRANSPORT_ROUTES}':")
        print(f"  - Formula-based (estimated): {est}")
        print(f"  - Route benchmark comparisons: {bench}")
        print(f"  - Demo Synthetic routes: {syn_r}")

        # Seed Experiences (Task D4)
        total_e = seed_experiences(db)
        print(f"[Experiences] Successfully seeded {total_e} experiences into collection '{COLLECTION_EXPERIENCES}'")

        # Seed Businesses (Task D5)
        total_b = seed_businesses(db)
        print(f"[Businesses] Successfully seeded {total_b} businesses into collection '{COLLECTION_BUSINESSES}'")

        # Seed Confirmations (Task D6)
        total_c = seed_confirmations(db)
        print(f"[Confirmations] Successfully seeded {total_c} confirmations into collection '{COLLECTION_CONFIRMATIONS}'")

        print("\nAll documents passed strict data integrity & emissions verification.")
    except Exception as e:
        print(f"Seeding failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
