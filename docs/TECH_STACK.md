# Tech Stack (v2)

## Frontend
- React + Vite + TypeScript (all components are `.tsx`, all plain
  modules are `.ts` — see `frontend/tsconfig.json`)
- Tailwind CSS
- React Router (route groups for B2C and B2B, shared component library)
- Recharts (B2B analytics charts, funnel, breakdown bars)
- Google Maps JavaScript API (multi-modal journey / map views)
- react-i18next (i18n: English, Hindi, Marathi)
- Google Fonts: Noto Sans Devanagari (or Noto Sans) loaded alongside
  the Latin UI font so Hindi/Marathi render correctly, not as tofu boxes
- Razorpay Checkout JS (test-mode key only)

Folder structure:
```
/frontend
  /src
    /b2c
      /pages
        SearchPage, TripPromptPage (NL intake), RequirementForm,
        ResultsPage, JourneyView, ListingDetail, ExplorePage,
        TripSummary, PaymentPage, BookingConfirmation
      /components
        TradeOffCard, DataStateBadge, RequirementChips,
        FilterSidebar (desktop), FilterBottomSheet (mobile),
        WeightSliders, EmissionsInfoPopover
    /b2b
      /pages
        Onboarding, PhotoUpload, AiAnalysisReview, ListingManager,
        OpportunityDetector, AnalyticsDashboard, DemandComparison,
        VerificationInbox
      /components
        KpiTile, OpportunityCard, FunnelChart, DemandTable
    /shared
      /components
        Navbar (desktop), BottomNavBar (mobile), LanguageSwitcher,
        Tabs, Badge, Modal
    /i18n
      en/*.json, hi/*.json, mr/*.json
      i18n-config.js
    /lib
      api.js         <- all fetch calls, matches API_CONTRACT.md
      razorpay.js     <- checkout trigger + verify flow
```

Setup:
```
cd frontend
npm create vite@latest . -- --template react
npm install tailwindcss react-router-dom recharts @react-google-maps/api \
  react-i18next i18next razorpay
npm run dev
```

Note: Google Maps requires an API key with billing enabled on the Google Cloud project (there is a free monthly credit, but a card must be on file).

Responsive rule (see AGENTS.md #9): every page ships an explicit
desktop component tree and an explicit mobile component tree, toggled
via `hidden md:flex` / `flex md:hidden` pairs — not one tree resized.

## Backend
- Python + FastAPI, Uvicorn
- Pydantic models mirroring API_CONTRACT.md
- PyMongo or Motor (async) for MongoDB access
- An LLM API with structured/function-calling JSON output for the
  natural-language extraction endpoint (e.g. Claude API or another
  provider's API with tool-use/JSON mode) — used ONLY for extraction,
  never for ranking or recommending
- Razorpay Python SDK (test mode keys, stored in `.env`, never committed)

Folder structure:
```
/backend
  /app
    main.py
    /routes
      search.py         transport + accommodation search
      listings.py         admin/manual listing CRUD
      business.py          B2B onboarding + opportunity endpoints
      nlu.py                natural-language extraction endpoint
      analytics.py          event ingestion + Pro dashboard queries
      payments.py           Razorpay create-order / verify-payment
    /models              Pydantic request/response schemas
    /db
      mongo.py
requirements.txt
```

Setup:
```
cd backend
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn pymongo pydantic razorpay <llm-sdk-of-choice>
uvicorn app.main:app --reload
```

## Recommendation Engine
- Plain Python, imported directly by the backend (same process)

```
/recommendation-engine
  filters.py          hard filters (budget/time/accessibility/data_state)
  scoring.py           environmental/accessibility/affordability/convenience
  emissions.py          model-based formula + benchmark comparison
  rank.py                weighted ranking + trade-off delta
  tests/
```

## AI Vision Service (NEW — separate process, GPU isolated)
- YOLO-World-S (open-vocabulary object detection)
- Runs as its own small FastAPI/Flask service so GPU load never
  blocks the main API process — important given 8GB VRAM budget
- Ultralytics YOLO-World implementation, small ("-s") variant only

```
/ai-vision-service
  main.py               lightweight HTTP wrapper, one endpoint:
                         POST /inspect  { image, queries[] } ->
                         [{ label, bbox, confidence }]
  model/                 downloaded YOLO-World-S weights
  requirements.txt        ultralytics, torch (CUDA build), fastapi/flask
```

Setup:
```
cd ai-vision-service
python -m venv venv && source venv/bin/activate
pip install ultralytics torch --index-url <cuda-wheel-index> fastapi uvicorn
python main.py
```
Hardware note: this is scoped to run on an RTX 5050 (8GB VRAM) /
16GB RAM / Ryzen 7 — do not swap in a larger model (e.g. a 3B-param
vision model) without re-checking VRAM headroom.

## Database
- MongoDB (local via Docker, or Atlas free tier)

Collections: `hotels`, `transport_routes`, `experiences`, `businesses`,
`confirmations`, `ai_inspections` (new), `analytics_events` (new) —
full schema in DATA_MODEL.md.

Setup:
```
docker run -d -p 27017:27017 --name travel-mongo mongo
cd database
python seed.py     # loads real-anchor + not-verified + demo dataset,
                    # including _en/_hi/_mr translated fields
```

## Environment variables (`.env` per module, never commit)
```
MONGO_URI=mongodb://localhost:27017
BACKEND_URL=http://localhost:8000
AI_VISION_URL=http://localhost:8001
LLM_API_KEY=...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
VITE_GOOGLE_MAPS_API_KEY=...
```
