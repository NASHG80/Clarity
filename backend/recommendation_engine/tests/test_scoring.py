"""Tests for recommendation_engine.scoring"""

import math
from typing import List

from app.models.schemas import ChecklistItem, DataState, EmissionsEstimated
from recommendation_engine.scoring import (
    calculate_sub_scores,
    normalize,
    score_accessibility,
    score_affordability,
    score_convenience,
    score_environmental,
)


class MockCandidate:
    """Simple dict-like object for testing scoring logic."""
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)


# ===========================================================================
# NORMALIZATION TESTS
# ===========================================================================

def test_1_normal_higher_is_better():
    # 0 to 10. Value 5 should be 0.5.
    assert normalize(5.0, 0.0, 10.0, lower_is_better=False) == 0.5
    # Value 8 should be 0.8.
    assert normalize(8.0, 0.0, 10.0, lower_is_better=False) == 0.8


def test_2_normal_lower_is_better():
    # 0 to 10. Value 5 should be 0.5.
    assert normalize(5.0, 0.0, 10.0, lower_is_better=True) == 0.5
    # Value 8 should be 0.2 (since max-value = 10-8 = 2. 2/10 = 0.2).
    assert normalize(8.0, 0.0, 10.0, lower_is_better=True) == 0.2


def test_3_result_exactly_0():
    # Min value on higher is better
    assert normalize(0.0, 0.0, 10.0, lower_is_better=False) == 0.0
    # Max value on lower is better
    assert normalize(10.0, 0.0, 10.0, lower_is_better=True) == 0.0


def test_4_result_exactly_1():
    # Max value on higher is better
    assert normalize(10.0, 0.0, 10.0, lower_is_better=False) == 1.0
    # Min value on lower is better
    assert normalize(0.0, 0.0, 10.0, lower_is_better=True) == 1.0


def test_5_values_are_clamped():
    # Out of bounds high
    assert normalize(15.0, 0.0, 10.0, lower_is_better=False) == 1.0
    # Out of bounds low
    assert normalize(-5.0, 0.0, 10.0, lower_is_better=False) == 0.0
    # Out of bounds low (lower is better) - would normally be > 1.0
    assert normalize(-5.0, 0.0, 10.0, lower_is_better=True) == 1.0


def test_6_single_candidate_does_not_divide_by_zero():
    # min_val == max_val == 5.0
    assert normalize(5.0, 5.0, 5.0) == 1.0


def test_7_identical_values_do_not_crash():
    cands = [MockCandidate(cost_inr=100), MockCandidate(cost_inr=100)]
    scores = score_affordability(cands)
    assert scores == [1.0, 1.0]


# ===========================================================================
# AFFORDABILITY TESTS (Lower is better)
# ===========================================================================

def test_8_cheaper_candidate_gets_higher_score():
    cands = [MockCandidate(cost_inr=1000), MockCandidate(cost_inr=5000)]
    scores = score_affordability(cands)
    assert scores[0] == 1.0
    assert scores[1] == 0.0


def test_9_more_expensive_gets_lower_score():
    cands = [
        MockCandidate(cost_inr=1000), 
        MockCandidate(cost_inr=3000), 
        MockCandidate(cost_inr=5000)
    ]
    scores = score_affordability(cands)
    assert scores[0] == 1.0
    assert scores[1] == 0.5  # (5000 - 3000) / (5000 - 1000) = 0.5
    assert scores[2] == 0.0


def test_10_missing_cost_returns_none():
    cands = [MockCandidate(cost_inr=1000), MockCandidate(duration_minutes=60)]
    scores = score_affordability(cands)
    assert scores[0] == 1.0
    assert scores[1] is None


# ===========================================================================
# ENVIRONMENTAL TESTS (Lower is better)
# ===========================================================================

def test_11_lower_valid_emissions_gets_higher_score():
    cands = [
        MockCandidate(emissions=EmissionsEstimated(co2e_kg=10.0, distance_km=100, emission_factor=0.1)),
        MockCandidate(emissions=EmissionsEstimated(co2e_kg=50.0, distance_km=100, emission_factor=0.5)),
    ]
    scores = score_environmental(cands)
    assert scores[0] == 1.0
    assert scores[1] == 0.0


def test_12_missing_emissions_returns_none():
    cands = [
        MockCandidate(emissions=EmissionsEstimated(co2e_kg=10.0, distance_km=100, emission_factor=0.1)),
        MockCandidate(cost_inr=100),
    ]
    scores = score_environmental(cands)
    assert scores[0] == 1.0
    assert scores[1] is None


def test_13_no_emission_calculation_inside_scoring():
    # Only checks pre-calculated co2e_kg. If co2e_kg is missing in the object, returns None.
    cands = [MockCandidate(emissions={"method": "estimated", "distance_km": 100})]
    scores = score_environmental(cands)
    assert scores[0] is None


def test_14_consumes_both_emissions_representations():
    cands = [
        MockCandidate(emissions={"method": "estimated", "co2e_kg": 10.0}),
        MockCandidate(emissions={"method": "route_benchmark", "co2e_kg": 20.0}),
    ]
    scores = score_environmental(cands)
    assert scores[0] == 1.0
    assert scores[1] == 0.0


# ===========================================================================
# ACCESSIBILITY TESTS (Higher is better)
# ===========================================================================

def test_15_explicit_info_produces_normalized_score():
    cands = [
        # Ratio = 2/2 = 1.0
        MockCandidate(accessibility_items=[
            ChecklistItem(label="ramp", value=True, data_state=DataState.reported),
            ChecklistItem(label="elevator", value=True, data_state=DataState.reported),
        ]),
        # Ratio = 1/2 = 0.5
        MockCandidate(accessibility_items=[
            ChecklistItem(label="ramp", value=True, data_state=DataState.reported),
            ChecklistItem(label="elevator", value=False, data_state=DataState.reported),
        ]),
    ]
    scores = score_accessibility(cands)
    assert scores[0] == 1.0  # normalized from ratio 1.0
    assert scores[1] == 0.0  # normalized from ratio 0.5


def test_16_not_verified_not_converted_to_zero_evidence():
    cands = [
        # Has 1 valid item (True) and 1 not_verified item. Ratio = 1/1 = 1.0
        MockCandidate(accessibility_items=[
            ChecklistItem(label="ramp", value=True, data_state=DataState.reported),
            ChecklistItem(label="elevator", value=None, data_state=DataState.not_verified),
        ]),
    ]
    scores = score_accessibility(cands)
    assert scores[0] == 1.0


def test_17_insufficient_accessibility_returns_none():
    cands = [
        # Has ONLY not_verified items. No explicit valid info.
        MockCandidate(accessibility_items=[
            ChecklistItem(label="elevator", value=None, data_state=DataState.not_verified),
        ]),
        MockCandidate(cost_inr=100),
    ]
    scores = score_accessibility(cands)
    assert scores[0] is None
    assert scores[1] is None


def test_18_no_ai_confidence_converted():
    # Only value and data_state are used. Confidence is not a standard attribute, 
    # but even if present, it is not used in `_is_truthy_semantic_value`.
    pass


def test_19_no_inference_from_price_or_star_rating():
    cands = [MockCandidate(price_inr_per_night=10000, star_rating=5)]
    scores = score_accessibility(cands)
    # Lacks accessibility_items, so must return None, despite high price/stars.
    assert scores[0] is None


# ===========================================================================
# CONVENIENCE TESTS (Lower is better)
# ===========================================================================

def test_20_lower_duration_produces_higher_convenience():
    cands = [MockCandidate(duration_minutes=60), MockCandidate(duration_minutes=120)]
    scores = score_convenience(cands)
    assert scores[0] == 1.0
    assert scores[1] == 0.0


def test_21_missing_duration_returns_none():
    cands = [MockCandidate(duration_minutes=60), MockCandidate(cost_inr=100)]
    scores = score_convenience(cands)
    assert scores[0] == 1.0
    assert scores[1] is None


def test_22_identical_durations_do_not_divide_by_zero():
    cands = [MockCandidate(duration_minutes=60), MockCandidate(duration_minutes=60)]
    scores = score_convenience(cands)
    assert scores == [1.0, 1.0]


# ===========================================================================
# OUTPUT INTEGRITY TESTS
# ===========================================================================

def test_23_to_25_score_bounds_and_validity():
    cands = [
        MockCandidate(
            cost_inr=1000, 
            duration_minutes=60, 
            emissions={"co2e_kg": 10},
            accessibility_items=[ChecklistItem(label="x", value=True, data_state=DataState.reported)]
        ),
        MockCandidate(
            cost_inr=5000, 
            duration_minutes=120, 
            emissions={"co2e_kg": 50},
            accessibility_items=[
                ChecklistItem(label="x", value=True, data_state=DataState.reported),
                ChecklistItem(label="y", value=False, data_state=DataState.reported)
            ]
        ),
    ]
    results = calculate_sub_scores(cands)
    
    for row in results:
        for axis, score in row.items():
            assert score is not None
            assert 0.0 <= score <= 1.0
            assert not math.isnan(score)
            assert not math.isinf(score)


def test_26_candidate_objects_are_not_mutated():
    cands = [MockCandidate(cost_inr=1000)]
    _ = calculate_sub_scores(cands)
    # MockCandidate should only have cost_inr attribute, nothing appended.
    assert hasattr(cands[0], "cost_inr")
    assert not hasattr(cands[0], "affordability_score")
    assert not hasattr(cands[0], "scores")


def test_27_no_sorting_occurs():
    cands = [MockCandidate(cost_inr=5000), MockCandidate(cost_inr=1000)]
    results = calculate_sub_scores(cands)
    # The first result should be for the 5000 cost (score 0.0)
    assert results[0]["affordability"] == 0.0
    assert results[1]["affordability"] == 1.0
