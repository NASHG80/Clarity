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
{ "text": "I am planning to go from Mumbai to Goa with 2 children and 1 senior citizen. I need a wheelchair, accessible transport and accessible accommodation." }
```
Response:
```json
{
  "extracted": {
    "origin": "Mumbai",
    "destination": "Goa",
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

## POST /api/search/accommodation
Same shape as transport search, plus `destination_city`. Response:
array of hotel cards with `accessibility_items` / `sustainability_items`
as arrays of `{ label, data_state, value }` — never a merged score.

## GET /api/listings/{id}
Full detail: overview, full accessibility/sustainability checklist
(each item with `data_state`), reviews/confirmations count, and
`translations: { en: {...}, hi: {...}, mr: {...} }` for name/description
where available (missing language falls back to `en`).

## POST /api/listings  (admin/manual listing tool)
Requires an explicit `data_state` on submission (`reported` or
`demo_synthetic` only — never `verified` from this endpoint).

## GET /api/explore/{city}
Experience cards: `{ accessibility, environmental_impact, cost_inr,
duration_minutes, distance_km, data_state, translations }`.

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
Request: `{ amount_inr, currency: "INR", receipt_id }`.
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
