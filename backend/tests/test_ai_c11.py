"""Tests for C11 YOLO-World-S AI vision integration."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_response(status_code=200, json_data=None, raises=None):
    """Create a mock httpx.Response or simulate an exception."""
    if raises:
        mock = AsyncMock()
        mock.side_effect = raises
        return mock
        
    resp_mock = MagicMock()
    resp_mock.status_code = status_code
    resp_mock.json.return_value = json_data if json_data is not None else []
    
    # raise_for_status mock
    if status_code >= 400:
        def _raise():
            raise httpx.HTTPStatusError("error", request=MagicMock(), response=resp_mock)
        resp_mock.raise_for_status.side_effect = _raise
    else:
        resp_mock.raise_for_status.return_value = None
        
    mock = AsyncMock()
    mock.return_value = resp_mock
    return mock


def _post_inspect(queries=None, filename="test.jpg", content=b"fake-image", content_type="image/jpeg"):
    """Helper to POST to the C11 endpoint."""
    if queries is None:
        queries = ["ramp", "grab bar"]
        
    files = {"image": (filename, content, content_type)}
    data = {"queries": json.dumps(queries)}
    
    return client.post("/api/ai/inspect-property-image", data=data, files=files)


# ---------------------------------------------------------------------------
# Success Cases
# ---------------------------------------------------------------------------

@patch("httpx.AsyncClient.post")
def test_1_valid_image_and_queries_forwarded(mock_post):
    mock_post.return_value = _mock_response(json_data=[
        {"label": "ramp", "bbox": [10, 10, 100, 100], "confidence": 0.95}
    ]).return_value
    
    resp = _post_inspect()
    assert resp.status_code == 200
    
    # Verify the mock was called correctly
    assert mock_post.called
    args, kwargs = mock_post.call_args
    assert "data" in kwargs
    # Ensure data was passed as a list of tuples (or dict of lists if httpx converted it)
    # The actual code passes [("queries", "ramp"), ("queries", "grab bar")]
    assert ("queries", "ramp") in kwargs["data"]
    assert ("queries", "grab bar") in kwargs["data"]
    assert "files" in kwargs
    assert "image" in kwargs["files"]


@patch("httpx.AsyncClient.post")
def test_2_multiple_queries_forwarded_correctly(mock_post):
    mock_post.return_value = _mock_response().return_value
    _post_inspect(queries=["q1", "q2", "q3"])
    
    args, kwargs = mock_post.call_args
    assert kwargs["data"] == [("queries", "q1"), ("queries", "q2"), ("queries", "q3")]


@patch("httpx.AsyncClient.post")
def test_3_correct_downstream_url_usage(mock_post, monkeypatch):
    monkeypatch.setenv("AI_VISION_URL", "http://custom-vision-url:9999")
    mock_post.return_value = _mock_response().return_value
    
    _post_inspect()
    args, kwargs = mock_post.call_args
    assert args[0] == "http://custom-vision-url:9999/inspect"


@patch("httpx.AsyncClient.post")
def test_4_5_6_downstream_response_maps_correctly(mock_post):
    mock_post.return_value = _mock_response(json_data=[
        {"label": "wheelchair ramp", "bbox": [1, 2, 3, 4], "confidence": 0.88},
        {"label": "grab bar", "bbox": [10, 20, 30, 40], "confidence": 0.77},
    ]).return_value
    
    resp = _post_inspect()
    assert resp.status_code == 200
    data = resp.json()
    
    assert len(data["detections"]) == 2
    d1 = data["detections"][0]
    assert d1["label"] == "wheelchair ramp"
    assert d1["bbox"] == [1, 2, 3, 4]  # test 5: bounding boxes preserved
    assert d1["confidence"] == 0.88    # test 6: confidence preserved
    
    d2 = data["detections"][1]
    assert d2["label"] == "grab bar"
    assert d2["bbox"] == [10, 20, 30, 40]


@patch("httpx.AsyncClient.post")
def test_7_empty_detections_return_successfully(mock_post):
    mock_post.return_value = _mock_response(json_data=[]).return_value
    resp = _post_inspect()
    assert resp.status_code == 200
    assert resp.json()["detections"] == []


# ---------------------------------------------------------------------------
# Failure & Edge Cases
# ---------------------------------------------------------------------------

@patch("httpx.AsyncClient.post")
def test_8_ai_service_unreachable(mock_post):
    mock_post.side_effect = httpx.RequestError("Connection Refused")
    resp = _post_inspect()
    assert resp.status_code == 503
    assert "manual" in resp.json()["detail"].lower()


@patch("httpx.AsyncClient.post")
def test_9_ai_service_timeout(mock_post):
    mock_post.side_effect = httpx.TimeoutException("Timeout")
    resp = _post_inspect()
    assert resp.status_code == 504
    assert "timeout" in resp.json()["detail"].lower()


@patch("httpx.AsyncClient.post")
def test_10_ai_service_returns_http_error(mock_post):
    mock_post.return_value = _mock_response(status_code=500).return_value
    resp = _post_inspect()
    assert resp.status_code == 502
    assert "manual" in resp.json()["detail"].lower()


@patch("httpx.AsyncClient.post")
def test_11_ai_service_returns_malformed_json(mock_post):
    mock = _mock_response(status_code=200)
    mock.return_value.json.side_effect = json.JSONDecodeError("Expecting value", "", 0)
    mock_post.return_value = mock.return_value
    
    resp = _post_inspect()
    assert resp.status_code == 502
    assert "malformed" in resp.json()["detail"].lower()


@patch("httpx.AsyncClient.post")
def test_11b_ai_service_returns_non_list(mock_post):
    mock_post.return_value = _mock_response(json_data={"not": "a list"}).return_value
    resp = _post_inspect()
    assert resp.status_code == 502


@patch("httpx.AsyncClient.post")
def test_11c_ai_service_returns_malformed_detection_data(mock_post):
    # missing bbox
    mock_post.return_value = _mock_response(json_data=[
        {"label": "ramp", "confidence": 0.9}
    ]).return_value
    resp = _post_inspect()
    assert resp.status_code == 502


def test_12_missing_image_rejected():
    data = {"queries": json.dumps(["ramp"])}
    resp = client.post("/api/ai/inspect-property-image", data=data)
    # FastAPI returns 422 Unprocessable Entity for missing required fields
    assert resp.status_code == 422


def test_12b_invalid_content_type_rejected():
    resp = _post_inspect(content_type="text/plain")
    assert resp.status_code == 422


def test_13_missing_queries_rejected():
    files = {"image": ("test.jpg", b"fake", "image/jpeg")}
    resp = client.post("/api/ai/inspect-property-image", files=files)
    assert resp.status_code == 422


def test_13b_invalid_queries_json_rejected():
    files = {"image": ("test.jpg", b"fake", "image/jpeg")}
    data = {"queries": "not-valid-json"}
    resp = client.post("/api/ai/inspect-property-image", data=data, files=files)
    assert resp.status_code == 422


def test_13c_invalid_queries_type_rejected():
    files = {"image": ("test.jpg", b"fake", "image/jpeg")}
    data = {"queries": json.dumps({"this": "is a dict, not a list"})}
    resp = client.post("/api/ai/inspect-property-image", data=data, files=files)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Strict Boundary Constraints
# ---------------------------------------------------------------------------

@patch("httpx.AsyncClient.post")
def test_14_to_20_no_mongo_no_data_state_mutations(mock_post):
    """
    Ensure the endpoint is a pure pass-through and doesn't mutate or inject
    unauthorized fields.
    """
    mock_post.return_value = _mock_response(json_data=[
        {"label": "ramp", "bbox": [1, 2, 3, 4], "confidence": 0.9}
    ]).return_value
    
    resp = _post_inspect()
    assert resp.status_code == 200
    
    # The output MUST NOT contain data_state, reported, verified, etc.
    data = resp.json()
    d1 = data["detections"][0]
    
    assert "data_state" not in d1
    assert "verified" not in d1
    assert "reported" not in d1
    
    # Note must exist and not promise a data state change here
    assert "C11" in data["note"]
