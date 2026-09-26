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
        
    def insert_one(self, doc):
        self.data.append(doc)
        
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
                
            elif "$unwind" in stage:
                field = stage["$unwind"][1:]
                new_docs = []
                for d in docs:
                    arr = d.get(field, [])
                    if isinstance(arr, list):
                        for item in arr:
                            nd = d.copy()
                            nd[field] = item
                            new_docs.append(nd)
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
                        
                        if "$sum" in g_val:
                            expr = g_val["$sum"]
                            if expr == 1:
                                res[g_key] = len(v_list)
                            else:
                                pass # Not needed for C16
                    new_docs.append(res)
                docs = new_docs
                
            elif "$sort" in stage:
                sort_field = list(stage["$sort"].keys())[0]
                direction = stage["$sort"][sort_field]
                docs = sorted(docs, key=lambda x: x.get(sort_field, ""), reverse=(direction == -1))
                
        return docs

class FakeDB:
    def __init__(self):
        now = datetime.now(timezone.utc)
        recent = (now - timedelta(days=1)).isoformat().replace("+00:00", "Z")
        old = (now - timedelta(days=10)).isoformat().replace("+00:00", "Z")
        
        self.businesses = FakeCollection([
            {"_id": "biz_real", "hotel_id": "hotel_real"},
            {"_id": "biz_demo", "hotel_id": "hotel_demo"},
        ])
        
        self.hotels = FakeCollection([
            {"_id": "hotel_real", "data_state": "verified", "accessibility_items": [
                {"label": "step_free_entrance", "data_state": "reported"},
                {"label": "elevator", "data_state": "not_verified"},
                {"label": "accessible_parking", "data_state": "community_confirmed"},
            ]},
            {"_id": "hotel_demo", "data_state": "demo_synthetic"},
        ])
        
        self.search_requests = FakeCollection([
            {"_id": "req_1", "search_type": "transport", "accessibility_required": ["roll_in_shower"], "timestamp": recent},
            {"_id": "req_2", "search_type": "accommodation", "accessibility_required": ["roll_in_shower", "elevator"], "timestamp": recent},
            {"_id": "req_3", "search_type": "accommodation", "accessibility_required": ["roll_in_shower"], "timestamp": recent}, # dup request for roll_in_shower
            {"_id": "req_old", "search_type": "transport", "accessibility_required": ["roll_in_shower"], "timestamp": old},
            {"_id": "req_empty", "search_type": "transport", "accessibility_required": [], "timestamp": recent} # Should not exist in real db, but testing robust aggregation
        ])
        
        self.analytics_events = FakeCollection([
            {"business_id": "biz_real", "event_type": "listing_impression", "timestamp": recent},
        ])
        
    def __getitem__(self, key):
        return getattr(self, key)

fake_db = FakeDB()

@pytest.fixture(autouse=True)
def mock_get_db():
    global fake_db
    fake_db = FakeDB()
    with patch("app.db.mongo.get_db", return_value=fake_db):
        # We need to also patch the routes if they imported get_db directly
        with patch("app.routes.business.get_db", return_value=fake_db, create=True):
            yield

def test_1_search_transport_persists():
    resp = client.post("/api/search/transport", json={
        "origin": "Mumbai", "destination": "Goa",
        "budget_max": 12000, "time_max_hours": 6,
        "accessibility_required": ["step_free_train"],
        "weights": {"environmental": 0.4, "accessibility": 0.4, "affordability": 0.1, "convenience": 0.1},
        "include_unverified": False
    })
    assert resp.status_code == 200
    
    docs = fake_db.search_requests.data
    # 5 from initial + 1 new
    assert len(docs) == 6
    new_doc = docs[-1]
    assert new_doc["search_type"] == "transport"
    assert new_doc["accessibility_required"] == ["step_free_train"]
    assert "timestamp" in new_doc

def test_2_search_accommodation_persists():
    resp = client.post("/api/search/accommodation", json={
        "destination_city": "Goa",
        "budget_max": 12000,
        "accessibility_required": ["roll_in_shower", "step_free_entrance"],
        "weights": {"environmental": 0.4, "accessibility": 0.4, "affordability": 0.1, "convenience": 0.1},
        "include_unverified": False
    })
    assert resp.status_code == 200
    
    docs = fake_db.search_requests.data
    assert len(docs) == 6
    new_doc = docs[-1]
    assert new_doc["search_type"] == "accommodation"
    assert new_doc["accessibility_required"] == ["roll_in_shower", "step_free_entrance"]
    
def test_3_empty_requirements_not_persisted():
    resp = client.post("/api/search/transport", json={
        "origin": "Mumbai", "destination": "Goa",
        "budget_max": 12000, "time_max_hours": 6,
        "accessibility_required": [],
        "weights": {"environmental": 0.4, "accessibility": 0.4, "affordability": 0.1, "convenience": 0.1},
        "include_unverified": False
    })
    assert resp.status_code == 200
    assert len(fake_db.search_requests.data) == 5 # Unchanged

def test_4_demand_aggregation_excludes_old_and_computes_correctly():
    resp = client.get("/api/business/biz_real/demand")
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["period"] == "this_week"
    assert data["is_demo_data"] is False
    
    counts = {c["label"]: c["count"] for c in data["requirement_search_counts"]}
    assert counts.get("roll_in_shower") == 3 # req_1, req_2, req_3. (req_old is excluded)
    assert counts.get("elevator") == 1 # req_2
    
def test_5_property_gaps_logic():
    resp = client.get("/api/business/biz_real/demand")
    data = resp.json()
    
    gaps = {g["label"]: g for g in data["gaps"]}
    
    # roll_in_shower: Not in property checklist -> implicitly not_verified -> GAP!
    assert "roll_in_shower" in gaps
    assert gaps["roll_in_shower"]["property_data_state"] == "not_verified"
    
    # elevator: In property checklist with data_state="not_verified" -> GAP!
    assert "elevator" in gaps
    assert gaps["elevator"]["property_data_state"] == "not_verified"
    
    # Let's add a search request for a reported item to ensure it doesn't gap
    fake_db.search_requests.insert_one({"_id": "r99", "search_type": "accommodation", "accessibility_required": ["step_free_entrance"], "timestamp": datetime.now(timezone.utc).isoformat()})
    
    resp2 = client.get("/api/business/biz_real/demand")
    data2 = resp2.json()
    gaps2 = {g["label"]: g for g in data2["gaps"]}
    
    # step_free_entrance is "reported" -> Not a gap
    assert "step_free_entrance" not in gaps2

def test_6_demo_data_behavior():
    resp = client.get("/api/business/biz_demo/demand")
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_demo_data"] is True

def test_7_invalid_business():
    resp = client.get("/api/business/unknown/demand")
    assert resp.status_code == 404

def test_8_empty_db_honest_response():
    fake_db.search_requests.data = []
    resp = client.get("/api/business/biz_real/demand")
    assert resp.status_code == 200
    data = resp.json()
    assert data["requirement_search_counts"] == []
    assert data["gaps"] == []

def test_9_malformed_search_does_not_break():
    resp = client.post("/api/search/transport", json={"bad": "payload"})
    assert resp.status_code == 422 # Validation error
    assert len(fake_db.search_requests.data) == 5 # Unchanged
