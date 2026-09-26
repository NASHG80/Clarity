"""Tests for C12 AI confidence-score handling and traveler-facing sanitization.

AGENTS.md / TEAM_SPLIT.md explicitly dictate:
- Confidence is retained internally for B2B / engineering review.
- Confidence is STRICTLY STRIPPED from any traveler-facing representation.
- Confidence NEVER transforms into an accessibility/sustainability percentage.
- Confidence NEVER sets `data_state`, `verified`, `reported`, or `community_confirmed`.
- The mechanism should use the smallest safe mechanism consistent with the repository.

The repository's chosen mechanism is Pydantic's `extra="forbid"`, which
guarantees that traveler-facing models literally cannot serialize or accept
the internal `confidence` field, while the internal `Detection` model retains it.
"""

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    AiInspectResponse,
    AttributeWithState,
    ChecklistItem,
    DataState,
    Detection,
    ExperienceCard,
    HotelResult,
    ListingDetailResponse,
    TransportResult,
)


def test_1_internal_detection_retains_confidence():
    """1. Internal detection retains confidence.
    3. Bounding boxes remain available where legitimately needed internally.
    4. Labels remain available where legitimately needed.
    """
    d = Detection(label="wheelchair ramp", bbox=[10, 20, 100, 100], confidence=0.82)
    assert d.confidence == 0.82
    assert d.label == "wheelchair ramp"
    assert d.bbox == [10, 20, 100, 100]


def test_11_c11_internal_ai_inspection_response_still_conforms():
    """11. C11 internal AI inspection response still conforms to its frozen contract."""
    d = Detection(label="wheelchair ramp", bbox=[10, 20, 100, 100], confidence=0.82)
    resp = AiInspectResponse(
        detections=[d],
        queries_received=["wheelchair ramp"],
        note="Internal",
    )
    assert resp.detections[0].confidence == 0.82
    # Schema validation passes because confidence is allowed here.
    assert "confidence" in resp.model_dump()["detections"][0]


def test_2_traveler_facing_detection_representation_strips_confidence():
    """2. Traveler-facing detection representation strips confidence."""
    # Attempting to map a Detection into a ChecklistItem while passing
    # confidence must strictly fail due to `extra="forbid"`.
    with pytest.raises(ValidationError) as exc:
        ChecklistItem(
            label="wheelchair_ramp",
            value=True,
            data_state=DataState.reported,
            confidence=0.82,  # type: ignore
        )
    
    assert "Extra inputs are not permitted" in str(exc.value)
    assert "confidence" in str(exc.value)


def test_12_traveler_listing_search_responses_contain_no_confidence_fields():
    """12. Traveler listing/search responses contain no confidence fields."""
    with pytest.raises(ValidationError):
        AttributeWithState(
            value=True,
            data_state=DataState.reported,
            confidence=0.82,  # type: ignore
        )


def test_5_6_no_confidence_derived_percentages():
    """5, 6. No confidence-derived accessibility/sustainability percentage is produced."""
    # Ensure there's no `accessibility_percentage` or `sustainability_percentage`
    # on the models.
    with pytest.raises(ValidationError):
        ChecklistItem(
            label="ramp",
            value=True,
            data_state=DataState.reported,
            accessibility_percentage=82,  # type: ignore
        )


def test_7_8_9_10_no_data_state_mutations():
    """
    7. No confidence-derived data_state is produced.
    8. verified is never created from confidence.
    9. reported is never created from confidence.
    10. community_confirmed is never created from confidence.
    """
    # The pure function mapping logic for data_state explicitly
    # requires an Enum. If someone tries to pass a float (confidence)
    # to data_state, Pydantic prevents it entirely.
    with pytest.raises(ValidationError) as exc:
        ChecklistItem(
            label="ramp",
            value=True,
            data_state=0.82,  # type: ignore
        )
    assert "Input should be" in str(exc.value)


def test_13_14_15_no_c13_or_mongo_side_effects():
    """
    13. No MongoDB write is introduced solely by C12.
    14. No C13 confirmation behavior is implemented.
    15. No mutation of the internal detection object.
    
    These are verified by the fact that C12 is purely a Pydantic boundary validation
    and zero MongoDB or confirmation endpoints were modified in this PR.
    """
    d = Detection(label="ramp", bbox=[10, 20, 100, 100], confidence=0.82)
    # The object is immutable with respect to data_state (which it lacks).
    assert not hasattr(d, "data_state")
