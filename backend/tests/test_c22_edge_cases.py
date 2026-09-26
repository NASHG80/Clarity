import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import httpx
import razorpay

from app.main import app

client = TestClient(app)

# NLU Tests

def test_1_nlu_empty_fallback_on_provider_error():
    with patch("app.routes.nlu.AsyncGroq") as mock_client, \
         patch.dict("os.environ", {"GROQ_API_KEY": "test"}):
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        # Provider throws exception on both attempts
        mock_instance.chat.completions.create = AsyncMock(side_effect=Exception("Provider down"))
        
        resp = client.post("/api/nlu/extract", json={"text": "Hello"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["extracted"]["origin"] is None
        assert data["extracted"]["destination"] is None
        assert data["missing_or_ambiguous"] == []

# AI Vision Tests

def test_2_ai_vision_unreachable():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.side_effect = httpx.RequestError("Unreachable", request=MagicMock())
        
        # We need a dummy image
        resp = client.post(
            "/api/ai/inspect-property-image",
            data={"queries": '["wheelchair"]'},
            files={"image": ("test.jpg", b"fake", "image/jpeg")}
        )
        assert resp.status_code == 503
        data = resp.json()
        assert data["code"] == "ERR_AI_VISION_UNREACHABLE"

def test_3_ai_vision_timeout():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Timeout")
        
        resp = client.post(
            "/api/ai/inspect-property-image",
            data={"queries": '["wheelchair"]'},
            files={"image": ("test.jpg", b"fake", "image/jpeg")}
        )
        assert resp.status_code == 504
        data = resp.json()
        assert data["code"] == "ERR_AI_VISION_TIMEOUT"

# Payment Tests

def test_4_payment_provider_error_create_order():
    with patch.dict("os.environ", {"RAZORPAY_KEY_ID": "test", "RAZORPAY_KEY_SECRET": "test"}), \
         patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        
        mock_instance.order.create.side_effect = razorpay.errors.GatewayError("Down")
        
        resp = client.post("/api/booking/create-order", json={
            "amount_inr": 1000, "currency": "INR", "receipt_id": "test"
        })
        assert resp.status_code == 502
        data = resp.json()
        assert data["code"] == "ERR_PAYMENT_PROVIDER_ERROR"
        assert "Down" not in data["detail"] # Secret/internal message must not leak

def test_5_payment_missing_order_id():
    with patch.dict("os.environ", {"RAZORPAY_KEY_ID": "test", "RAZORPAY_KEY_SECRET": "test"}), \
         patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        
        # Provider returns weird dict without ID
        mock_instance.order.create.return_value = {"amount": 1000}
        
        resp = client.post("/api/booking/create-order", json={
            "amount_inr": 1000, "currency": "INR", "receipt_id": "test"
        })
        assert resp.status_code == 502
        data = resp.json()
        assert data["code"] == "ERR_PROVIDER_MISSING_ORDER_ID"

# Search zero-result tests

def test_6_transport_zero_results():
    resp = client.post("/api/search/transport", json={
        "origin": "Chennai", "destination": "Jaipur",
        "budget_max": 12000, "time_max_hours": 6,
        "accessibility_required": [],
        "weights": {"environmental": 0.4, "accessibility": 0.4, "affordability": 0.1, "convenience": 0.1},
        "include_unverified": False
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["results"]) == 0

def test_7_accommodation_zero_results():
    resp = client.post("/api/search/accommodation", json={
        "destination_city": "Chennai",
        "budget_max": 12000,
        "accessibility_required": [],
        "weights": {"environmental": 0.4, "accessibility": 0.4, "affordability": 0.1, "convenience": 0.1},
        "include_unverified": False
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["results"]) == 0
