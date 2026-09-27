import os
import time
import httpx
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
RAILRADAR_API_KEY = os.getenv("RAILRADAR_API_KEY")
GOOGLE_ROUTES_API_KEY = os.getenv("GOOGLE_ROUTES_API_KEY")

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

api_cache = SimpleCache(ttl=3600)

async def google_routes_compute(body: dict, mask: str) -> dict:
    if not GOOGLE_ROUTES_API_KEY:
        logger.error("Missing GOOGLE_ROUTES_API_KEY")
        return {}
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_ROUTES_API_KEY,
        "X-Goog-FieldMask": mask
    }
    # Do not cache routes as per terms, though for dev we might. We won't cache here.
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post("https://routes.googleapis.com/directions/v2:computeRoutes", json=body, headers=headers)
            if resp.status_code != 200:
                logger.error(f"Google Routes HTTP {resp.status_code}: {resp.text}")
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"Google Routes API error: {e}")
        return {}

async def railradar_get(path: str, params: dict = None) -> dict:
    if not RAILRADAR_API_KEY:
        logger.error("Missing RAILRADAR_API_KEY")
        return {}
    
    # Simple caching for trains
    cache_key = f"railradar_{path}_{str(params)}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        return cached

    headers = {"Authorization": f"Bearer {RAILRADAR_API_KEY}"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"https://api.railradar.in{path}", headers=headers, params=params)
            
            try:
                data = resp.json()
            except:
                data = {}

            if resp.status_code == 200:
                api_cache.set(cache_key, data)
                return data
            
            return {"error": True, "status": resp.status_code, "message": data.get("message", f"HTTP {resp.status_code}")}
    except Exception as e:
        logger.error(f"RailRadar API error: {e}")
        return {"error": True, "status": 500, "message": str(e)}

async def railradar_autocomplete(q: str) -> List[Dict]:
    data = await railradar_get(f"/v1/lookup/search/stations", {"q": q, "limit": 20})
    if data.get("error"):
        from fastapi import HTTPException
        raise HTTPException(status_code=data.get("status", 500), detail=data.get("message", "Error fetching stations"))
    if data and data.get("success"):
        return data.get("data", [])
    return []

async def railradar_train_route(train_number: str) -> dict:
    return await railradar_get(f"/v1/trains/{train_number}/route")

async def railradar_train_details(train_number: str) -> dict:
    return await railradar_get(f"/v1/trains/{train_number}")

async def railradar_train_live(train_number: str) -> dict:
    return await railradar_get(f"/v1/trains/{train_number}/live")

async def railradar_train_fare(train_number: str, src: str, dst: str, date: str) -> dict:
    return await railradar_get(f"/v1/trains/{train_number}/fare", {"journeyDate": date, "source": src, "destination": dst, "class": "3A"})

async def railradar_train_seats(train_number: str, src: str, dst: str, date: str) -> dict:
    return await railradar_get(f"/v1/trains/{train_number}/seat-availability", {"journeyDate": date, "source": src, "destination": dst, "class": "3A"})

async def serpapi_get(params: dict) -> dict:
    if not SERPAPI_API_KEY:
        logger.error("Missing SERPAPI_API_KEY")
        return {}
    
    cache_key = f"serpapi_{str(params)}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        return cached

    req_params = params.copy()
    req_params["api_key"] = SERPAPI_API_KEY
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://serpapi.com/search", params=req_params)
            resp.raise_for_status()
            data = resp.json()
            api_cache.set(cache_key, data)
            return data
    except Exception as e:
        logger.error(f"SerpApi error: {e}")
        return {}

async def fetch_serpapi_hotels(destination: str, check_in: str, check_out: str) -> List[Dict]:
    params = {
        "engine": "google_hotels",
        "q": destination,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "currency": "INR",
        "hl": "en"
    }
    data = await serpapi_get(params)
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
            "accessibility_items": [],
            "sustainability_items": [],
            "source": "live",
            "photos": [img.get("thumbnail") or img.get("original_image") for img in prop.get("images", [])] if prop.get("images") else []
        })
    return results

async def google_places_autocomplete(q: str) -> List[Dict]:
    if not GOOGLE_ROUTES_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://places.googleapis.com/v1/places:autocomplete",
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_ROUTES_API_KEY,
                },
                json={"input": q}
            )
            data = resp.json()
            return data.get("suggestions", [])
    except Exception as e:
        logger.error(f"Google Places Autocomplete error: {e}")
        return []

async def google_places_details(place_id: str) -> dict:
    if not GOOGLE_ROUTES_API_KEY:
        return {}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://places.googleapis.com/v1/places/{place_id}",
                headers={
                    "X-Goog-Api-Key": GOOGLE_ROUTES_API_KEY,
                    "X-Goog-FieldMask": "id,displayName,formattedAddress,location"
                }
            )
            return resp.json()
    except Exception as e:
        logger.error(f"Google Places Details error: {e}")
        return {}
