import sys
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path.cwd()))
from database.check_demo_analytics import check_analytics_data, DEMO_WEEK_START

def make_event(eid, biz, lst, etype, sid, ts_offset=0):
    ts = (DEMO_WEEK_START + timedelta(seconds=ts_offset)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "_id": eid,
        "business_id": biz,
        "listing_id": lst,
        "event_type": etype,
        "session_id": sid,
        "timestamp": ts
    }

def test_passing():
    biz_map = {"biz_001": "hotel_001"}
    
    events = [
        make_event("e1", "biz_001", "hotel_001", "listing_impression", "s1", 10),
        make_event("e2", "biz_001", "hotel_001", "listing_open", "s1", 20),
        make_event("e3", "biz_001", "hotel_001", "map_open", "s1", 25),
        make_event("e4", "biz_001", "hotel_001", "detail_open", "s1", 30),
        make_event("e5", "biz_001", "hotel_001", "save", "s1", 40),
        make_event("e6", "biz_001", "hotel_001", "booking_start", "s1", 50),
        make_event("e7", "biz_001", "hotel_001", "booking_complete", "s1", 60),
    ]
    
    res, viols = check_analytics_data(events, biz_map)
    assert len(viols) == 0, f"Expected 0 violations, got {len(viols)}"
    
def test_failing():
    biz_map = {"biz_001": "hotel_001", "biz_002": "hotel_002"}
    
    events = [
        # Missing biz
        make_event("e1", "biz_001", "hotel_001", "listing_impression", "s1", 10),
        make_event("e2", "biz_001", "hotel_001", "listing_open", "s1", 20),
        
        # Missing prior stage
        make_event("e3", "biz_002", "hotel_002", "booking_complete", "s2", 10),
        
        # Duplicate ID
        make_event("e3", "biz_002", "hotel_002", "listing_impression", "s3", 10),
        
        # Bad timestamp (out of bounds)
        make_event("e4", "biz_001", "hotel_001", "listing_impression", "s4", -10000000000),
        
        # Monotonicity failed
        make_event("e5", "biz_001", "hotel_001", "save", "s5", 10),
        make_event("e6", "biz_001", "hotel_001", "booking_start", "s5", 20),
        make_event("e7", "biz_001", "hotel_001", "booking_start", "s5", 30), # 2 booking starts, 1 save
        
        # Listing mismatch
        make_event("e8", "biz_001", "hotel_002", "listing_impression", "s6", 10),
        
        # Invalid event type
        make_event("e9", "biz_001", "hotel_001", "invalid_type", "s7", 10),
    ]
    
    res, viols = check_analytics_data(events, biz_map)
    
    assert len(viols) > 0
    errors = [v.error_type for v in viols]
    assert "missing_prior_stage" in errors
    assert "duplicate_id" in errors
    assert "out_of_window" in errors
    assert "funnel_order" in errors
    assert "listing_mismatch" in errors
    assert "invalid_event_type" in errors

if __name__ == "__main__":
    test_passing()
    test_failing()
    print("All unit tests for check_demo_analytics passed!")
