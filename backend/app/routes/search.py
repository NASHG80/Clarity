"""Search routes — transport + accommodation.

Integrates real DB queries, live API fetches, and the Recommendation Engine.
"""

from fastapi import APIRouter
from typing import Dict, Any, List
import datetime

from app.db.mongo import get_db
from app.services.live_api import (
    fetch_serpapi_hotels, railradar_autocomplete, google_places_autocomplete, google_places_details,
    railradar_train_route, railradar_train_live, railradar_train_fare, railradar_train_seats
)
from app.services.journey_builder import build_train_journeys, build_flight_journeys, build_car_journeys
from app.models.schemas import (
    TransportSearchRequest, AccommodationSearchRequest,
    TransportSearchResponse, AccommodationSearchResponse,
    TransportResult, HotelResult, NormalizedJourney
)
from recommendation_engine.filters import filter_candidates
from recommendation_engine.scoring import calculate_sub_scores, apply_sustainability_boost
from recommendation_engine.rank import rank_candidates, generate_trade_offs

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.get("/autocomplete/places")
async def autocomplete_places(q: str):
    return await google_places_autocomplete(q)

@router.get("/autocomplete/station")
async def autocomplete_station(q: str):
    return await railradar_autocomplete(q)

@router.get("/autocomplete/airport")
async def autocomplete_airport(q: str):
    q = q.lower()
    airports = [
        {"id": "BOM", "name": "Mumbai - Chhatrapati Shivaji Int"},
        {"id": "GOI", "name": "Goa - Dabolim"},
        {"id": "DEL", "name": "Delhi - Indira Gandhi Int"},
        {"id": "BLR", "name": "Bangalore - Kempegowda Int"}
    ]
    return [a for a in airports if q in a["name"].lower() or q in a["id"].lower()]

@router.get("/place/{place_id}")
async def get_place_details(place_id: str):
    return await google_places_details(place_id)

@router.get("/transport/train/{train_number}/route")
async def get_train_route(train_number: str):
    return await railradar_train_route(train_number)

@router.get("/transport/train/{train_number}/details")
async def get_train_details(train_number: str):
    from app.services.live_api import railradar_train_details
    return await railradar_train_details(train_number)

@router.get("/transport/train/{train_number}/live")
async def get_train_live(train_number: str):
    return await railradar_train_live(train_number)

@router.get("/transport/train/{train_number}/fare")
async def get_train_fare(train_number: str, src: str, dst: str, date: str):
    return await railradar_train_fare(train_number, src, dst, date)

@router.get("/transport/train/{train_number}/seats")
async def get_train_seats(train_number: str, src: str, dst: str, date: str):
    return await railradar_train_seats(train_number, src, dst, date)

def _build_trade_off_summary(trade_offs_data: dict, item_id: str) -> List[str]:
    if not trade_offs_data:
        return []
        
    summary = []
    is_top = trade_offs_data["top_option_id"] == item_id
    is_alt = trade_offs_data["comparison_option_id"] == item_id
    
    if not is_top and not is_alt:
        return []
        
    for to in trade_offs_data["trade_offs"]:
        # If this is the top option and the alternative is better at this axis
        # Or if this is the alternative and it is better at this axis
        if is_top:
            summary.append(f"Runner-up has better {to['axis']} score by {to['delta']:.2f}")
        elif is_alt:
            summary.append(f"Better {to['axis']} score than top option by {to['delta']:.2f}")
            
    return summary

@router.post("/transport", response_model=TransportSearchResponse)
async def search_transport(req: TransportSearchRequest) -> TransportSearchResponse:
    db = get_db()
    
    # Optional tracking
    if req.accessibility_required:
        try:
            import uuid
            doc = {
                "_id": f"req_{uuid.uuid4().hex[:8]}",
                "search_type": "transport",
                "accessibility_required": req.accessibility_required,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            db.search_requests.insert_one(doc)
        except Exception:
            pass

    # 1. We won't use seeded data for real transport logic unless specified
    results = []
    
    # 2. Fetch live journeys
    mode = req.mode or "train"
    date = req.date or (datetime.datetime.now() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")
    
    preferences = {}
    if req.weights:
        # e.g., mapping convenience to fewer transfers or less walking if high
        if req.weights.convenience and req.weights.convenience > 0.5:
            preferences["fewer_transfers"] = True
        if req.weights.environmental and req.weights.environmental > 0.5:
            preferences["eco_friendly"] = True
            
    if req.vehicle_preferences:
        preferences.update(req.vehicle_preferences)

    try:
        if mode == "train":
            journeys = await build_train_journeys(req.origin, req.destination, date, preferences)
        elif mode == "flight":
            journeys = await build_flight_journeys(req.origin, req.destination, date, preferences)
        elif mode == "car":
            journeys = await build_car_journeys(req.origin, req.destination, preferences)
        else:
            journeys = []
            
        for j in journeys:
            results.append(j.model_dump())
    except Exception as e:
        import traceback
        traceback.print_exc()
        results = []
            
    # 4. Filter (C3/C4)
    filtered = filter_candidates(
        results,
        budget_max=req.budget_max,
        time_max_hours=req.time_max_hours,
        accessibility_required=req.accessibility_required,
        include_unverified=req.include_unverified
    )
    
    # 5. Score (C4)
    sub_scores = calculate_sub_scores(filtered)
    
    # 6. Rank (C5/C6)
    ranked_meta = rank_candidates(filtered, sub_scores, req.weights)
    
    # 7. Trade-offs (C5)
    trade_offs_data = generate_trade_offs(ranked_meta, req.weights)
    
    # Map to TransportResult
    final_results = []
    for meta in ranked_meta:
        cand = filtered[meta["original_index"]]
        cand_id = meta["id"]
        
        # Merge the computed scores
        cand["personal_match_pct"] = meta["personal_match_pct"]
        cand["trade_off_summary"] = _build_trade_off_summary(trade_offs_data, cand_id)
        
        # Pydantic will validate the strict schema.
        try:
            emissions_data = cand.get("emissions", {
                "method": "estimated",
                "co2e_kg": cand.get("total_co2_kg", 0.0),
                "distance_km": sum(s.get("distance_km", 0) for s in cand.get("segments", [])),
                "emission_factor": 0.04
            })
            
            final_results.append(TransportResult(
                id=cand_id,
                mode=cand["mode"],
                cost_inr=cand.get("total_cost_inr", 0),
                duration_minutes=cand.get("total_duration_minutes", 0),
                emissions=emissions_data,
                accessibility=cand.get("accessibility", {"value": None, "data_state": "not_verified"}),
                personal_match_pct=cand.get("personal_match_pct"),
                trade_off_summary=cand.get("trade_off_summary", []),
                recommendation_reasons=cand.get("recommendation_reasons", []),
                total_walking_m=cand.get("total_walking_m", 0),
                transfer_count=cand.get("transfer_count", 0),
                segments=cand.get("segments", []),
                provider_details=cand.get("provider_details")
            ))
        except Exception as e:
            # Skip invalid candidates
            import logging
            logging.error(f"Failed to map TransportResult: {e}")
            pass

    return TransportSearchResponse(results=final_results)

@router.post("/accommodation", response_model=AccommodationSearchResponse)
async def search_accommodation(req: AccommodationSearchRequest) -> AccommodationSearchResponse:
    db = get_db()
    
    if req.accessibility_required:
        try:
            import uuid
            doc = {
                "_id": f"req_{uuid.uuid4().hex[:8]}",
                "search_type": "accommodation",
                "accessibility_required": req.accessibility_required,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            db.search_requests.insert_one(doc)
        except Exception:
            pass

    # 1. Fetch seeded
    if req.destination_city == "ALL":
        seeded_cursor = db.hotels.find({})
    else:
        seeded_cursor = db.hotels.find({
            "$or": [
                {"city": {"$regex": req.destination_city, "$options": "i"}},
                {"name": {"$regex": req.destination_city, "$options": "i"}},
                {"address": {"$regex": req.destination_city, "$options": "i"}}
            ]
        })
        
        # If no exact match and destination_city contains commas (e.g. "Candolim, Goa"), try matching the last part
        if "," in req.destination_city:
            broad_city = req.destination_city.split(",")[-1].strip()
            if broad_city:
                broad_cursor = db.hotels.find({
                    "$or": [
                        {"city": {"$regex": broad_city, "$options": "i"}},
                        {"address": {"$regex": broad_city, "$options": "i"}}
                    ]
                })
                # Combine the results
                seeded_cursor = list(seeded_cursor) + list(broad_cursor)
    
    results = []
    seen_seeded_names = set()
    for doc in seeded_cursor:
        name = doc.get("name", "").lower()
        if name in seen_seeded_names:
            continue
        seen_seeded_names.add(name)
        
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        doc["source"] = "seeded"
        results.append(doc)
        
    # 2. Fetch live data — use trip dates when supplied, else fall back to +7/+9 days
    if req.destination_city and req.destination_city != "ALL":
        if req.arrival_date and req.departure_date:
            check_in  = req.arrival_date
            check_out = req.departure_date
        else:
            check_in  = (datetime.datetime.now() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")
            check_out = (datetime.datetime.now() + datetime.timedelta(days=9)).strftime("%Y-%m-%d")
        live_hotels = await fetch_serpapi_hotels(req.destination_city, check_in, check_out)
    else:
        live_hotels = []
    
    # 3. Deduplicate
    seen_names = {r.get("name", "").lower() for r in results if r.get("name")}
    for item in live_hotels:
        name = item.get("name", "")
        if "id" not in item:
            item["id"] = f"live_{len(seen_names)}"
        if name.lower() not in seen_names:
            results.append(item)
            seen_names.add(name.lower())
            
    # 4. Filter
    filtered = filter_candidates(
        results,
        budget_max=req.budget_max,
        accessibility_required=req.accessibility_required,
        include_unverified=req.include_unverified
    )
    
    # 5. Score
    sub_scores = calculate_sub_scores(filtered)

    # 5b. Sustainability soft boost (AGENTS.md §2.2 — not_verified items never boosted)
    sub_scores = apply_sustainability_boost(
        filtered,
        sub_scores,
        req.sustainability_preferred or [],
    )

    # 6. Rank
    ranked_meta = rank_candidates(filtered, sub_scores, req.weights)
    
    # 7. Trade-offs
    trade_offs_data = generate_trade_offs(ranked_meta, req.weights)
    
    # Map to HotelResult
    final_results = []
    for meta in ranked_meta:
        cand = filtered[meta["original_index"]]
        cand_id = meta["id"]
        
        cand["personal_match_pct"] = meta["personal_match_pct"]
        cand["trade_off_summary"] = _build_trade_off_summary(trade_offs_data, cand_id)
        
        try:
            # Handle live API differences gracefully
            translations = cand.get("translations")
            if not translations and cand.get("name"):
                translations = {"en": {"name": cand.get("name")}}
            
            price = cand.get("price_inr_per_night")
            if price is None:
                price = cand.get("cost_inr") or 0.0

            final_results.append(HotelResult(
                id=cand_id,
                translations=translations,
                city=cand.get("city", req.destination_city),
                price_inr_per_night=price,
                star_rating=cand.get("star_rating", cand.get("rating")),
                data_state=cand.get("data_state", "not_verified"),
                accessibility_items=cand.get("accessibility_items", []),
                sustainability_items=cand.get("sustainability_items", []),
                personal_match_pct=cand.get("personal_match_pct"),
                trade_off_summary=cand.get("trade_off_summary", [])
            ))
        except Exception as e:
            import logging
            logging.error(f"Failed to map hotel {cand_id}: {e}")
        
    return AccommodationSearchResponse(results=final_results)
