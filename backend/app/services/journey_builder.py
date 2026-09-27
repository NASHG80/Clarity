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
        'routes.legs.steps.navigationInstruction',
        'routes.legs.steps.localizedValues',
        'routes.legs.steps.transitDetails',
        'routes.legs.steps.polyline.encodedPolyline',
        'routes.polyline.encodedPolyline'
    ])
    
    return await google_routes_compute(body, mask_transit)

def _normalize_google_steps(steps: list, fallback_orig: str, fallback_dest: str) -> list:
    """Normalize raw Google Routes steps into structured, human-readable sub-steps.
    
    - Merges consecutive WALK steps into a single walking sub-step.
    - Extracts transit line name, vehicle type, stop names.
    - Ensures every sub-step has a human-readable instruction.
    """
    if not steps:
        return []

    normalized = []
    pending_walk_dist_m = 0
    pending_walk_dur_s = 0
    pending_walk_start_loc = None
    pending_walk_end_loc = None

    def flush_walk():
        nonlocal pending_walk_dist_m, pending_walk_dur_s, pending_walk_start_loc, pending_walk_end_loc
        if pending_walk_dist_m > 0 or pending_walk_dur_s > 0:
            dist_text = f"{pending_walk_dist_m}m" if pending_walk_dist_m < 1000 else f"{pending_walk_dist_m/1000:.1f} km"
            dur_mins = pending_walk_dur_s // 60
            normalized.append({
                "travelMode": "WALK",
                "distanceMeters": pending_walk_dist_m,
                "startLocation": pending_walk_start_loc,
                "endLocation": pending_walk_end_loc,
                "navigationInstruction": {"instructions": "Walk"},
                "localizedValues": {
                    "distance": {"text": dist_text},
                    "staticDuration": {"text": f"{dur_mins} min" if dur_mins > 0 else "< 1 min"}
                }
            })
        pending_walk_dist_m = 0
        pending_walk_dur_s = 0
        pending_walk_start_loc = None
        pending_walk_end_loc = None

    for step in steps:
        mode = step.get("travelMode", "WALK")
        dist = step.get("distanceMeters", 0)
        dur_str = step.get("staticDuration", "0s")
        dur_s = int(dur_str.replace("s", "")) if isinstance(dur_str, str) else 0
        start_loc = step.get("startLocation")
        end_loc = step.get("endLocation")
        nav = step.get("navigationInstruction", {})
        transit = step.get("transitDetails", {})

        if mode == "WALK":
            # Accumulate walk steps
            if pending_walk_start_loc is None:
                pending_walk_start_loc = start_loc
            pending_walk_end_loc = end_loc
            pending_walk_dist_m += dist
            pending_walk_dur_s += dur_s
        else:
            # Non-walk step — flush any accumulated walk first
            flush_walk()

            # Build transit step
            transit_line = transit.get("transitLine", {})
            vehicle = transit_line.get("vehicle", {})
            vehicle_type = vehicle.get("type", "TRANSIT").replace("_", " ").title()
            line_name = transit_line.get("name") or transit_line.get("nameShort") or ""
            dep_stop = transit.get("stopDetails", {}).get("departureStop", {}).get("name", "")
            arr_stop = transit.get("stopDetails", {}).get("arrivalStop", {}).get("name", "")
            
            instruction_text = nav.get("instructions") or f"{vehicle_type}"
            # Make instruction human-readable: "Bus 703: Borivali → LTT"
            if line_name and dep_stop and arr_stop:
                instruction_text = f"{vehicle_type} {line_name}: {dep_stop} → {arr_stop}"
            elif dep_stop and arr_stop:
                instruction_text = f"{vehicle_type}: {dep_stop} → {arr_stop}"
            elif line_name:
                instruction_text = f"{vehicle_type} {line_name}"

            dist_text = f"{dist}m" if dist < 1000 else f"{dist/1000:.1f} km"
            dur_mins = dur_s // 60

            normalized.append({
                "travelMode": mode,
                "distanceMeters": dist,
                "startLocation": start_loc,
                "endLocation": end_loc,
                "transitDetails": transit,
                "navigationInstruction": {"instructions": instruction_text},
                "localizedValues": {
                    "distance": {"text": dist_text},
                    "staticDuration": {"text": f"{dur_mins} min" if dur_mins > 0 else "< 1 min"}
                }
            })

    flush_walk()  # flush any trailing walk
    return normalized


def _parse_google_route_to_segment(route_data: dict, segment_type: str, mode: str, orig_name: str, dest_name: str) -> Optional[NormalizedSegment]:
    if not route_data or 'routes' not in route_data or not route_data['routes']:
        return None
        
    rt = route_data['routes'][0]
    dur_str = rt.get('duration', '0s')
    dur_mins = int(dur_str.replace('s', '')) // 60 if dur_str else 0
    dist_m = rt.get('distanceMeters', 0)
    
    raw_steps = rt.get('legs', [{}])[0].get('steps', [])
    # For DRIVE routes, do not expand turn-by-turn directions.
    # Only TRANSIT routes get meaningful Walk/Bus sub-step breakdown.
    if mode == 'DRIVE':
        steps = []
    else:
        steps = _normalize_google_steps(raw_steps, orig_name, dest_name)
    
    geom = rt.get('polyline', {}).get('encodedPolyline')
    
    orig_lat, orig_lng = 0.0, 0.0
    dest_lat, dest_lng = 0.0, 0.0
    
    if raw_steps:
        first_step = raw_steps[0]
        last_step = raw_steps[-1]
        orig_lat = first_step.get('startLocation', {}).get('latLng', {}).get('latitude', 0.0)
        orig_lng = first_step.get('startLocation', {}).get('latLng', {}).get('longitude', 0.0)
        dest_lat = last_step.get('endLocation', {}).get('latLng', {}).get('latitude', 0.0)
        dest_lng = last_step.get('endLocation', {}).get('latLng', {}).get('longitude', 0.0)
    
    co2_per_km = 0.12 if mode == "DRIVE" else 0.02  # TRANSIT is much lower
    
    return NormalizedSegment(
        id=str(uuid.uuid4()),
        segment_type=segment_type,
        mode=mode,
        provider="Google Routes",
        origin=NormalizedPlace(name=orig_name, lat=orig_lat, lng=orig_lng),
        destination=NormalizedPlace(name=dest_name, lat=dest_lat, lng=dest_lng),
        distance_km=dist_m / 1000.0,
        duration_minutes=dur_mins,
        cost_inr=None,
        co2_kg=(dist_m / 1000.0) * co2_per_km,
        accessibility=AttributeWithState(value=None, data_state=DataState.not_verified),
        geometry=geom,
        sub_steps=steps,
        details={"steps_count": len(steps)}
    )

async def build_train_journeys(origin: Any, destination: Any, date: str, preferences: dict = None) -> List[NormalizedJourney]:
    """Builds complete door-to-door train journeys."""
    import re
    orig_text = resolve_place_text(origin).lower()
    dest_text = resolve_place_text(destination).lower()
    
    orig_stations = []
    dest_stations = []
    
    for city, stations in CITY_STATIONS.items():
        if city in orig_text:
            orig_stations.extend(stations)
        if city in dest_text:
            dest_stations.extend(stations)
            
    if preferences and preferences.get("board_station"):
        # Expecting something like "Mumbai LTT (LTT)", extract the code
        m = re.search(r'\(([a-zA-Z0-9_]+)\)$', preferences["board_station"])
        if m:
            orig_stations = [m.group(1).upper()]
        else:
            orig_stations = [preferences["board_station"].upper()]

    if preferences and preferences.get("dest_station"):
        m = re.search(r'\(([a-zA-Z0-9_]+)\)$', preferences["dest_station"])
        if m:
            dest_stations = [m.group(1).upper()]
        else:
            dest_stations = [preferences["dest_station"].upper()]
            
            
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
        
        # ---------------------------------------------------------------
        # FILTER → ROUTING MODE DECISION
        # Each filter explicitly controls how first/last mile is routed.
        # This is the core of the recommendation engine — every filter
        # must have a deterministic, meaningful effect on what is built.
        # ---------------------------------------------------------------
        eco         = bool(preferences and preferences.get("eco_friendly"))
        less_walk   = bool(preferences and preferences.get("less_walking"))
        fewer_xfer  = bool(preferences and preferences.get("fewer_transfers"))
        fastest     = bool(preferences and preferences.get("fastest"))
        lowest_cost = bool(preferences and preferences.get("lowest_cost"))
        wheelchair  = bool(preferences and preferences.get("wheelchair_accessible"))

        # Decide first_mile and last_mile travel modes:
        #   less_walking   → DRIVE both: user doesn't want to walk to bus stops
        #   fewer_transfers → DRIVE both: cab has 0 transfers
        #   wheelchair      → DRIVE both: most accessible, no walking required
        #   fastest        → DRIVE both: direct cab is fastest
        #   lowest_cost    → TRANSIT both: public transit is cheapest
        #   eco_friendly   → TRANSIT both: lowest CO₂ per km
        #   default        → TRANSIT first (sustainable), DRIVE last (practical in India)
        if less_walk or fewer_xfer or wheelchair or fastest:
            first_mile_mode = "DRIVE"
            last_mile_mode  = "DRIVE"
        elif eco or lowest_cost:
            first_mile_mode = "TRANSIT"
            last_mile_mode  = "TRANSIT"
        else:
            first_mile_mode = "TRANSIT"  # encourage sustainable default
            last_mile_mode  = "DRIVE"    # practical for Indian last-mile

        # Build recommendation reason strings for UI
        active_reasons = []
        if less_walk:
            active_reasons.append("Cab-to-station to minimise walking (Less Walking filter active)")
        if fewer_xfer:
            active_reasons.append("Direct cab door-to-station — zero transit transfers")
        if eco:
            active_reasons.append("Public transit used for first & last mile to reduce CO\u2082")
        if lowest_cost:
            active_reasons.append("Public transit on both ends to minimise total cost")
        if fastest:
            active_reasons.append("Cab used for both miles to minimise total travel time")
        if wheelchair:
            active_reasons.append("Cab used on both ends for step-free, accessible access")
        if not active_reasons:
            active_reasons.append("Sustainable transit first-mile, practical cab last-mile (default)")

        # Pass filter preferences to Google routing
        first_mile_prefs = dict(preferences or {})
        last_mile_prefs  = dict(preferences or {})
        
        first_mile_task = _get_google_route(origin, f"{src_code} Railway Station, India", first_mile_mode, first_mile_prefs)
        last_mile_task  = _get_google_route(f"{dst_code} Railway Station, India", destination, last_mile_mode, last_mile_prefs)
        geometry_task   = railradar_get(f"/v1/trains/{train_num}/route")
        fare_task       = railradar_get(f"/v1/trains/{train_num}/fare", {"journeyDate": date, "source": src_code, "destination": dst_code, "class": "3A"})
        
        results = await asyncio.gather(first_mile_task, last_mile_task, geometry_task, fare_task, return_exceptions=True)
        
        fm_res   = results[0] if not isinstance(results[0], Exception) else {}
        lm_res   = results[1] if not isinstance(results[1], Exception) else {}
        geom_res = results[2] if not isinstance(results[2], Exception) else {}
        fare_res = results[3] if not isinstance(results[3], Exception) else {}
        
        # Build First Mile segment
        fm_seg = _parse_google_route_to_segment(fm_res, "first_mile", first_mile_mode, resolve_place_text(origin), f"{src_code} Station")
        if fm_seg and fm_seg.mode == "DRIVE" and not fm_seg.cost_inr:
            # Add cab cost estimate: INR 12/km (typical Ola/Uber rate)
            fm_seg.cost_inr = max(50.0, round(fm_seg.distance_km * 12.0, 0))
        if not fm_seg:
            # Fallback estimation if Google fails
            fm_mode_fallback = first_mile_mode
            fm_cost = 50 if fm_mode_fallback == "TRANSIT" else 180
            fm_seg = NormalizedSegment(
                id=str(uuid.uuid4()), segment_type="first_mile", mode=fm_mode_fallback, provider="Estimated",
                origin=NormalizedPlace(name=resolve_place_text(origin), lat=0, lng=0),
                destination=NormalizedPlace(name=f"{src_code} Station", lat=0, lng=0),
                distance_km=15.0, duration_minutes=30 if fm_mode_fallback == "DRIVE" else 45,
                cost_inr=fm_cost, co2_kg=1.8 if fm_mode_fallback == "DRIVE" else 0.5,
                accessibility=AttributeWithState(value=None, data_state=DataState.not_verified)
            )
            
        # Build Last Mile segment
        lm_seg = _parse_google_route_to_segment(lm_res, "last_mile", last_mile_mode, f"{dst_code} Station", resolve_place_text(destination))
        if lm_seg and lm_seg.mode == "DRIVE" and not lm_seg.cost_inr:
            lm_seg.cost_inr = max(50.0, round(lm_seg.distance_km * 12.0, 0))
        if not lm_seg:
            lm_cost = 40 if last_mile_mode == "TRANSIT" else 300
            lm_seg = NormalizedSegment(
                id=str(uuid.uuid4()), segment_type="last_mile", mode=last_mile_mode, provider="Estimated",
                origin=NormalizedPlace(name=f"{dst_code} Station", lat=0, lng=0),
                destination=NormalizedPlace(name=resolve_place_text(destination), lat=0, lng=0),
                distance_km=10.0, duration_minutes=20 if last_mile_mode == "DRIVE" else 35,
                cost_inr=lm_cost, co2_kg=1.2 if last_mile_mode == "DRIVE" else 0.3,
                accessibility=AttributeWithState(value=None, data_state=DataState.not_verified)
            )

        # Build Main Segment (Train via RailRadar)
        dist_km  = t.get("distance", 0)
        dur_mins = t.get("duration", 0)
        
        fare_val = None
        is_fare_estimated = False
        if fare_res and fare_res.get("success") and "data" in fare_res:
            fare_val = fare_res["data"].get("breakdown", {}).get("totalFare")
            
        if not fare_val:
            fare_val = dist_km * 2.5  # INR 2.5 per km estimate
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
            co2_kg=dist_km * 0.02,  # Train: ~0.02 kg CO₂/km
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
        
        # Compile Journey totals
        segments    = [fm_seg, main_seg, lm_seg]
        total_time  = sum(s.duration_minutes for s in segments)
        total_cost  = sum((s.cost_inr or 0) for s in segments)
        total_co2   = sum((s.co2_kg or 0) for s in segments)
        
        # Walking distance: count only WALK sub_steps from TRANSIT segments
        walk_m = 0
        transfer_count = 0
        for seg in [fm_seg, lm_seg]:
            if seg.mode == "DRIVE":
                # Cab: 0 walking, 1 transfer (origin → cab)
                transfer_count += 1
            else:
                for s in seg.sub_steps:
                    if s.get('travelMode') == 'WALK':
                        walk_m += s.get('distanceMeters', 0)
                    elif s.get('travelMode') == 'TRANSIT':
                        transfer_count += 1
        transfer_count += 1  # board main train
        
        # Build trade-off warnings
        trade_offs = []
        if first_mile_mode == "DRIVE" or last_mile_mode == "DRIVE":
            co2_drive = (fm_seg.co2_kg or 0) + (lm_seg.co2_kg or 0)
            if co2_drive > 5:
                trade_offs.append(f"Cab adds ~{co2_drive:.1f} kg CO\u2082 vs. transit alternative")
        if less_walk or fewer_xfer:
            alt_transit_cost = 50 + 40  # typical TRANSIT first+last mile
            cab_cost = (fm_seg.cost_inr or 0) + (lm_seg.cost_inr or 0)
            if cab_cost > alt_transit_cost:
                trade_offs.append(f"Cab costs ~\u20b9{cab_cost:.0f} more than transit for access legs")
        
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
            recommendation_reasons=active_reasons,
            trade_offs=trade_offs,
            provider_details={"train_number": train_num}
        ))
        
    return journeys

async def build_flight_journeys(origin: Any, destination: Any, date: str, preferences: dict = None) -> List[NormalizedJourney]:
    """Builds complete door-to-door flight journeys."""
    orig_text = resolve_place_text(origin).lower()
    dest_text = resolve_place_text(destination).lower()
    
    
    # Do NOT guess airport code from text if a specific station was passed.
    # The frontend should pass the actual IATA code in board_station/dest_station
    orig_airport = "BOM"
    dest_airport = "GOI"
    
    if preferences:
        if preferences.get("board_station"):
            orig_airport = str(preferences.get("board_station")).upper()
        if preferences.get("dest_station"):
            dest_airport = str(preferences.get("dest_station")).upper()
    
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
    price_insights = res.get("price_insights")
    
    flights = []
    if "best_flights" in res:
        for f in res["best_flights"]:
            f["_category"] = "Best departing flights"
            flights.append(f)
    if "other_flights" in res:
        for f in res["other_flights"]:
            f["_category"] = "Other available flights"
            flights.append(f)
            
    if not flights:
        return []
    
    # ---------------------------------------------------------------
    # FILTER → GROUND ROUTING MODE DECISION
    # ---------------------------------------------------------------
    eco         = bool(preferences and preferences.get("eco_friendly"))
    less_walk   = bool(preferences and preferences.get("less_walking"))
    fewer_xfer  = bool(preferences and preferences.get("fewer_transfers"))
    fastest     = bool(preferences and preferences.get("fastest"))
    lowest_cost = bool(preferences and preferences.get("lowest_cost"))
    wheelchair  = bool(preferences and preferences.get("wheelchair_accessible"))

    if less_walk or fewer_xfer or wheelchair or fastest:
        first_mile_mode = "DRIVE"
        last_mile_mode  = "DRIVE"
    elif eco or lowest_cost:
        first_mile_mode = "TRANSIT"
        last_mile_mode  = "TRANSIT"
    else:
        first_mile_mode = "TRANSIT"
        last_mile_mode  = "DRIVE"

    active_reasons = []
    if less_walk: active_reasons.append("Cab-to-airport to minimise walking")
    if fewer_xfer: active_reasons.append("Direct cab to airport — zero transit transfers")
    if eco: active_reasons.append("Public transit used for airport access to reduce CO\u2082")
    if lowest_cost: active_reasons.append("Public transit on both ends to minimise total cost")
    if fastest: active_reasons.append("Cab used for airport access to minimise total travel time")
    if wheelchair: active_reasons.append("Cab used for step-free, accessible airport access")
    if not active_reasons: active_reasons.append("Sustainable transit to airport, practical cab from airport (default)")

    first_mile_prefs = dict(preferences or {})
    last_mile_prefs  = dict(preferences or {})

    # Deduplicate ground routes by airport code
    unique_dep_codes = set()
    unique_arr_codes = set()
    for f in flights:
        flight_details = f.get("flights", [{}])[0]
        dep_ap = flight_details.get("departure_airport", {})
        arr_ap = f.get("flights", [{}])[-1].get("arrival_airport", {})
        unique_dep_codes.add(dep_ap.get("id", orig_airport))
        unique_arr_codes.add(arr_ap.get("id", dest_airport))
        
    dep_routes = {}
    arr_routes = {}
    
    async def fetch_dep(code):
        return code, await _get_google_route(origin, f"{code} Airport, India", first_mile_mode, first_mile_prefs)
    async def fetch_arr(code):
        return code, await _get_google_route(f"{code} Airport, India", destination, last_mile_mode, last_mile_prefs)
        
    dep_results = await asyncio.gather(*[fetch_dep(c) for c in unique_dep_codes], return_exceptions=True)
    arr_results = await asyncio.gather(*[fetch_arr(c) for c in unique_arr_codes], return_exceptions=True)
    
    for r in dep_results:
        if not isinstance(r, Exception): dep_routes[r[0]] = r[1]
    for r in arr_results:
        if not isinstance(r, Exception): arr_routes[r[0]] = r[1]

    journeys = []
    for f in flights:
        flight_details = f.get("flights", [{}])[0]
        last_leg = f.get("flights", [{}])[-1]
        dep_ap = flight_details.get("departure_airport", {})
        arr_ap = last_leg.get("arrival_airport", {})
        
        dep_code = dep_ap.get("id", orig_airport)
        arr_code = arr_ap.get("id", dest_airport)
        
        fm_res = dep_routes.get(dep_code, {})
        lm_res = arr_routes.get(arr_code, {})
        
        # Build First Mile
        fm_seg = _parse_google_route_to_segment(fm_res, "first_mile", first_mile_mode, resolve_place_text(origin), f"{dep_code} Airport")
        if fm_seg and fm_seg.mode == "DRIVE" and not fm_seg.cost_inr:
            fm_seg.cost_inr = max(100.0, round(fm_seg.distance_km * 12.0, 0))
        if not fm_seg:
            fm_mode_fallback = first_mile_mode
            fm_cost = 150 if fm_mode_fallback == "TRANSIT" else 500
            fm_seg = NormalizedSegment(
                id=str(uuid.uuid4()), segment_type="first_mile", mode=fm_mode_fallback, provider="Estimated",
                origin=NormalizedPlace(name=resolve_place_text(origin), lat=0, lng=0),
                destination=NormalizedPlace(name=f"{dep_code} Airport", lat=0, lng=0),
                distance_km=25.0, duration_minutes=45 if fm_mode_fallback == "DRIVE" else 75,
                cost_inr=fm_cost, co2_kg=3.0 if fm_mode_fallback == "DRIVE" else 0.8,
                accessibility=AttributeWithState(value=None, data_state=DataState.not_verified)
            )
            
        # Build Last Mile
        lm_seg = _parse_google_route_to_segment(lm_res, "last_mile", last_mile_mode, f"{arr_code} Airport", resolve_place_text(destination))
        if lm_seg and lm_seg.mode == "DRIVE" and not lm_seg.cost_inr:
            lm_seg.cost_inr = max(100.0, round(lm_seg.distance_km * 12.0, 0))
        if not lm_seg:
            lm_cost = 100 if last_mile_mode == "TRANSIT" else 600
            lm_seg = NormalizedSegment(
                id=str(uuid.uuid4()), segment_type="last_mile", mode=last_mile_mode, provider="Estimated",
                origin=NormalizedPlace(name=f"{arr_code} Airport", lat=0, lng=0),
                destination=NormalizedPlace(name=resolve_place_text(destination), lat=0, lng=0),
                distance_km=30.0, duration_minutes=50 if last_mile_mode == "DRIVE" else 90,
                cost_inr=lm_cost, co2_kg=3.6 if last_mile_mode == "DRIVE" else 1.0,
                accessibility=AttributeWithState(value=None, data_state=DataState.not_verified)
            )

        flight_num = flight_details.get("flight_number")
        co2_data = f.get("carbon_emissions", {})
        co2_val = co2_data.get("this_flight", 0) / 1000.0 if co2_data.get("this_flight") else 0.0
        
        main_seg = NormalizedSegment(
            id=str(uuid.uuid4()),
            segment_type="main",
            mode="FLIGHT",
            provider="SerpApi",
            origin=NormalizedPlace(name=dep_ap.get("name", dep_code), lat=0, lng=0, code=dep_code),
            destination=NormalizedPlace(name=arr_ap.get("name", arr_code), lat=0, lng=0, code=arr_code),
            distance_km=0.0,
            duration_minutes=f.get("total_duration", 0),
            cost_inr=f.get("price"),
            co2_kg=co2_val,
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
        
        walk_m = 0
        transfer_count = 0
        for seg in [fm_seg, lm_seg]:
            if seg.mode == "DRIVE":
                transfer_count += 1
            else:
                for s in seg.sub_steps:
                    if s.get('travelMode') == 'WALK': walk_m += s.get('distanceMeters', 0)
                    elif s.get('travelMode') == 'TRANSIT': transfer_count += 1
        transfer_count += len(f.get("flights", []))
        
        trade_offs = []
        if first_mile_mode == "DRIVE" or last_mile_mode == "DRIVE":
            co2_drive = (fm_seg.co2_kg or 0) + (lm_seg.co2_kg or 0)
            if co2_drive > 5: trade_offs.append(f"Cabs add ~{co2_drive:.1f} kg CO\u2082 vs. transit alternative")
        
        provider_details = {
            "flight_category": f.get("_category"),
            "booking_token": f.get("booking_token"),
            "carbon_emissions": co2_data,
            "legs": f.get("flights", []),
            "layovers": f.get("layovers", []),
            "price_insights": price_insights
        }
        
        journeys.append(NormalizedJourney(
            journey_id=str(uuid.uuid4()),
            mode="flight",
            segments=segments,
            total_cost_inr=total_cost,
            total_duration_minutes=total_time,
            total_co2_kg=total_co2,
            total_walking_m=int(walk_m),
            transfer_count=transfer_count,
            accessibility=AttributeWithState(value=None, data_state=DataState.not_verified),
            recommendation_reasons=list(active_reasons),
            trade_offs=trade_offs,
            provider_details=provider_details
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
