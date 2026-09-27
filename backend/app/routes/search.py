"""Search routes — transport + accommodation.

Integrates real DB queries, live API fetches, and the Recommendation Engine.
"""

from fastapi import APIRouter
from typing import Dict, Any, List
import datetime

from app.db.mongo import get_db
from app.services.live_api import fetch_serpapi_flights, fetch_serpapi_hotels, fetch_railradar_trains
from app.models.schemas import (
    TransportSearchRequest, AccommodationSearchRequest,
    TransportSearchResponse, AccommodationSearchResponse,
    TransportResult, HotelResult
)
from recommendation_engine.filters import filter_candidates
from recommendation_engine.scoring import calculate_sub_scores
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

    # 1. Fetch seeded data
    seeded_cursor = db.transport_routes.find({
        "origin": req.origin,
        "destination": req.destination
    })
    results = []
    for doc in seeded_cursor:
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        doc["source"] = "seeded"
        results.append(doc)
    
    # 2. Fetch live data
    search_date = (datetime.datetime.now() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")
    live_flights = await fetch_serpapi_flights(req.origin, req.destination, search_date)
    live_trains = await fetch_railradar_trains(req.origin, req.destination, search_date)
    
    # 3. Combine and deduplicate
    seen_ids = {r.get("id") for r in results if r.get("id")}
    for item in live_flights + live_trains:
        if "id" not in item:
            item["id"] = f"live_{len(seen_ids)}"
        if item["id"] not in seen_ids:
            results.append(item)
            seen_ids.add(item["id"])
            
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
            final_results.append(TransportResult(
                id=cand_id,
                mode=cand["mode"],
                cost_inr=cand["cost_inr"],
                duration_minutes=cand["duration_minutes"],
                emissions=cand["emissions"],
                accessibility=cand["accessibility"],
                personal_match_pct=cand.get("personal_match_pct"),
                trade_off_summary=cand.get("trade_off_summary", []),
                segments=cand.get("segments", [])
            ))
        except Exception as e:
            # Skip invalid candidates
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
    query = {}
    if req.destination_city and req.destination_city != "ALL":
        query["city"] = req.destination_city
    seeded_cursor = db.hotels.find(query)
    results = []
    for doc in seeded_cursor:
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        doc["source"] = "seeded"
        results.append(doc)
        
    # 2. Fetch live data
    if req.destination_city and req.destination_city != "ALL":
        check_in = (datetime.datetime.now() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")
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
