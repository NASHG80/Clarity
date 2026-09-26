# AGENTS.md — Read this before touching any code
(v2 — updated with natural-language intake, AI photo detection, B2B Pro
analytics, benchmark emissions, Razorpay test payments, i18n, responsive
dual-layout requirement)

You are working on **Green & Inclusive Travel** — a Personalized Travel
Decision Engine for sustainable + accessible travel in India (hackathon
prototype, 4-person team, built with the help of coding agents).

Read this file fully before writing or editing any code. If your task
touches a specific module, also read the matching file in `/docs` per
Section 4 before starting.

## 1. What this project is (one paragraph)

A travel platform with two sides. B2C: a traveler types a natural-
language trip description, an LLM extracts structured fields (never
silently inferring missing ones), the existing full requirement form
opens pre-filled for the traveler to confirm/edit, and a rule-based
recommendation engine ranks transport/accommodation/experiences as
trade-off cards (never a single score), followed by a Razorpay test-
mode payment step and a booking confirmation. B2B: a business
onboards, self-reports accessibility/sustainability data, can upload
property photos for AI-assisted (YOLO-World-S) feature detection that
still requires human confirmation before counting as evidence, and
gets a Pro analytics dashboard (views, funnel, traveler demand vs.
what the property offers) feeding into an Opportunity Detector. The
whole app is available in English, Hindi, and Marathi, and every page
has a real desktop layout and a real mobile layout, not just scaled
CSS. Full reasoning lives in `docs/IMPLEMENTATION_PLAN.md`.

## 2. Non-negotiable rules (apply to every module, every agent)

1. **Never convert missing data into a score or percentage.** A field
   with no reliable info gets `data_state: "not_verified"` and its
   `value` is null/omitted — never estimated from price tier, star
   rating, or an AI model's confidence score.
2. **Five data states everywhere:** `verified`, `reported`,
   `community_confirmed`, `not_verified`, `demo_synthetic`. Every
   accessibility/sustainability field carries one. `demo_synthetic`
   is always visibly badged, in every screen, table, and export.
3. **The LLM is an extraction layer only — never a decision-maker.**
   It converts free text into candidate structured fields for the
   requirement form. It does not rank, filter, or recommend anything,
   and it must not silently fill in fields the user didn't state
   (e.g. "2 children + 1 senior" does not imply an adult count — the
   UI must ask). Every LLM-extracted field is editable and clearly
   distinguishable from a user-typed field until confirmed.
4. **AI photo detection (YOLO-World-S) never creates `verified` or
   `reported` status by itself.** A detected object is a candidate;
   only an explicit business confirmation click converts it to
   `data_state: "reported"`. The model's internal confidence score
   may be logged for engineering purposes but must never be shown to
   travelers as an accessibility percentage.
5. **Two kinds of carbon numbers exist and must not be mixed:**
   (A) model-based estimate = `distance_km x emission_factor`, and
   (B) benchmark comparison = this option's emissions vs. a route
   benchmark ("13% lower than typical"). Every emissions value must
   expose its `method` (e.g. "Estimated" vs. "Route benchmark") plus
   the underlying numbers on tap — never a bare kg-CO2e value.
6. **Razorpay is payment only, not inventory.** Test-mode Razorpay
   demonstrates a real payment flow, but it does not reserve a seat
   or room. Unless a booking-capable supplier API is actually wired
   in, the post-payment "booking confirmation" is explicitly a
   simulated reservation confirmation, and the code/comments must say
   so — do not let a real payment success imply a real reservation.
7. **Results are trade-off cards, not a single leaderboard score.**
   Cost / Time / CO2 / Accessibility / Convenience shown separately,
   with an optional secondary "Personal Match %".
8. **UI follows patterns users already know** (Booking.com /
   MakeMyTrip / Airbnb / Google Flights conventions). No invented
   navigation patterns, in any language or screen size.
9. **Every page ships two real layouts: desktop and mobile** — not
   one fluid layout scaled down. Build the desktop and mobile version
   of a screen as explicit component variants (e.g. `FilterSidebar`
   for desktop, `FilterBottomSheet` for mobile), toggled with
   Tailwind's `hidden md:flex` / `flex md:hidden` pattern, not with
   font-size/padding tweaks alone. If a screen's mobile version would
   just be "the same layout, smaller," that's a sign the mobile
   layout hasn't actually been designed yet — go back and design it.
10. **Every user-facing string ships in English, Hindi, and
    Marathi.** No hardcoded UI text in components — everything routes
    through the i18n layer (see TECH_STACK.md). Dynamic content
    (property names/descriptions) that has no translation yet must
    fall back to English visibly, not silently mix languages on one
    card without indication.
11. **No blockchain / Hyperledger / certificate-chain anything.**
    This was explicitly removed from the product. Do not reintroduce
    it under any framing (defeat system, future-proofing, etc.).
12. **Follow the API contract exactly** (`docs/API_CONTRACT.md`). If
    your module needs a new field/endpoint, propose it there first —
    other modules depend on the contract staying stable.

## 3. Repo structure

```
/frontend                 React + Vite (B2C + B2B, shared components, i18n)
/backend                  Python + FastAPI (routes, LLM extraction, Razorpay)
/recommendation-engine    Python — filters, scoring, ranking, emissions
/ai-vision-service        YOLO-World-S inference microservice (separate process)
/database                 MongoDB schema + seed scripts + seed data + sources.md
/docs
  IMPLEMENTATION_PLAN.md
  TECH_STACK.md
  API_CONTRACT.md
  DATA_MODEL.md
  TEAM_SPLIT.md
AGENTS.md                 <- this file
README.md
```

## 4. Which doc to read for your task

| If you're working on...                          | Read this first                          |
|----------------------------------------------------|--------------------------------------------|
| Overall plan / phases / what's next                | docs/IMPLEMENTATION_PLAN.md               |
| Anything frontend (B2C or B2B), i18n, responsive   | docs/TECH_STACK.md, docs/API_CONTRACT.md  |
| Anything backend, LLM extraction, Razorpay          | docs/API_CONTRACT.md, docs/DATA_MODEL.md  |
| Recommendation engine / scoring / emissions logic  | docs/DATA_MODEL.md, docs/IMPLEMENTATION_PLAN.md |
| YOLO-World-S / ai-vision-service                    | docs/API_CONTRACT.md, docs/DATA_MODEL.md  |
| Database schema / seed data / analytics events     | docs/DATA_MODEL.md                        |
| Who owns what / exact task list                    | docs/TEAM_SPLIT.md                        |

## 5. Definition of done for any feature

- Matches the API contract exactly (or the contract was updated first).
- Every accessibility/sustainability field has a `data_state` and the
  correct badge renders for it, in all three languages.
- No invented numbers — carbon has a `method` + formula, AI detections
  require confirmation before counting as evidence.
- Desktop and mobile layouts both manually checked, not just resized.
- All three languages (EN/HI/MR) checked for that screen — no
  hardcoded strings, no broken Devanagari rendering.
- Tested against at least one `not_verified` item and one
  `demo_synthetic` item to confirm both render correctly.

## 6. Commit / branch convention

- Branch per module: `frontend/*`, `backend/*`, `recengine/*`,
  `vision/*`, `db/*`
- Commit messages: `[module] short description`
- Open a PR against `main` when integration-ready; at least one other
  teammate reviews before merge.
