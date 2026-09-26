import os
import json
import io
import sys
from pathlib import Path
from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from main import app, lifespan

client = TestClient(app)

def test_health_check_no_model():
    # Before lifespan startup
    response = client.get("/health")
    assert response.status_code == 503
    assert response.json() == {"status": "degraded", "detail": "Model not loaded or warmup failed"}

def test_health_check_after_warmup():
    with TestClient(app) as live_client:
        response = live_client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

def test_inspect_rejects_missing_image():
    response = client.post("/inspect", data={"queries": '["ramp"]'})
    assert response.status_code == 422 # FastAPI built-in validation

def test_inspect_rejects_bad_queries():
    # Need to run within TestClient `with` to trigger lifespan and model load
    with TestClient(app) as live_client:
        # Mock image
        img_byte_arr = io.BytesIO()
        Image.new('RGB', (100, 100), color='grey').save(img_byte_arr, format='JPEG')
        img_byte_arr = img_byte_arr.getvalue()
        
        files = {"file": ("test.jpg", img_byte_arr, "image/jpeg")}
        
        # Test bad json
        response = live_client.post("/inspect", files=files, data={"queries": "invalid"})
        assert response.status_code == 400
        assert "valid JSON list" in response.json()["detail"]
        
        # Test empty queries
        response = live_client.post("/inspect", files=files, data={"queries": "[]"})
        assert response.status_code == 400
        assert "valid JSON list" in response.json()["detail"]

def test_inspect_rejects_invalid_mime_type():
    with TestClient(app) as live_client:
        files = {"file": ("test.txt", b"hello", "text/plain")}
        queries = json.dumps(["wheelchair ramp"])
        
        response = live_client.post("/inspect", files=files, data={"queries": queries})
        assert response.status_code == 415
        assert "Unsupported media type" in response.json()["detail"]

def test_inspect_rejects_oversized_image():
    with TestClient(app) as live_client:
        # Generate 6MB of random bytes mimicking an oversized JPEG
        large_bytes = b"0" * (6 * 1024 * 1024)
        files = {"file": ("large.jpg", large_bytes, "image/jpeg")}
        queries = json.dumps(["wheelchair ramp"])
        
        response = live_client.post("/inspect", files=files, data={"queries": queries})
        assert response.status_code == 413
        assert "Image file too large" in response.json()["detail"]

def test_inspect_rejects_corrupt_image():
    with TestClient(app) as live_client:
        corrupt_bytes = b"This is not a real JPEG image but has the MIME type"
        files = {"file": ("corrupt.jpg", corrupt_bytes, "image/jpeg")}
        queries = json.dumps(["wheelchair ramp"])
        
        response = live_client.post("/inspect", files=files, data={"queries": queries})
        assert response.status_code == 400
        assert "Unreadable or malformed image" in response.json()["detail"]

def test_inspect_valid_request():
    with TestClient(app) as live_client:
        img_byte_arr = io.BytesIO()
        Image.new('RGB', (320, 320), color='grey').save(img_byte_arr, format='JPEG')
        img_byte_arr = img_byte_arr.getvalue()
        
        files = {"file": ("test.jpg", img_byte_arr, "image/jpeg")}
        queries = json.dumps(["wheelchair ramp", "grab bars"])
        
        response = live_client.post("/inspect", files=files, data={"queries": queries})
        assert response.status_code == 200, response.text
        data = response.json()
        assert "detections" in data
        assert isinstance(data["detections"], list)
        
        for det in data["detections"]:
            assert "label" in det
            assert "bbox" in det
            assert len(det["bbox"]) == 4
            assert "confidence" in det
            assert isinstance(det["confidence"], float)

if __name__ == "__main__":
    test_health_check_no_model()
    test_health_check_after_warmup()
    test_inspect_rejects_missing_image()
    test_inspect_rejects_bad_queries()
    test_inspect_rejects_invalid_mime_type()
    test_inspect_rejects_oversized_image()
    test_inspect_rejects_corrupt_image()
    test_inspect_valid_request()
    print("All endpoint tests passed!")
