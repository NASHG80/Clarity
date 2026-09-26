# Implementation Plan (v2)

## 1. Product summary

Personalized Travel Decision Engine. Traveler starts with a natural-
language trip description, an LLM extracts structured fields into the
existing full requirement form (which the traveler reviews/edits —
the LLM never decides anything), then a rule-based engine hard-
filters and ranks transport/accommodation/experiences as trade-off
cards. Businesses self-report data, can use AI photo analysis
(YOLO-World-S) as a confirmation aid (never automatic evidence), and
get a Pro analytics dashboard connecting traveler demand to concrete
improvement opportunities. Payment uses Razorpay Test Mode; booking
confirmation is real payment + simulated reservation unless a real
supplier API is wired in. Entire app in English/Hindi/Marathi, with a
real desktop and a real mobile layout per page.

## 2. Architecture

```
        ┌──────────────────────────────────────┐
        │     Frontend (React + Vite)            │
        │  B2C app | B2B console | i18n layer     │
        │  desktop layout variants | mobile layout variants │
        └───────────────────┬────────────────────┘
                             │ REST (see API_CONTRACT.md)
        ┌───────────────────▼────────────────────┐
        │        Backend (FastAPI)                 │
        │  routes, validation, Razorpay endpoints   │
        └───┬───────────────┬────────────────┬─────┘
            │               │                │
  ┌─────────▼─────┐ ┌───────▼───────┐ ┌──────▼─────────┐
  │ Recommendation │ │  LLM/NLU        │ │ ai-vision-service│
  │ Engine (Py)     │ │  extraction     │ │ YOLO-World-S     │
  │ filters/scoring/│ │  (B2C intake)    │ │ (separate process,│
  │ ranking/carbon  │ │                 │ │  GPU-isolated)    │
  └─────────┬─────┘ └───────┬───────┘ └──────┬─────────┘
            │               │                │
            └───────────────┼────────────────┘
                             │
                      ┌──────▼───────┐
                      │   MongoDB      │
                      │ hotels, routes,│
                      │ experiences,   │
                      │ businesses,    │
                      │ confirmations, │
                      │ ai_inspections,│
                      │ analytics_events│
                      └───────────────┘
```

## 3. New flows added in this version

### 3.1 B2C natural-language intake
```
Landing
  -> Natural-language trip prompt (single text box, standard
     "search-like" placement, not a chat window)
  -> POST /api/nlu/extract
  -> LLM returns candidate structured fields + a list of
     "unclear/missing" items
  -> If anything is missing/ambiguous (e.g. adult count not stated),
     UI asks one short clarifying question before opening the form
  -> Full existing Requirement Form opens, PRE-FILLED with extracted
     fields, everything still editable
  -> User reviews/edits/confirms
  -> Recommendation Engine runs as before
```
Rule: the LLM only extracts what was explicitly said. "Accessible
hotel" must not auto-expand into "roll-in shower + elevator + ramp" —
only "accessible" is captured as a general flag, and the form shows
the individual chips unchecked for the user to specify further.

### 3.2 B2B AI photo detection
```
Business uploads photos (Entrance / Bathroom / Room / Parking buckets)
  -> POST /api/ai/inspect-property-image
  -> ai-vision-service (YOLO-World-S) returns detected objects +
     bounding boxes + internal confidence (not shown to travelers)
  -> Business reviews an "AI Analysis" screen: detected items shown
     with a confirm/reject toggle per item
  -> On confirm: item's data_state becomes "reported" (never
     auto-verified, regardless of model confidence)
  -> Same flow reused for sustainability objects (solar panel, EV
     charger, recycling bin, water refill station, rainwater tank)
```

### 3.3 B2B Pro analytics
```
Traveler interactions logged as discrete events (never "closed
listing" — use measurable events):
  listing_impression, listing_open, detail_open, accessibility_view,
  sustainability_view, map_open, save, booking_start, booking_complete

Weekly dashboard shows:
  - Views / unique visitors / detail opens / saves / booking starts /
    bookings, and the conversions between each stage (funnel)
  - Traveler demand: aggregated counts of what accessibility/
    sustainability features travelers searched for this week
  - Demand vs. property comparison: "214 travelers searched for
    roll-in shower, your property has no reportable info for this"
  - This demand+gap signal feeds directly into the existing
    Opportunity Detector as a new opportunity type

Causality rule: drop-off correlation may be shown ("users who viewed
accessibility info showed higher drop-off") but never stated as a
guaranteed cause ("users didn't book because..."). All demo-period
numbers require is_demo_data: true.
```

### 3.4 Emissions — model estimate + benchmark comparison
```
Model-based (always available):
  CO2e_kg = distance_km x emission_factor(mode)
  factors: flight domestic 0.15, car solo 0.17, bus 0.05, train 0.03

Benchmark comparison (only where a defensible benchmark exists,
e.g. a route-level typical value):
  reduction_pct = (typical_kg - this_option_kg) / typical_kg
  shown as: "🟢 13% lower than typical" with the benchmark value
  shown alongside on tap, same as Google Flights' pattern

Every emissions value exposes a "method" field:
  "estimated" (formula-based) or "route_benchmark" (comparison-based)
These are never merged into one label — the UI shows which one it is.
```

### 3.5 Payment — Razorpay Test Mode
```
Trip summary -> POST /api/booking/create-order (Razorpay test order)
  -> Razorpay Test Mode checkout -> POST /api/booking/verify-payment
  -> On verified payment: booking confirmation screen

The confirmation screen must clearly state whether the reservation
is real (only possible if a booking-capable supplier API is actually
integrated) or simulated (payment demonstrated, inventory not
actually reserved). Do not blur this distinction in the copy.
```

### 3.6 i18n (English / Hindi / Marathi)
```
All static UI strings -> i18next resource files, one JSON per
language, namespaced per screen (e.g. b2c.search.json, b2b.dashboard.json)
Language switcher in the navbar (shared component), persisted in
localStorage, applied on load
Devanagari font (Noto Sans Devanagari or similar) loaded for Hindi/
Marathi so text doesn't fall back to a broken glyph font
Dynamic seed content (property/experience names & descriptions)
carries _en/_hi/_mr fields; missing translation falls back to
English with a small "shown in English" note, never silently mixed
```

### 3.7 Responsive — two real layouts per page
```
Every page has an explicit desktop component tree and an explicit
mobile component tree (not the same tree with different CSS sizes):
  - Filters: desktop = left sidebar, mobile = bottom sheet triggered
    by a "Filters" button
  - Navigation: desktop = top navbar, mobile = bottom tab bar +
    hamburger for secondary items
  - Trade-off cards: desktop = 3-column grid, mobile = single-column
    stacked cards with the same data, reordered for thumb scrolling
  - B2B dashboard: desktop = multi-column KPI tiles + side-by-side
    funnel, mobile = stacked single-column cards, funnel becomes a
    vertical list instead of a horizontal funnel chart
```

## 4. Build phases (order matters)

### Phase 0 — Contracts first (Day 1, all 4 together)
Freeze `docs/API_CONTRACT.md` and `docs/DATA_MODEL.md`, INCLUDING the
new NLU, AI-vision, analytics, and payment endpoints/schemas. This is
more important than before since there are now 3 backend-adjacent
services (FastAPI, recommendation engine, ai-vision-service) that
must agree on shapes before anyone builds.

### Phase 1 — Parallel build (Days 2-5, extended vs. v1 given new scope)
Each teammate builds against the frozen contract using mocks/stubs:
- Frontend: all B2C + B2B screens, i18n wired from day one (do not
  bolt on translations at the end), both layout variants per screen.
- Backend: FastAPI routes + LLM extraction endpoint + Razorpay
  test-mode integration, calling recommendation engine as a Python
  import.
- Recommendation engine: filters/scoring/ranking + both emissions
  calculation types, unit-tested against seed data.
- Database: schema finalization including ai_inspections and
  analytics_events, seed data with i18n fields, ai-vision-service
  environment setup and model serving.

### Phase 2 — Integration (Day 6)
Swap all frontend mocks for real endpoints; wire FastAPI to the real
recommendation engine and the ai-vision-service; run both full flows
end-to-end (B2C natural-language -> booking, and B2B onboarding ->
photo analysis -> analytics -> opportunity detector) in all three
languages and both layouts.

### Phase 3 — Polish + demo prep (Day 7)
- Confirm every `not_verified` / `demo_synthetic` badge renders
  correctly in all 3 languages.
- Confirm mobile layouts were actually designed, not just shrunk.
- Rehearse both demo scripts (B2C and B2B) at least twice, in Hindi
  once to prove i18n isn't cosmetic-only.

## 5. What NOT to build

- Blockchain/Hyperledger anything (explicitly removed).
- A real booking-capable travel supplier integration (out of scope
  unless time allows — Razorpay demonstrates payment only).
- Real-time transit API integration (seeded/static route data is fine).
- An ML re-ranker beyond the rule-based engine (stretch-only).
- Converting AI photo-detection confidence into a shown accessibility
  percentage, under any circumstance.
