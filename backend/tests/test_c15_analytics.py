import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone

from app.main import app

client = TestClient(app)

class FakeCollection:
    def __init__(self, data=None):
        self.data = data or []
        
    def find_one(self, query):
        for doc in self.data:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None
        
    def aggregate(self, pipeline):
        docs = self.data
        for stage in pipeline:
            if "$match" in stage:
                new_docs = []
                for d in docs:
                    match = True
                    for k, v in stage["$match"].items():
                        if isinstance(v, dict) and "$gte" in v:
                            if not (d.get(k, "") >= v["$gte"]):
                                match = False
                        elif d.get(k) != v:
                            match = False
                    if match:
                        new_docs.append(d)
                docs = new_docs
                
            elif "$group" in stage:
                group = stage["$group"]
                _id = group["_id"]
                grouped = {}
                for d in docs:
                    key = d.get(_id[1:]) if isinstance(_id, str) and _id.startswith("$") else None
                    if key not in grouped:
                        grouped[key] = []
                    grouped[key].append(d)
                
                new_docs = []
                for k, v_list in grouped.items():
                    res = {"_id": k}
                    for g_key, g_val in group.items():
                        if g_key == "_id": continue
                        
                        if "$max" in g_val:
                            expr = g_val["$max"]
                            cond = expr["$cond"]
                            eq_expr = cond[0]["$eq"]
                            field = eq_expr[0][1:]
                            val = eq_expr[1]
                            true_val = cond[1]
                            false_val = cond[2]
                            
                            m_val = false_val
                            for item in v_list:
                                if item.get(field) == val:
                                    m_val = max(m_val, true_val)
                            res[g_key] = m_val
                            
                        elif "$sum" in g_val:
                            expr = g_val["$sum"]
                            if isinstance(expr, str) and expr.startswith("$"):
                                field = expr[1:]
                                res[g_key] = sum(item.get(field, 0) for item in v_list)
                            elif isinstance(expr, dict) and "$cond" in expr:
                                cond = expr["$cond"]
                                eq_expr = cond[0]["$eq"]
                                field1 = eq_expr[0][1:]
                                val1 = eq_expr[1]
                                true_val = cond[1]
                                false_val = cond[2]
                                
                                s_val = 0
                                for item in v_list:
                                    if item.get(field1) == val1:
                                        if isinstance(true_val, str) and true_val.startswith("$"):
                                            s_val += item.get(true_val[1:], 0)
                                        else:
                                            s_val += true_val
                                    else:
                                        if isinstance(false_val, str) and false_val.startswith("$"):
                                            s_val += item.get(false_val[1:], 0)
                                        else:
                                            s_val += false_val
                                res[g_key] = s_val
                    new_docs.append(res)
                docs = new_docs
        return docs

class FakeDB:
    def __init__(self):
        now = datetime.now(timezone.utc)
        recent = (now - timedelta(days=1)).isoformat()
        old = (now - timedelta(days=10)).isoformat()
        
        self.businesses = FakeCollection([
            {"_id": "biz_real", "hotel_id": "hotel_real"},
            {"_id": "biz_demo", "hotel_id": "hotel_demo"},
        ])
        
        self.hotels = FakeCollection([
            {"_id": "hotel_real", "data_state": "verified"},
            {"_id": "hotel_demo", "data_state": "demo_synthetic"},
        ])
        
        self.analytics_events = FakeCollection([
            # Session 1: 3 detail_open events
            {"business_id": "biz_real", "session_id": "s1", "event_type": "listing_impression", "timestamp": recent},
            {"business_id": "biz_real", "session_id": "s1", "event_type": "listing_open", "timestamp": recent},
            {"business_id": "biz_real", "session_id": "s1", "event_type": "detail_open", "timestamp": recent},
            {"business_id": "biz_real", "session_id": "s1", "event_type": "detail_open", "timestamp": recent},
            {"business_id": "biz_real", "session_id": "s1", "event_type": "detail_open", "timestamp": recent},
            {"business_id": "biz_real", "session_id": "s1", "event_type": "accessibility_view", "timestamp": recent},
            
            # Session 2: 2 detail_open events
            {"business_id": "biz_real", "session_id": "s2", "event_type": "listing_impression", "timestamp": recent},
            {"business_id": "biz_real", "session_id": "s2", "event_type": "detail_open", "timestamp": recent},
            {"business_id": "biz_real", "session_id": "s2", "event_type": "detail_open", "timestamp": recent},
            {"business_id": "biz_real", "session_id": "s2", "event_type": "booking_start", "timestamp": recent},
            {"business_id": "biz_real", "session_id": "s2", "event_type": "booking_complete", "timestamp": recent},
            
            # Session 3: 1 detail open
            {"business_id": "biz_real", "session_id": "s3", "event_type": "detail_open", "timestamp": recent},
            {"business_id": "biz_real", "session_id": "s3", "event_type": "booking_complete", "timestamp": recent},

            # Session 4: outside weekly period (real biz)
            {"business_id": "biz_real", "session_id": "s4", "event_type": "booking_complete", "timestamp": old},
            
            # Demo biz event
            {"business_id": "biz_demo", "session_id": "s5", "event_type": "listing_impression", "timestamp": recent},
        ])
        
    def __getitem__(self, key):
        return getattr(self, key)

fake_db = FakeDB()

@pytest.fixture(autouse=True)
def mock_get_db():
    global fake_db
    fake_db = FakeDB()
    with patch("app.routes.business.get_db", return_value=fake_db):
        yield

def test_1_valid_weekly_aggregation_raw_counts():
    resp = client.get("/api/business/biz_real/analytics")
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["period"] == "this_week"
    assert data["is_demo_data"] is False
    
    # Session 1: 3 detail_opens. Session 2: 2 detail_opens. Session 3: 1 detail_open.
    # Total detail_opens = 6
    f = data["funnel"]
    assert f["listing_impressions"] == 2  # s1, s2
    assert f["listing_opens"] == 1        # s1
    assert f["detail_opens"] == 6         # 3 from s1 + 2 from s2 + 1 from s3
    assert f["saves"] == 0
    assert f["booking_starts"] == 1       # s2
    assert f["bookings"] == 2             # s2, s3 (s4 is excluded because it is old)

def test_2_demo_data_behavior_from_hotels():
    resp = client.get("/api/business/biz_demo/analytics")
    assert resp.status_code == 200
    data = resp.json()
    
    # is_demo_data should be True because hotel_demo has data_state="demo_synthetic"
    assert data["is_demo_data"] is True
    assert data["funnel"]["listing_impressions"] == 1

def test_3_empty_dataset_returns_zeroes():
    resp = client.get("/api/business/biz_empty/analytics")
    assert resp.status_code == 404 # Business doesn't exist
    
    fake_db.businesses.data.append({"_id": "biz_empty", "hotel_id": "h_empty"})
    fake_db.hotels.data.append({"_id": "h_empty", "data_state": "reported"})
    
    resp2 = client.get("/api/business/biz_empty/analytics")
    assert resp2.status_code == 200
    data = resp2.json()
    assert data["funnel"]["listing_impressions"] == 0
    assert data["funnel"]["bookings"] == 0
    assert len(data["signals"]) == 0

def test_4_correlation_signal_logic():
    resp = client.get("/api/business/biz_real/analytics")
    assert resp.status_code == 200
    data = resp.json()
    
    # s1: acc_view=True -> detail_opens = 3, bookings = 0
    # Drop-off rate for acc_view = 1.0 - (0 / 3) = 1.0
    
    # s2: acc_view=False -> detail_opens = 2, bookings = 1
    # s3: acc_view=False -> detail_opens = 1, bookings = 1
    # Drop-off rate for non-acc_view = 1.0 - (2 / 3) = 0.33
    
    # Since 1.0 > 0.33, correlation signal is created.
    
    assert len(data["signals"]) == 1
    sig = data["signals"][0]
    assert sig["type"] == "drop_off_correlation"
    assert "higher drop-off" in sig["text"]
    assert "caused" not in sig["text"].lower()

def test_5_invalid_business():
    resp = client.get("/api/business/unknown/analytics")
    assert resp.status_code == 404
