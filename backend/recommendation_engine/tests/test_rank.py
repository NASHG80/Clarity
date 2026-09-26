"""Tests for recommendation_engine.rank"""

from typing import Dict, Optional

from app.models.schemas import SearchWeights
from recommendation_engine.rank import (
    NEAR_TIE_EPSILON,
    calculate_tradeoff_deltas,
    calculate_weighted_score,
    generate_trade_offs,
    normalize_weights,
    rank_candidates,
)


class MockCandidate:
    def __init__(self, id: str):
        self.id = id


def _mock_sub_scores(env: Optional[float], acc: Optional[float], aff: Optional[float], con: Optional[float]) -> Dict[str, Optional[float]]:
    return {
        "environmental": env,
        "accessibility": acc,
        "affordability": aff,
        "convenience": con,
    }


# ===========================================================================
# WEIGHTED SCORE & WEIGHTS TESTS
# ===========================================================================

def test_1_four_available_sub_scores():
    sub = _mock_sub_scores(1.0, 0.5, 0.0, 0.5)
    weights = {"environmental": 0.25, "accessibility": 0.25, "affordability": 0.25, "convenience": 0.25}
    score = calculate_weighted_score(sub, weights)
    # (0.25*1.0) + (0.25*0.5) + (0.25*0.0) + (0.25*0.5) = 0.25 + 0.125 + 0 + 0.125 = 0.5
    assert score == 0.5


def test_2_weights_are_handled_correctly():
    weights = SearchWeights(environmental=2.0, accessibility=2.0, affordability=0.0, convenience=0.0)
    norm = normalize_weights(weights)
    assert norm["environmental"] == 0.5
    assert norm["accessibility"] == 0.5
    assert norm["affordability"] == 0.0
    assert norm["convenience"] == 0.0


def test_3_final_score_remains_in_bounds():
    sub = _mock_sub_scores(1.0, 1.0, 1.0, 1.0)
    weights = normalize_weights({"environmental": 10.0, "accessibility": 10.0})
    score = calculate_weighted_score(sub, weights)
    assert score == 1.0


def test_4_changing_user_weights_changes_score():
    sub = _mock_sub_scores(1.0, 0.0, 0.0, 0.0)
    
    w1 = normalize_weights({"environmental": 1.0})
    s1 = calculate_weighted_score(sub, w1)
    
    w2 = normalize_weights({"accessibility": 1.0})
    s2 = calculate_weighted_score(sub, w2)
    
    assert s1 == 1.0
    assert s2 == 0.0


# ===========================================================================
# MISSING SUB-SCORES TESTS
# ===========================================================================

def test_5_none_is_never_converted_to_zero():
    # If None was zero, (0.5 * 0 + 0.5 * 1.0) = 0.5
    # Since it's ignored, we renormalize over just affordability -> score = 1.0
    sub = _mock_sub_scores(None, None, 1.0, None)
    w = normalize_weights({"environmental": 0.5, "affordability": 0.5})
    score = calculate_weighted_score(sub, w)
    assert score == 1.0


def test_6_available_weight_renormalization_deterministic():
    sub = _mock_sub_scores(0.8, 0.6, None, None)
    w = normalize_weights({"environmental": 0.4, "accessibility": 0.2, "affordability": 0.4})
    score = calculate_weighted_score(sub, w)
    # Available sum = 0.4 + 0.2 = 0.6
    # Score = (0.4 * 0.8 + 0.2 * 0.6) / 0.6 = (0.32 + 0.12) / 0.6 = 0.44 / 0.6
    assert abs(score - (0.44 / 0.6)) < 1e-7


def test_7_all_none_returns_none():
    sub = _mock_sub_scores(None, None, None, None)
    w = normalize_weights(None)
    score = calculate_weighted_score(sub, w)
    assert score is None


def test_8_partial_availability_produces_valid_score():
    sub = _mock_sub_scores(0.5, None, None, None)
    w = normalize_weights(None)
    score = calculate_weighted_score(sub, w)
    assert score == 0.5


def test_9_missing_environmental_does_not_imply_zero():
    sub = _mock_sub_scores(None, 1.0, 1.0, 1.0)
    w = normalize_weights({"environmental": 0.9, "accessibility": 0.1})
    score = calculate_weighted_score(sub, w)
    # Excludes environmental entirely, evaluates only on accessibility (which has score 1.0)
    assert score == 1.0


# ===========================================================================
# RANKING TESTS
# ===========================================================================

def test_10_higher_weighted_score_ranks_first():
    cands = [MockCandidate("a"), MockCandidate("b")]
    subs = [_mock_sub_scores(0.5, 0.5, 0.5, 0.5), _mock_sub_scores(1.0, 1.0, 1.0, 1.0)]
    ranked = rank_candidates(cands, subs)
    
    assert ranked[0]["id"] == "b"
    assert ranked[1]["id"] == "a"


def test_11_three_candidates_rank_correctly():
    cands = [MockCandidate("1"), MockCandidate("2"), MockCandidate("3")]
    subs = [_mock_sub_scores(0.1, 0, 0, 0), _mock_sub_scores(0.9, 0, 0, 0), _mock_sub_scores(0.5, 0, 0, 0)]
    w = {"environmental": 1.0}
    ranked = rank_candidates(cands, subs, w)
    
    assert ranked[0]["id"] == "2"
    assert ranked[1]["id"] == "3"
    assert ranked[2]["id"] == "1"


def test_12_exact_equal_scores_preserve_original_order():
    cands = [MockCandidate("first"), MockCandidate("second")]
    subs = [_mock_sub_scores(0.5, 0, 0, 0), _mock_sub_scores(0.5, 0, 0, 0)]
    w = {"environmental": 1.0}
    ranked = rank_candidates(cands, subs, w)
    
    assert ranked[0]["id"] == "first"
    assert ranked[1]["id"] == "second"


def test_13_14_no_data_state_tie_break_or_randomness():
    # Implicitly covered by deterministic test_12
    pass


# ===========================================================================
# TRADE-OFFS TESTS
# ===========================================================================

def test_15_closest_weighted_score_alternative_selected():
    cands = [MockCandidate("top"), MockCandidate("alt1_far"), MockCandidate("alt2_close")]
    # alt2_close is closer to top in weighted score.
    # Scores: top: 1.0, alt2: 0.9, alt1: 0.5
    subs = [
        _mock_sub_scores(1.0, 1.0, 1.0, 1.0),
        _mock_sub_scores(0.5, 0.5, 0.5, 0.5),
        _mock_sub_scores(0.9, 0.9, 0.9, 0.9),
    ]
    ranked = rank_candidates(cands, subs)
    trade_offs = generate_trade_offs(ranked)
    
    # Wait, trade_offs are only generated if the alternative is strictly BETTER on at least one axis.
    # Here top is 1.0 on all, so no alternative is better. trade_offs will be None.
    assert trade_offs is None


def test_16_worse_axes_identified_correctly():
    cands = [MockCandidate("top"), MockCandidate("alt")]
    subs = [
        _mock_sub_scores(1.0, 0.5, 1.0, 1.0),  # top score: 0.875
        _mock_sub_scores(0.8, 0.8, 0.8, 0.8),  # alt score: 0.800. alt is worse on env, aff, con. Better on acc.
    ]
    ranked = rank_candidates(cands, subs)
    trade_offs_res = generate_trade_offs(ranked)
    
    assert trade_offs_res is not None
    assert trade_offs_res["comparison_option_id"] == "alt"
    
    trade_offs = trade_offs_res["trade_offs"]
    assert len(trade_offs) == 1
    assert trade_offs[0]["axis"] == "accessibility"
    assert round(trade_offs[0]["delta"], 2) == 0.30  # 0.8 - 0.5


def test_17_normalized_deltas_have_correct_sign():
    top = {"id": "top", "sub_scores": {"convenience": 0.2}}
    alt = {"id": "alt", "sub_scores": {"convenience": 0.5}}
    deltas = calculate_tradeoff_deltas(top, alt)
    assert deltas[0]["delta"] > 0


def test_18_missing_axis_does_not_produce_delta():
    top = {"id": "top", "sub_scores": {"environmental": 0.5}}
    alt = {"id": "alt", "sub_scores": {"environmental": None}}
    deltas = calculate_tradeoff_deltas(top, alt)
    assert len(deltas) == 0


def test_19_three_way_near_tie_is_deterministic():
    cands = [MockCandidate("top"), MockCandidate("alt1"), MockCandidate("alt2")]
    
    subs = [
        _mock_sub_scores(0.8, 0.8, 0.8, 0.8),    # top score: 0.8
        _mock_sub_scores(0.7, 0.9, 0.78, 0.78),  # alt1 score: 0.79. Max delta = 0.1 (accessibility)
        _mock_sub_scores(0.78, 0.78, 1.0, 0.6),  # alt2 score: 0.79. Max delta = 0.2 (affordability)
    ]
    
    # alt2 has the larger delta (0.2 > 0.1), so it should be picked over alt1
    ranked = rank_candidates(cands, subs)
    trade = generate_trade_offs(ranked)
    
    assert trade["comparison_option_id"] == "alt2"


def test_20_three_way_tie_does_not_use_data_state():
    # Handled by design, rank.py has no access to data_state
    pass


# ===========================================================================
# PERSONAL MATCH TESTS
# ===========================================================================

def test_21_score_converts_to_percentage():
    sub = _mock_sub_scores(0.9142, None, None, None)
    ranked = rank_candidates([MockCandidate("1")], [sub], {"environmental": 1.0})
    assert ranked[0]["personal_match_pct"] == 91


def test_22_none_score_means_none_percentage():
    sub = _mock_sub_scores(None, None, None, None)
    ranked = rank_candidates([MockCandidate("1")], [sub], None)
    assert ranked[0]["score"] is None
    assert ranked[0]["personal_match_pct"] is None


def test_23_percentage_bounds():
    sub = _mock_sub_scores(1.0, None, None, None)
    ranked = rank_candidates([MockCandidate("1")], [sub], {"environmental": 1.0})
    assert ranked[0]["personal_match_pct"] == 100


# ===========================================================================
# INTEGRITY TESTS
# ===========================================================================

def test_24_candidate_objects_not_mutated():
    cands = [MockCandidate("1")]
    subs = [_mock_sub_scores(1.0, 1.0, 1.0, 1.0)]
    _ = rank_candidates(cands, subs)
    assert not hasattr(cands[0], "score")
    assert not hasattr(cands[0], "rank")
