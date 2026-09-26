import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

class FakeCollection:
    def __init__(self, data=None):
        self.data = data or []
        
    def insert_one(self, doc):
        self.data.append(doc)
        
    def find(self, query=None):
        return self.data
        
class FakeDB:
    def __init__(self):
        self.analytics_events = FakeCollection()
        
    def __getitem__(self, key):
        return getattr(self, key)

fake_db = FakeDB()

@pytest.fixture(autouse=True)
def mock_get_db():
    global fake_db
    fake_db = FakeDB()
    with patch("app.routes.analytics.get_db", return_value=fake_db):
        yield

def get_db():
    return fake_db

def test_1_listing_impression_accepted():
    payload = {
        "business_id": "biz_001",
        "listing_id": "hotel_014",
        "event_type": "listing_impression",
        "session_id": "anon-session-abc",
        "timestamp": "2026-09-26T10:00:00Z"
    }
    resp = client.post("/api/analytics/events", json=payload)
    assert resp.status_code == 202
    
    events = get_db().analytics_events.find()
    assert len(events) == 1
    assert events[0]["business_id"] == "biz_001"
    assert events[0]["event_type"] == "listing_impression"
    assert events[0]["session_id"] == "anon-session-abc"
    assert events[0]["timestamp"] == "2026-09-26T10:00:00Z"

def test_2_all_canonical_events_accepted():
    canonical_events = [
        "listing_open",
        "detail_open",
        "accessibility_view",
        "sustainability_view",
        "map_open",
        "save",
        "booking_start",
        "booking_complete"
    ]
    
    for ev in canonical_events:
        payload = {
            "business_id": "biz_001",
            "listing_id": "hotel_014",
            "event_type": ev,
            "session_id": "anon-session-abc",
            "timestamp": "2026-09-26T10:00:00Z"
        }
        resp = client.post("/api/analytics/events", json=payload)
        assert resp.status_code == 202

    events = get_db().analytics_events.find()
    assert len(events) == 8
    stored_types = [e["event_type"] for e in events]
    assert set(stored_types) == set(canonical_events)

def test_3_invalid_event_type_rejected():
    payload = {
        "business_id": "biz_001",
        "listing_id": "hotel_014",
        "event_type": "invalid_made_up_event",
        "session_id": "anon-session-abc",
        "timestamp": "2026-09-26T10:00:00Z"
    }
    resp = client.post("/api/analytics/events", json=payload)
    assert resp.status_code == 422
    
    events = get_db().analytics_events.find()
    assert len(events) == 0

def test_4_missing_required_field_rejected():
    payload = {
        # missing business_id
        "listing_id": "hotel_014",
        "event_type": "listing_impression",
        "session_id": "anon-session-abc",
    }
    resp = client.post("/api/analytics/events", json=payload)
    assert resp.status_code == 422
    
    events = get_db().analytics_events.find()
    assert len(events) == 0

def test_5_extra_unsupported_fields_rejected():
    payload = {
        "business_id": "biz_001",
        "listing_id": "hotel_014",
        "event_type": "listing_impression",
        "session_id": "anon-session-abc",
        "extra_field_not_allowed": "should_fail"
    }
    resp = client.post("/api/analytics/events", json=payload)
    assert resp.status_code == 422
    
    events = get_db().analytics_events.find()
    assert len(events) == 0

def test_6_multiple_events_independent_writes():
    valid1 = {
        "business_id": "biz_001",
        "listing_id": "hotel_014",
        "event_type": "listing_impression",
        "session_id": "sess-1"
    }
    invalid = {
        "business_id": "biz_001",
        "listing_id": "hotel_014",
        "event_type": "bad_event",
        "session_id": "sess-2"
    }
    valid2 = {
        "business_id": "biz_001",
        "listing_id": "hotel_014",
        "event_type": "detail_open",
        "session_id": "sess-3"
    }
    
    resp1 = client.post("/api/analytics/events", json=valid1)
    resp2 = client.post("/api/analytics/events", json=invalid)
    resp3 = client.post("/api/analytics/events", json=valid2)
    
    assert resp1.status_code == 202
    assert resp2.status_code == 422
    assert resp3.status_code == 202
    
    events = get_db().analytics_events.find()
    assert len(events) == 2
    assert events[0]["session_id"] == "sess-1"
    assert events[1]["session_id"] == "sess-3"


