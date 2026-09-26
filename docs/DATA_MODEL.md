# Data Model (MongoDB) — v2

## The 5-state data enum (unchanged, still the core integrity rule)
```
data_state: one of
  "verified"              official certification / third-party audit
  "reported"               business self-reported OR AI-detected +
                            business-confirmed via onboarding/photo flow
  "community_confirmed"    travelers confirmed (n >= threshold)
  "not_verified"           no reliable info — NEVER a score/estimate
  "demo_synthetic"         hypothetical, for prototype demo only
```
Hard rule unchanged: `not_verified` fields carry a null/omitted value,
never a guessed one. AI detection confidence is NOT this enum and
never substitutes for it — see `ai_inspections` below.

## Collection: hotels  (extended with translations)
```json
{
  "_id": "hotel_001",
  "city": "Delhi",
  "price_inr_per_night": 14000,
  "star_rating": 5,
  "data_state": "reported",
  "translations": {
    "en": { "name": "Andaz Delhi Aerocity", "description": "..." },
    "hi": { "name": "...", "description": "..." },
    "mr": { "name": "...", "description": "..." }
  },
  "accessibility_items": [
    { "label": "step_free_entrance", "value": true, "data_state": "reported" },
    { "label": "roll_in_shower", "value": null, "data_state": "not_verified" }
  ],
  "sustainability_items": [
    { "label": "solar_power", "value": null, "data_state": "not_verified" }
  ],
  "photos": ["url1", "url2"],
  "confirmations": []
}
```
If a language's translation is missing, the API falls back to `en`
and the frontend shows a small "shown in English" note.

## Collection: transport_routes  (extended with emissions method)
```json
{
  "_id": "route_001",
  "origin": "Mumbai",
  "destination": "Goa",
  "mode": "train",
  "distance_km": 460,
  "cost_inr": 1800,
  "duration_minutes": 320,
  "emissions": {
    "method": "estimated",
    "emission_factor": 0.03,
    "benchmark_kg": null
  },
  "segments": [
    { "type": "walk", "distance_m": 450, "accessible": true, "data_state": "demo_synthetic" },
    { "type": "train", "duration_minutes": 300, "data_state": "reported" }
  ]
}
```
For modes with a defensible benchmark (e.g. flights), set
`method: "route_benchmark"` and populate `benchmark_kg` instead of
(or alongside, clearly labeled) the factor-based estimate.

## Collection: experiences
```json
{
  "_id": "exp_001",
  "city": "Goa",
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
```

## Collection: businesses  (extended with opportunities from demand gaps)
```json
{
  "_id": "biz_001",
  "hotel_id": "hotel_014",
  "onboarding_complete": true,
  "opportunities": [
    { "severity": "red", "title": "Food Waste", "estimate": "18 kg/day",
      "suggested_action": "Reduce buffet production by ~10%", "is_demo_data": true },
    { "severity": "red", "title": "Demand gap: roll-in shower",
      "suggested_action": "Confirm or add this feature", "is_demo_data": true }
  ]
}
```

## Collection: confirmations
```json
{ "_id": "conf_001", "hotel_id": "hotel_014", "item_label": "roll_in_shower",
  "confirmed_by_count": 4, "disputed_count": 0 }
```
Threshold (e.g. 3) lives in recommendation-engine config, not hardcoded
in the frontend or in this document — see `config.py` in
recommendation-engine.

## Collection: verification_submissions (NEW for B19)
```json
{
  "_id": "sub_001",
  "hotel_id": "hotel_014",
  "item_label": "roll_in_shower",
  "status": "pending", 
  "submission_type": "confirmation",
  "created_at": "2026-09-26T10:00:00Z"
}
```
`status` enum: `pending`, `accepted`, `disputed`. This feeds the B19 Verification Inbox. Accepting or disputing updates this status and flows into the `confirmations` aggregate collection according to domain logic.

## Collection: ai_inspections  (NEW)
```json
{
  "_id": "insp_001",
  "business_id": "biz_001",
  "image_id": "img_entrance_01",
  "detections": [
    { "label": "wheelchair ramp", "bbox": [10, 20, 120, 80], "confidence": 0.82, "review_status": "confirmed" },
    { "label": "handrail", "bbox": [50, 10, 40, 100], "confidence": 0.77, "review_status": "pending" }
  ],
  "model": "yolo-world-s",
  "created_at": "2026-09-26T10:00:00Z"
}
```
`review_status` moves from `pending` to `confirmed` or `rejected` only
via an explicit business action (`POST /api/ai/confirm-detections`).
Only `confirmed` detections cause a checklist item's `data_state` to
become `"reported"` — `confidence` never flows into any traveler-
facing field.

## Collection: analytics_events  (NEW)
```json
{
  "_id": "evt_001",
  "business_id": "biz_001",
  "listing_id": "hotel_014",
  "event_type": "detail_open",
  "session_id": "anon-session-abc",
  "timestamp": "2026-09-26T10:00:00Z"
}
```
`event_type` enum: `listing_impression`, `listing_open`, `detail_open`,
`accessibility_view`, `sustainability_view`, `map_open`, `save`,
`booking_start`, `booking_complete`.

Aggregation approach for the prototype: compute weekly funnel/demand
numbers on-demand via a MongoDB aggregation pipeline over
`analytics_events` (simplest for hackathon scope) rather than
maintaining separate pre-aggregated documents, unless query latency
becomes a real problem in testing — if so, fall back to a daily
materialized `analytics_daily_summary` collection.

## Collection: search_requests  (NEW for C16)
```json
{
  "_id": "req_001",
  "search_type": "accommodation",
  "accessibility_required": ["roll_in_shower", "step_free_entrance"],
  "timestamp": "2026-09-26T10:00:00Z"
}
```
`search_type` enum: `transport` or `accommodation`.
Only valid search requests containing a non-empty `accessibility_required` list are persisted. Labels are stored exactly as submitted, without expansion or inference. No user, session, destination mapping, or business tracking is recorded here. The `timestamp` field supports the C16 "recent" aggregation window (defined as a rolling 7-day UTC lookback matching C15).

## Seed dataset composition (`database/seed.py`)
- 5 real, researched anchor properties (mix of luxury + budget),
  `data_state: "reported"` or `"verified"` where justified, each with
  `en/hi/mr` translations for name + short description.
- 10-15 real budget properties with genuinely no public accessibility
  data, `data_state: "not_verified"` on all relevant fields.
- A small number of `demo_synthetic` entries, only added if the real
  dataset produces zero matches for the rehearsed demo query — always
  watermarked, never silently mixed in.
- Synthetic `analytics_events` generated for 2-3 demo business_ids,
  internally consistent (impressions >= opens >= detail_opens >=
  saves >= booking_starts >= bookings), all implicitly `is_demo_data`
  when surfaced via the analytics endpoints.
- Keep a `database/sources.md` listing where each real-anchor claim
  came from, so every claim in the demo is traceable.
