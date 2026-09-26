import asyncio
import uuid
import logging
from typing import List, Dict, Any, Optional

from app.models.schemas import (
    NormalizedPlace, NormalizedSegment, NormalizedJourney,
    AttributeWithState, DataState
)
from app.services.live_api import google_routes_compute, railradar_get, serpapi_get

logger = logging.getLogger(__name__)

# Static resolution for hackathon (since RailRadar station search is flaky)
CITY_STATIONS = {
    "mumbai": ["LTT", "CSTM", "BCT", "BDTS", "BVI"],
    "goa": ["MAO", "VSG", "KRMI", "THVM"],
    "delhi": ["NDLS", "NZM", "DLI"],
    "bangalore": ["SBC", "YPR"]
}

CITY_AIRPORTS = {
    "mumbai": ["BOM"],
    "goa": ["GOI", "GOX"],
    "delhi": ["DEL"],
    "bangalore": ["BLR"]
}

def resolve_place_text(place: Any) -> str:
    if isinstance(place, dict):
        return place.get('address') or place.get('name') or ""
    return str(place)

def resolve_place_coords(place: Any) -> Optional[Dict[str, float]]:
    if isinstance(place, dict) and 'lat' in place and 'lng' in place:
        return {"latitude": place["lat"], "longitude": place["lng"]}
    return None

async def _get_google_route(origin_place: Any, dest_place: Any, mode: str, preferences: dict = None) -> dict:
    """Gets a Google route (Drive or Transit) with standardized field mask."""
    body = {
        "travelMode": mode,
        "languageCode": "en-US",
        "units": "METRIC"
    }
    
    orig_coords = resolve_place_coords(origin_place)
    if orig_coords:
        body["origin"] = {"location": {"latLng": orig_coords}}
    else:
        body["origin"] = {"address": resolve_place_text(origin_place)}
        
    dest_coords = resolve_place_coords(dest_place)
    if dest_coords:
        body["destination"] = {"location": {"latLng": dest_coords}}
    else:
        body["destination"] = {"address": resolve_place_text(dest_place)}

    if mode == "TRANSIT" and preferences:
        # Check for less walking or fewer transfers
        if preferences.get("less_walking"):
            body["transitPreferences"] = {"routingPreference": "LESS_WALKING"}
        elif preferences.get("fewer_transfers"):
            body["transitPreferences"] = {"routingPreference": "FEWER_TRANSFERS"}
            
    if mode == "DRIVE" and preferences:
        modifiers = {}
        if preferences.get("avoid_tolls"):
            modifiers["avoidTolls"] = True
        if preferences.get("avoid_highways"):
            modifiers["avoidHighways"] = True
        if modifiers:
            body["routeModifiers"] = modifiers
            
    mask_transit = ','.join([
        'routes.duration','routes.distanceMeters',
        'routes.legs.steps.travelMode',
        'routes.legs.steps.distanceMeters',
        'routes.legs.steps.staticDuration',
        'routes.legs.steps.startLocation',
        'routes.legs.steps.endLocation',
        'routes.legs.steps.transitDetails',
        'routes.legs.steps.polyline.encodedPolyline',
        'routes.polyline.encodedPolyline'
    ])
    
    return await google_routes_compute(body, mask_transit)

def _parse_google_route_to_segment(route_data: dict, segment_type: str, mode: str, orig_name: str, dest_name: str) -> Optional[NormalizedSegment]:
    if not route_data or 'routes' not in route_data or not route_data['routes']:
        return None
        
    rt = route_data['routes'][0]
    dur_str = rt.get('duration', '0s')
    dur_mins = int(dur_str.replace('s', '')) // 60 if dur_str else 0
    dist_m = rt.get('distanceMeters', 0)
    
    steps = rt.get('legs', [{}])[0].get('steps', [])
    
    geom = rt.get('polyline', {}).get('encodedPolyline')
    
    orig_lat, orig_lng = 0.0, 0.0
    dest_lat, dest_lng = 0.0, 0.0
    
    if steps:
        first_step = steps[0]
        last_step = steps[-1]
        orig_lat = first_step.get('startLocation', {}).get('latLng', {}).get('latitude', 0.0)
        orig_lng = first_step.get('startLocation', {}).get('latLng', {}).get('longitude', 0.0)
        dest_lat = last_step.get('endLocation', {}).get('latLng', {}).get('latitude', 0.0)
        dest_lng = last_step.get('endLocation', {}).get('latLng', {}).get('longitude', 0.0)
    
    return NormalizedSegment(
        id=str(uuid.uuid4()),
        segment_type=segment_type,
        mode=mode,
        provider="Google Routes",
        origin=NormalizedPlace(name=orig_name, lat=orig_lat, lng=orig_lng),
        destination=NormalizedPlace(name=dest_name, lat=dest_lat, lng=dest_lng),
        distance_km=dist_m / 1000.0,
        duration_minutes=dur_mins,
        cost_inr=None, # Google Routes doesn't reliably give INR fares
        co2_kg=(dist_m / 1000.0) * 0.12 if mode == "DRIVE" else (dist_m / 1000.0) * 0.04, # Rough estimates
        accessibility=AttributeWithState(value=None, data_state=DataState.not_verified),
        geometry=geom,
        sub_steps=steps,
        details={"steps_count": len(steps)}
    )

async def build_train_journeys(origin: Any, destination: Any, date: str, preferences: dict = None) -> List[NormalizedJourney]:
    """Builds complete door-to-door train journeys."""
    orig_text = resolve_place_text(origin).lower()
    dest_text = resolve_place_text(destination).lower()
    
    orig_stations = []
    dest_stations = []
    
    for city, stations in CITY_STATIONS.items():
        if city in orig_text:
            orig_stations.extend(stations)
        if city in dest_text:
            dest_stations.extend(stations)
            
    import re
    m_orig = re.search(r'\(([a-z0-9_]+)\)$', orig_text)
    if m_orig:
        orig_stations = [m_orig.group(1).upper()]
        
    m_dest = re.search(r'\(([a-z0-9_]+)\)$', dest_text)
    if m_dest:
        dest_stations = [m_dest.group(1).upper()]
            
    # Default fallback if not found in static map (hackathon safeguard)
    if not orig_stations: orig_stations = ["LTT", "CSTM"]
    if not dest_stations: dest_stations = ["MAO"]

    all_trains = []
    for src in orig_stations:
        for dst in dest_stations:
            res = await railradar_get(f"/v1/trains/between/{src}/{dst}", {"date": date, "live": "false"})
            if res and res.get("success") and "data" in res:
                trains = res.get("data", {}).get("trains", [])
                all_trains.extend(trains)

    # Limit to top 3 unique trains to prevent massive Google API parallel calls
    unique_trains = []
    seen_trains = set()
    for t in all_trains:
        tnum = t.get("train", {}).get("number")
        if tnum and tnum not in seen_trains:
            seen_trains.add(tnum)
            unique_trains.append(t)
        if len(unique_trains) >= 3:
            break

    journeys = []
    for t in unique_trains:
        tr_info = t.get("train", {})
        tr_src = t.get("from", {})
        tr_dst = t.get("to", {})
        
        train_num = tr_info.get("number")
        src_code = tr_src.get("code")
        dst_code = tr_dst.get("code")
        
        # Parallel fetch first/last mile and train geometry
        first_mile_task = _get_google_route(origin, f"{src_code} Railway Station, India", "TRANSIT", preferences)
        last_mile_task = _get_google_route(f"{dst_code} Railway Station, India", destination, "DRIVE", preferences)
        geometry_task = railradar_get(f"/v1/trains/{train_num}/route")
        
        # Try fetching fare
        fare_task = railradar_get(f"/v1/trains/{train_num}/fare", {"journeyDate": date, "source": src_code, "destination": dst_code, "class": "3A"})
        
        results = await asyncio.gather(first_mile_task, last_mile_task, geometry_task, fare_task, return_exceptions=True)
        
        fm_res = results[0] if not isinstance(results[0], Exception) else {}
        lm_res = results[1] if not isinstance(results[1], Exception) else {}
        geom_res = results[2] if not isinstance(results[2], Exception) else {}
        fare_res = results[3] if not isinstance(results[3], Exception) else {}
        
        # Build First Mile
        fm_seg = _parse_google_route_to_segment(fm_res, "first_mile", "TRANSIT", resolve_place_text(origin), f"{src_code} Station")
        if not fm_seg:
            # Fallback estimation if Google fails
            fm_seg = NormalizedSegment(
                id=str(uuid.uuid4()), segment_type="first_mile", mode="TRANSIT", provider="Estimated",
                origin=NormalizedPlace(name=resolve_place_text(origin), lat=0, lng=0),
                destination=NormalizedPlace(name=f"{src_code} Station", lat=0, lng=0),
                distance_km=15.0, duration_minutes=45, cost_inr=50, co2_kg=1.5,
                accessibility=AttributeWithState(value=None, data_state=DataState.not_verified)
            )
            
        # Build Last Mile
        lm_seg = _parse_google_route_to_segment(lm_res, "last_mile", "DRIVE", f"{dst_code} Station", resolve_place_text(destination))
        if not lm_seg:
            lm_seg = NormalizedSegment(
                id=str(uuid.uuid4()), segment_type="last_mile", mode="DRIVE", provider="Estimated",
                origin=NormalizedPlace(name=f"{dst_code} Station", lat=0, lng=0),
                destination=NormalizedPlace(name=resolve_place_text(destination), lat=0, lng=0),
                distance_km=10.0, duration_minutes=30, cost_inr=300, co2_kg=2.0,
                accessibility=AttributeWithState(value=None, data_state=DataState.not_verified)
            )

        # Build Main Segment
        dist_km = t.get("distance", 0)
        dur_mins = t.get("duration", 0)
        
        fare_val = None
        is_fare_estimated = False
        if fare_res and fare_res.get("success") and "data" in fare_res:
            fare_val = fare_res["data"].get("breakdown", {}).get("totalFare")
            
        if not fare_val:
            fare_val = dist_km * 2.5 # Estimated INR 2.5 per km
            is_fare_estimated = True
            
        geo_json = None
        if geom_res and geom_res.get("success") and "data" in geom_res:
            geo_json = geom_res["data"].get("geojson")

        main_seg = NormalizedSegment(
            id=str(uuid.uuid4()),
            segment_type="main",
            mode="TRAIN",
            provider="RailRadar",
            origin=NormalizedPlace(name=f"{src_code} ({tr_src.get('name')})", lat=0, lng=0, code=src_code),
            destination=NormalizedPlace(name=f"{dst_code} ({tr_dst.get('name')})", lat=0, lng=0, code=dst_code),
            distance_km=dist_km,
            duration_minutes=dur_mins,
            cost_inr=fare_val,
            co2_kg=dist_km * 0.02, # Estimated train emission factor
            accessibility=AttributeWithState(value=None, data_state=DataState.not_verified),
            geometry=geo_json,
            details={
                "train_number": train_num,
                "train_name": tr_info.get("name"),
                "departure_time": tr_src.get("departure"),
                "arrival_time": tr_dst.get("arrival"),
                "run_days": tr_info.get("runDays", []),
                "classes": tr_info.get("classes", []),
                "is_fare_estimated": is_fare_estimated
            }
        )
        
        # Compile Journey
        segments = [fm_seg, main_seg, lm_seg]
        total_time = sum(s.duration_minutes for s in segments)
        total_cost = sum((s.cost_inr or 0) for s in segments)
        total_co2 = sum((s.co2_kg or 0) for s in segments)
        
        walk_m = 0
        transfer_count = 0
        
        for s in fm_seg.sub_steps + lm_seg.sub_steps:
            if s.get('travelMode') == 'WALK':
                walk_m += s.get('distanceMeters', 0)
            elif s.get('travelMode') == 'TRANSIT':
                transfer_count += 1
                
        # The main segments constitute transfers
        transfer_count += 2 # FM->Main, Main->LM
        
        journeys.append(NormalizedJourney(
            journey_id=str(uuid.uuid4()),
            mode="train",
            segments=segments,
            total_cost_inr=total_cost,
            total_duration_minutes=total_time,
            total_co2_kg=total_co2,
            total_walking_m=int(walk_m),
            transfer_count=transfer_count,
            accessibility=AttributeWithState(value=None, data_state=DataState.not_verified),
            provider_details={"train_number": train_num}
        ))
        
    return journeys

async def build_flight_journeys(origin: Any, destination: Any, date: str, preferences: dict = None) -> List[NormalizedJourney]:
    """Builds complete door-to-door flight journeys."""
    orig_text = resolve_place_text(origin).lower()
    dest_text = resolve_place_text(destination).lower()
    
    import re
    m_orig = re.search(r'\b([a-z]{3})\b', orig_text)
    m_dest = re.search(r'\b([a-z]{3})\b', dest_text)
    
    orig_airport = m_orig.group(1).upper() if m_orig else ("BOM" if "mumbai" in orig_text else ("DEL" if "delhi" in orig_text else "BOM"))
    dest_airport = m_dest.group(1).upper() if m_dest else ("GOI" if "goa" in dest_text else "GOI")
    
    params = {
        "engine": "google_flights",
        "departure_id": orig_airport,
        "arrival_id": dest_airport,
        "outbound_date": date,
        "type": "2",
        "currency": "INR",
        "hl": "en"
    }
    
    res = await serpapi_get(params)
    flights = res.get("best_flights", []) or res.get("other_flights", [])
    
    # Limit to top 3 flights
    flights = flights[:3]
    
    journeys = []
    for f in flights:
        flight_details = f.get("flights", [{}])[0]
        dep_ap = flight_details.get("departure_airport", {})
        arr_ap = flight_details.get("arrival_airport", {})
        
        dep_code = dep_ap.get("id", orig_airport)
        arr_code = arr_ap.get("id", dest_airport)
        
        first_mile_task = _get_google_route(origin, f"{dep_code} Airport, India", "DRIVE", preferences)
        last_mile_task = _get_google_route(f"{arr_code} Airport, India", destination, "DRIVE", preferences)
        
        results = await asyncio.gather(first_mile_task, last_mile_task, return_exceptions=True)
        fm_res = results[0] if not isinstance(results[0], Exception) else {}
        lm_res = results[1] if not isinstance(results[1], Exception) else {}
        
        fm_seg = _parse_google_route_to_segment(fm_res, "first_mile", "DRIVE", resolve_place_text(origin), f"{dep_code} Airport")
        lm_seg = _parse_google_route_to_segment(lm_res, "last_mile", "DRIVE", f"{arr_code} Airport", resolve_place_text(destination))
        
        # Fallbacks
        if not fm_seg:
            fm_seg = NormalizedSegment(
                id=str(uuid.uuid4()), segment_type="first_mile", mode="DRIVE", provider="Estimated",
                origin=NormalizedPlace(name=resolve_place_text(origin), lat=0, lng=0),
                destination=NormalizedPlace(name=f"{dep_code} Airport", lat=0, lng=0),
                distance_km=25.0, duration_minutes=60, cost_inr=500, co2_kg=3.0,
                accessibility=AttributeWithState(value=None, data_state=DataState.not_verified)
            )
        if not lm_seg:
            lm_seg = NormalizedSegment(
                id=str(uuid.uuid4()), segment_type="last_mile", mode="DRIVE", provider="Estimated",
                origin=NormalizedPlace(name=f"{arr_code} Airport", lat=0, lng=0),
                destination=NormalizedPlace(name=resolve_place_text(destination), lat=0, lng=0),
                distance_km=30.0, duration_minutes=50, cost_inr=600, co2_kg=3.5,
                accessibility=AttributeWithState(value=None, data_state=DataState.not_verified)
            )

        flight_num = flight_details.get("flight_number")
        
        main_seg = NormalizedSegment(
            id=str(uuid.uuid4()),
            segment_type="main",
            mode="FLIGHT",
            provider="SerpApi",
            origin=NormalizedPlace(name=dep_ap.get("name", dep_code), lat=0, lng=0, code=dep_code),
            destination=NormalizedPlace(name=arr_ap.get("name", arr_code), lat=0, lng=0, code=arr_code),
            distance_km=500.0, # flights usually don't give exact dist easily, could estimate
            duration_minutes=f.get("total_duration", 0),
            cost_inr=f.get("price"),
            co2_kg=f.get("carbon_emissions", {}).get("this_flight", 0) / 1000.0,
            accessibility=AttributeWithState(value=None, data_state=DataState.not_verified),
            details={
                "airline": flight_details.get("airline"),
                "flight_number": flight_num,
                "departure_time": dep_ap.get("time"),
                "arrival_time": arr_ap.get("time"),
                "stops": len(f.get("flights", [])) - 1,
                "airline_logo": f.get("airline_logo")
            }
        )
        
        segments = [fm_seg, main_seg, lm_seg]
        total_time = sum(s.duration_minutes for s in segments)
        total_cost = sum((s.cost_inr or 0) for s in segments)
        total_co2 = sum((s.co2_kg or 0) for s in segments)
        
        journeys.append(NormalizedJourney(
            journey_id=str(uuid.uuid4()),
            mode="flight",
            segments=segments,
            total_cost_inr=total_cost,
            total_duration_minutes=total_time,
            total_co2_kg=total_co2,
            total_walking_m=0,
            transfer_count=2,
            accessibility=AttributeWithState(value=None, data_state=DataState.not_verified),
            provider_details={"flight_number": flight_num}
        ))
        
    return journeys

async def build_car_journeys(origin: Any, destination: Any, preferences: dict = None) -> List[NormalizedJourney]:
    """Builds door-to-door private car journeys using Google Routes."""
    route_res = await _get_google_route(origin, destination, "DRIVE", preferences)
    seg = _parse_google_route_to_segment(route_res, "main", "DRIVE", resolve_place_text(origin), resolve_place_text(destination))
    
    if not seg:
        return []
        
    # Add estimated cost (e.g. INR 12 per km)
    seg.cost_inr = seg.distance_km * 12.0
    fuel_type = (preferences or {}).get("fuel_type", "petrol").lower()
    if fuel_type == "ev":
        seg.co2_kg = seg.distance_km * 0.0 # EV tailpipe emissions
    else:
        seg.co2_kg = seg.distance_km * 0.12 # Petrol average
        
    j = NormalizedJourney(
        journey_id=str(uuid.uuid4()),
        mode="car",
        segments=[seg],
        total_cost_inr=seg.cost_inr,
        total_duration_minutes=seg.duration_minutes,
        total_co2_kg=seg.co2_kg or 0,
        total_walking_m=0,
        transfer_count=0,
        accessibility=AttributeWithState(value=None, data_state=DataState.not_verified),
    )
    return [j]
