"""Pydantic models for customer dashboard trip endpoints.

Covers:
  POST   /api/trips/create
  GET    /api/trips/active
  PATCH  /api/trips/{trip_id}/state
  POST   /api/trips/{trip_id}/interactions
  GET    /api/trips/{trip_id}/interactions
"""

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# DashboardPhase
# ---------------------------------------------------------------------------

class DashboardPhase(str, Enum):
    EMPTY          = "EMPTY"
    BASICS_SAVED   = "BASICS_SAVED"
    ACCESSIBILITY  = "ACCESSIBILITY"
    SUSTAINABILITY = "SUSTAINABILITY"
    PRIORITIES     = "PRIORITIES"
    SEARCHING      = "SEARCHING"
    RESULTS        = "RESULTS"
    ERROR          = "ERROR"


# ---------------------------------------------------------------------------
# TravelerEventType
# ---------------------------------------------------------------------------

class TravelerEventType(str, Enum):
    trip_basics_submitted          = "trip_basics_submitted"
    destination_changed            = "destination_changed"
    dates_changed                  = "dates_changed"
    traveler_count_changed         = "traveler_count_changed"
    accessibility_filter_selected  = "accessibility_filter_selected"
    accessibility_filter_removed   = "accessibility_filter_removed"
    sustainability_filter_selected = "sustainability_filter_selected"
    sustainability_filter_removed  = "sustainability_filter_removed"
    budget_changed                 = "budget_changed"
    weight_changed                 = "weight_changed"
    persona_preset_applied         = "persona_preset_applied"
    search_performed               = "search_performed"
    result_viewed                  = "result_viewed"
    result_opened                  = "result_opened"
    result_saved                   = "result_saved"
    filter_changed_after_results   = "filter_changed_after_results"
    search_refreshed               = "search_refreshed"


# ---------------------------------------------------------------------------
# Weights
# ---------------------------------------------------------------------------

class TripWeights(BaseModel):
    environmental: float = 0.25
    accessibility: float = 0.25
    affordability: float = 0.25
    convenience:   float = 0.25


# ---------------------------------------------------------------------------
# POST /api/trips/create
# ---------------------------------------------------------------------------

class TripCreateRequest(BaseModel):
    user_id:        str
    destination:    str
    adults:         int = Field(..., ge=1)
    children:       int = Field(0, ge=0)
    rooms:          int = Field(1, ge=1)
    arrival_date:   str  # YYYY-MM-DD
    departure_date: str  # YYYY-MM-DD

    @model_validator(mode="after")
    def check_dates(self) -> "TripCreateRequest":
        try:
            arr = date.fromisoformat(self.arrival_date)
            dep = date.fromisoformat(self.departure_date)
        except ValueError as exc:
            raise ValueError("arrival_date and departure_date must be YYYY-MM-DD") from exc
        if dep <= arr:
            raise ValueError("departure_date must be strictly after arrival_date")
        return self


class TripCreateResponse(BaseModel):
    trip_id:    str
    phase:      DashboardPhase
    created_at: str


# ---------------------------------------------------------------------------
# GET /api/trips/active
# ---------------------------------------------------------------------------

class TripDocument(BaseModel):
    """Full trip state document returned by active-trip and PATCH endpoints."""
    trip_id:                  str
    user_id:                  str
    destination:              str
    adults:                   int
    children:                 int
    rooms:                    int
    arrival_date:             str
    departure_date:           str
    accessibility_required:   List[str] = Field(default_factory=list)
    sustainability_preferred: List[str] = Field(default_factory=list)
    budget_max:               Optional[float] = None
    weights:                  TripWeights = Field(default_factory=TripWeights)
    include_unverified:       bool = False
    phase:                    DashboardPhase = DashboardPhase.BASICS_SAVED
    last_search_result_count: Optional[int] = None
    created_at:               str
    last_updated:             str


class ActiveTripResponse(BaseModel):
    trip: Optional[TripDocument] = None


# ---------------------------------------------------------------------------
# PATCH /api/trips/{trip_id}/state
# ---------------------------------------------------------------------------

class TripStatePatch(BaseModel):
    """All fields optional — only supplied fields are updated."""
    user_id:                  str
    destination:              Optional[str] = None
    adults:                   Optional[int] = Field(None, ge=1)
    children:                 Optional[int] = Field(None, ge=0)
    rooms:                    Optional[int] = Field(None, ge=1)
    arrival_date:             Optional[str] = None
    departure_date:           Optional[str] = None
    accessibility_required:   Optional[List[str]] = None
    sustainability_preferred: Optional[List[str]] = None
    budget_max:               Optional[float] = None
    weights:                  Optional[TripWeights] = None
    include_unverified:       Optional[bool] = None
    phase:                    Optional[DashboardPhase] = None
    last_search_result_count: Optional[int] = None


class TripStatePatchResponse(BaseModel):
    trip_id:      str
    last_updated: str


# ---------------------------------------------------------------------------
# POST /api/trips/{trip_id}/interactions
# ---------------------------------------------------------------------------

class TravelerInteractionRequest(BaseModel):
    user_id:    str
    session_id: str
    event_type: TravelerEventType
    payload:    Dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def require_client_event_id(self) -> "TravelerInteractionRequest":
        if not self.payload.get("client_event_id"):
            raise ValueError("payload must include a non-empty client_event_id for idempotency")
        return self


class TravelerInteractionResponse(BaseModel):
    interaction_id: str
    status:         Literal["recorded"]


# ---------------------------------------------------------------------------
# GET /api/trips/{trip_id}/interactions
# ---------------------------------------------------------------------------

class InteractionRecord(BaseModel):
    interaction_id: str
    event_type:     str
    timestamp:      str
    payload:        Dict[str, Any] = Field(default_factory=dict)


class TripInteractionsResponse(BaseModel):
    interactions: List[InteractionRecord]
