# Project Structure — Clarity

Two naming/location changes from earlier docs, made when turning the
plan into an actual scaffold — noting them here so nothing looks
inconsistent with IMPLEMENTATION_PLAN.md / TECH_STACK.md:

1. `recommendation-engine/` now lives INSIDE `backend/` as
   `backend/recommendation_engine/` — it was already documented as
   "same process as FastAPI, not a microservice," so it belongs under
   the same top-level folder it's imported into, rather than sitting
   as a sibling.
2. The GPU-isolated YOLO-World-S service is now `ai-services/vision-
   service/` (was `ai-vision-service/`) — pluralized and grouped so any
   future locally-hosted model (as opposed to an external LLM API call,
   which stays a plain route inside `backend/`) has an obvious home
   next to it.

## Full tree

```
clarity/
├── AGENTS.md                        <- read this first, every agent
├── README.md
│
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   ├── TECH_STACK.md
│   ├── API_CONTRACT.md
│   ├── DATA_MODEL.md
│   ├── TEAM_SPLIT.md
│   └── PROJECT_STRUCTURE.md         <- this file
│
├── frontend/                        Person A (B2C) + Person B (B2B/shared)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── b2c/
│       │   ├── pages/
│       │   │   ├── LandingPage.jsx
│       │   │   ├── TripPromptPage.jsx          (NL intake, A3)
│       │   │   ├── RequirementFormPage.jsx      (A5-A9)
│       │   │   ├── TransportResultsPage.jsx     (A10)
│       │   │   ├── AccommodationResultsPage.jsx (A14)
│       │   │   ├── JourneyViewPage.tsx          (A13)
│       │   │   ├── ListingDetailPage.jsx        (A15)
│       │   │   ├── ExplorePage.jsx              (A16)
│       │   │   ├── TripSummaryPage.jsx          (A17)
│       │   │   ├── PaymentPage.jsx              (A18)
│       │   │   └── BookingConfirmationPage.jsx  (A19)
│       │   └── components/
│       │       ├── TradeOffCard.jsx
│       │       ├── RequirementChips.jsx
│       │       ├── FilterSidebar.jsx            (desktop)
│       │       ├── FilterBottomSheet.jsx         (mobile)
│       │       ├── WeightSliders.jsx
│       │       └── EmissionsInfoPopover.jsx
│       │
│       ├── b2b/
│       │   ├── pages/
│       │   │   ├── OnboardingPage.jsx           (B4-B6)
│       │   │   ├── PhotoUploadPage.jsx           (B7-B8)
│       │   │   ├── AiAnalysisReviewPage.jsx      (B9-B10)
│       │   │   ├── ListingManagerPage.jsx        (B11)
│       │   │   ├── OpportunityDetectorPage.jsx   (B12-B13, B18)
│       │   │   ├── AnalyticsDashboardPage.jsx     (B14-B15)
│       │   │   ├── DemandComparisonPage.jsx       (B16-B17)
│       │   │   └── VerificationInboxPage.jsx      (B19, stretch)
│       │   └── components/
│       │       ├── KpiTile.jsx
│       │       ├── OpportunityCard.jsx
│       │       ├── FunnelChart.jsx
│       │       └── DemandTable.jsx
│       │
│       ├── shared/
│       │   └── components/
│       │       ├── Navbar.jsx                  (desktop nav)
│       │       ├── BottomNavBar.jsx              (mobile nav)
│       │       ├── LanguageSwitcher.jsx          (EN/HI/MR)
│       │       ├── Tabs.jsx
│       │       ├── DataStateBadge.jsx            (5-state badge)
│       │       └── Modal.jsx
│       │
│       ├── i18n/
│       │   ├── i18n-config.js
│       │   ├── en/{b2c.json, b2b.json}
│       │   ├── hi/{b2c.json, b2b.json}
│       │   └── mr/{b2c.json, b2b.json}
│       │
│       └── lib/
│           ├── api.js                          (all fetch calls)
│           └── razorpay.js
│
├── backend/                         Person C
│   ├── requirements.txt
│   ├── .env.example
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── search.py            transport + accommodation search
│   │   │   ├── listings.py           admin/manual listing CRUD
│   │   │   ├── business.py            onboarding + opportunities + analytics + demand
│   │   │   ├── nlu.py                 POST /api/nlu/extract (LLM call)
│   │   │   ├── analytics.py           event ingestion
│   │   │   └── payments.py            Razorpay create-order / verify-payment
│   │   ├── models/
│   │   │   └── schemas.py            Pydantic request/response models
│   │   └── db/
│   │       └── mongo.py
│   │
│   └── recommendation_engine/       imported directly by app/, same process
│       ├── filters.py               hard filters (C3)
│       ├── scoring.py                sub-scores (C4)
│       ├── emissions.py               model-based + benchmark (C7-C8)
│       ├── rank.py                    weighted ranking + trade-off delta (C5-C6)
│       ├── config.py                  thresholds/epsilon (D17)
│       └── tests/
│           ├── test_filters.py
│           └── test_scoring.py
│
├── ai-services/                      Person D (GPU-isolated, own process)
│   ├── README.md
│   └── vision-service/               YOLO-World-S
│       ├── main.py                   POST /inspect endpoint
│       ├── requirements.txt          ultralytics, torch (CUDA build)
│       ├── .env.example
│       └── model/                    downloaded YOLO-World-S weights
│
├── database/                         Person D
│   ├── seed.py                       loads real + not_verified + demo_synthetic
│   ├── reset_demo_data.py            rehearsal reset (D18)
│   ├── sources.md                    traceability for real-anchor claims (D20)
│   └── schema/                       reference JSON shapes matching DATA_MODEL.md
│       ├── hotels.json
│       ├── transport_routes.json
│       ├── experiences.json
│       ├── businesses.json
│       ├── confirmations.json
│       ├── ai_inspections.json
│       └── analytics_events.json
```

## Why the recommendation engine sits inside `backend/`

It was always designed to be imported as a plain Python module in the
same process as FastAPI (see IMPLEMENTATION_PLAN.md, "same process as
FastAPI, not a microservice") — putting it one level down inside
`backend/` instead of as a sibling top-level folder matches that
architecture and avoids implying it needs its own deploy/run step.

## Why `ai-services/` is separate from `backend/`

The opposite is true here: YOLO-World-S needs GPU isolation (per the
8GB VRAM budget) and runs as its own process with its own `main.py`
and `requirements.txt`, called over HTTP by `backend/app/routes/...`
(the actual route handling the call from the frontend lives in
`business.py`, which forwards to `ai-services/vision-service`). If a
second locally-hosted model is ever added, it gets its own folder
under `ai-services/` the same way.
