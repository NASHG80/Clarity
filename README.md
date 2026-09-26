# Clarity

Personalized Travel Decision Engine for sustainable + accessible travel
in India — B2C traveler app + B2B business console, built for a
4-person hackathon team with the help of coding agents.

Start here: read `AGENTS.md` at the project root before writing or
changing any code. It routes you to the right doc in `/docs` for
whatever you're working on (architecture, API contract, data model,
tech stack, or your specific task in the team split).

## Top-level layout
- `frontend/`      React + Vite — B2C app, B2B console, shared i18n
- `backend/`       FastAPI — routes, LLM/NLU extraction, Razorpay,
                   plus the recommendation engine (same-process import)
- `ai-services/`   Standalone GPU-isolated services — currently
                   `vision-service` (YOLO-World-S for B2B photo analysis)
- `database/`      MongoDB seed scripts, schema references, sources
- `docs/`          Implementation plan, tech stack, API contract,
                   data model, team split
