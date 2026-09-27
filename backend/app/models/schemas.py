"""Pydantic request/response models for every contract shape.

Source of truth: docs/API_CONTRACT.md + docs/DATA_MODEL.md (frozen — do not modify).

C2 adds strict Pydantic v2 models with extra="forbid".
All route files import from here — no duplicated model definitions in routes.

Model naming convention:
  <Resource><Action>Request   — inbound request body
  <Resource><Action>Response  — outbound response body
  Shared leaf models are named by what they represent (e.g. ChecklistItem).
"""

from __future__ import annotations

from enum import Enum
from typing import Any, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, model_validator


# ===========================================================================
# ENUMS — frozen by docs/DATA_MODEL.md and docs/API_CONTRACT.md
# ===========================================================================

class DataState(str, Enum):
    """Five data states used on every accessibility/sustainability field.

    Rule (AGENTS.md §2.2): every field carrying an accessibility or
    sustainability claim must expose exactly one of these states.
    'not_verified' means the value field is null/omitted — never estimated.
    'demo_synthetic' must always be visibly badged in the UI.
    """
    verified = "verified"
    reported = "reported"
    community_confirmed = "community_confirmed"
    not_verified = "not_verified"
    demo_synthetic = "demo_synthetic"


class EmissionsMethod(str, Enum):
    """Two distinct emissions calculation methods — never mixed.

    Rule (AGENTS.md §2.5):
      estimated       = distance_km × emission_factor
      route_benchmark = comparison against a route-level typical value
    """
    estimated = "estimated"
    route_benchmark = "route_benchmark"


class EventType(str, Enum):
    """Analytics event types — discrete, measurable traveler interactions."""
    listing_impression = "listing_impression"
    listing_open = "listing_open"
    detail_open = "detail_open"
    accessibility_view = "accessibility_view"
    sustainability_view = "sustainability_view"
    map_open = "map_open"
    save = "save"
    booking_start = "booking_start"
    booking_complete = "booking_complete"


class AiReviewStatus(str, Enum):
    """Per-detection review status in the ai_inspections collection."""
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"


class ReservationStatus(str, Enum):
    """Booking reservation status.

    Rule (AGENTS.md §2.6): 'simulated' is always returned for this prototype
    unless a real supplier API is wired in, in which case 'confirmed' is used.
    """
    simulated = "simulated"
    confirmed = "confirmed"


# ---------------------------------------------------------------------------
# Listing data_state — POST /api/listings accepts only these two values
# ---------------------------------------------------------------------------
class ListingSubmitDataState(str, Enum):
    """Subset of DataState allowed when submitting a listing manually.
    'verified' can never come from this endpoint (API_CONTRACT.md).
    """
    reported = "reported"
    demo_synthetic = "demo_synthetic"


# ===========================================================================
# SHARED SMALL MODELS
# ===========================================================================

class _StrictBase(BaseModel):
    """Base model with extra='forbid' applied project-wide.

    All request and most response models inherit from this to ensure unknown
    fields are rejected rather than silently swallowed.
    """
    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# Translation entry (single language)
# ---------------------------------------------------------------------------
class TranslationEntry(BaseModel):
    """One language's name + optional description for a property/experience."""
    model_config = ConfigDict(extra="forbid")

    name: str
    description: Optional[str] = None


class Translations(BaseModel):
    """en/hi/mr translations. Missing language falls back to 'en' in the API."""
    model_config = ConfigDict(extra="forbid")

    en: TranslationEntry
    hi: Optional[TranslationEntry] = None
    mr: Optional[TranslationEntry] = None


# ---------------------------------------------------------------------------
# Checklist item — used for accessibility_items and sustainability_items
# ---------------------------------------------------------------------------
class ChecklistItem(BaseModel):
    """A single accessibility or sustainability checklist entry.

    value is Any because the contract uses bool, str, or null depending
    on the field. 'not_verified' entries always have value=None.
    C20 will enforce the null rule centrally at serialization time.
    """
    model_config = ConfigDict(extra="forbid")

    label: str
    value: Any = None  # bool | str | None — see DATA_MODEL.md
    data_state: DataState

    @model_validator(mode="after")
    def enforce_c20_not_verified(self):
        if self.data_state == DataState.not_verified and self.value is not None:
            self.value = None
        return self


# ---------------------------------------------------------------------------
# Emissions — two distinct shapes, never mixed (AGENTS.md §2.5)
# ---------------------------------------------------------------------------
class EmissionsEstimated(BaseModel):
    """Formula-based emissions: distance_km × emission_factor."""
    model_config = ConfigDict(extra="forbid")

    method: EmissionsMethod = EmissionsMethod.estimated
    co2e_kg: float
    distance_km: float
    emission_factor: float


class EmissionsRouteBenchmark(BaseModel):
    """Benchmark comparison emissions: this option vs. route typical value."""
    model_config = ConfigDict(extra="forbid")

    method: EmissionsMethod = EmissionsMethod.route_benchmark
    co2e_kg: float
    benchmark_kg: float
    reduction_pct: float


# Use a discriminated union so callers can tell them apart by 'method'.
Emissions = Union[EmissionsEstimated, EmissionsRouteBenchmark]


# ---------------------------------------------------------------------------
# Accessibility / scalar attribute — used at route level (not full checklist)
# ---------------------------------------------------------------------------
class AttributeWithState(BaseModel):
    """A single-value attribute that carries a data_state (e.g. accessibility on a route)."""
    model_config = ConfigDict(extra="forbid")

    value: Any = None
    data_state: DataState

    @model_validator(mode="after")
    def enforce_c20_not_verified(self):
        if self.data_state == DataState.not_verified and self.value is not None:
            self.value = None
        return self


# ---------------------------------------------------------------------------
# Transport segment
# ---------------------------------------------------------------------------
class Segment(BaseModel):
    """One leg of a multi-modal transport route."""
    model_config = ConfigDict(extra="forbid")

    type: str                               # e.g. "walk", "train", "flight"
    duration_minutes: Optional[int] = None
    distance_m: Optional[int] = None
    accessible: Optional[bool] = None
    data_state: DataState


# ===========================================================================
# NLU — POST /api/nlu/extract
# ===========================================================================

class NLURequest(_StrictBase):
    """Natural-language trip description submitted for LLM extraction."""
    text: str


class NLUExtracted(BaseModel):
    """Structured fields extracted from the natural-language input.

    Only fields explicitly stated in the text are populated here.
    The LLM must not silently infer adult_count, expand 'accessible' into
    specific checklist items, or default any missing field (AGENTS.md §2.3).
    """
    model_config = ConfigDict(extra="forbid")

    origin: Optional[str] = None
    destination: Optional[str] = None
    adult_count: Optional[int] = None
    children_count: Optional[int] = None
    senior_count: Optional[int] = None
    travel_date: Optional[str] = None
    # Coarse flags only — not expanded into specific checklist items
    accessibility_flags: Optional[List[str]] = None
    sustainability_preference: Optional[str] = None


class NLUAmbiguousField(BaseModel):
    """One field that was unclear or missing and requires a follow-up question."""
    model_config = ConfigDict(extra="forbid")

    field: str
    prompt: str


class NLUResponse(BaseModel):
    """Response from POST /api/nlu/extract."""
    model_config = ConfigDict(extra="forbid")

    extracted: NLUExtracted
    missing_or_ambiguous: List[NLUAmbiguousField] = Field(default_factory=list)


# ===========================================================================
# SEARCH — POST /api/search/transport
# ===========================================================================

class SearchWeights(_StrictBase):
    """Traveler priority weights — must not accept arbitrary weight keys."""
    environmental: Optional[float] = None
    accessibility: Optional[float] = None
    affordability: Optional[float] = None
    convenience: Optional[float] = None


class TransportSearchRequest(_StrictBase):
    origin: str
    destination: str
    budget_max: Optional[float] = None
    time_max_hours: Optional[float] = None
    accessibility_required: Optional[List[str]] = Field(default_factory=list)
    weights: Optional[SearchWeights] = None
    include_unverified: Optional[bool] = False


class TransportResult(BaseModel):
    """One transport option card returned by the recommendation engine."""
    model_config = ConfigDict(extra="forbid")

    id: str
    mode: str
    cost_inr: float
    duration_minutes: int
    emissions: Emissions
    accessibility: AttributeWithState
    personal_match_pct: Optional[float] = None
    trade_off_summary: List[str] = Field(default_factory=list)
    segments: List[Segment] = Field(default_factory=list)


class TransportSearchResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    results: List[TransportResult]


# ===========================================================================
# SEARCH — POST /api/search/accommodation
# ===========================================================================

class AccommodationSearchRequest(_StrictBase):
    destination_city: str
    budget_max: Optional[float] = None
    accessibility_required: Optional[List[str]] = Field(default_factory=list)
    weights: Optional[SearchWeights] = None
    include_unverified: Optional[bool] = False


class HotelResult(BaseModel):
    """One hotel card returned by the accommodation search."""
    model_config = ConfigDict(extra="forbid")

    id: str
    translations: Optional[Translations] = None
    city: Optional[str] = None
    price_inr_per_night: Optional[float] = None
    star_rating: Optional[int] = None
    data_state: DataState
    accessibility_items: List[ChecklistItem] = Field(default_factory=list)
    sustainability_items: List[ChecklistItem] = Field(default_factory=list)
    personal_match_pct: Optional[float] = None
    trade_off_summary: List[str] = Field(default_factory=list)


class AccommodationSearchResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    results: List[HotelResult]


# ===========================================================================
# LISTINGS — GET /api/listings/{id} and POST /api/listings
# ===========================================================================

class ListingCreateRequest(_StrictBase):
    """Manual listing creation — only 'reported' or 'demo_synthetic' accepted."""
    data_state: ListingSubmitDataState
    name: Optional[str] = None
    city: Optional[str] = None
    price_inr_per_night: Optional[float] = None
    star_rating: Optional[int] = None
    accessibility_items: List[ChecklistItem] = Field(default_factory=list)
    sustainability_items: List[ChecklistItem] = Field(default_factory=list)


class ListingCreateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str
    id: str
    data_state: ListingSubmitDataState
    note: str


class ListingDetailResponse(BaseModel):
    """Full listing detail — returned by GET /api/listings/{id}."""
    model_config = ConfigDict(extra="forbid")

    id: str
    data_state: DataState
    translations: Optional[Translations] = None
    city: Optional[str] = None
    price_inr_per_night: Optional[float] = None
    star_rating: Optional[int] = None
    accessibility_items: List[ChecklistItem] = Field(default_factory=list)
    sustainability_items: List[ChecklistItem] = Field(default_factory=list)
    reviews_count: Optional[int] = None
    confirmations_count: Optional[int] = None
    photos: List[str] = Field(default_factory=list)


# ===========================================================================
# EXPLORE — GET /api/explore/{city}
# ===========================================================================

class ExperienceTranslationEntry(BaseModel):
    """Experience name (description is optional for experiences)."""
    model_config = ConfigDict(extra="forbid")
    name: str
    description: Optional[str] = None


class ExperienceTranslations(BaseModel):
    model_config = ConfigDict(extra="forbid")
    en: ExperienceTranslationEntry
    hi: Optional[ExperienceTranslationEntry] = None
    mr: Optional[ExperienceTranslationEntry] = None


class ExperienceCard(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    translations: ExperienceTranslations
    accessibility: AttributeWithState
    environmental_impact: AttributeWithState
    cost_inr: float
    duration_minutes: int
    distance_km: float
    data_state: DataState


class ExploreResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    city: str
    experiences: List[ExperienceCard]


# ===========================================================================
# BUSINESS — POST /api/business/onboard
# ===========================================================================

class OnboardRequest(_StrictBase):
    name: Optional[str] = None
    city: Optional[str] = None
    price_band: Optional[str] = None
    star_rating: Optional[int] = None
    accessibility_items: Optional[List[ChecklistItem]] = Field(default_factory=list)
    sustainability_items: Optional[List[ChecklistItem]] = Field(default_factory=list)


class OnboardResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str
    business_id: str
    data_state: DataState
    note: str


# ===========================================================================
# BUSINESS — GET /api/business/{id}/analytics
# ===========================================================================

class AnalyticsFunnel(BaseModel):
    model_config = ConfigDict(extra="forbid")
    listing_impressions: int
    listing_opens: int
    detail_opens: int
    saves: int
    booking_starts: int
    bookings: int


class AnalyticsSignal(BaseModel):
    """A signal (correlation only — never causal) from the analytics engine."""
    model_config = ConfigDict(extra="forbid")
    type: str
    text: str


class BusinessAnalyticsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    period: str
    is_demo_data: bool
    funnel: AnalyticsFunnel
    signals: List[AnalyticsSignal] = Field(default_factory=list)


class AIAnalyticsInsight(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str
    description: str


class AIAnalyticsSummaryRequest(_StrictBase):
    period: str = "this_week"


class AIAnalyticsSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    summary: str
    key_findings: List[AIAnalyticsInsight]
    demand_insights: List[AIAnalyticsInsight]
    data_gaps: List[AIAnalyticsInsight]
    opportunities: List[AIAnalyticsInsight]
    next_actions: List[AIAnalyticsInsight]

# ===========================================================================
# BUSINESS — GET /api/business/{id}/demand
# ===========================================================================

class RequirementSearchCount(BaseModel):
    model_config = ConfigDict(extra="forbid")
    label: str
    count: int


class DemandGap(BaseModel):
    model_config = ConfigDict(extra="forbid")
    label: str
    count: int
    property_data_state: DataState


class BusinessDemandResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    period: str
    is_demo_data: bool
    requirement_search_counts: List[RequirementSearchCount]
    gaps: List[DemandGap]


# ===========================================================================
# BUSINESS — GET /api/business/{id}/opportunities
# ===========================================================================

class Opportunity(BaseModel):
    model_config = ConfigDict(extra="forbid")
    severity: str                   # "red" | "yellow"
    title: str
    suggested_action: str
    is_demo_data: bool
    type: str                       # "resource" | "demand_gap"
    estimate: Optional[str] = None  # e.g. "18 kg/day" for resource opportunities


class OpportunitiesResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    opportunities: List[Opportunity]


# ===========================================================================
# AI — POST /api/ai/inspect-property-image
# ===========================================================================

class BoundingBox(BaseModel):
    """Bounding box as [x, y, w, h] — four integers."""
    model_config = ConfigDict(extra="forbid")
    x: int
    y: int
    w: int
    h: int


class Detection(BaseModel):
    """One YOLO-World-S detected object.

    IMPORTANT: confidence is INTERNAL / ENGINEERING ONLY.
    It must NEVER be shown to travelers as an accessibility percentage.
    It does not represent or substitute for data_state.
    """
    model_config = ConfigDict(extra="forbid")

    label: str
    bbox: List[int] = Field(..., min_length=4, max_length=4)  # [x, y, w, h]
    confidence: float  # internal only — see rule above


class AiInspectResponse(BaseModel):
    """Response from POST /api/ai/inspect-property-image."""
    model_config = ConfigDict(extra="forbid")

    detections: List[Detection]
    image_filename: Optional[str] = None
    queries_received: List[str] = Field(default_factory=list)
    note: str


# ===========================================================================
# AI — POST /api/ai/confirm-detections
# ===========================================================================

class DetectionConfirmItem(_StrictBase):
    label: str
    confirmed: bool
    image_id: str


class ConfirmDetectionsRequest(_StrictBase):
    detections: List[DetectionConfirmItem]


class ConfirmDetectionsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str
    confirmed_labels: List[str]
    rejected_labels: List[str]
    note: str


# ===========================================================================
# ANALYTICS — POST /api/analytics/events
# ===========================================================================

class AnalyticsEventRequest(_StrictBase):
    business_id: str
    listing_id: str
    event_type: EventType           # Enum — invalid values rejected at Pydantic layer
    session_id: str
    timestamp: Optional[str] = None


class AnalyticsEventResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str
    event_type: EventType
    note: str


# ===========================================================================
# PAYMENTS — POST /api/booking/create-order
# ===========================================================================

class CreateOrderRequest(_StrictBase):
    amount_inr: float = Field(gt=0, description="Amount must be positive")
    currency: str = Field(pattern="^INR$", description="Only INR is supported")
    receipt_id: str = Field(min_length=1, description="Receipt ID is required")


class CreateOrderResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    order_id: str
    amount: int     # in paise (Razorpay convention)
    currency: str


# ===========================================================================
# PAYMENTS — POST /api/booking/verify-payment
# ===========================================================================

class VerifyPaymentRequest(_StrictBase):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class VerifyPaymentResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    payment_verified: bool
    reservation_status: ReservationStatus


# ===========================================================================
# CONFIRMATIONS — POST /api/confirmations
# ===========================================================================

class ConfirmationRequest(_StrictBase):
    hotel_id: str
    item_label: str
    confirmed: bool
    session_id: Optional[str] = None


class ConfirmationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str
    hotel_id: str
    item_label: str
    note: str
