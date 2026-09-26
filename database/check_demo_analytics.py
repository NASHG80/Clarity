import argparse
import sys
from datetime import datetime
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Any

sys.path.insert(0, str(Path.cwd()))

from database.generate_demo_analytics import (
    DEMO_WEEK_START,
    DEMO_WEEK_END,
    DEMO_WEEK_START_STR,
    DEMO_WEEK_END_STR,
    EVENT_TYPES,
    FUNNEL_STAGES
)
from database.seed import load_businesses_data, load_hotels_data

class Violation:
    def __init__(self, error_type: str, business: str, message: str, **kwargs):
        self.error_type = error_type
        self.business = business
        self.message = message
        self.details = kwargs

    def __str__(self):
        s = f"[{self.error_type}]\n"
        s += f"business={self.business}\n"
        for k, v in self.details.items():
            s += f"{k}={v}\n"
        s += f"message={self.message}\n"
        return s

def safe_pct(num, denom):
    if denom == 0:
        return "not defined"
    return f"{(num / denom * 100):.1f}%"

def check_analytics_data(events: List[Dict[str, Any]], businesses_map: Dict[str, str]) -> tuple:
    violations = []
    
    business_event_counts = {biz: 0 for biz in businesses_map}
    funnel_counts = {biz: {stage: 0 for stage in FUNNEL_STAGES} for biz in businesses_map}
    aux_counts = {biz: defaultdict(int) for biz in businesses_map}
    
    earliest_time = {biz: None for biz in businesses_map}
    latest_time = {biz: None for biz in businesses_map}
    
    seen_ids = set()
    sessions = defaultdict(list)
    
    # Track out of window explicitly
    out_of_window = 0
    
    # 1. Base event validation
    for ev in events:
        eid = ev.get("_id")
        if not eid:
            violations.append(Violation("missing_id", "unknown", "Event missing _id"))
            continue
            
        if eid in seen_ids:
            violations.append(Violation("duplicate_id", ev.get("business_id", "unknown"), "Duplicate event ID found", event_id=eid))
        seen_ids.add(eid)
        
        biz = ev.get("business_id")
        if not biz:
            violations.append(Violation("missing_business", "unknown", "Event missing business_id", event_id=eid))
            continue
            
        if biz not in businesses_map:
            violations.append(Violation("unknown_business", biz, "Unknown business ID", event_id=eid))
            continue
            
        business_event_counts[biz] += 1
        
        expected_listing = businesses_map[biz]
        actual_listing = ev.get("listing_id")
        if actual_listing != expected_listing:
            violations.append(Violation("listing_mismatch", biz, "listing_id does not match business's hotel_id", 
                                      event_id=eid, expected=expected_listing, actual=actual_listing))
                                      
        evt = ev.get("event_type")
        if not evt or evt not in EVENT_TYPES:
            violations.append(Violation("invalid_event_type", biz, "Unknown event type", event_id=eid, event_type=evt))
            continue
            
        sid = ev.get("session_id")
        if not sid:
            violations.append(Violation("missing_session", biz, "Missing session_id", event_id=eid))
            continue
            
        ts_str = ev.get("timestamp")
        try:
            ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            
            if earliest_time[biz] is None or ts < earliest_time[biz]:
                earliest_time[biz] = ts
            if latest_time[biz] is None or ts > latest_time[biz]:
                latest_time[biz] = ts
                
            if not (DEMO_WEEK_START <= ts <= DEMO_WEEK_END):
                violations.append(Violation("out_of_window", biz, "event is outside configured demo week", 
                                          event_id=eid, timestamp=ts_str))
                out_of_window += 1
                
            sessions[sid].append({"event": evt, "ts": ts, "eid": eid, "biz": biz})
            
        except Exception as e:
            violations.append(Violation("invalid_timestamp", biz, "Unparseable timestamp", event_id=eid, timestamp=ts_str))
            
        if evt in FUNNEL_STAGES:
            funnel_counts[biz][evt] += 1
        else:
            aux_counts[biz][evt] += 1

    # 2. Funnel monotonicity validation
    for biz in businesses_map:
        if business_event_counts[biz] == 0:
            violations.append(Violation("missing_business_data", biz, "No events found for expected demo business"))
            continue
            
        counts = funnel_counts[biz]
        for i in range(len(FUNNEL_STAGES) - 1):
            s1 = FUNNEL_STAGES[i]
            s2 = FUNNEL_STAGES[i+1]
            if counts[s1] < counts[s2]:
                violations.append(Violation("funnel_order", biz, f"{s1} count is less than {s2} count", 
                                          expected=f"{s1} >= {s2}", actual=f"{counts[s1]} >= {counts[s2]}"))

    # 3. Session progression validation
    for sid, sess_events in sessions.items():
        sess_events.sort(key=lambda x: x["ts"])
        
        reached = {}
        for ev in sess_events:
            evt = ev["event"]
            biz = ev["biz"]
            eid = ev["eid"]
            ts_str = ev["ts"].isoformat()
            
            if evt in FUNNEL_STAGES:
                stage_idx = FUNNEL_STAGES.index(evt)
                if stage_idx > 0:
                    prior_stage = FUNNEL_STAGES[stage_idx - 1]
                    if prior_stage not in reached:
                        violations.append(Violation("missing_prior_stage", biz, f"no earlier {prior_stage} event found",
                                                  session=sid, event=evt, timestamp=ts_str))
                reached[evt] = True
                
    results = {
        "funnel_counts": funnel_counts,
        "aux_counts": aux_counts,
        "earliest_time": earliest_time,
        "latest_time": latest_time,
        "total_events": business_event_counts,
        "out_of_window": out_of_window
    }
    
    return results, violations

def run_mongo_check():
    try:
        from backend.app.db.mongo import get_db
        db = get_db()
        db.command("ping")
    except Exception as e:
        print(f"Error: MongoDB unavailable: {e}", file=sys.stderr)
        sys.exit(2)
        
    hotels = load_hotels_data()
    valid_hotel_ids = {h["_id"] for h in hotels}
    businesses = load_businesses_data(valid_hotel_ids)
    
    businesses_map = {b["_id"]: b["hotel_id"] for b in businesses if b["_id"] in ["biz_001", "biz_002", "biz_003"]}
    
    events = list(db["analytics_events"].find({}))
    return check_analytics_data(events, businesses_map)

def print_report(results, violations, source, total_checked):
    print("DEMO ANALYTICS CONSISTENCY CHECK")
    print(f"Source: {source}")
    print(f"Demo week: {DEMO_WEEK_START_STR} -> {DEMO_WEEK_END_STR}")
    print(f"Businesses checked: {len(results['funnel_counts'])}")
    print(f"Events checked: {total_checked}\n")
    
    for biz, counts in results['funnel_counts'].items():
        if results['total_events'][biz] == 0:
            continue
            
        print(biz)
        
        # Stage prints
        stage_names = {
            "listing_impression": "impressions",
            "listing_open": "opens",
            "detail_open": "detail_opens",
            "save": "saves",
            "booking_start": "booking_starts",
            "booking_complete": "bookings"
        }
        for stg in FUNNEL_STAGES:
            print(f"  {stage_names[stg]}: {counts[stg]}")
            
        # Aux prints
        aux_total = sum(results['aux_counts'][biz].values())
        print(f"  auxiliary_events: {aux_total}")
        
        # Determine status
        biz_viols = [v for v in violations if v.business == biz]
        print(f"  status: {'FAIL' if biz_viols else 'PASS'}")
        
        print("\n  Conversion Rates:")
        c1 = safe_pct(counts["listing_open"], counts["listing_impression"])
        print(f"    opens / impressions: {c1}")
        c2 = safe_pct(counts["detail_open"], counts["listing_open"])
        print(f"    detail_opens / opens: {c2}")
        c3 = safe_pct(counts["save"], counts["detail_open"])
        print(f"    saves / detail_opens: {c3}")
        c4 = safe_pct(counts["booking_start"], counts["save"])
        print(f"    booking_starts / saves: {c4}")
        c5 = safe_pct(counts["booking_complete"], counts["booking_start"])
        print(f"    bookings / booking_starts: {c5}")
        
        earliest = results['earliest_time'][biz]
        latest = results['latest_time'][biz]
        print(f"  earliest_event: {earliest.isoformat() if earliest else 'None'}")
        print(f"  latest_event: {latest.isoformat() if latest else 'None'}")
        print()

    print(f"Total violations: {len(violations)}")
    if violations:
        print("Status: FAIL\n")
        for v in violations:
            print(v)
        sys.exit(1)
    else:
        print("Status: PASS")
        sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["mongo"], required=True, help="Source to audit")
    args = parser.parse_args()
    
    if args.source == "mongo":
        results, violations = run_mongo_check()
        total = sum(results["total_events"].values())
        print_report(results, violations, "mongo", total)
