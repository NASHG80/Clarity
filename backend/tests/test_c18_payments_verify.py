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

def test_1_valid_signature_returns_canonical_shape():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        # Mocking successful verification (returns None)
        mock_instance.utility.verify_payment_signature.return_value = True
        
        resp = client.post("/api/booking/verify-payment", json={
            "razorpay_order_id": "order_123",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "sig_123"
        })
        
        assert resp.status_code == 200
        data = resp.json()
        assert data["payment_verified"] is True
        assert data["reservation_status"] == "simulated"
        assert set(data.keys()) == {"payment_verified", "reservation_status"}

def test_2_invalid_signature_returns_400():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_instance.utility.verify_payment_signature.side_effect = razorpay.errors.SignatureVerificationError("Invalid sig")
        
        resp = client.post("/api/booking/verify-payment", json={
            "razorpay_order_id": "order_123",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "sig_wrong"
        })
        
        assert resp.status_code == 400
        assert "Invalid payment signature" in resp.json()["detail"]

def test_3_missing_configuration_returns_500():
    with patch.dict(os.environ, {}, clear=True):
        resp = client.post("/api/booking/verify-payment", json={
            "razorpay_order_id": "order_123",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "sig_123"
        })
        
        assert resp.status_code == 500
        assert "Payment gateway configuration missing" in resp.json()["detail"]

def test_4_missing_fields_fails_validation():
    resp = client.post("/api/booking/verify-payment", json={
        "razorpay_order_id": "order_123",
        "razorpay_payment_id": "pay_123"
        # missing razorpay_signature
    })
    
    assert resp.status_code == 422

def test_5_extra_fields_forbidden():
    resp = client.post("/api/booking/verify-payment", json={
        "razorpay_order_id": "order_123",
        "razorpay_payment_id": "pay_123",
        "razorpay_signature": "sig_123",
        "extra_field": "not_allowed"
    })
    
    assert resp.status_code == 422

def test_6_provider_sdk_failure():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_instance.utility.verify_payment_signature.side_effect = Exception("General failure")
        
        resp = client.post("/api/booking/verify-payment", json={
            "razorpay_order_id": "order_123",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "sig_123"
        })
        
        assert resp.status_code == 500
        assert "Internal payment verification error" in resp.json()["detail"]
