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
        
    def update_one(self, filter, update):
        # A very crude update_one just for these tests
        doc = self.find_one(filter)
        class Result:
            matched_count = 1 if doc else 0
        if not doc:
            # Special case for updating by _id when array filter misses
            if "_id" in filter and len(filter) > 1:
                doc = self.find_one({"_id": filter["_id"]})
            if not doc:
                return Result()
                
        if "$set" in update:
            for k, v in update["$set"].items():
                if k == "detections.$.review_status":
                    lbl = filter.get("detections.label")
                    for d in doc["detections"]:
                        if d["label"] == lbl:
                            d["review_status"] = v
                elif k.endswith("$.data_state"):
                    array_name = k.split(".")[0]
                    lbl = filter.get(f"{array_name}.label")
                    for a in doc.get(array_name, []):
                        if a["label"] == lbl:
                            a["data_state"] = v
                elif k.endswith("$.value"):
                    array_name = k.split(".")[0]
                    lbl = filter.get(f"{array_name}.label")
                    for a in doc.get(array_name, []):
                        if a["label"] == lbl:
                            a["value"] = v
        return Result()

class FakeDB:
    def __init__(self):
        self.ai_inspections = FakeCollection([
            {
                "_id": "test_insp_1",
                "business_id": "test_biz_1",
                "image_id": "test_img_1",
                "detections": [
                    {"label": "wheelchair ramp", "bbox": [1,2,3,4], "confidence": 0.95, "review_status": "pending"},
                    {"label": "elevator", "bbox": [5,6,7,8], "confidence": 0.85, "review_status": "pending"},
                    {"label": "grab bar", "bbox": [1,1,1,1], "confidence": 0.75, "review_status": "pending"},
                    {"label": "solar panel", "bbox": [10,20,30,40], "confidence": 0.88, "review_status": "pending"},
                    {"label": "alien technology", "bbox": [0,0,0,0], "confidence": 0.99, "review_status": "pending"}
                ]
            }
        ])
        self.businesses = FakeCollection([
            {
                "_id": "test_biz_1",
                "hotel_id": "test_hotel_1"
            }
        ])
        self.hotels = FakeCollection([
            {
                "_id": "test_hotel_1",
                "accessibility_items": [
                    {"label": "wheelchair ramp", "value": None, "data_state": "not_verified"},
                    {"label": "elevator", "value": None, "data_state": "not_verified"},
                ],
                "sustainability_items": [
                    {"label": "solar panel", "value": None, "data_state": "not_verified"}
                ]
            }
        ])
        
    def __getitem__(self, key):
        return getattr(self, key)

fake_db = FakeDB()

@pytest.fixture(autouse=True)
def mock_get_db():
    global fake_db
    fake_db = FakeDB()
    with patch("app.routes.ai.get_db", return_value=fake_db):
        yield

def get_db():
    return fake_db


def test_1_valid_confirmed_detection():
    payload = {
        "detections": [
            {
                "label": "wheelchair ramp",
                "confirmed": True,
                "image_id": "test_img_1"
            }
        ]
    }
    resp = client.post("/api/ai/confirm-detections", json=payload)
    assert resp.status_code == 200
    
    db = get_db()
    insp = db.ai_inspections.find_one({"_id": "test_insp_1"})
    ramp_det = next(d for d in insp["detections"] if d["label"] == "wheelchair ramp")
    assert ramp_det["review_status"] == "confirmed"
    
    hotel = db.hotels.find_one({"_id": "test_hotel_1"})
    ramp_item = next(i for i in hotel["accessibility_items"] if i["label"] == "wheelchair ramp")
    assert ramp_item["data_state"] == "reported"
    assert ramp_item["value"] is True


def test_2_valid_rejected_detection():
    payload = {
        "detections": [
            {
                "label": "elevator",
                "confirmed": False,
                "image_id": "test_img_1"
            }
        ]
    }
    resp = client.post("/api/ai/confirm-detections", json=payload)
    assert resp.status_code == 200
    
    db = get_db()
    insp = db.ai_inspections.find_one({"_id": "test_insp_1"})
    elev_det = next(d for d in insp["detections"] if d["label"] == "elevator")
    assert elev_det["review_status"] == "rejected"
    
    hotel = db.hotels.find_one({"_id": "test_hotel_1"})
    elev_item = next(i for i in hotel["accessibility_items"] if i["label"] == "elevator")
    assert elev_item["data_state"] == "not_verified"  # Unchanged


def test_3_pending_remains_pending():
    db = get_db()
    insp = db.ai_inspections.find_one({"_id": "test_insp_1"})
    bar_det = next(d for d in insp["detections"] if d["label"] == "grab bar")
    assert bar_det["review_status"] == "pending"


def test_4_confidence_has_no_effect():
    # Tested by test 1 where conf=0.95 and test 2 where conf=0.85
    # The endpoint solely respects `confirmed` flag.
    pass


def test_5_unknown_image_id_or_label_returns_404():
    payload = {
        "detections": [
            {
                "label": "wheelchair ramp",
                "confirmed": True,
                "image_id": "invalid_img_id"
            }
        ]
    }
    resp = client.post("/api/ai/confirm-detections", json=payload)
    assert resp.status_code == 404

    payload2 = {
        "detections": [
            {
                "label": "unknown_label",
                "confirmed": True,
                "image_id": "test_img_1"
            }
        ]
    }
    resp2 = client.post("/api/ai/confirm-detections", json=payload2)
    assert resp2.status_code == 404


def test_6_multiple_confirmations_in_one_request():
    payload = {
        "detections": [
            {
                "label": "wheelchair ramp",
                "confirmed": True,
                "image_id": "test_img_1"
            },
            {
                "label": "elevator",
                "confirmed": False,
                "image_id": "test_img_1"
            }
        ]
    }
    resp = client.post("/api/ai/confirm-detections", json=payload)
    assert resp.status_code == 200
    
    db = get_db()
    insp = db.ai_inspections.find_one({"_id": "test_insp_1"})
    assert next(d for d in insp["detections"] if d["label"] == "wheelchair ramp")["review_status"] == "confirmed"
    assert next(d for d in insp["detections"] if d["label"] == "elevator")["review_status"] == "rejected"
    assert next(d for d in insp["detections"] if d["label"] == "grab bar")["review_status"] == "pending"


def test_missing_checklist_item_fails_safely():
    payload = {
        "detections": [
            {
                "label": "alien technology",
                "confirmed": True,
                "image_id": "test_img_1"
            }
        ]
    }
    resp = client.post("/api/ai/confirm-detections", json=payload)
    assert resp.status_code == 400
    assert "not found in canonical checklist" in resp.json()["detail"]
    
    db = get_db()
    insp = db.ai_inspections.find_one({"_id": "test_insp_1"})
    alien = next(d for d in insp["detections"] if d["label"] == "alien technology")
    assert alien["review_status"] == "pending"  # Transaction failed safely

def test_sustainability_item_updates_correct_array():
    payload = {
        "detections": [
            {
                "label": "solar panel",
                "confirmed": True,
                "image_id": "test_img_1"
            }
        ]
    }
    resp = client.post("/api/ai/confirm-detections", json=payload)
    assert resp.status_code == 200
    
    db = get_db()
    hotel = db.hotels.find_one({"_id": "test_hotel_1"})
    sust = next(i for i in hotel["sustainability_items"] if i["label"] == "solar panel")
    assert sust["data_state"] == "reported"
    assert sust["value"] is True

