"""Search routes — transport + accommodation.

Integrates real DB queries, live API fetches, and the Recommendation Engine.
"""

from fastapi import APIRouter
from typing import Dict, Any, List
import datetime

from app.db.mongo import get_db
from app.services.live_api import fetch_serpapi_hotels
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
                provider_metadata=cand.get("provider_metadata")
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
    seeded_cursor = db.hotels.find({"city": req.destination_city})
    results = []
    for doc in seeded_cursor:
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        doc["source"] = "seeded"
        results.append(doc)
        
    # 2. Fetch live data — use trip dates when supplied, else fall back to +7/+9 days
    if req.arrival_date and req.departure_date:
        check_in  = req.arrival_date
        check_out = req.departure_date
    else:
        check_in  = (datetime.datetime.now() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")
        check_out = (datetime.datetime.now() + datetime.timedelta(days=9)).strftime("%Y-%m-%d")
    live_hotels = await fetch_serpapi_hotels(req.destination_city, check_in, check_out)
    
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
            final_results.append(HotelResult(
                id=cand_id,
                translations=cand.get("translations"),
                city=cand.get("city"),
                price_inr_per_night=cand.get("price_inr_per_night"),
                star_rating=cand.get("star_rating"),
                data_state=cand["data_state"],
                accessibility_items=cand.get("accessibility_items", []),
                sustainability_items=cand.get("sustainability_items", []),
                personal_match_pct=cand.get("personal_match_pct"),
                trade_off_summary=cand.get("trade_off_summary", [])
            ))
        except Exception:
            pass
        
    return AccommodationSearchResponse(results=final_results)
