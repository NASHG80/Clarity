import os
import time
import httpx
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
RAILRADAR_API_KEY = os.getenv("RAILRADAR_API_KEY")
LIVE_DATA_CACHE_TTL = int(os.getenv("LIVE_DATA_CACHE_TTL_SECONDS", "3600"))
SERPAPI_ENABLED = os.getenv("SERPAPI_ENABLED", "true").lower() == "true"
RAILRADAR_ENABLED = os.getenv("RAILRADAR_ENABLED", "true").lower() == "true"
LIVE_TRAVEL_DATA_ENABLED = os.getenv("LIVE_TRAVEL_DATA_ENABLED", "true").lower() == "true"

class SimpleCache:
    def __init__(self, ttl: int):
        self.ttl = ttl
        self.cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry["timestamp"] < self.ttl:
                return entry["data"]
            else:
                del self.cache[key]
        return None

    def set(self, key: str, data: Any):
        self.cache[key] = {
            "timestamp": time.time(),
            "data": data
        }

api_cache = SimpleCache(ttl=LIVE_DATA_CACHE_TTL)

async def fetch_serpapi_flights(origin: str, destination: str, date: str) -> List[Dict]:
    if not LIVE_TRAVEL_DATA_ENABLED or not SERPAPI_ENABLED or not SERPAPI_API_KEY:
        return []
        
    cache_key = f"serpapi_flight_{origin}_{destination}_{date}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        return cached

    # Mapping common cities to codes
    codes = {"Mumbai": "BOM", "Goa": "GOI", "Delhi": "DEL"}
    orig_code = codes.get(origin, origin)
    dest_code = codes.get(destination, destination)

    params = {
        "engine": "google_flights",
        "departure_id": orig_code,
        "arrival_id": dest_code,
        "outbound_date": date,
        "type": "2",  # One-way
        "currency": "INR",
        "hl": "en",
        "api_key": SERPAPI_API_KEY
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://serpapi.com/search", params=params)
            resp.raise_for_status()
            data = resp.json()
            
            results = []
            flights = data.get("best_flights", []) or data.get("other_flights", [])
            for f in flights:
                # Normalize to API contract
                cost = f.get("price")
                duration = f.get("total_duration")
                results.append({
                    "id": f.get("flight_token", f.get("flights", [{}])[0].get("flight_number", "serp_flight")),
                    "mode": "flight",
                    "cost_inr": cost,
                    "duration_minutes": duration,
                    "accessibility": {"value": None, "data_state": "not_verified"},
                    "source": "live",
                    "personal_match_pct": None
                })
            
            api_cache.set(cache_key, results)
            return results
    except Exception as e:
        logger.error(f"SerpApi flight error: {e}")
        return []

async def fetch_serpapi_hotels(destination: str, check_in: str, check_out: str) -> List[Dict]:
    if not LIVE_TRAVEL_DATA_ENABLED or not SERPAPI_ENABLED or not SERPAPI_API_KEY:
        return []

    cache_key = f"serpapi_hotel_{destination}_{check_in}_{check_out}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        return cached

    params = {
        "engine": "google_hotels",
        "q": destination,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "currency": "INR",
        "hl": "en",
        "api_key": SERPAPI_API_KEY
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://serpapi.com/search", params=params)
            resp.raise_for_status()
            data = resp.json()
            
            results = []
            for prop in data.get("properties", []):
                price_val = prop.get("rate_per_night", {}).get("lowest")
                if isinstance(price_val, str):
                    try:
                        price_val = int("".join(filter(str.isdigit, price_val)))
                    except ValueError:
                        price_val = None
                
                results.append({
                    "id": prop.get("property_token", prop.get("name")),
                    "name": prop.get("name"),
                    "cost_inr": price_val,
                    "rating": prop.get("overall_rating"),
                    "accessibility_items": [], # not_verified
                    "sustainability_items": [], # not_verified
                    "source": "live"
                })
            
            api_cache.set(cache_key, results)
            return results
    except Exception as e:
        logger.error(f"SerpApi hotel error: {e}")
        return []

async def fetch_railradar_trains(origin: str, destination: str, date: str) -> List[Dict]:
    if not LIVE_TRAVEL_DATA_ENABLED or not RAILRADAR_ENABLED or not RAILRADAR_API_KEY:
        return []

    cache_key = f"railradar_{origin}_{destination}_{date}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        return cached

    codes = {"Mumbai": "CSTM", "Goa": "MAO", "Delhi": "NDLS"}
    orig_code = codes.get(origin, origin)
    dest_code = codes.get(destination, destination)

    headers = {"Authorization": f"Bearer {RAILRADAR_API_KEY}"}
    params = {"date": date, "live": "false"}
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"https://api.railradar.in/v1/trains/between/{orig_code}/{dest_code}", headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()
            
            results = []
            for t in data.get("trains", []):
                results.append({
                    "id": t.get("train_number", "railradar_train"),
                    "mode": "train",
                    "cost_inr": t.get("fare"),
                    "duration_minutes": t.get("duration"),
                    "accessibility": {"value": None, "data_state": "not_verified"},
                    "source": "live",
                    "personal_match_pct": None
                })
            
            api_cache.set(cache_key, results)
            return results
    except Exception as e:
        logger.error(f"RailRadar error: {e}")
        # Return empty list gracefully on failure
        return []
