import os
import json
import httpx
import pytest
import sys
from pathlib import Path
from unittest.mock import patch, AsyncMock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def mock_image_bytes():
    return b"fake_image_bytes"

class MockResponse:
    def __init__(self, status_code, json_data):
        self.status_code = status_code
        self._json_data = json_data
        
    def json(self):
        return self._json_data
        
    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("Error", request=httpx.Request("POST", "url"), response=self)

def test_inspect_property_image_happy_path(mock_image_bytes):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        expected_detections = [
            {"label": "wheelchair ramp", "bbox": [10.0, 10.0, 100.0, 100.0], "confidence": 0.95}
        ]
        mock_post.return_value = MockResponse(200, expected_detections)
        
        # Call backend route
        response = client.post(
            "/api/ai/inspect-property-image",
            data={"queries": '["wheelchair ramp"]'},
            files={"image": ("test.jpg", mock_image_bytes, "image/jpeg")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "detections" in data
        assert len(data["detections"]) == 1
        assert data["detections"][0]["label"] == "wheelchair ramp"
        assert len(data["detections"][0]["bbox"]) == 4
        assert isinstance(data["detections"][0]["confidence"], float)

def test_inspect_invalid_queries_rejected(mock_image_bytes):
    response = client.post(
        "/api/ai/inspect-property-image",
        data={"queries": "not-json"},
        files={"image": ("test.jpg", mock_image_bytes, "image/jpeg")}
    )
    assert response.status_code == 422
    assert "JSON" in str(response.json())

def test_inspect_vision_service_timeout(mock_image_bytes):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Timeout")
        
        response = client.post(
            "/api/ai/inspect-property-image",
            data={"queries": '["grab bars"]'},
            files={"image": ("test.jpg", mock_image_bytes, "image/jpeg")}
        )
        
        assert response.status_code == 504
        assert "timeout" in str(response.json()).lower()

def test_inspect_vision_service_unavailable(mock_image_bytes):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.RequestError("Connection refused")
        
        response = client.post(
            "/api/ai/inspect-property-image",
            data={"queries": '["grab bars"]'},
            files={"image": ("test.jpg", mock_image_bytes, "image/jpeg")}
        )
        
        assert response.status_code == 503
        assert "unavailable" in str(response.json()).lower()

def test_inspect_vision_service_400_error(mock_image_bytes):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.HTTPStatusError("Error", request=httpx.Request("POST", "url"), response=MockResponse(400, {"detail": "Bad image"}))
        
        response = client.post(
            "/api/ai/inspect-property-image",
            data={"queries": '["grab bars"]'},
            files={"image": ("test.jpg", mock_image_bytes, "image/jpeg")}
        )
        
        assert response.status_code == 502
        assert "unavailable" in str(response.json()).lower()
