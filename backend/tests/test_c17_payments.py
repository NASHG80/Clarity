import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import razorpay
import os

from app.main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_env():
    with patch.dict(os.environ, {"RAZORPAY_KEY_ID": "test_id", "RAZORPAY_KEY_SECRET": "test_secret"}):
        yield

def test_1_valid_create_order_returns_canonical_shape():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_instance.order.create.return_value = {
            "id": "order_test_123",
            "amount": 250000,
            "currency": "INR",
            "receipt": "receipt_1"
        }
        
        resp = client.post("/api/booking/create-order", json={
            "amount_inr": 2500,
            "currency": "INR",
            "receipt_id": "receipt_1"
        })
        
        assert resp.status_code == 200
        data = resp.json()
        assert data["order_id"] == "order_test_123"
        assert data["amount"] == 250000
        assert data["currency"] == "INR"
        assert "note" not in data
        assert set(data.keys()) == {"order_id", "amount", "currency"}
        assert "secret" not in str(data).lower()

def test_2_razorpay_sdk_called_with_expected_args():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_instance.order.create.return_value = {
            "id": "order_test_123",
            "amount": 250000,
            "currency": "INR"
        }
        
        client.post("/api/booking/create-order", json={
            "amount_inr": 2500,
            "currency": "INR",
            "receipt_id": "trip_demo_001"
        })
        
        mock_instance.order.create.assert_called_once_with(data={
            "amount": 250000, # 2500 * 100
            "currency": "INR",
            "receipt": "trip_demo_001"
        })

def test_3_missing_amount_rejected():
    resp = client.post("/api/booking/create-order", json={
        "currency": "INR",
        "receipt_id": "receipt_1"
    })
    assert resp.status_code == 422 # Pydantic validation error

def test_4_invalid_amount_rejected():
    resp = client.post("/api/booking/create-order", json={
        "amount_inr": -500,
        "currency": "INR",
        "receipt_id": "receipt_1"
    })
    assert resp.status_code == 422
    
    resp2 = client.post("/api/booking/create-order", json={
        "amount_inr": 0,
        "currency": "INR",
        "receipt_id": "receipt_1"
    })
    assert resp2.status_code == 422

def test_5_unsupported_currency_rejected():
    resp = client.post("/api/booking/create-order", json={
        "amount_inr": 2500,
        "currency": "USD",
        "receipt_id": "receipt_1"
    })
    assert resp.status_code == 422

def test_6_missing_receipt_id_rejected():
    resp = client.post("/api/booking/create-order", json={
        "amount_inr": 2500,
        "currency": "INR"
    })
    assert resp.status_code == 422

def test_7_missing_configuration_fails_safely():
    with patch.dict(os.environ, {}, clear=True):
        resp = client.post("/api/booking/create-order", json={
            "amount_inr": 2500,
            "currency": "INR",
            "receipt_id": "receipt_1"
        })
        assert resp.status_code == 500
        assert "Payment gateway configuration missing" in resp.json()["detail"]

def test_8_razorpay_sdk_exception_controlled_error():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_instance.order.create.side_effect = razorpay.errors.ServerError("Simulated SDK error")
        
        resp = client.post("/api/booking/create-order", json={
            "amount_inr": 2500,
            "currency": "INR",
            "receipt_id": "receipt_1"
        })
        assert resp.status_code == 502
        assert "Payment provider error" in resp.json()["detail"]

def test_9_razorpay_missing_order_id_safely_handled():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_instance.order.create.return_value = {
            "amount": 250000,
            "currency": "INR"
            # Missing id
        }
        
        resp = client.post("/api/booking/create-order", json={
            "amount_inr": 2500,
            "currency": "INR",
            "receipt_id": "receipt_1"
        })
        assert resp.status_code == 502
        assert "missing order ID" in resp.json()["detail"]

def test_10_secret_never_in_response():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_instance.order.create.return_value = {
            "id": "order_test_123",
            "amount": 250000,
            "currency": "INR"
        }
        
        resp = client.post("/api/booking/create-order", json={
            "amount_inr": 2500,
            "currency": "INR",
            "receipt_id": "receipt_1"
        })
        
        body = resp.text.lower()
        assert "test_secret" not in body
        assert "secret" not in body
