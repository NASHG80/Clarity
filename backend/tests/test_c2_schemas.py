"""C2 tests — schema validation + route smoke tests.

Tests:
  1.  Valid TransportSearchRequest passes.
  2.  Unknown field in TransportSearchRequest is rejected (extra="forbid").
  3.  Valid AnalyticsEventRequest passes.
  4.  Invalid event_type is rejected by Pydantic EventType enum.
  5.  Invalid data_state is rejected by DataState enum.
  6.  Invalid emissions method is rejected by EmissionsMethod enum.
  7.  Existing C1 stub responses pass their response models.
  8.  FastAPI app starts and OpenAPI generation succeeds.
  9.  POST /api/listings rejects data_state="verified".
  10. Correct data_state="reported" is accepted by POST /api/listings.

Run with:
    pytest tests/test_c2_schemas.py -v
"""

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.models.schemas import (
    AccommodationSearchRequest,
    AnalyticsEventRequest,
    ChecklistItem,
    ConfirmDetectionsRequest,
    ConfirmationRequest,
    CreateOrderRequest,
    DataState,
    DetectionConfirmItem,
    EmissionsEstimated,
    EmissionsMethod,
    EmissionsRouteBenchmark,
    EventType,
    NLURequest,
    OnboardRequest,
    ReservationStatus,
    SearchWeights,
    TransportSearchRequest,
    VerifyPaymentRequest,
)

client = TestClient(app)


# ---------------------------------------------------------------------------
# 1. Valid TransportSearchRequest passes
# ---------------------------------------------------------------------------
def test_transport_request_valid():
    req = TransportSearchRequest(
        origin="Mumbai",
        destination="Goa",
        budget_max=12000,
        time_max_hours=6,
        accessibility_required=["step_free", "wheelchair_accessible_transport"],
        weights=SearchWeights(
            environmental=0.4,
            accessibility=0.4,
            affordability=0.1,
            convenience=0.1,
        ),
        include_unverified=False,
    )
    assert req.origin == "Mumbai"
    assert req.destination == "Goa"


# ---------------------------------------------------------------------------
# 2. Unknown field in TransportSearchRequest is rejected
# ---------------------------------------------------------------------------
def test_transport_request_rejects_extra_field():
    with pytest.raises(ValidationError) as exc_info:
        TransportSearchRequest(
            origin="Mumbai",
            destination="Goa",
            unexpected_field="should fail",
        )
    errors = exc_info.value.errors()
    assert any(e["type"] == "extra_forbidden" for e in errors)


# ---------------------------------------------------------------------------
# 3. Valid AnalyticsEventRequest passes
# ---------------------------------------------------------------------------
def test_analytics_event_valid():
    req = AnalyticsEventRequest(
        business_id="biz_001",
        listing_id="hotel_014",
        event_type=EventType.detail_open,
        session_id="anon-session-abc",
        timestamp="2026-09-26T10:00:00Z",
    )
    assert req.event_type == EventType.detail_open


# ---------------------------------------------------------------------------
# 4. Invalid event_type is rejected
# ---------------------------------------------------------------------------
def test_analytics_event_invalid_type():
    with pytest.raises(ValidationError) as exc_info:
        AnalyticsEventRequest(
            business_id="biz_001",
            listing_id="hotel_014",
            event_type="not_a_real_event",
            session_id="anon-session-abc",
        )
    errors = exc_info.value.errors()
    assert len(errors) > 0


# ---------------------------------------------------------------------------
# 5. Invalid data_state is rejected
# ---------------------------------------------------------------------------
def test_checklist_item_invalid_data_state():
    with pytest.raises(ValidationError):
        ChecklistItem(
            label="step_free_entrance",
            value=True,
            data_state="totally_made_up",
        )


# ---------------------------------------------------------------------------
# 6. Invalid emissions method is rejected
# ---------------------------------------------------------------------------
def test_emissions_invalid_method():
    with pytest.raises(ValidationError):
        EmissionsEstimated(
            method="not_a_method",  # type: ignore[arg-type]
            co2e_kg=13.8,
            distance_km=460,
            emission_factor=0.03,
        )


# ---------------------------------------------------------------------------
# 7a. C1 stub transport response passes its model
# ---------------------------------------------------------------------------
def test_transport_stub_response_passes_model():
    from unittest.mock import patch
    
    dummy_data = [
        {
            "_id": "t1", "origin": "Mumbai", "destination": "Goa", "mode": "train",
            "operator": "IR", "distance_km": 500, "cost_inr": 1000, "duration_minutes": 600,
            "departure_time": "2026-09-30T10:00:00Z", "arrival_time": "2026-09-30T20:00:00Z",
            "emissions": {"method": "estimated", "co2e_kg": 15.0, "distance_km": 500, "emission_factor": 0.03},
            "accessibility": {"value": "high", "data_state": "reported"},
            "segments": []
        },
        {
            "_id": "t2", "origin": "Mumbai", "destination": "Goa", "mode": "flight",
            "operator": "Air", "distance_km": 500, "cost_inr": 5000, "duration_minutes": 60,
            "departure_time": "2026-09-30T12:00:00Z", "arrival_time": "2026-09-30T13:00:00Z",
            "emissions": {"method": "estimated", "co2e_kg": 50.0, "distance_km": 500, "emission_factor": 0.1},
            "accessibility": {"value": "low", "data_state": "reported"},
            "segments": []
        }
    ]
    
    with patch("app.routes.search.get_db") as mock_get_db:
        mock_db = mock_get_db.return_value
        mock_db.transport_routes.find.return_value = dummy_data
        
        # Also mock the live APIs so they don't block or return empty
        with patch("app.routes.search.fetch_serpapi_flights", return_value=[]), \
             patch("app.routes.search.fetch_railradar_trains", return_value=[]):
            
            resp = client.post(
                "/api/search/transport",
                json={"origin": "Mumbai", "destination": "Goa"},
            )
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert len(data["results"]) == 2
    for result in data["results"]:
        assert "id" in result
        assert "emissions" in result
        assert "method" in result["emissions"]





# ---------------------------------------------------------------------------
# 7c. C1 stub NLU response passes its model
# ---------------------------------------------------------------------------
def test_nlu_stub_response_passes_model():
    resp = client.post("/api/nlu/extract", json={"text": "Mumbai to Goa with 2 kids"})
    assert resp.status_code == 200
    data = resp.json()
    assert "extracted" in data
    assert "missing_or_ambiguous" in data


# ---------------------------------------------------------------------------
# 7d. C1 stub payment response has simulated reservation_status
# ---------------------------------------------------------------------------
def test_payment_stub_reservation_simulated():
    from unittest.mock import patch, MagicMock
    import os
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
        assert data["reservation_status"] == "simulated"
        assert data["payment_verified"] is True


# ---------------------------------------------------------------------------
# 8. OpenAPI schema generates without error
# ---------------------------------------------------------------------------
def test_openapi_generates():
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    schema = resp.json()
    assert "paths" in schema
    # Verify all 16 routes are in the OpenAPI schema
    paths = set(schema["paths"].keys())
    expected = {
        "/api/nlu/extract",
        "/api/search/transport",
        "/api/search/accommodation",
        "/api/listings/{listing_id}",
        "/api/listings",
        "/api/explore/{city}",
        "/api/business/onboard",
        "/api/business/{business_id}/analytics",
        "/api/business/{business_id}/demand",
        "/api/business/{business_id}/opportunities",
        "/api/ai/inspect-property-image",
        "/api/ai/confirm-detections",
        "/api/analytics/events",
        "/api/booking/create-order",
        "/api/booking/verify-payment",
        "/api/confirmations",
    }
    assert expected.issubset(paths), f"Missing paths: {expected - paths}"


# ---------------------------------------------------------------------------
# 9. POST /api/listings rejects data_state="verified"
# ---------------------------------------------------------------------------
def test_listing_create_rejects_verified_state():
    resp = client.post(
        "/api/listings",
        json={"data_state": "verified", "name": "Test Hotel"},
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 10. POST /api/listings accepts data_state="reported"
# ---------------------------------------------------------------------------
def test_listing_create_accepts_reported():
    resp = client.post(
        "/api/listings",
        json={"data_state": "reported", "name": "Test Hotel"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["data_state"] == "reported"


# ---------------------------------------------------------------------------
# 11. POST /api/analytics/events with invalid event_type returns 422
# ---------------------------------------------------------------------------
def test_analytics_event_route_rejects_invalid_type():
    resp = client.post(
        "/api/analytics/events",
        json={
            "business_id": "biz_001",
            "listing_id": "hotel_014",
            "event_type": "fake_event",
            "session_id": "abc",
        },
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 12. SearchWeights rejects unknown weight keys
# ---------------------------------------------------------------------------
def test_search_weights_rejects_extra():
    with pytest.raises(ValidationError):
        SearchWeights(environmental=0.5, unknown_axis=0.5)


# ---------------------------------------------------------------------------
# 13. EmissionsEstimated and EmissionsRouteBenchmark are distinct
# ---------------------------------------------------------------------------
def test_emissions_both_shapes_valid():
    est = EmissionsEstimated(co2e_kg=13.8, distance_km=460, emission_factor=0.03)
    assert est.method == EmissionsMethod.estimated

    bench = EmissionsRouteBenchmark(co2e_kg=87, benchmark_kg=100, reduction_pct=13)
    assert bench.method == EmissionsMethod.route_benchmark
