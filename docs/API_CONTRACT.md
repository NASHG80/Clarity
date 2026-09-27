# API Contract (v2 — frozen; propose changes here before changing code)

General rule: any field representing an accessibility/sustainability
claim must include its `data_state` alongside the value. Any emissions
value must include its `method`. No exceptions.

Locale: the frontend manages all UI string translation locally
(i18next). The API itself communicates in English/error-codes only;
it does not translate response content. An optional `Accept-Language`
header may be passed for future use but is not required in v1.

---

## POST /api/nlu/extract  (NEW)
Request:
```json
{ "text": "I am planning to go from Mumbai to Goa for 3 nights with 2 children and 1 senior citizen. I need a wheelchair, accessible transport and accessible accommodation." }
```
Response:
```json
{
  "extracted": {
    "origin": "Mumbai",
    "destination": "Goa",
    "nights": 3,
    "children_count": 2,
    "senior_count": 1,
    "accessibility_flags": ["wheelchair", "accessible_transport", "accessible_accommodation"]
  },
  "missing_or_ambiguous": [
    { "field": "adult_count", "prompt": "How many adults are traveling?" }
  ]
}
```
Rule: `extracted` only contains fields explicitly stated in the text.
`accessibility_flags` are coarse/general flags only (e.g.
"accessible_accommodation") — the endpoint must NOT expand these into
specific checklist items (roll-in shower, elevator, etc.); that
remains the user's job in the Requirement Form. Anything not
explicitly stated goes into `missing_or_ambiguous`, never silently
defaulted.

## POST /api/search/transport
Request:
```json
{
  "origin": "Mumbai",
  "destination": "Goa",
  "budget_max": 12000,
  "time_max_hours": 6,
  "accessibility_required": ["step_free", "wheelchair_accessible_transport"],
  "weights": { "environmental": 0.4, "accessibility": 0.4, "affordability": 0.1, "convenience": 0.1 },
  "include_unverified": false
}
```
Response:
```json
{
  "results": [
    {
      "id": "route_001",
      "mode": "train+shuttle",
      "cost_inr": 1800,
      "duration_minutes": 320,
      "emissions": {
        "co2e_kg": 13.8,
        "method": "estimated",
        "distance_km": 460,
        "emission_factor": 0.03
      },
      "accessibility": { "value": "high", "data_state": "demo_synthetic" },
      "source": "seeded",
      "personal_match_pct": 91,
      "trade_off_summary": [
        "Meets your accessibility requirement",
        "Within your budget",
        "79% lower estimated CO2e than the flight"
      ],
      "segments": [
        { "type": "walk", "distance_m": 450, "accessible": true },
        { "type": "train", "duration_minutes": 300, "data_state": "reported" },
        { "type": "shuttle", "duration_minutes": 20, "data_state": "demo_synthetic" }
      ]
    },
    {
      "id": "route_002",
      "mode": "flight+taxi",
      "cost_inr": 7500,
      "duration_minutes": 130,
      "emissions": {
        "co2e_kg": 87,
        "method": "route_benchmark",
        "benchmark_kg": 100,
        "reduction_pct": 13
      }
    }
  ]
}
```
Note: an option's `emissions.method` is either `"estimated"` (formula-
based, always includes `distance_km` + `emission_factor`) or
`"route_benchmark"` (includes `benchmark_kg` + `reduction_pct`).
Never combine both in one object.

Persistence Side Effect (C16): This endpoint asynchronously persists valid search requests containing a non-empty `accessibility_required` list to the `search_requests` collection for demand analytics. The request/response shapes remain unchanged.

## POST /api/search/accommodation
Request (Transport Search shape + `destination_city`):
```json
{
  "origin": "Mumbai",
  "destination": "Goa",
  "destination_city": "Goa",
  "budget_max": 12000,
  "time_max_hours": 6,
  "accessibility_required": ["step_free", "wheelchair_accessible_room"],
  "weights": { "environmental": 0.4, "accessibility": 0.4, "affordability": 0.1, "convenience": 0.1 },
  "include_unverified": false,
  "arrival_date": "2026-10-12",
  "departure_date": "2026-10-16",
  "sustainability_preferred": ["solar_power", "waste_program"]
}
```
`arrival_date` and `departure_date` are optional ISO 8601 date strings (YYYY-MM-DD).
When supplied, they are passed to the live hotel search (SerpAPI) instead of the default +7/+9 day fallback.
`departure_date` must be strictly after `arrival_date`; the backend returns 422 if violated.
`sustainability_preferred` is an optional list of sustainability label strings.
It acts as a **ranking preference only**, never a hard filter.
Hotels with matching verified/reported sustainability items receive a small score boost
on the `environmental` axis. `not_verified` items are never boosted.
Zero results will never be caused solely by a sustainability preference.
Response:
```json
{
  "results": [
    {
      "id": "hotel_001",
      "translations": {
        "en": { "name": "Andaz Delhi Aerocity", "description": "..." },
        "hi": { "name": "...", "description": "..." },
        "mr": { "name": "...", "description": "..." }
      },
      "city": "Delhi",
      "price_inr_per_night": 14000,
      "star_rating": 5,
      "photos": ["url1", "url2"],
      "data_state": "reported",
      "accessibility_items": [
        { "label": "step_free_entrance", "data_state": "reported", "value": true },
        { "label": "roll_in_shower", "data_state": "not_verified", "value": null }
      ],
      "sustainability_items": [
        { "label": "solar_power", "data_state": "not_verified", "value": null }
      ]
    }
  ]
}
```
Note: `data_state` must be maintained strictly per item per the integrity rules. Do not create a merged score. `demo_synthetic` can appear at the root level (`data_state`) or item level. The frontend must safely fall back to `en` if a `translations` key is missing. No emissions fields are supported for accommodations.

Persistence Side Effect (C16): This endpoint asynchronously persists valid search requests containing a non-empty `accessibility_required` list to the `search_requests` collection for demand analytics. The request/response shapes remain unchanged.

## GET /api/listings/{id}
Response schema:
```json
{
  "id": "hotel_014",
  "translations": {
    "en": {
      "name": "Accessible Serene Retreat",
      "description": "A fully accessible property..."
    },
    "hi": { "name": "...", "description": "..." },
    "mr": { "name": "...", "description": "..." }
  },
  "city": "Goa",
  "price_inr_per_night": 4500,
  "star_rating": 4,
  "photos": ["https://..."],
  "data_state": "reported",
  "accessibility_items": [
    { "label": "step_free_entrance", "data_state": "reported", "value": true },
    { "label": "roll_in_shower", "data_state": "community_confirmed", "value": true }
  ],
  "sustainability_items": [
    { "label": "solar_power", "data_state": "not_verified", "value": null }
  ],
  "confirmations": [
    { "item_label": "roll_in_shower", "confirmed_by_count": 4, "disputed_count": 0 }
  ]
}
```
Note: Missing translation languages must safely fall back to `en`. Missing fields default to null. No merged score is permitted. `demo_synthetic` may appear at the root `data_state` or on individual items. The `confirmations` array provides traveler verification data in lieu of text reviews.

## POST /api/listings  (admin/manual listing tool)
Requires an explicit `data_state` on submission (`reported` or
`demo_synthetic` only — never `verified` from this endpoint).

## GET /api/explore/{city}
Response schema:
```json
{
  "results": [
    {
      "id": "exp_001",
      "translations": {
        "en": { "name": "Accessible beach walk — Miramar", "description": "A fully step-free coastal experience." },
        "hi": { "name": "...", "description": "..." },
        "mr": { "name": "...", "description": "..." }
      },
      "accessibility": { "value": "step_free_path", "data_state": "community_confirmed" },
      "environmental_impact": { "value": "low", "data_state": "reported" },
      "cost_inr": 0,
      "duration_minutes": 60,
      "distance_km": 2.1,
      "data_state": "demo_synthetic"
    }
  ]
}
```
Note: Returns `{ "results": [...] }`. Missing `translations` languages must visibly fall back to `en`. `data_state` is preserved at both the root level and on individual `accessibility`/`environmental_impact` items. Missing or `not_verified` items must retain a `null` value and never be scored or inferred. `photos` are deliberately excluded from this contract.

## POST /api/business/onboard
Self-assessment submission. All items stored with
`data_state = "reported"`. Rejects any attempt to submit `"verified"`.

## POST /api/ai/inspect-property-image  (NEW)
Request: multipart image + `queries` (e.g. ["wheelchair ramp",
"handrail", "grab bar", "solar panel"]). Backend forwards to the
ai-vision-service.
Response:
```json
{
  "detections": [
    { "label": "wheelchair ramp", "bbox": [x, y, w, h], "confidence": 0.82 },
    { "label": "handrail", "bbox": [x, y, w, h], "confidence": 0.77 }
  ]
}
```
`confidence` is for internal/engineering display only (e.g. a debug
view) — it must never be shown to travelers as an accessibility score,
and detections do not change any `data_state` until the business
explicitly confirms them via:

## POST /api/ai/confirm-detections  (NEW)
Request: list of `{ label, confirmed: true|false, image_id }`.
On `confirmed: true`, the matching checklist item's `data_state`
becomes `"reported"`. Rejected items are discarded (not stored as a
negative claim unless the business explicitly marks the feature absent).

## POST /api/analytics/events  (NEW)
```json
{
  "business_id": "biz_001",
  "listing_id": "hotel_014",
  "event_type": "detail_open",
  "session_id": "anon-session-abc",
  "timestamp": "2026-09-26T10:00:00Z"
}
```
`event_type` one of: `listing_impression`, `listing_open`,
`detail_open`, `accessibility_view`, `sustainability_view`, `map_open`,
`save`, `booking_start`, `booking_complete`.

## GET /api/business/{id}/analytics  (NEW)
```json
{
  "period": "this_week",
  "is_demo_data": true,
  "funnel": {
    "listing_impressions": 1284, "listing_opens": 906,
    "detail_opens": 542, "saves": 87,
    "booking_starts": 64, "bookings": 31
  },
  "signals": [
    { "type": "drop_off_correlation", "text": "Users who viewed accessibility information showed a higher drop-off." }
  ]
}
```
Causality rule: `signals` may only state correlations, never causes.

## GET /api/business/{id}/demand  (NEW)
```json
{
  "period": "this_week",
  "is_demo_data": true,
  "requirement_search_counts": [
    { "label": "step_free_entrance", "count": 382 },
    { "label": "roll_in_shower", "count": 214 }
  ],
  "gaps": [
    { "label": "roll_in_shower", "count": 214, "property_data_state": "not_verified" }
  ]
}
```
`gaps` feeds directly into the Opportunity Detector as a new
opportunity type ("214 travelers searched for X, you have no
reportable info").

## GET /api/business/{id}/opportunities
```json
{
  "opportunities": [
    { "severity": "red", "title": "Food Waste", "estimate": "18 kg/day",
      "suggested_action": "Reduce buffet production by ~10%", "is_demo_data": true },
    { "severity": "red", "title": "Demand gap: roll-in shower",
      "suggested_action": "Confirm or add this feature — 214 recent searches",
      "is_demo_data": true }
  ]
}
```

## POST /api/booking/create-order  (NEW)
Request:
```json
{
  "amount_inr": 12300,
  "currency": "INR",
  "receipt_id": "8432a559-00f7-4148-be8e-1f7d5c5890ad"
}
```
* `receipt_id`: A standard UUID v4 string generated by the frontend using `crypto.randomUUID()` (or equivalent). This is a **transient identifier** for the Razorpay order request only. The backend treats it as an opaque string and passes it directly to Razorpay. It does **not** persist in the database, does **not** represent a confirmed reservation or inventory allocation, and is not trusted as evidence of payment.
* `amount_inr`: Must exactly equal the computed `tripTotal` from the frontend A17 summary. No hidden taxes, fees, discounts, or inventory charges may be added by the frontend.

Response: Razorpay test-mode order object (`order_id`, `amount`, `currency`).

## POST /api/booking/verify-payment  (NEW)
Request: Razorpay payment signature fields.
Response: `{ payment_verified: true, reservation_status: "simulated" }`
`reservation_status` is `"simulated"` unless a real supplier API is
wired in, in which case it can be `"confirmed"` — the frontend must
render these two states with different copy.

## POST /api/confirmations
Community verification submission — moves an item toward
`community_confirmed` once a confirmation threshold (config value,
e.g. 3) is met, computed by the recommendation engine, not hardcoded
in the frontend.

## GET /api/business/{id}/verification-inbox (NEW for B19)
```json
{
  "pending_submissions": [
    {
      "id": "sub_001",
      "item_label": "roll_in_shower",
      "submission_type": "confirmation",
      "created_at": "2026-09-26T10:00:00Z",
      "property_data_state": "not_verified"
    }
  ]
}
```

## POST /api/business/{id}/verification-inbox/{submission_id}/respond (NEW for B19)
Request: `{ "action": "accept" }` or `{ "action": "dispute" }`
Response: `{ "success": true, "status": "accepted" }`
Business responds to an individual traveler submission. Updates the submission status to `accepted` or `disputed`. Backend domain logic is responsible for updating the `confirmations` aggregate collection and potentially moving `data_state` toward `community_confirmed` when the threshold is reached.

---

## POST /api/auth/signup (NEW)
Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "customer",
  "location": "28.6139, 77.2090"
}
```
Note: `location` is optional and typically only provided for `role: "customer"`. Valid roles are `"customer"` or `"business"`.

Response:
```json
{
  "user_id": "usr_abc123",
  "role": "customer",
  "token": "mock_jwt_token",
  "is_first_time": true
}
```

## POST /api/auth/login (NEW)
Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```
Response:
```json
{
  "user_id": "usr_abc123",
  "role": "customer",
  "token": "mock_jwt_token",
  "is_first_time": false
}
```

---

## POST /api/trips/create  (NEW — Customer Dashboard)
Creates a new trip planning session for an authenticated customer.
Ownership: the backend verifies `user_id` exists in the `users` collection.
```json
{
  "user_id": "usr_abc123",
  "destination": "Goa",
  "adults": 2,
  "children": 1,
  "rooms": 1,
  "arrival_date": "2026-10-12",
  "departure_date": "2026-10-16"
}
```
Response:
```json
{ "trip_id": "trip_abc12345", "phase": "BASICS_SAVED", "created_at": "2026-09-27T00:00:00Z" }
```
Errors: 401 if user_id unknown; 422 if adults < 1, rooms < 1, or arrival_date >= departure_date.

## GET /api/trips/active  (NEW — Customer Dashboard)
Returns the customer's most recently updated trip, or null if none exists.
Query param: `user_id` (required).
Response:
```json
{ "trip": { "trip_id": "trip_abc12345", "destination": "Goa", "adults": 2, "phase": "RESULTS", ... } }
```
Or: `{ "trip": null }` when no trip exists for this user.

## PATCH /api/trips/{trip_id}/state  (NEW — Customer Dashboard)
Partial update of mutable trip planning fields. Only supplied fields are updated.
`user_id` is required for ownership enforcement (403 if trip belongs to another user).
```json
{
  "user_id": "usr_abc123",
  "accessibility_required": ["wheelchair_accessible_room", "step_free_entrance"],
  "sustainability_preferred": ["solar_power"],
  "budget_max": 8000,
  "weights": { "environmental": 0.3, "accessibility": 0.4, "affordability": 0.2, "convenience": 0.1 },
  "phase": "RESULTS",
  "last_search_result_count": 8
}
```
Response: `{ "trip_id": "trip_abc12345", "last_updated": "2026-09-27T00:15:00Z" }`

## POST /api/trips/{trip_id}/interactions  (NEW — Customer Dashboard)
Records one immutable customer planning-memory event.
`client_event_id` in payload enables idempotent retry — safe to call multiple times with the same ID.
This is DISTINCT from `POST /api/analytics/events` (B2B business funnel data — different collection, different schema, different event taxonomy).
```json
{
  "user_id": "usr_abc123",
  "session_id": "sess_uvw01234",
  "event_type": "search_performed",
  "payload": {
    "client_event_id": "ce_01929abc",
    "accessibility_required": ["wheelchair_accessible_room"],
    "sustainability_preferred": ["solar_power"],
    "budget_max": 8000,
    "result_count": 8
  }
}
```
Response: `{ "interaction_id": "int_def45678", "status": "recorded" }`
Ownership: 403 if trip belongs to another user.

## GET /api/trips/{trip_id}/interactions  (NEW — Customer Dashboard)
Returns all planning-memory events for a trip in timestamp-ascending order.
Used by the frontend to reconstruct the Memory Rail on page load/refresh.
Query param: `user_id` (required for ownership enforcement).
Response:
```json
{
  "interactions": [
    { "interaction_id": "int_abc001", "event_type": "trip_basics_submitted", "timestamp": "2026-09-27T00:00:00Z", "payload": { "destination": "Goa", "adults": 2 } },
    { "interaction_id": "int_abc002", "event_type": "search_performed", "timestamp": "2026-09-27T00:10:00Z", "payload": { "result_count": 8 } }
  ]
}
```
Ownership: 403 if trip belongs to another user.

### TravelerEventType enum (customer planning memory — NOT analytics_events)
```
trip_basics_submitted
destination_changed
dates_changed
traveler_count_changed
accessibility_filter_selected
accessibility_filter_removed
sustainability_filter_selected
sustainability_filter_removed
budget_changed
weight_changed
persona_preset_applied
search_performed
result_viewed
result_opened
result_saved
filter_changed_after_results
search_refreshed
```
