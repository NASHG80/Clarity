"""Tests for the experimental ML re-ranker integration.

Covers Phases 7 and 8 requirements:
  - ML disabled → rule-based ranking
  - ML enabled → re-ranker called and used
  - model missing → rule-based fallback
  - ML inference exception → rule-based fallback
  - empty candidate list → empty result
  - one candidate → unchanged
  - not_verified data_state preserved through ML pass
  - missing accessibility never treated as verified evidence
  - missing sustainability never guessed as zero evidence
  - data-state priority intact
  - ml_score never present in ranked result dicts (contract-safe)
  - candidate membership and count unchanged by ML
"""
import pytest
import numpy as np
from unittest.mock import patch, MagicMock, AsyncMock
from recommendation_engine.rank import rank_candidates
from recommendation_engine.ml.features import (
    extract_features,
    STATE_PRIORITY,
    UNKNOWN_STATE_PRIORITY,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_candidate(id_val, data_state="reported", sub_scores=None):
    """Build a minimal ranked-candidate dict as produced by rank.rank_candidates."""
    return {
        "id": id_val,
        "data_state": data_state,
        "score": 0.5,
        "personal_match_pct": 50,
        "sub_scores": sub_scores or {},
        "original_index": 0,
        "rank": 1,
    }

class MockCandidate(dict):
    def __init__(self, id_val, data_state="reported"):
        super().__init__()
        self["id"] = id_val
        self["data_state"] = data_state


# ---------------------------------------------------------------------------
# Phase 7 — Fallback tests
# ---------------------------------------------------------------------------

def test_1_ml_disabled_returns_normal_rule_ranking():
    """ML_ENABLED=False: re_rank_candidates never called, rule order preserved."""
    cands = [MockCandidate("1"), MockCandidate("2")]
    subs = [{"environmental": 0.5}, {"environmental": 0.9}]

    with patch("recommendation_engine.config.ML_ENABLED", False):
        with patch("recommendation_engine.ml.predict.re_rank_candidates") as mock_predict:
            ranked = rank_candidates(cands, subs, {"environmental": 1.0})
            assert not mock_predict.called
            assert ranked[0]["id"] == "2"   # 0.9 beats 0.5


def test_2_ml_enabled_calls_re_ranker():
    """ML_ENABLED=True: re_rank_candidates is called and its result is used."""
    cands = [MockCandidate("1"), MockCandidate("2")]
    subs = [{"environmental": 0.5}, {"environmental": 0.9}]

    with patch("recommendation_engine.config.ML_ENABLED", True):
        with patch("recommendation_engine.ml.predict.re_rank_candidates") as mock_predict:
            mock_predict.return_value = [{"id": "1"}, {"id": "2"}]
            ranked = rank_candidates(cands, subs, {"environmental": 1.0})
            assert mock_predict.called
            assert ranked[0]["id"] == "1"


def test_3_ml_inference_exception_falls_back():
    """If ML inference raises any exception, rule-based order is returned unchanged."""
    cands = [MockCandidate("1"), MockCandidate("2")]
    subs = [{"environmental": 0.5}, {"environmental": 0.9}]

    with patch("recommendation_engine.config.ML_ENABLED", True):
        with patch("recommendation_engine.ml.predict.extract_features",
                   side_effect=Exception("ML crash")):
            ranked = rank_candidates(cands, subs, {"environmental": 1.0})
            assert ranked[0]["id"] == "2"
            assert ranked[1]["id"] == "1"


def test_4_model_missing_falls_back():
    """If model.pkl does not exist, rule-based order is returned unchanged."""
    cands = [MockCandidate("1"), MockCandidate("2")]
    subs = [{"environmental": 0.5}, {"environmental": 0.9}]

    with patch("recommendation_engine.config.ML_ENABLED", True):
        with patch("recommendation_engine.ml.predict.load_model", return_value=None):
            ranked = rank_candidates(cands, subs, {"environmental": 1.0})
            assert ranked[0]["id"] == "2"


def test_5_empty_candidate_list():
    """Empty input → empty output, no crash."""
    ranked = rank_candidates([], [], None)
    assert ranked == []


def test_6_one_candidate():
    """Single candidate is returned unchanged."""
    ranked = rank_candidates([MockCandidate("1")], [{"environmental": 0.5}], None)
    assert len(ranked) == 1
    assert ranked[0]["id"] == "1"


# ---------------------------------------------------------------------------
# Phase 8 — not_verified / data-state integrity tests
# ---------------------------------------------------------------------------

def test_7_not_verified_data_state_preserved_through_ranking():
    """data_state='not_verified' on a candidate is never mutated by rank_candidates."""
    cands = [MockCandidate("1", "not_verified")]
    subs = [{"environmental": 0.5}]
    ranked = rank_candidates(cands, subs, {"environmental": 1.0})
    assert ranked[0]["data_state"] == "not_verified"


def test_8_not_verified_state_priority_is_zero():
    """STATE_PRIORITY maps not_verified to 0.0, NOT to a positive number."""
    assert STATE_PRIORITY["not_verified"] == 0.0


def test_9_unknown_state_priority_is_zero():
    """An unrecognised or None data_state maps to UNKNOWN_STATE_PRIORITY=0.0."""
    assert UNKNOWN_STATE_PRIORITY == 0.0
    cand = _make_candidate("x", data_state=None)
    weights = {"environmental": 0.25, "accessibility": 0.25,
               "affordability": 0.25, "convenience": 0.25}
    feat = extract_features(cand, weights)
    assert feat[8] == 0.0   # f8_state_prio


def test_10_missing_accessibility_score_does_not_become_evidence():
    """
    When acc_score is None (not_verified), features.py maps it to 0.0.
    The DOCUMENTED limitation: this is identical to a verified-false score.
    What must NOT happen: the code must not infer or assert accessibility is present.
    This test verifies the raw mapping only — 0.0 from None.
    """
    cand = _make_candidate("x", data_state="not_verified",
                           sub_scores={"accessibility": None})
    weights = {"environmental": 0.25, "accessibility": 0.25,
               "affordability": 0.25, "convenience": 0.25}
    feat = extract_features(cand, weights)
    # f1 must be 0.0 (not_verified -> None -> 0.0 per documented limitation)
    assert feat[1] == 0.0
    # f8 must be 0.0 (not_verified state priority)
    assert feat[8] == 0.0


def test_11_missing_sustainability_score_does_not_become_positive():
    """
    When env_score is None (not_verified sustainability data),
    it maps to 0.0 — never to a positive non-zero value.
    """
    cand = _make_candidate("x", data_state="not_verified",
                           sub_scores={"environmental": None})
    weights = {"environmental": 1.0, "accessibility": 0.0,
               "affordability": 0.0, "convenience": 0.0}
    feat = extract_features(cand, weights)
    assert feat[0] == 0.0   # f0_env_score must be 0.0, never positive from None


def test_12_verified_state_priority_is_highest():
    """verified must have higher state_prio than all other states."""
    assert STATE_PRIORITY["verified"] > STATE_PRIORITY["reported"]
    assert STATE_PRIORITY["verified"] > STATE_PRIORITY["community_confirmed"]
    assert STATE_PRIORITY["verified"] > STATE_PRIORITY["demo_synthetic"]
    assert STATE_PRIORITY["verified"] > STATE_PRIORITY["not_verified"]


def test_13_demo_synthetic_still_gets_nonzero_state_prio():
    """demo_synthetic is still distinguishable from not_verified via state_prio."""
    assert STATE_PRIORITY["demo_synthetic"] > STATE_PRIORITY["not_verified"]


def test_14_candidate_count_unchanged_by_ml():
    """ML re-ranking must never add or remove candidates."""
    from recommendation_engine.ml.predict import re_rank_candidates
    import os, pickle
    model_path = os.path.join(
        os.path.dirname(__file__), "..", "ml", "model.pkl"
    )
    if not os.path.exists(model_path):
        pytest.skip("model.pkl not present; skipping runtime integration test")

    cands = [
        _make_candidate("a", "reported",    {"environmental": 0.9, "accessibility": 0.8,
                                              "affordability": 0.7, "convenience": 0.6}),
        _make_candidate("b", "not_verified", {"environmental": 0.1, "accessibility": None,
                                               "affordability": 0.9, "convenience": 0.9}),
        _make_candidate("c", "verified",    {"environmental": 0.6, "accessibility": 1.0,
                                              "affordability": 0.5, "convenience": 0.5}),
    ]
    weights = {"environmental": 0.25, "accessibility": 0.25,
               "affordability": 0.25, "convenience": 0.25}

    result = re_rank_candidates(cands, weights)
    assert len(result) == 3
    ids_in = {c["id"] for c in cands}
    ids_out = {c["id"] for c in result}
    assert ids_in == ids_out


def test_15_ml_score_not_in_public_result():
    """
    ml_score is an internal sorting key only.
    After re-ranking with ML enabled, ml_score may be present in the
    intermediate dict but must NEVER appear in API response schemas
    (Pydantic extra=forbid ensures this at the route level).
    This test verifies the field is at most an internal implementation detail.
    """
    # Verify that TransportResult / HotelResult schemas reject ml_score
    from app.models.schemas import TransportResult, DataState
    import pytest
    with pytest.raises(Exception):
        TransportResult(
            id="r1",
            mode="train",
            origin="A",
            destination="B",
            cost_inr=1000,
            duration_minutes=120,
            data_state=DataState.reported,
            ml_score=0.99,   # must be rejected
        )


def test_16_accessibility_fields_unchanged_by_ml():
    """
    accessibility_items on a candidate are not mutated by the ML re-ranker.
    """
    from recommendation_engine.ml.predict import re_rank_candidates
    import os
    model_path = os.path.join(
        os.path.dirname(__file__), "..", "ml", "model.pkl"
    )
    if not os.path.exists(model_path):
        pytest.skip("model.pkl not present")

    original_items = [{"label": "step_free_entrance", "value": True,
                        "data_state": "reported"}]
    cand = _make_candidate("x", "reported",
                           {"environmental": 0.5, "accessibility": 0.8,
                            "affordability": 0.6, "convenience": 0.7})
    cand["accessibility_items"] = original_items

    weights = {"environmental": 0.25, "accessibility": 0.25,
               "affordability": 0.25, "convenience": 0.25}
    result = re_rank_candidates([cand], weights)
    assert result[0]["accessibility_items"] == original_items
