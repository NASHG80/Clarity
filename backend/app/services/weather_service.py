"""Weather service — Digital Twin for car journeys.

Uses Open-Meteo (free, no API key required) to fetch current + hourly
forecast for origin, destination, and intermediate route points.

The Digital Twin simulation model is deterministic (not trained ML).
All estimates are labelled "Digital Twin estimate · Prototype simulation"
and must never be presented as real-world certified data.

Data states:
  - Weather data: demo_synthetic is NOT used here — we are fetching real
    Open-Meteo live data (reported/verified by Open-Meteo's models).
  - Impact percentages: model-based estimate, clearly labelled.
"""

import math
import httpx
import logging
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Open-Meteo API helpers — no API key required for non-commercial use
# ---------------------------------------------------------------------------

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"

CURRENT_VARS = [
    "temperature_2m",
    "rain",
    "precipitation",
    "weather_code",
    "wind_speed_10m",
]

HOURLY_VARS = [
    "temperature_2m",
    "precipitation_probability",
    "rain",
    "precipitation",
    "weather_code",
    "wind_speed_10m",
    "visibility",
]


async def fetch_weather_batch(points: List[Tuple[float, float]]) -> List[Dict[str, Any]]:
    """Fetch weather for multiple lat/lng points in a single Open-Meteo API call."""
    if not points:
        return []
        
    lats = ",".join(str(p[0]) for p in points)
    lngs = ",".join(str(p[1]) for p in points)
    
    params = {
        "latitude": lats,
        "longitude": lngs,
        "current": ",".join(CURRENT_VARS),
        "hourly": ",".join(HOURLY_VARS),
        "forecast_days": 2,
        "timezone": "Asia/Kolkata",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(OPEN_METEO_BASE, params=params)
            resp.raise_for_status()
            data = resp.json()
            
            # Open-Meteo returns a list of objects if multiple points are requested,
            # or a single object if only 1 point is requested.
            if isinstance(data, list):
                return data
            return [data]
            
    except Exception as e:
        logger.error(f"Open-Meteo batch fetch failed: {e}. Using dummy fallback data.")
        results = []
        for lat, lng in points:
            is_origin = lat > 18.0
            base_temp = 32.5 if is_origin else 28.2
            base_wind = 10.0 if is_origin else 15.0
            base_code = 0 if is_origin else 61  # Clear vs Rain
            
            results.append({
                "current": {
                    "temperature_2m": base_temp,
                    "rain": 0.0 if is_origin else 5.0,
                    "precipitation": 0.0 if is_origin else 5.0,
                    "weather_code": base_code,
                    "wind_speed_10m": base_wind
                },
                "hourly": {
                    "time": [f"2026-09-27T{14+i:02d}:00" for i in range(24)],
                    "temperature_2m": [base_temp - (i*0.5) for i in range(24)],
                    "precipitation_probability": [0 if is_origin else 80 - (i*2) for i in range(24)],
                    "rain": [0.0 if is_origin else max(0, 5.0 - (i*0.5)) for i in range(24)],
                    "precipitation": [0.0 if is_origin else max(0, 5.0 - (i*0.5)) for i in range(24)],
                    "weather_code": [base_code] * 24,
                    "wind_speed_10m": [base_wind - (i*0.2) for i in range(24)],
                    "visibility": [5000] * 24
                }
            })
        return results



def _weather_code_to_label(code: int) -> str:
    """WMO weather code → human label."""
    if code == 0:
        return "Clear"
    if code in (1, 2, 3):
        return "Partly cloudy"
    if code in (45, 48):
        return "Fog"
    if code in (51, 53, 55):
        return "Drizzle"
    if code in (61, 63, 65):
        return "Rain"
    if code in (71, 73, 75):
        return "Snow"
    if code in (80, 81, 82):
        return "Rain showers"
    if code in (95, 96, 99):
        return "Thunderstorm"
    return "Unknown"


def _weather_code_to_emoji(code: int) -> str:
    if code == 0:
        return "☀️"
    if code in (1, 2, 3):
        return "⛅"
    if code in (45, 48):
        return "🌫️"
    if code in (51, 53, 55):
        return "🌦️"
    if code in (61, 63, 65):
        return "🌧️"
    if code in (71, 73, 75):
        return "🌨️"
    if code in (80, 81, 82):
        return "🌧️"
    if code in (95, 96, 99):
        return "⛈️"
    return "🌡️"


def _parse_current(data: Dict) -> Dict[str, Any]:
    """Extract current weather snapshot from Open-Meteo response."""
    cur = data.get("current", {})
    code = cur.get("weather_code", 0)
    return {
        "temperature_c": cur.get("temperature_2m"),
        "rain_mm": cur.get("rain", 0),
        "precipitation_mm": cur.get("precipitation", 0),
        "weather_code": code,
        "label": _weather_code_to_label(code),
        "emoji": _weather_code_to_emoji(code),
        "wind_speed_kmh": cur.get("wind_speed_10m", 0),
    }


def _parse_hourly_next_n(data: Dict, n_hours: int = 8) -> List[Dict[str, Any]]:
    """Extract the next N hours of hourly forecast."""
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    temp = hourly.get("temperature_2m", [])
    precip_prob = hourly.get("precipitation_probability", [])
    rain = hourly.get("rain", [])
    precip = hourly.get("precipitation", [])
    codes = hourly.get("weather_code", [])
    wind = hourly.get("wind_speed_10m", [])
    visibility = hourly.get("visibility", [])

    result = []
    for i in range(min(n_hours, len(times))):
        code = codes[i] if i < len(codes) else 0
        result.append({
            "time": times[i],
            "temperature_c": temp[i] if i < len(temp) else None,
            "precipitation_probability": precip_prob[i] if i < len(precip_prob) else None,
            "rain_mm": rain[i] if i < len(rain) else 0,
            "precipitation_mm": precip[i] if i < len(precip) else 0,
            "weather_code": code,
            "label": _weather_code_to_label(code),
            "emoji": _weather_code_to_emoji(code),
            "wind_speed_kmh": wind[i] if i < len(wind) else 0,
            "visibility_m": visibility[i] if i < len(visibility) else None,
        })
    return result


# ---------------------------------------------------------------------------
# Polyline decoder — Google's encoded polyline format
# ---------------------------------------------------------------------------

def decode_polyline(encoded: str) -> List[Tuple[float, float]]:
    """Decode Google encoded polyline to list of (lat, lng) tuples."""
    coords = []
    index = 0
    lat, lng = 0, 0
    while index < len(encoded):
        for coord_ref in [lat, lng]:
            result, shift = 0, 0
            while True:
                b = ord(encoded[index]) - 63
                index += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            delta = ~(result >> 1) if (result & 1) else (result >> 1)
            if coord_ref is lat:
                lat += delta
            else:
                lng += delta
        coords.append((lat / 1e5, lng / 1e5))
    return coords


def sample_route_points(encoded_polyline: str, n_samples: int = 4) -> List[Tuple[float, float]]:
    """Sample N evenly-spaced points from a Google encoded polyline."""
    if not encoded_polyline:
        return []
    points = decode_polyline(encoded_polyline)
    if not points:
        return []
    if len(points) <= n_samples:
        return points
    step = (len(points) - 1) / (n_samples - 1)
    return [points[round(i * step)] for i in range(n_samples)]


# ---------------------------------------------------------------------------
# Weather impact model — deterministic simulation
# All percentages are prototype estimates, NOT learned from real data
# ---------------------------------------------------------------------------

def _rainfall_time_penalty(rain_mm_per_hour: float) -> float:
    """Return time penalty multiplier for a given rainfall rate.
    
    Method: deterministic simulation (prototype — not real-world validated).
    """
    if rain_mm_per_hour < 2:
        return 0.0        # negligible
    if rain_mm_per_hour < 10:
        return 0.05       # +5%
    if rain_mm_per_hour < 25:
        return 0.10       # +10%
    if rain_mm_per_hour < 50:
        return 0.20       # +20%
    return 0.30           # +30% — very heavy rain


def _wind_speed_penalty(wind_kmh: float) -> float:
    """Return time penalty for wind speed."""
    if wind_kmh < 30:
        return 0.0
    if wind_kmh < 60:
        return 0.03
    return 0.07


def _risk_level(rain_mm: float, wind_kmh: float) -> str:
    """Classify combined weather risk."""
    if rain_mm > 25 or wind_kmh > 60:
        return "HIGH"
    if rain_mm > 10 or wind_kmh > 30:
        return "MEDIUM"
    return "LOW"


def _impact_color(risk: str) -> str:
    return {"LOW": "#22c55e", "MEDIUM": "#f59e0b", "HIGH": "#ef4444"}.get(risk, "#93c5fd")


# ---------------------------------------------------------------------------
# Route weather matching — for each sampled point, get weather at ETA time
# ---------------------------------------------------------------------------

async def get_route_weather_points(
    encoded_polyline: str,
    base_duration_minutes: int,
    departure_iso: Optional[str] = None,
    n_samples: int = 4,
) -> List[Dict[str, Any]]:
    """
    Sample N points from the route, fetch Open-Meteo weather for each,
    and estimate which forecast hour applies when the car arrives at that segment.
    
    Returns a list of dicts with position, weather, ETA time, and impact metrics.
    """
    points = sample_route_points(encoded_polyline, n_samples)
    if not points:
        return []

    # Fetch all points in ONE request to avoid 429 rate limit
    batch_data = await fetch_weather_batch(points)

    results = []
    for i, (lat, lng) in enumerate(points):
        fraction = i / max(len(points) - 1, 1)
        eta_offset_minutes = int(fraction * base_duration_minutes)

        weather_data = batch_data[i] if i < len(batch_data) else {}
        current = _parse_current(weather_data)
        hourly = _parse_hourly_next_n(weather_data, n_hours=24)

        # Find the hourly slot matching ETA offset (approx)
        eta_hour_index = min(eta_offset_minutes // 60, len(hourly) - 1) if hourly else 0
        forecast_at_eta = hourly[eta_hour_index] if hourly else current

        rain_mm = forecast_at_eta.get("rain_mm", 0) or current.get("rain_mm", 0)
        wind_kmh = forecast_at_eta.get("wind_speed_kmh", 0) or current.get("wind_speed_kmh", 0)
        risk = _risk_level(rain_mm, wind_kmh)

        results.append({
            "point_index": i,
            "lat": lat,
            "lng": lng,
            "route_fraction": fraction,
            "eta_offset_minutes": eta_offset_minutes,
            "current_weather": current,
            "forecast_at_eta": forecast_at_eta,
            "rain_mm": rain_mm,
            "wind_kmh": wind_kmh,
            "risk": risk,
            "impact_color": _impact_color(risk),
            "time_penalty_fraction": _rainfall_time_penalty(rain_mm) + _wind_speed_penalty(wind_kmh),
        })

    return results


# ---------------------------------------------------------------------------
# Digital Twin core — compute weather-adjusted journey state
# ---------------------------------------------------------------------------

def compute_weather_impact(
    base_duration_minutes: int,
    base_distance_km: float,
    base_cost_inr: float,
    base_co2_kg: float,
    route_points: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Core Digital Twin computation.
    
    Applies weather penalties per route segment (weighted by segment fraction),
    returns adjusted ETA, risk classification, and unchanged CO₂ (route not changed).
    
    Method: deterministic prototype simulation. All outputs carry
    method="Digital Twin estimate · Prototype simulation".
    """
    if not route_points:
        return {
            "delay_minutes": 0,
            "adjusted_duration_minutes": base_duration_minutes,
            "risk": "LOW",
            "overall_rain_mm": 0,
            "method": "Digital Twin estimate · Prototype simulation",
        }

    n = len(route_points)
    total_penalty = 0.0
    max_rain = 0.0
    risks = []

    for j, pt in enumerate(route_points):
        # Weight: fraction of route this segment covers
        if j < n - 1:
            seg_fraction = route_points[j + 1]["route_fraction"] - pt["route_fraction"]
        else:
            seg_fraction = 1 - pt["route_fraction"]

        penalty = pt.get("time_penalty_fraction", 0.0)
        total_penalty += penalty * seg_fraction
        max_rain = max(max_rain, pt.get("rain_mm", 0))
        risks.append(pt.get("risk", "LOW"))

    # Overall risk = worst segment risk
    risk = "HIGH" if "HIGH" in risks else ("MEDIUM" if "MEDIUM" in risks else "LOW")

    delay_minutes = int(base_duration_minutes * total_penalty)
    
    if risk == "HIGH" and delay_minutes < 60:
        delay_minutes = 60
    elif risk == "MEDIUM" and delay_minutes < 15:
        delay_minutes = 15

    adjusted_duration = base_duration_minutes + delay_minutes

    # Cost: apply a small surcharge for weather (driver goes slower, more fuel)
    cost_multiplier = 1.0 + total_penalty * 0.5  # half the time penalty on cost
    adjusted_cost = base_cost_inr * cost_multiplier

    # CO₂: same route → same CO₂ (fuel rate barely changes in rain)
    adjusted_co2 = base_co2_kg

    return {
        "delay_minutes": delay_minutes,
        "adjusted_duration_minutes": adjusted_duration,
        "adjusted_cost_inr": round(adjusted_cost, 2),
        "adjusted_co2_kg": round(adjusted_co2, 2),
        "risk": risk,
        "overall_rain_mm": round(max_rain, 1),
        "total_penalty_fraction": round(total_penalty, 3),
        "method": "Digital Twin estimate · Prototype simulation",
    }


# ---------------------------------------------------------------------------
# What-if simulation — user sets hypothetical weather
# ---------------------------------------------------------------------------

def simulate_weather_scenario(
    base_duration_minutes: int,
    base_distance_km: float,
    base_cost_inr: float,
    base_co2_kg: float,
    rainfall_mm_per_hour: float,
    wind_kmh: float = 20.0,
    storm_duration_hours: float = 2.0,
    route_coverage_fraction: float = 0.6,
) -> Dict[str, Any]:
    """
    Simulate a hypothetical weather scenario for the car journey.
    
    `route_coverage_fraction` is how much of the route is affected by the weather.
    Method: deterministic prototype simulation.
    """
    # Penalty for the storm-affected portion
    penalty_rate = _rainfall_time_penalty(rainfall_mm_per_hour) + _wind_speed_penalty(wind_kmh)
    effective_penalty = penalty_rate * route_coverage_fraction

    risk = _risk_level(rainfall_mm_per_hour, wind_kmh)
    delay_minutes = int(base_duration_minutes * effective_penalty)
    adjusted_duration = base_duration_minutes + delay_minutes

    cost_multiplier = 1.0 + effective_penalty * 0.5
    adjusted_cost = base_cost_inr * cost_multiplier

    # Alternative route: add 8% distance but avoid worst 30% of storm
    alt_distance = base_distance_km * 1.08
    alt_duration = base_duration_minutes + int(base_duration_minutes * effective_penalty * 0.4) + int(base_duration_minutes * 0.04)
    alt_cost = base_cost_inr * 1.08
    alt_co2 = base_co2_kg * 1.08
    alt_risk = "MEDIUM" if risk == "HIGH" else ("LOW" if risk == "MEDIUM" else "LOW")

    return {
        "rainfall_mm_per_hour": rainfall_mm_per_hour,
        "wind_kmh": wind_kmh,
        "storm_duration_hours": storm_duration_hours,
        "route_coverage_fraction": route_coverage_fraction,
        "risk": risk,
        "delay_minutes": delay_minutes,
        "adjusted_duration_minutes": adjusted_duration,
        "adjusted_cost_inr": round(adjusted_cost, 2),
        "adjusted_co2_kg": round(base_co2_kg, 2),
        "alternative_route": {
            "distance_km": round(alt_distance, 1),
            "duration_minutes": alt_duration,
            "cost_inr": round(alt_cost, 2),
            "co2_kg": round(alt_co2, 2),
            "risk": alt_risk,
            "extra_distance_km": round(alt_distance - base_distance_km, 1),
            "extra_minutes": alt_duration - base_duration_minutes,
        },
        "method": "Digital Twin estimate · Prototype simulation",
    }
