# Team Split — 4 people, full feature breakdown (v2)

This replaces the v1 module-only split. Each person gets a list of
concrete features. For each feature: what it is, how to build it, and
the edge cases to handle before calling it done. Roughly ~90 discrete
items across 4 people (~20-24 each) — close enough to "100 features"
that nothing meaningful is left unassigned.

Cross-cutting rule for ALL 4 people on EVERY feature below: it is not
done until (a) it works in all 3 languages, (b) it has a real desktop
AND a real mobile layout, and (c) `data_state`/`is_demo_data` badges
render correctly. This is not a separate pass at the end — build it
in from the start, since retrofitting i18n and dual-layout onto
finished screens takes longer than building them in.

---

# PERSON A — Frontend B2C

## A1. Landing page
What: search-bar-first homepage (origin/destination/date), standard
OTA layout.
How: React page + Tailwind, desktop = wide hero + search bar top,
mobile = compact search bar as the whole above-the-fold content.
Edge cases: empty origin/destination on submit (inline validation,
translated error text); returning user with a previous search saved
locally (optional nice-to-have, not required).

## A2. Language switcher (shared, built by Person A + B together)
What: EN/HI/MR dropdown in the navbar.
How: react-i18next `changeLanguage`, persisted to localStorage, read
on app load before first paint to avoid a flash of English.
Edge cases: switching language mid-form must not clear the user's
entered values; Devanagari font must be loaded before switching or
text flashes as tofu boxes.

## A3. Natural-language trip prompt screen
What: single text box below/instead of the structured search, with a
short helper example text.
How: textarea + submit button, calls `POST /api/nlu/extract`, shows a
loading state while the LLM responds.
Edge cases: LLM API timeout/failure -> fall back gracefully to the
empty structured form (never block the user); extremely short input
("Goa") -> show the clarifying-question pattern rather than erroring.

## A4. Extraction review / clarifying-question UI
What: "I found 2 children and 1 senior traveler. How many adults are
traveling?" style single-question prompts before the form opens.
How: render one question at a time from `missing_or_ambiguous`, plain
text/number input, confirm button.
Edge cases: multiple missing fields — ask them one at a time, not all
at once, to avoid overwhelming the user; user can skip a question and
fill it in the form instead.

## A5. Requirement Form — accessibility chips
What: the full existing checklist (step-free entrance, elevator,
wheelchair-accessible room, roll-in shower, accessible toilet, low
walking distance, accessible public transport, visual assistance,
hearing assistance), pre-checked from LLM extraction where applicable.
How: chip/tag components (Zomato/Swiggy filter-chip pattern), toggle
state, pre-fill from extraction result on mount.
Edge cases: LLM only extracted a general "accessible" flag — do NOT
auto-check specific chips (roll-in shower etc.) from that; only
explicitly stated items get pre-checked.

## A6. Requirement Form — budget slider
What: max budget input.
How: range slider + numeric input synced both ways, INR formatting.
Edge cases: user types a budget below the cheapest available option —
show a warning, don't block submission.

## A7. Requirement Form — max travel time slider
Same pattern as A6, hours instead of INR.

## A8. Requirement Form — weight sliders (advanced panel)
What: environmental/accessibility/cost/convenience priority sliders,
collapsed by default under "Customize priorities."
How: 4 sliders, normalized to sum sensibly before sending to the API
(document the normalization in a code comment).
Edge cases: all sliders at zero — define a sane default weighting
rather than dividing by zero.

## A9. Persona presets
What: "Traveling with elderly parent," "Wheelchair user," "Budget
backpacker," etc. buttons that pre-fill chips + sliders.
How: static config mapping persona -> chip/slider values; user can
still edit after selecting.
Edge cases: selecting a persona after already editing the form should
ask for confirmation before overwriting (don't silently discard input).

## A10. Results page — transport trade-off cards
What: Cost/Time/CO2/Accessibility/Convenience shown per card, plus
`trade_off_summary` bullet list and `personal_match_pct` as a
secondary line.
How: consumes `/api/search/transport` response directly (Section
API_CONTRACT.md), one card component reused desktop (grid) / mobile
(stacked).
Edge cases: zero results -> show a clear "no matches, try adjusting
requirements" state, not a blank page; a result with
`data_state: "demo_synthetic"` must show the orange DEMO badge in the
exact same visual weight as other badges (not smaller/hidden).

## A11. DataStateBadge integration (B2C usage)
What: consistent rendering of all 5 states with translated labels.
How: import the shared `DataStateBadge` (owned by Person B), pass
`data_state` prop.
Edge cases: unknown/unexpected state string from the API -> render as
"not_verified" defensively rather than crashing.

## A12. Emissions info popover
What: tap-to-reveal "How was this calculated?" showing method,
distance, factor, or benchmark value.
How: popover/modal triggered from an info icon next to any CO2e value;
branch UI on `method: "estimated"` vs `"route_benchmark"` — different
copy and fields for each, never merged.
Edge cases: missing emissions data entirely -> hide the CO2e line
rather than showing "0 kg" or "N/A" ambiguously.

## A13. Multi-modal journey view
What: segment-by-segment breakdown (walk/metro/bus) with per-segment
time/CO2/accessibility.
How: render `segments[]` from the transport result as a vertical
timeline; Google Maps optional overlay if time allows, static list is
an acceptable fallback.
Edge cases: a segment with no accessibility data -> show
"Not verified" for that segment specifically, don't infer from the
overall route's badge.

## A14. Accommodation results page
Same card pattern as A10, adapted for hotel fields (price/night,
star rating, accessibility_items count summary).

## A15. Listing detail page (tabbed)
What: Overview / Accessibility / Sustainability / Reviews tabs.
How: shared `Tabs` component (Person B), each accessibility/
sustainability item rendered with its own `DataStateBadge` — never
collapsed into one summary badge.
Edge cases: an item list that's entirely `not_verified` should still
render cleanly (not look like an error state).

## A16. Explore / Experiences page
What: "Explore [City]" cards (accessible beaches, step-free museums,
eco-friendly experiences, cycling routes, family-friendly).
How: consumes `/api/explore/{city}`, same card attribute set as hotels
for visual consistency (accessibility, environmental impact, cost,
duration, distance, data_state).

## A17. Trip summary screen
What: pre-payment review of selected transport + hotel + any
experiences, itemized cost total.
How: pulls selections from app state/context, formats INR totals.
Edge cases: user navigates back and changes a selection — summary
must recompute, not show stale totals.

## A18. Razorpay Test Mode checkout integration
What: trigger Razorpay checkout from the trip summary "Pay" button.
How: `POST /api/booking/create-order` -> Razorpay Checkout JS with the
returned order_id -> on success, `POST /api/booking/verify-payment`.
Edge cases: payment failure/cancellation -> return to trip summary
with a clear retry option, don't lose the user's selections.

## A19. Booking confirmation screen
What: final confirmation, explicitly stating real payment + real or
simulated reservation per `reservation_status`.
How: branch copy on `reservation_status: "confirmed"` vs `"simulated"`
— e.g. simulated shows "Payment confirmed (test mode). This
reservation is simulated for demo purposes."
Edge cases: never phrase a simulated reservation in a way that could
be mistaken for a real booking.

## A20. Responsive shell for all B2C pages
What: the desktop/mobile component-pair pattern applied consistently.
How: `hidden md:flex` / `flex md:hidden` pairs per AGENTS.md #9;
mobile bottom tab bar for primary nav (Search/Explore/Trips), desktop
top navbar.
Edge cases: don't let both desktop and mobile trees mount and fetch
data twice — gate data-fetching above the layout split, not inside
each variant.

## A21. i18n wiring for all B2C strings
What: every string above routed through `useTranslation()`.
How: one JSON namespace per B2C page under `/i18n/{lang}/b2c.*.json`.
Edge cases: pluralization (e.g. "2 children" vs "1 child") — use
i18next's plural key support, don't string-concatenate manually.

## A22. Locale-aware formatting
What: currency (₹ with Indian digit grouping), dates, durations.
How: `Intl.NumberFormat('en-IN', ...)` for currency regardless of UI
language (India uses ₹ formatting even in Hindi/Marathi UI); duration
formatting localized per language.

## A23. Accessibility of the UI itself
What: keyboard navigation, ARIA labels, focus states — for the app's
own usability, distinct from the product's accessibility *content*.
How: semantic HTML, `aria-label` on icon-only buttons, visible focus
rings.
Edge cases: ARIA labels must also be translated, not left in English
when the UI language is Hindi/Marathi.

---

# PERSON B — Frontend B2B + Shared Components

## B1. Shared component library
What: Navbar (desktop), BottomNavBar (mobile), Tabs, Badge/
DataStateBadge, Modal, Button set.
How: build these FIRST — Person A depends on DataStateBadge and Tabs
early; coordinate timing on Day 1-2.
Edge cases: Badge component must support all 5 states plus an
"unknown" defensive fallback (see A11).

## B2. Language switcher (shared with Person A, see A2)
Person B owns the component; Person A integrates it into B2C navbar.

## B3. TradeOffCard skeleton (shared)
What: the base card layout (Cost/Time/CO2/Accessibility/Convenience
rows) reused by both B2C results and any B2B preview-as-traveler view.
How: props-driven, no B2C/B2B-specific logic inside it.

## B4. Business onboarding — basic info step
What: name, city, price band, star rating form.
How: standard multi-step wizard, step 1 of 3.

## B5. Business onboarding — accessibility self-assessment
What: same checklist items as the traveler-facing chips (A5), from
the business's side.
How: reuse chip component from shared library where possible; submits
with `data_state: "reported"` per API contract (never "verified").

## B6. Business onboarding — sustainability self-assessment
Same pattern as B5, sustainability items (solar power, waste program,
water program, local sourcing).

## B7. Photo upload component
What: upload buckets — Entrance / Bathroom / Room / Parking.
How: drag-drop + file picker, client-side image size/type validation
before upload (see D13 for server-side limits).
Edge cases: oversized image -> compress client-side or reject with a
clear message before hitting the API.

## B8. "Analyze Photos" trigger + loading state
What: button that calls `POST /api/ai/inspect-property-image` per
uploaded image, with appropriate loading indicators (this call can
take a few seconds on GPU inference).
Edge cases: partial failure (3 of 4 images analyzed, 1 timed out) —
show per-image status, allow retry on just the failed one.

## B9. AI Analysis review screen
What: "Entrance: ✓ Ramp detected, ✓ Handrail detected" style list per
uploaded image, with optional bounding-box overlay on the image.
How: render `detections[]` from the API; confidence score can be shown
in a small debug/internal toggle ONLY if useful for your own QA, never
in the default business-facing view.
Edge cases: zero detections for an image -> show "No features
detected in this image" plainly, not an error.

## B10. Review & Confirm flow
What: per-detected-item confirm/reject toggle, submit calls
`POST /api/ai/confirm-detections`.
How: only confirmed items update `data_state` to "reported" per the
contract — this is the most important integrity checkpoint in the
whole B2B flow, test it explicitly.
Edge cases: business rejects a correctly-detected item (e.g. a ramp
that's actually broken/unusable) — respect the rejection, do not
override with the AI's confidence.

## B11. Listing Manager (manual/admin listing tool)
What: the standalone form for adding/editing listings directly,
mandatory Real (`reported`) vs Demo (`demo_synthetic`) choice on
every submission, per API contract — no default value allowed.
Edge cases: form must not let submission proceed without this choice
explicitly made (not pre-selected).

## B12. Opportunity Detector dashboard — KPI tiles
What: top-of-dashboard summary tiles (e.g. count of red/yellow
opportunities).
How: consumes `/api/business/{id}/opportunities`.

## B13. Opportunity feed cards
What: severity-colored cards (red/yellow), suggested action text,
`is_demo_data` badge where applicable.
Edge cases: an opportunity from a demand gap (see B17) must look
visually consistent with a resource-based opportunity (B12/food waste
example) — same card component, different content.

## B14. Weekly Listing Analytics dashboard
What: views / unique visitors / detail opens / saves / booking starts
/ bookings tiles.
How: consumes `/api/business/{id}/analytics`, `is_demo_data: true`
banner shown prominently, not buried in a tooltip.

## B15. Traveler funnel visualization
What: funnel chart (desktop) / vertical stacked list (mobile — see
AGENTS.md responsive rule, a horizontal funnel doesn't work on a
narrow screen).
How: Recharts funnel or custom bar-based funnel; mobile variant is a
genuinely different component, not a squeezed chart.

## B16. Traveler demand analytics table
What: "Step-free entrance — 382 searches" style ranked list.
How: consumes `/api/business/{id}/demand`, `requirement_search_counts`.

## B17. Demand vs. property comparison view
What: "214 travelers searched for roll-in shower, your property has
no reportable info for this feature."
How: cross-reference `gaps[]` from the demand endpoint against the
property's own checklist state; feed directly into B13's opportunity
feed as a distinct opportunity type.

## B18. Connect analytics to Opportunity Detector (integration task)
What: unify B13 + B17 into one coherent feed rather than two separate
lists competing for attention.
How: single feed component, opportunity `type` field distinguishes
"resource" vs "demand_gap" vs "ai_detection_pending" opportunities.

## B19. Verification inbox (stretch, build only after B1-B18 solid)
What: business responds to traveler-submitted accessibility
corrections/confirmations.
How: list of pending `confirmations`, accept/dispute action per item.

## B20. B2B responsive layouts
What: desktop = multi-column dashboard, mobile = stacked single-column
cards; funnel becomes a vertical list on mobile (see B15).
Edge cases: KPI tiles that are a 4-column grid on desktop must reflow
to a genuinely usable 1 or 2-column stack on mobile, not a tiny
4-column grid squeezed onto a phone.

## B21. i18n wiring for all B2B strings
Same pattern as A21, separate namespace `/i18n/{lang}/b2b.*.json`.

## B22. Demo-data labeling consistency audit
What: a manual (or scripted) pass confirming every screen that can
show `is_demo_data: true` or `data_state: "demo_synthetic"` actually
renders the badge — this is the single most judge-visible integrity
check in the whole B2B side.
Edge cases: a badge that renders in the results list but disappears on
the detail page is a real bug class here — check both.

## B23. Photo upload / analysis failure states
What: no objects detected, upload failure, analysis timeout, all with
clear, non-technical, translated user-facing messages.

---

# PERSON C — Backend (FastAPI) + Recommendation Engine + LLM + Razorpay

## C1. FastAPI skeleton + route stubs
What: all routes from API_CONTRACT.md, returning hardcoded sample
responses first so Person A/B can hit a real endpoint on Day 2 if
they'd rather not mock locally.

## C2. Pydantic models for every request/response shape
What: one model per contract shape, validated strictly (reject unknown
fields rather than silently dropping them, to catch drift early).

## C3. Hard filter functions
What: budget ceiling, max travel time, mandatory accessibility flags.
How: `not_verified` items are excluded from "meets requirement" by
default; `include_unverified: true` toggle relaxes this per request,
never as a silent default.
Edge cases: a mandatory accessibility flag that no option in the
dataset satisfies at all -> return zero results honestly (feeds into
D-side demo_synthetic strategy), don't relax filters silently to avoid
an empty result.

## C4. Sub-scoring functions
What: environmental / accessibility / affordability / convenience
normalized sub-scores, each 0-1 before weighting.
Edge cases: normalization must handle a category with only one
candidate option (avoid divide-by-zero range issues).

## C5. Weighted ranking + trade-off delta computation
What: `score = sum(weight_i * subscore_i)`, plus the explicit "next
best on axis X, delta Y" computation described in
IMPLEMENTATION_PLAN.md.
Edge cases: a genuine three-way near-tie — trade-off delta logic
should pick the most decision-relevant comparison, not an arbitrary one.

## C6. Data-state tie-breaking logic
What: verified > reported > community_confirmed > demo_synthetic on
near-ties (epsilon-based, config value).

## C7. Emissions — model-based calculation
What: `distance_km x emission_factor(mode)`, returns `method:
"estimated"` plus the inputs.

## C8. Emissions — benchmark comparison
What: `(benchmark_kg - option_kg) / benchmark_kg`, returns `method:
"route_benchmark"` plus `benchmark_kg`.
Edge cases: never compute a percentage from a synthetic/demo
benchmark without labeling it as such too — demo_synthetic emissions
data should probably use `method: "estimated"` only, not benchmark
labels, since a fabricated benchmark is a step further into
misrepresentation than a fabricated distance-based estimate. Flag this
for a team decision if it comes up.

## C9. LLM/NLU extraction endpoint
What: `POST /api/nlu/extract` — prompt design instructing the LLM to
return ONLY explicitly-stated fields, structured JSON output (use
function-calling/JSON mode, not free text parsing).
How: system prompt should explicitly instruct: do not infer adult
count, do not expand general accessibility mentions into specific
checklist items, list anything ambiguous in `missing_or_ambiguous`.
Edge cases: LLM returns malformed JSON -> retry once, then fall back
to an empty extraction (never crash the intake flow); prompt-injection
style input in the free-text box -> the extraction endpoint should
only ever produce the fixed schema fields, never execute instructions
from the input text.

## C10. Clarification question generation logic
What: rule-based post-processing that decides which
`missing_or_ambiguous` items actually need a clarifying question vs.
which can just be left blank in the form.
How: e.g. missing adult count when children/seniors were mentioned
always asks; missing weight-slider preferences never asks (those
have sane defaults).

## C11. YOLO-World-S inference integration (client side of ai-vision-service)
What: FastAPI route that forwards images + queries to the separate
ai-vision-service and returns its response, per API_CONTRACT.md.
Edge cases: ai-vision-service down/unreachable -> return a clear
error the frontend can show as "AI analysis unavailable, please fill
the checklist manually" rather than hanging.

## C12. Confidence score handling
What: store `confidence` from detections internally; strip it from
any response path that could reach a traveler-facing screen.

## C13. AI inspection -> reported-state conversion logic
What: `POST /api/ai/confirm-detections` updates the relevant
checklist item's `data_state` to `"reported"` only on explicit
confirmation, per C's ownership of business logic (B10 owns the UI).

## C14. Analytics events ingestion endpoint
What: `POST /api/analytics/events`, lightweight write, no heavy
validation beyond enum-checking `event_type`.
Edge cases: high-frequency events (impressions) shouldn't block on a
slow write — consider a simple write-behind/batching approach if
Mongo write latency becomes noticeable in testing, otherwise a direct
insert is fine for hackathon scale.

## C15. Weekly Pro metrics aggregation
What: `GET /api/business/{id}/analytics` — Mongo aggregation pipeline
over `analytics_events` for the funnel numbers.
Coordinate with Person D on whether to pre-aggregate (see
DATA_MODEL.md note) if pipeline queries are too slow live.

## C16. Demand analytics endpoint
What: `GET /api/business/{id}/demand` — aggregate
`accessibility_required` values from recent search requests, compare
against the property's own checklist to produce `gaps[]`.

## C17. Razorpay create-order endpoint
What: `POST /api/booking/create-order`, test-mode keys from `.env`.

## C18. Razorpay verify-payment endpoint
What: `POST /api/booking/verify-payment`, verifies the Razorpay
signature server-side (never trust a client-side "success" alone).
Edge cases: signature verification failure -> return a clear failure
response, do not mark `payment_verified: true` on any client claim
without server-side signature check.

## C19. Booking confirmation / reservation-status logic
What: sets `reservation_status: "simulated"` by default; only
`"confirmed"` if an actual supplier API call succeeded (out of scope
unless the team decides to integrate one later).

## C20. Data-state enforcement validation layer
What: a response-serialization check that raises/strips any field
where `data_state == "not_verified"` but `value` is non-null —
catches this class of bug centrally instead of relying on every
route author remembering the rule.

## C21. Backend error-message strategy for i18n
What: API returns error codes (e.g. `ERR_BUDGET_BELOW_MIN`), frontend
maps codes to translated strings — document this decision so Person A/
B don't expect translated text from the API directly.

## C22. Edge case handling pass
What: LLM extraction failure/timeout fallback (-> empty form, C9);
YOLO service down (-> clear error, C11); Razorpay payment failure
(-> retry path, C18); zero search results (-> honest empty state,
feeds D's demo_synthetic decision).

---

# PERSON D — Database + Seed Data + AI Vision Service Ops + Integration

## D1. MongoDB setup
What: local Docker instance or Atlas free tier, all collections
created per DATA_MODEL.md.

## D2. hotels collection seeding
What: real anchor properties + not_verified budget properties +
demo_synthetic entries where needed, each with `en/hi/mr` translation
fields.
How: research real properties first (see D20 sources tracking) before
writing any seed script.

## D3. transport_routes seeding
What: real routes with distance/cost/duration, `method: "estimated"`
by default, `method: "route_benchmark"` + `benchmark_kg` for the
handful of routes where a genuine benchmark makes sense (e.g. a
well-known flight route).

## D4. experiences collection seeding
What: 8-12 experiences across demo cities, translated fields, mixed
data_states.

## D5. businesses collection seeding
What: 2-3 demo business_ids with onboarding data + opportunities,
matched to the analytics events in D9.

## D6. confirmations collection + threshold config
What: a small seed set of community confirmations; threshold value
(e.g. 3) lives in recommendation-engine config, cross-check with
Person C.

## D7. ai_inspections collection schema + indexes
What: index on `business_id` and `image_id` for fast lookups during
the confirm-detections flow.

## D8. analytics_events collection schema + indexes
What: index on `(business_id, event_type, timestamp)` for the
aggregation queries Person C writes in C15/C16.

## D9. Demo/synthetic analytics generator
What: a script producing internally-consistent weekly funnel numbers
(impressions >= opens >= detail_opens >= saves >= booking_starts >=
bookings) for the 2-3 demo businesses, all implicitly `is_demo_data`.
Edge cases: don't generate numbers that produce a >100% conversion
rate at any funnel stage — sanity-check the generator's output.

## D10. i18n content data strategy — implementation
What: populate `translations.en/hi/mr` for every seeded hotel/
experience name + short description.
How: for hackathon scope, professional/native translation isn't
required — reasonable machine/manual translation is acceptable, but
note in `sources.md` that these are prototype-quality translations,
not verified professional ones (this matters if a judge asks).

## D11. YOLO-World-S model setup
What: download/set up the small YOLO-World variant, confirm it runs
within the RTX 5050 8GB VRAM budget.
How: use the ultralytics YOLO-World-S weights; test inference on a
handful of sample property photos before wiring it into the service.

## D12. ai-vision-service build
What: the standalone lightweight service (main.py) exposing
`POST /inspect`, per TECH_STACK.md — kept separate from the main
FastAPI process for GPU isolation.

## D13. Model warm-up / cold-start + input validation
What: handle the first-inference latency spike; reject images above a
sane size/dimension before they hit the model; validate file type.
Edge cases: a corrupted/non-image file upload should fail cleanly with
a clear error, not crash the service.

## D14. Integration checklist ownership (Phase 2 lead)
What: own the Phase 2 day — swap all frontend mocks for real
endpoints, confirm FastAPI calls the real recommendation engine and
the real ai-vision-service, run both full demo flows end-to-end.

## D15. Full data-state audit script
What: a script that crawls every document in the seeded database and
flags any record where `data_state == "not_verified"` but `value` is
non-null (should be paired with Person C's C20 runtime check as a
second, static line of defense).

## D16. Analytics demo data consistency check
What: verify D9's generator output stays consistent after any manual
edits during rehearsal (re-run the check before the final demo).

## D17. Threshold / config management
What: a single config file (shared by recommendation-engine) holding
the community-confirmation threshold and the tie-breaking epsilon
from C6 — one source of truth, not duplicated constants.

## D18. Seed data backup/rollback for rehearsal
What: a `reset_demo_data.py` script to restore the database to a known
good state before each rehearsal run, so accumulated test bookings/
confirmations don't pollute the real demo.

## D19. Demo_synthetic placement checker
What: a script verifying `demo_synthetic` entries are only used where
the real dataset genuinely produces zero matches for the rehearsed
demo query (per IMPLEMENTATION_PLAN.md's rule) — prevents synthetic
data from creeping into results where real data would have worked.

## D20. Sources tracking
What: maintain `database/sources.md` — where each real-anchor
property's accessibility/sustainability claim came from, so every
claim shown in the demo is traceable if a judge asks "where did you
get this."

---

# Cross-cutting dependency order (do not violate)

```
Day 1:   ALL 4 -> freeze API_CONTRACT.md + DATA_MODEL.md, INCLUDING
         the new NLU / AI-vision / analytics / payment additions
Day 2:   Person B starts shared components (B1) immediately —
         Person A depends on them within 1-2 days
Day 2-5: Person A, B, C build in parallel against mocks/stubs
         Person D builds schema + seed data + ai-vision-service in
         parallel, researching real properties EARLY (this takes
         longer than it looks — start Day 1 evening if possible)
Day 6:   Integration (Person D leads) — swap mocks, wire ai-vision-
         service and recommendation engine into FastAPI for real
Day 7:   Polish + rehearse both demo scripts (B2C + B2B), in Hindi
         at least once, on both desktop and mobile
```

# Stretch goals (only after all above is done and stable)
- Verification inbox live end-to-end (Person B + C)
- ML re-ranker layered on the rule-based engine (Person C)
- Real Google Maps rendering for the journey view (Person A)
- A real booking-capable supplier integration (Person C + D, large
  scope — only attempt if Day 6 integration finished early)
