"""Tests for the experimental ML re-ranker integration.

Verifies Phase 8 requirements:
- ML disabled works
- ML enabled works
- model missing/failure falls back gracefully
- Filters and data-states are preserved
"""
import pytest
from unittest.mock import patch, MagicMock
from recommendation_engine.rank import rank_candidates
from recommendation_engine.config import ML_ENABLED

class MockCandidate(dict):
    def __init__(self, id_val, data_state="reported"):
        super().__init__()
        self["id"] = id_val
        self["data_state"] = data_state

def test_1_ml_disabled_returns_normal_rule_ranking():
    cands = [MockCandidate("1"), MockCandidate("2")]
    subs = [{"environmental": 0.5}, {"environmental": 0.9}]
    
    with patch("recommendation_engine.config.ML_ENABLED", False):
        with patch("recommendation_engine.ml.predict.re_rank_candidates") as mock_predict:
            ranked = rank_candidates(cands, subs, {"environmental": 1.0})
            assert not mock_predict.called
            assert ranked[0]["id"] == "2" # 0.9 beats 0.5 normally

def test_2_ml_enabled_calls_re_ranker():
    cands = [MockCandidate("1"), MockCandidate("2")]
    subs = [{"environmental": 0.5}, {"environmental": 0.9}]
    
    with patch("recommendation_engine.config.ML_ENABLED", True):
        with patch("recommendation_engine.ml.predict.re_rank_candidates") as mock_predict:
            # Mock the re_ranker to invert the order just to prove it was called and used
            mock_predict.return_value = [{"id": "1"}, {"id": "2"}]
            ranked = rank_candidates(cands, subs, {"environmental": 1.0})
            assert mock_predict.called
            assert ranked[0]["id"] == "1"

def test_3_ml_inference_failure_falls_back_gracefully():
    cands = [MockCandidate("1"), MockCandidate("2")]
    subs = [{"environmental": 0.5}, {"environmental": 0.9}]
    
    with patch("recommendation_engine.config.ML_ENABLED", True):
        # Actual re_rank_candidates will throw an exception internally 
        # or we can mock it to throw exception
        with patch("recommendation_engine.ml.predict.extract_features", side_effect=Exception("ML crash")):
            ranked = rank_candidates(cands, subs, {"environmental": 1.0})
            # Must fall back to rule-based order
            assert ranked[0]["id"] == "2"
            assert ranked[1]["id"] == "1"

def test_4_model_missing_returns_gracefully():
    cands = [MockCandidate("1"), MockCandidate("2")]
    subs = [{"environmental": 0.5}, {"environmental": 0.9}]
    
    with patch("recommendation_engine.config.ML_ENABLED", True):
        with patch("recommendation_engine.ml.predict.load_model", return_value=None):
            ranked = rank_candidates(cands, subs, {"environmental": 1.0})
            # Falls back to rule-based
            assert ranked[0]["id"] == "2"

def test_5_ml_preserves_not_verified_state():
    cands = [MockCandidate("1", "not_verified")]
    subs = [{"environmental": 0.5}]
    
    ranked = rank_candidates(cands, subs, {"environmental": 1.0})
    assert ranked[0]["data_state"] == "not_verified"
    
def test_6_empty_candidate_list():
    ranked = rank_candidates([], [], None)
    assert ranked == []

def test_7_one_candidate():
    ranked = rank_candidates([MockCandidate("1")], [{"environmental": 0.5}], None)
    assert len(ranked) == 1
    assert ranked[0]["id"] == "1"
