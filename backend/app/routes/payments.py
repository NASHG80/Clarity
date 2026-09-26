"""Razorpay payment routes — create-order and verify-payment.

C1 stubs: return deterministic contract-shaped responses.
Real Razorpay test-mode SDK calls implemented in C17/C18.

Routes:
    POST /api/booking/create-order
    POST /api/booking/verify-payment

Rules (AGENTS.md §2.6 / API_CONTRACT.md):
  - Razorpay is PAYMENT ONLY — not inventory.
  - reservation_status must be "simulated" unless a real supplier API
    is integrated (out of scope for this prototype).
  - Do NOT imply a real booking from a test-mode payment.
"""

from fastapi import APIRouter

from app.models.schemas import (
    CreateOrderRequest,
    CreateOrderResponse,
    ReservationStatus,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
)

router = APIRouter(prefix="/api/booking", tags=["Payments"])


# ---------------------------------------------------------------------------
# C1 STUBS — real Razorpay SDK calls implemented in C17/C18
# ---------------------------------------------------------------------------

import os
import razorpay
from fastapi import HTTPException

@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(payload: CreateOrderRequest) -> CreateOrderResponse:
    """Create a Razorpay test-mode order.

    Real test-mode order creation implemented in C17.
    """
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if not key_id or not key_secret:
        raise HTTPException(status_code=500, detail={"code": "ERR_PAYMENT_CONFIG_MISSING", "detail": "Payment gateway configuration missing."})
        
    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        
        # Razorpay takes amount in paise (1 INR = 100 paise)
        amount_paise = int(payload.amount_inr * 100)
        
        order_data = {
            "amount": amount_paise,
            "currency": payload.currency,
            "receipt": payload.receipt_id
        }
        
        order = client.order.create(data=order_data)
        
        if "id" not in order:
            raise HTTPException(status_code=502, detail={"code": "ERR_PROVIDER_MISSING_ORDER_ID", "detail": "Provider response missing order ID."})
            
        return CreateOrderResponse(
            order_id=order["id"],
            amount=order["amount"],
            currency=order["currency"]
        )
    except (razorpay.errors.BadRequestError, razorpay.errors.GatewayError, razorpay.errors.ServerError):
        raise HTTPException(status_code=502, detail={"code": "ERR_PAYMENT_PROVIDER_ERROR", "detail": "Payment provider error."})
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail={"code": "ERR_INTERNAL_PAYMENT_ERROR", "detail": "Internal payment error."})


@router.post("/verify-payment", response_model=VerifyPaymentResponse)
async def verify_payment(payload: VerifyPaymentRequest) -> VerifyPaymentResponse:
    """Verify a Razorpay payment signature server-side.

    C1 stub: does NOT perform real signature verification.
    Returns a deterministic stub response.
    Real server-side Razorpay signature verification implemented in C18.

    reservation_status is ALWAYS "simulated" in this prototype —
    a verified payment demonstrates the payment flow only; no seat or
    room is actually reserved unless a real supplier API is wired in.
    """
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if not key_id or not key_secret:
        raise HTTPException(status_code=500, detail={"code": "ERR_PAYMENT_CONFIG_MISSING", "detail": "Payment gateway configuration missing."})

    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        client.utility.verify_payment_signature({
            'razorpay_order_id': payload.razorpay_order_id,
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature
        })
        
        return VerifyPaymentResponse(
            payment_verified=True,
            reservation_status=ReservationStatus.simulated
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail={"code": "ERR_INVALID_SIGNATURE", "detail": "Invalid payment signature."})
    except Exception:
        raise HTTPException(status_code=500, detail={"code": "ERR_INTERNAL_VERIFICATION_ERROR", "detail": "Internal payment verification error."})
