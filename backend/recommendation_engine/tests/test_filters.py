"""Tests for recommendation_engine.filters"""

from app.models.schemas import ChecklistItem, DataState
from recommendation_engine.filters import (
    filter_candidates,
    passes_accessibility,
    passes_budget,
    passes_time,
)


class MockCandidate:
    """Simple dict-like object for testing filter logic."""
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)


# ===========================================================================
# BUDGET TESTS
# ===========================================================================

def test_1_budget_below_passes():
    cand = MockCandidate(cost_inr=1000)
    assert passes_budget(cand, 1500) is True


def test_2_budget_exact_passes():
    cand = MockCandidate(cost_inr=1500)
    assert passes_budget(cand, 1500) is True


def test_3_budget_above_fails():
    cand = MockCandidate(cost_inr=2000)
    assert passes_budget(cand, 1500) is False


# ===========================================================================
# TIME TESTS
# ===========================================================================

def test_4_time_below_passes():
    cand = MockCandidate(duration_minutes=90)
    assert passes_time(cand, 2.0) is True  # 2.0 hours = 120 mins


def test_5_time_exact_passes():
    cand = MockCandidate(duration_minutes=120)
    assert passes_time(cand, 2.0) is True


def test_6_time_above_fails():
    cand = MockCandidate(duration_minutes=130)
    assert passes_time(cand, 2.0) is False


# ===========================================================================
# ACCESSIBILITY TESTS
# ===========================================================================

def test_7_accessibility_all_satisfied_passes():
    cand = MockCandidate(
        accessibility_items=[
            ChecklistItem(label="step_free_entrance", value=True, data_state=DataState.reported),
            ChecklistItem(label="elevator", value=True, data_state=DataState.reported),
        ]
    )
    # Note: "step_free" maps to "step_free_entrance" via ACCESSIBILITY_LABEL_MAPPING
    reqs = ["step_free", "elevator"]
    assert passes_accessibility(cand, reqs, include_unverified=False) is True


def test_8_accessibility_one_false_fails():
    cand = MockCandidate(
        accessibility_items=[
            ChecklistItem(label="step_free_entrance", value=True, data_state=DataState.reported),
            ChecklistItem(label="elevator", value=False, data_state=DataState.reported),
        ]
    )
    reqs = ["step_free", "elevator"]
    assert passes_accessibility(cand, reqs, include_unverified=False) is False


def test_9_accessibility_one_not_verified_default_fails():
    cand = MockCandidate(
        accessibility_items=[
            ChecklistItem(label="step_free_entrance", value=True, data_state=DataState.reported),
            # not_verified fields must have null/None value per docs, but we also check data_state
            ChecklistItem(label="elevator", value=True, data_state=DataState.not_verified),
        ]
    )
    reqs = ["step_free", "elevator"]
    # Fails because include_unverified=False and data_state is not_verified
    assert passes_accessibility(cand, reqs, include_unverified=False) is False


def test_10_accessibility_multiple_and_semantics():
    cand = MockCandidate(
        accessibility_items=[
            ChecklistItem(label="step_free_entrance", value=True, data_state=DataState.reported),
        ]
    )
    # Candidate lacks 'elevator', so AND semantics mean it must fail
    reqs = ["step_free", "elevator"]
    assert passes_accessibility(cand, reqs, include_unverified=False) is False


# ===========================================================================
# INCLUDE_UNVERIFIED TESTS
# ===========================================================================

def test_11_not_verified_include_unverified_false_fails():
    cand = MockCandidate(
        accessibility_items=[
            ChecklistItem(label="elevator", value=True, data_state=DataState.not_verified),
        ]
    )
    assert passes_accessibility(cand, ["elevator"], include_unverified=False) is False


def test_12_not_verified_include_unverified_true_passes():
    cand = MockCandidate(
        accessibility_items=[
            # If the user explicitly asks for unverified, it matches even though value is None
            ChecklistItem(label="elevator", data_state=DataState.not_verified),
        ]
    )
    assert passes_accessibility(cand, ["elevator"], include_unverified=True) is True


def test_13_include_unverified_does_not_bypass_budget():
    cand = MockCandidate(
        cost_inr=2000,
        accessibility_items=[
            ChecklistItem(label="elevator", data_state=DataState.not_verified),
        ]
    )
    filtered = filter_candidates(
        [cand],
        budget_max=1000,
        accessibility_required=["elevator"],
        include_unverified=True,
    )
    # Should still be excluded because cost 2000 > budget 1000
    assert len(filtered) == 0


def test_14_include_unverified_does_not_bypass_time():
    cand = MockCandidate(
        duration_minutes=300,
        accessibility_items=[
            ChecklistItem(label="elevator", value=True, data_state=DataState.not_verified),
        ]
    )
    filtered = filter_candidates(
        [cand],
        time_max_hours=2.0,
        accessibility_required=["elevator"],
        include_unverified=True,
    )
    # Excluded because 300 mins > 120 mins
    assert len(filtered) == 0


# ===========================================================================
# MISSING DATA TESTS
# ===========================================================================

def test_15_missing_cost_fails_conservatively():
    # Candidate has no cost_inr or price_inr_per_night
    cand = MockCandidate(duration_minutes=60)
    filtered = filter_candidates([cand], budget_max=1000)
    assert len(filtered) == 0


def test_16_missing_duration_fails_conservatively():
    cand = MockCandidate(cost_inr=500)
    filtered = filter_candidates([cand], time_max_hours=2.0)
    assert len(filtered) == 0


def test_17_missing_accessibility_fails():
    cand = MockCandidate(cost_inr=500, duration_minutes=60)
    # Lacks accessibility_items entirely
    filtered = filter_candidates([cand], accessibility_required=["elevator"])
    assert len(filtered) == 0


# ===========================================================================
# ZERO RESULTS TESTS
# ===========================================================================

def test_18_no_matching_candidate_returns_empty_list():
    cands = [
        MockCandidate(cost_inr=2000),
        MockCandidate(cost_inr=3000),
    ]
    filtered = filter_candidates(cands, budget_max=1500)
    assert filtered == []


def test_19_no_mandatory_accessibility_returns_empty_list():
    cands = [
        MockCandidate(
            cost_inr=1000, 
            accessibility_items=[
                ChecklistItem(label="step_free_entrance", value=True, data_state=DataState.reported)
            ]
        ),
    ]
    # No candidates have 'elevator'
    filtered = filter_candidates(cands, budget_max=1500, accessibility_required=["elevator"])
    assert filtered == []
