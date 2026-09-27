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
    travel_mode_str = "WALK" if mode.lower() == "walking" else "DRIVE"
    
    async def fetch_route(travel_mode: str):
        payload = {
            "origin": {"location": {"latLng": {"latitude": origin_lat, "longitude": origin_lng}}},
            "destination": {"location": {"latLng": {"latitude": dest_lat, "longitude": dest_lng}}},
            "travelMode": travel_mode,
            "computeAlternativeRoutes": False,
            "languageCode": "en-US",
            "units": "METRIC"
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://routes.googleapis.com/directions/v2:computeRoutes",
                json=payload,
                headers={
                    "X-Goog-Api-Key": GMAPS_KEY,
                    "X-Goog-FieldMask": (
                        "routes.duration,routes.distanceMeters,"
                        "routes.polyline.encodedPolyline,"
                        "routes.legs.duration,routes.legs.distanceMeters,"
                        "routes.legs.polyline.encodedPolyline"
                    )
                }
            )
        if resp.status_code != 200:
            return None
        data = resp.json()
        routes = data.get("routes", [])
        if not routes or not routes[0].get("polyline", {}).get("encodedPolyline"):
            return None
        return routes[0]

    # Try requested mode; fall back to DRIVE if no route returned
    route = await fetch_route(travel_mode_str)
    if route is None and travel_mode_str == "WALK":
        route = await fetch_route("DRIVE")
    if route is None:
        return {"routes": []}
    
    # Route-level distance/duration
    meters = route.get("distanceMeters", 0)
    dist_text = f"{meters/1000:.1f} km" if meters >= 1000 else f"{meters} m"
    
    seconds_str = route.get("duration", "0s")
    seconds = int(seconds_str.rstrip("s")) if seconds_str else 0
    mins = seconds // 60
    hours = mins // 60
    mins = mins % 60
    dur_text = f"{hours} h {mins} min" if hours > 0 else f"{mins} min"

    # Leg-level distance/duration (fall back to route-level if legs absent)
    legs_raw = route.get("legs", [{}])
    leg0 = legs_raw[0] if legs_raw else {}
    leg_meters = leg0.get("distanceMeters", meters)
    leg_secs_str = leg0.get("duration", seconds_str)
    leg_secs = int(leg_secs_str.rstrip("s")) if leg_secs_str else seconds
    leg_mins = leg_secs // 60
    leg_hours = leg_mins // 60
    leg_mins = leg_mins % 60
    leg_dur_text = f"{leg_hours} h {leg_mins} min" if leg_hours > 0 else f"{leg_mins} min"
    leg_dist_text = f"{leg_meters/1000:.1f} km" if leg_meters >= 1000 else f"{leg_meters} m"
    
    return {
        "routes": [{
            "overview_polyline": {
                "points": route.get("polyline", {}).get("encodedPolyline", "")
            },
            "legs": [{
                "distance": {"text": leg_dist_text},
                "duration": {"text": leg_dur_text}
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
