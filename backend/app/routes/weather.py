"""Weather Digital Twin routes.

Endpoints:
  GET  /api/weather/journey-impact   — live weather for a car journey
  POST /api/weather/simulate         — what-if scenario simulation

These endpoints are ONLY meaningful for CAR mode journeys.
All outputs carry method="Digital Twin estimate · Prototype simulation"
and must be displayed with that label in the UI.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel

from app.services.weather_service import (
    fetch_weather,
    get_route_weather_points,
    compute_weather_impact,
    simulate_weather_scenario,
    _parse_current,
    _parse_hourly_next_n,
)

router = APIRouter(prefix="/api/weather", tags=["Weather Digital Twin"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class JourneyImpactRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    encoded_polyline: Optional[str] = None
    base_duration_minutes: int
    base_distance_km: float
    base_cost_inr: float
    base_co2_kg: float
    departure_iso: Optional[str] = None  # e.g. "2026-09-27T14:00:00"


class SimulateRequest(BaseModel):
    base_duration_minutes: int
    base_distance_km: float
    base_cost_inr: float
    base_co2_kg: float
    rainfall_mm_per_hour: float = 5.0
    wind_kmh: float = 20.0
    storm_duration_hours: float = 2.0
    route_coverage_fraction: float = 0.6


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/journey-impact")
async def journey_impact(req: JourneyImpactRequest):
    """
    Fetch live weather at origin + destination (+ intermediate route points),
    then compute weather impact on the car journey using the Digital Twin model.
    
    Returns:
      - origin_weather: current + 8h hourly
      - destination_weather: current + 8h hourly  
      - route_points: sampled points with per-segment weather + risk colour
      - impact: Digital Twin delay / risk / adjusted ETA
    """
    # Fetch origin and destination weather concurrently
    import asyncio
    origin_data, dest_data = await asyncio.gather(
        fetch_weather(req.origin_lat, req.origin_lng),
        fetch_weather(req.dest_lat, req.dest_lng),
    )

    origin_current = _parse_current(origin_data)
    dest_current = _parse_current(dest_data)
    origin_hourly = _parse_hourly_next_n(origin_data, n_hours=8)
    dest_hourly = _parse_hourly_next_n(dest_data, n_hours=8)

    # Get route point weather (uses polyline if supplied, else just origin+dest)
    if req.encoded_polyline:
        route_points = await get_route_weather_points(
            req.encoded_polyline,
            req.base_duration_minutes,
            req.departure_iso,
            n_samples=5,
        )
    else:
        # Fallback: just use origin and destination as the two points
        import asyncio as _asyncio
        from app.services.weather_service import _risk_level, _impact_color, _rainfall_time_penalty, _wind_speed_penalty
        pts_raw = [(req.origin_lat, req.origin_lng), (req.dest_lat, req.dest_lng)]
        route_points = []
        for i, (lat, lng) in enumerate(pts_raw):
            wdata = origin_data if i == 0 else dest_data
            cur = _parse_current(wdata)
            rain = cur.get("rain_mm", 0)
            wind = cur.get("wind_speed_kmh", 0)
            risk = _risk_level(rain, wind)
            route_points.append({
                "point_index": i,
                "lat": lat,
                "lng": lng,
                "route_fraction": i / max(len(pts_raw) - 1, 1),
                "eta_offset_minutes": int(i * req.base_duration_minutes),
                "current_weather": cur,
                "forecast_at_eta": cur,
                "rain_mm": rain,
                "wind_kmh": wind,
                "risk": risk,
                "impact_color": _impact_color(risk),
                "time_penalty_fraction": _rainfall_time_penalty(rain) + _wind_speed_penalty(wind),
            })

    # Compute Digital Twin impact
    impact = compute_weather_impact(
        req.base_duration_minutes,
        req.base_distance_km,
        req.base_cost_inr,
        req.base_co2_kg,
        route_points,
    )

    return {
        "origin": {
            "lat": req.origin_lat,
            "lng": req.origin_lng,
            "current": origin_current,
            "hourly": origin_hourly,
        },
        "destination": {
            "lat": req.dest_lat,
            "lng": req.dest_lng,
            "current": dest_current,
            "hourly": dest_hourly,
        },
        "route_points": route_points,
        "impact": impact,
        "base": {
            "duration_minutes": req.base_duration_minutes,
            "distance_km": req.base_distance_km,
            "cost_inr": req.base_cost_inr,
            "co2_kg": req.base_co2_kg,
        },
    }


@router.post("/simulate")
async def simulate_weather(req: SimulateRequest):
    """
    What-if weather simulation for a car journey.
    
    User provides hypothetical rainfall + wind + storm duration.
    Returns adjusted journey state + alternative route comparison.
    All values are clearly labelled as prototype simulation estimates.
    """
    result = simulate_weather_scenario(
        base_duration_minutes=req.base_duration_minutes,
        base_distance_km=req.base_distance_km,
        base_cost_inr=req.base_cost_inr,
        base_co2_kg=req.base_co2_kg,
        rainfall_mm_per_hour=req.rainfall_mm_per_hour,
        wind_kmh=req.wind_kmh,
        storm_duration_hours=req.storm_duration_hours,
        route_coverage_fraction=req.route_coverage_fraction,
    )
    return result
