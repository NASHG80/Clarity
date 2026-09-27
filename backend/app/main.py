"""FastAPI entry point — mounts all routers from app/routes/.

Start the server:
    uvicorn app.main:app --reload --port 8000

C1: all routes are stubs returning deterministic contract-shaped responses.
     Real business logic is added in C2-C22.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

# ---------------------------------------------------------------------------
# Load .env (backend/.env) — must happen before any os.environ reads
# ---------------------------------------------------------------------------
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

# ---------------------------------------------------------------------------
# Import route modules
# ---------------------------------------------------------------------------
from app.routes import (  # noqa: E402  (imports after load_dotenv is intentional)
    nlu,
    search,
    listings,
    business,
    ai,
    analytics,
    payments,
    confirmations,
    auth,
    trips,
    proxy,
    chat,
    weather,
)

# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CLARITY — Backend API",
    description=(
        "Personalized Travel Decision Engine for sustainable + accessible travel in India. "
        "B2C: natural-language intake → recommendation engine → Razorpay test payment. "
        "B2B: business onboarding → AI photo analysis → Pro analytics dashboard. "
        "See docs/API_CONTRACT.md for the frozen endpoint contract."
    ),
    version="0.1.0-c1-stubs",
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": "ERR_UNKNOWN", "detail": str(exc.detail)}
    )

# ---------------------------------------------------------------------------
# CORS — scoped to frontend origins (supports comma-separated list)
# ---------------------------------------------------------------------------
_frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
_allowed_origins = [origin.strip() for origin in _frontend_origin.split(",") if origin.strip()]

# Preserve development origin just in case Render config overwrote it
if "http://localhost:5173" not in _allowed_origins:
    _allowed_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register all routers
# ---------------------------------------------------------------------------
app.include_router(nlu.router)
app.include_router(search.router)
app.include_router(listings.router)
app.include_router(business.router)
app.include_router(ai.router)
app.include_router(analytics.router)
app.include_router(payments.router)
app.include_router(confirmations.router)
app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(proxy.router)
app.include_router(chat.router)
app.include_router(weather.router)
