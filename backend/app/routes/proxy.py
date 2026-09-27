"""
proxy.py — Google Maps API proxy routes
Forwards Places, Distance Matrix, Directions, and Geocoding API calls
from the frontend to Google's servers, keeping the API key server-side.
"""
import os
import httpx
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/proxy", tags=["proxy"])

GMAPS_KEY = os.getenv("GOOGLE_ROUTES_API_KEY", "")

PLACES_BASE = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
DISTMAT_BASE = "https://maps.googleapis.com/maps/api/distancematrix/json"
DIRECTIONS_BASE = "https://maps.googleapis.com/maps/api/directions/json"
GEOCODE_BASE = "https://maps.googleapis.com/maps/api/geocode/json"


@router.get("/places")
async def proxy_places(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(5000),
    type: str = Query("tourist_attraction"),
):
    """Nearby Search proxy — returns raw Google Places API response."""
    if not GMAPS_KEY:
        raise HTTPException(503, "Google Maps API key not configured")
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            PLACES_BASE,
            params={
                "location": f"{lat},{lng}",
                "radius": radius,
                "type": type,
                "key": GMAPS_KEY,
            },
        )
    data = resp.json()
    return data


@router.get("/distancematrix")
async def proxy_distance_matrix(
    origins: str = Query(...),
    destinations: str = Query(...),
    mode: str = Query("driving"),
):
    """Distance Matrix proxy."""
    if not GMAPS_KEY:
        raise HTTPException(503, "Google Maps API key not configured")
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            DISTMAT_BASE,
            params={
                "origins": origins,
                "destinations": destinations,
                "mode": mode,
                "units": "metric",
                "key": GMAPS_KEY,
            },
        )
    return resp.json()


@router.get("/directions")
async def proxy_directions(
    origin: str = Query(...),
    destination: str = Query(...),
    mode: str = Query("driving"),
):
    """Directions proxy — uses new Routes API and maps to legacy format."""
    if not GMAPS_KEY:
        raise HTTPException(503, "Google Maps API key not configured")
        
    origin_lat, origin_lng = map(float, origin.split(","))
    dest_lat, dest_lng = map(float, destination.split(","))
    
    # Map modes: 'walking' -> 'WALK', 'driving' -> 'DRIVE'
    travel_mode = "WALK" if mode.lower() == "walking" else "DRIVE"
    
    payload = {
        "origin": {"location": {"latLng": {"latitude": origin_lat, "longitude": origin_lng}}},
        "destination": {"location": {"latLng": {"latitude": dest_lat, "longitude": dest_lng}}},
        "travelMode": travel_mode
    }
    
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://routes.googleapis.com/directions/v2:computeRoutes",
            json=payload,
            headers={
                "X-Goog-Api-Key": GMAPS_KEY,
                "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline"
            }
        )
        
    data = resp.json()
    if not data or "routes" not in data or not data["routes"]:
        return {"routes": []}
        
    route = data["routes"][0]
    
    # Format distance/duration for frontend
    meters = route.get("distanceMeters", 0)
    dist_text = f"{meters/1000:.1f} km" if meters >= 1000 else f"{meters} m"
    
    seconds_str = route.get("duration", "0s")
    seconds = int(seconds_str.replace("s", "")) if seconds_str.endswith("s") else 0
    mins = seconds // 60
    hours = mins // 60
    mins = mins % 60
    dur_text = f"{hours} h {mins} min" if hours > 0 else f"{mins} min"
    
    return {
        "routes": [{
            "overview_polyline": {
                "points": route.get("polyline", {}).get("encodedPolyline", "")
            },
            "legs": [{
                "distance": {"text": dist_text},
                "duration": {"text": dur_text}
            }]
        }]
    }


@router.get("/geocode")
async def proxy_geocode(address: str = Query(...)):
    """Geocode proxy."""
    if not GMAPS_KEY:
        raise HTTPException(503, "Google Maps API key not configured")
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            GEOCODE_BASE,
            params={"address": address, "key": GMAPS_KEY},
        )
    return resp.json()
