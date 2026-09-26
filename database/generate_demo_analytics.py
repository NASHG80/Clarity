import sys
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path.cwd()))
from backend.app.db.mongo import get_db, COLLECTION_BUSINESSES
from backend.app.db.init import init_db

# Canonical event types
EVENT_TYPES = {
    "listing_impression",
    "listing_open",
    "detail_open",
    "accessibility_view",
    "sustainability_view",
    "map_open",
    "save",
    "booking_start",
    "booking_complete"
}

DEMO_WEEK_START_STR = "2026-09-18T00:00:00Z"
DEMO_WEEK_END_STR = "2026-09-25T00:00:00Z"
DEMO_WEEK_START = datetime.fromisoformat(DEMO_WEEK_START_STR.replace("Z", "+00:00"))
DEMO_WEEK_END = datetime.fromisoformat(DEMO_WEEK_END_STR.replace("Z", "+00:00"))

RANDOM_SEED = 42

COLLECTION_ANALYTICS = "analytics_events"

FUNNEL_CONFIG = {
    "biz_001": {
        "listing_impression": 1200,
        "listing_open": 800,
        "detail_open": 450,
        "save": 120,
        "booking_start": 80,
        "booking_complete": 25
    },
    "biz_002": {
        "listing_impression": 850,
        "listing_open": 500,
        "detail_open": 220,
        "save": 90,
        "booking_start": 45,
        "booking_complete": 10
    },
    "biz_003": {
        "listing_impression": 500,
        "listing_open": 200,
        "detail_open": 80,
        "save": 20,
        "booking_start": 5,
        "booking_complete": 1
    }
}

FUNNEL_STAGES = [
    "listing_impression",
    "listing_open",
    "detail_open",
    "save",
    "booking_start",
    "booking_complete"
]

def generate_events_for_business(biz_id: str, hotel_id: str):
    config = FUNNEL_CONFIG.get(biz_id)
    if not config:
        return []

    # Validate configuration strictly
    for i in range(len(FUNNEL_STAGES) - 1):
        stage = FUNNEL_STAGES[i]
        next_stage = FUNNEL_STAGES[i+1]
        if config[stage] < config[next_stage]:
            raise ValueError(f"Invalid funnel config for {biz_id}: {stage} ({config[stage]}) < {next_stage} ({config[next_stage]})")
        if config[stage] < 0:
            raise ValueError(f"Invalid funnel config for {biz_id}: {stage} is negative")

    total_sessions = config["listing_impression"]
    sessions = [f"anon-session-{biz_id}-{i:04d}" for i in range(total_sessions)]
    
    events = []
    
    # We track which sessions reached which stage
    stage_sessions = {"listing_impression": sessions}
    
    for i in range(len(FUNNEL_STAGES) - 1):
        stage = FUNNEL_STAGES[i]
        next_stage = FUNNEL_STAGES[i+1]
        current_sessions = stage_sessions[stage].copy()
        random.shuffle(current_sessions)
        stage_sessions[next_stage] = current_sessions[:config[next_stage]]
        
    for session_id in sessions:
        # Determine base time for the session
        total_seconds = int((DEMO_WEEK_END - DEMO_WEEK_START).total_seconds())
        offset = random.randint(0, total_seconds - 3600)  # leave some room for session length
        session_time = DEMO_WEEK_START + timedelta(seconds=offset)
        
        for stage in FUNNEL_STAGES:
            if session_id in stage_sessions[stage]:
                event = {
                    "_id": f"demo_evt_{session_id}_{stage}",
                    "business_id": biz_id,
                    "listing_id": hotel_id,
                    "event_type": stage,
                    "session_id": session_id,
                    "timestamp": session_time.strftime("%Y-%m-%dT%H:%M:%SZ")
                }
                events.append(event)
                session_time += timedelta(seconds=random.randint(5, 120))
                
                # Add auxiliary events probabilistically
                if stage == "listing_open" and random.random() < 0.15:
                    events.append({
                        "_id": f"demo_evt_{session_id}_map_open",
                        "business_id": biz_id,
                        "listing_id": hotel_id,
                        "event_type": "map_open",
                        "session_id": session_id,
                        "timestamp": session_time.strftime("%Y-%m-%dT%H:%M:%SZ")
                    })
                    session_time += timedelta(seconds=random.randint(5, 60))
                
                if stage == "detail_open":
                    if random.random() < 0.30:
                        events.append({
                            "_id": f"demo_evt_{session_id}_accessibility_view",
                            "business_id": biz_id,
                            "listing_id": hotel_id,
                            "event_type": "accessibility_view",
                            "session_id": session_id,
                            "timestamp": session_time.strftime("%Y-%m-%dT%H:%M:%SZ")
                        })
                        session_time += timedelta(seconds=random.randint(5, 60))
                    if random.random() < 0.20:
                        events.append({
                            "_id": f"demo_evt_{session_id}_sustainability_view",
                            "business_id": biz_id,
                            "listing_id": hotel_id,
                            "event_type": "sustainability_view",
                            "session_id": session_id,
                            "timestamp": session_time.strftime("%Y-%m-%dT%H:%M:%SZ")
                        })
                        session_time += timedelta(seconds=random.randint(5, 60))

    return events


def validate_generated_events(events, businesses_map):
    # Strictly validate against requirements
    if not events:
        raise ValueError("No events generated")
        
    seen_ids = set()
    funnel_counts = {biz_id: {stage: 0 for stage in FUNNEL_STAGES} for biz_id in businesses_map}
    aux_counts = {biz_id: {"map_open": 0, "accessibility_view": 0, "sustainability_view": 0} for biz_id in businesses_map}
    
    session_has_start = set()
    session_has_complete = set()

    for ev in events:
        eid = ev["_id"]
        if eid in seen_ids:
            raise ValueError(f"Duplicate event ID generated: {eid}")
        seen_ids.add(eid)
        
        biz_id = ev["business_id"]
        if biz_id not in businesses_map:
            raise ValueError(f"Event {eid} points to unknown business {biz_id}")
            
        if ev["listing_id"] != businesses_map[biz_id]:
            raise ValueError(f"Event {eid} listing_id mismatch")
            
        if ev["event_type"] not in EVENT_TYPES:
            raise ValueError(f"Invalid event_type {ev['event_type']}")
            
        ts = datetime.fromisoformat(ev["timestamp"].replace("Z", "+00:00"))
        if not (DEMO_WEEK_START <= ts <= DEMO_WEEK_END):
            raise ValueError(f"Event timestamp {ts} out of bounds")
            
        evt = ev["event_type"]
        if evt in FUNNEL_STAGES:
            funnel_counts[biz_id][evt] += 1
        elif evt in aux_counts[biz_id]:
            aux_counts[biz_id][evt] += 1
            
        if evt == "booking_start":
            session_has_start.add(ev["session_id"])
        elif evt == "booking_complete":
            session_has_complete.add(ev["session_id"])

    # Check booking logic
    for sid in session_has_complete:
        if sid not in session_has_start:
            raise ValueError(f"Session {sid} has booking_complete without booking_start")

    # Check funnel monotonicity and match configuration
    for biz_id, config in FUNNEL_CONFIG.items():
        if biz_id not in businesses_map:
            continue
        
        counts = funnel_counts[biz_id]
        for i in range(len(FUNNEL_STAGES) - 1):
            s1 = FUNNEL_STAGES[i]
            s2 = FUNNEL_STAGES[i+1]
            if counts[s1] < counts[s2]:
                raise ValueError(f"Monotonicity failed for {biz_id}: {s1} ({counts[s1]}) < {s2} ({counts[s2]})")
            
            if counts[s1] != config[s1]:
                raise ValueError(f"Configuration mismatch for {biz_id} {s1}: Expected {config[s1]}, got {counts[s1]}")

    print("Internal generator validation passed.")
    for biz_id, counts in funnel_counts.items():
        print(f"  {biz_id} funnel: {counts}")
    for biz_id, counts in aux_counts.items():
        print(f"  {biz_id} aux: {counts}")


def generate_and_seed(db):
    init_db(db)
    
    # Load demo businesses mapping
    businesses_file = Path("database/seed_data/businesses.json")
    if not businesses_file.exists():
        raise FileNotFoundError("businesses.json not found")
        
    with open(businesses_file, "r") as f:
        businesses = json.load(f)
        
    biz_map = {b["_id"]: b["hotel_id"] for b in businesses if b["_id"] in FUNNEL_CONFIG}
    if len(biz_map) not in (2, 3):
        raise ValueError(f"Expected 2-3 target businesses, got {len(biz_map)}")
        
    random.seed(RANDOM_SEED)
    
    all_events = []
    for biz_id, hotel_id in biz_map.items():
        all_events.extend(generate_events_for_business(biz_id, hotel_id))
        
    validate_generated_events(all_events, biz_map)
    
    # Idempotent upsert
    coll = db[COLLECTION_ANALYTICS]
    
    print(f"Upserting {len(all_events)} synthetic analytics events...")
    # Note: Using bulk_write with ReplaceOne would be faster, but replace_one per item is fine for this scale
    from pymongo import ReplaceOne
    requests = [ReplaceOne({"_id": ev["_id"]}, ev, upsert=True) for ev in all_events]
    if requests:
        res = coll.bulk_write(requests)
        print(f"MongoDB Bulk Write: {res.upserted_count} upserted, {res.modified_count} modified.")
        
    return all_events

if __name__ == "__main__":
    db = get_db()
    generate_and_seed(db)
    print("Demo analytics generation complete.")
