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

def test_1_valid_payment_yields_simulated_reservation():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
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

def test_2_invalid_signature_means_payment_not_verified():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_instance.utility.verify_payment_signature.side_effect = razorpay.errors.SignatureVerificationError("Invalid")
        
        resp = client.post("/api/booking/verify-payment", json={
            "razorpay_order_id": "order_123",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "sig_wrong"
        })
        
        assert resp.status_code == 400
        # If the endpoint returns 400, it safely avoids returning payment_verified: true

def test_3_no_supplier_integration_never_returns_confirmed():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_instance.utility.verify_payment_signature.return_value = True
        
        resp = client.post("/api/booking/verify-payment", json={
            "razorpay_order_id": "order_123",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "sig_123"
        })
        
        data = resp.json()
        # Explicit check to ensure we never lie and say "confirmed"
        assert data["reservation_status"] != "confirmed"
        assert data["reservation_status"] == "simulated"

def test_4_exact_response_shape_strict_schema():
    with patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_instance.utility.verify_payment_signature.return_value = True
        
        resp = client.post("/api/booking/verify-payment", json={
            "razorpay_order_id": "order_123",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "sig_123"
        })
        
        data = resp.json()
        # Verify exactly the required keys
        assert set(data.keys()) == {"payment_verified", "reservation_status"}
