import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import os
import razorpay

from app.main import app

client = TestClient(app)

def test_1_missing_configuration_error():
    with patch.dict(os.environ, {}, clear=True):
        resp = client.post("/api/booking/create-order", json={
            "amount_inr": 1000,
            "currency": "INR",
            "receipt_id": "test"
        })
        assert resp.status_code == 500
        data = resp.json()
        assert data["code"] == "ERR_PAYMENT_CONFIG_MISSING"
        assert data["detail"] == "Payment gateway configuration missing."

def test_2_invalid_signature_error():
    with patch.dict(os.environ, {"RAZORPAY_KEY_ID": "test", "RAZORPAY_KEY_SECRET": "test"}), \
         patch("razorpay.Client") as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_instance.utility.verify_payment_signature.side_effect = razorpay.errors.SignatureVerificationError("Invalid")
        
        resp = client.post("/api/booking/verify-payment", json={
            "razorpay_order_id": "order_123",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "sig_wrong"
        })
        assert resp.status_code == 400
        data = resp.json()
        assert data["code"] == "ERR_INVALID_SIGNATURE"
        assert data["detail"] == "Invalid payment signature."

def test_3_business_not_found():
    with patch("app.routes.business.get_db") as mock_get_db:
        mock_db = MagicMock()
        mock_db["businesses"].find_one.return_value = None
        mock_get_db.return_value = mock_db
        
        resp = client.get("/api/business/non_existent_123/analytics")
        assert resp.status_code == 404
        data = resp.json()
        assert data["code"] == "ERR_BUSINESS_NOT_FOUND"
        assert data["detail"] == "Business not found"

def test_4_existing_validation_errors_422():
    # Pydantic validation errors should still return 422
    resp = client.post("/api/booking/create-order", json={
        "amount_inr": "not a number"
    })
    assert resp.status_code == 422
    # Pydantic default validation errors are standard arrays in "detail"
    assert isinstance(resp.json()["detail"], list)

def test_5_accept_language_not_required():
    with patch.dict(os.environ, {}, clear=True):
        resp = client.post("/api/booking/create-order", json={
            "amount_inr": 1000, "currency": "INR", "receipt_id": "test"
        }, headers={"Accept-Language": "hi-IN"})
        # The backend still responds in English + code
        assert resp.status_code == 500
        data = resp.json()
        assert data["code"] == "ERR_PAYMENT_CONFIG_MISSING"
        assert "Payment gateway configuration missing" in data["detail"]
        assert "कॉन्फ़िगरेशन" not in data["detail"] # Proves no Hindi translation in backend

def test_6_success_responses_unchanged():
    with patch.dict(os.environ, {"RAZORPAY_KEY_ID": "test", "RAZORPAY_KEY_SECRET": "test"}), \
         patch("razorpay.Client") as mock_client:
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
        assert "code" not in data
        assert data["payment_verified"] is True
