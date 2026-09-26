"""Weighted ranking and trade-off delta computation for recommendation engine.

Consumes C4 normalized sub-scores and ranks them. Handles missing sub-scores
by renormalizing weights dynamically. Generates structured trade-offs for 
the closest decision-relevant alternative.
"""

from typing import Any, Dict, List, Optional
import functools

from recommendation_engine.config import TIE_BREAK_EPSILON

# Epsilon for near-tie alternative selection (re-use the same configured epsilon)
NEAR_TIE_EPSILON = TIE_BREAK_EPSILON


def normalize_weights(raw_weights: Any) -> Dict[str, float]:
    """Normalize user weights to sum to 1.0. Defaults to equal weights if invalid.
    
    Accepts dict or Pydantic SearchWeights model.
    """
    default_weights = {
        "environmental": 0.25,
        "accessibility": 0.25,
        "affordability": 0.25,
        "convenience": 0.25,
    }
    if not raw_weights:
        return default_weights
        
    raw_dict = {}
    if hasattr(raw_weights, "model_dump"):
        raw_dict = raw_weights.model_dump()
    elif isinstance(raw_weights, dict):
        raw_dict = raw_weights
    else:
        axes = ["environmental", "accessibility", "affordability", "convenience"]
        raw_dict = {a: getattr(raw_weights, a, None) for a in axes}

    axes = ["environmental", "accessibility", "affordability", "convenience"]
    cleaned = {}
    for axis in axes:
        val = raw_dict.get(axis)
        cleaned[axis] = max(0.0, float(val)) if val is not None else 0.0
        
    total = sum(cleaned.values())
    if total <= 0.0:
        return default_weights
        
    return {axis: val / total for axis, val in cleaned.items()}


def calculate_weighted_score(sub_scores: Dict[str, Optional[float]], weights: Dict[str, float]) -> Optional[float]:
    """Calculate weighted sum over available sub-scores.
    
    If an axis is None, it is excluded and weights are renormalized over the available axes.
    """
    available_weight_sum = 0.0
    weighted_sum = 0.0
    
    for axis, weight in weights.items():
        score = sub_scores.get(axis)
        if score is not None:
            available_weight_sum += weight
            weighted_sum += score * weight
            
    if available_weight_sum <= 0.0:
        return None
        
    # Floating point precision is kept here, no rounding yet
    return weighted_sum / available_weight_sum


DATA_STATE_TIE_PRIORITY = {
    "verified": 4,
    "reported": 3,
    "community_confirmed": 2,
    "demo_synthetic": 1,
}

def compare_data_states(state_a: Any, state_b: Any) -> int:
    """Compare two data states for near-tie resolution.
    
    Returns:
      positive -> A preferred
      negative -> B preferred
      0        -> no preference (preserve stable ordering)
    """
    str_a = str(state_a) if state_a else ""
    str_b = str(state_b) if state_b else ""
    
    # If either is not_verified (or None/unknown), we preserve stable ordering.
    # We do NOT treat not_verified as automatically worst or best.
    if str_a == "not_verified" or str_b == "not_verified":
        return 0
    if not str_a or not str_b:
        return 0
        
    p_a = DATA_STATE_TIE_PRIORITY.get(str_a, 0)
    p_b = DATA_STATE_TIE_PRIORITY.get(str_b, 0)
    
    if p_a == 0 or p_b == 0:
        return 0
        
    return p_a - p_b

def compare_candidates(a: Dict[str, Any], b: Dict[str, Any]) -> int:
    """Pairwise comparator for ranking candidates.
    
    1. Score differences outside TIE_BREAK_EPSILON win by score.
    2. Score differences within TIE_BREAK_EPSILON use data-state precedence.
    3. Equal precedence falls back to stable original ordering.
    """
    score_a = a["score"] if a["score"] is not None else -1.0
    score_b = b["score"] if b["score"] is not None else -1.0
    
    # 1. Compare scores (with 1e-9 tolerance for float math)
    if abs(score_a - score_b) > (TIE_BREAK_EPSILON + 1e-9):
        if score_a > score_b:
            return -1  # A before B
        elif score_a < score_b:
            return 1   # B before A
            
    # 2. Near tie -> compare data states
    state_cmp = compare_data_states(a.get("data_state"), b.get("data_state"))
    if state_cmp > 0:
        return -1 # A preferred
    elif state_cmp < 0:
        return 1  # B preferred
        
    # 3. Stable ordering fallback
    idx_a = a.get("original_index", 0)
    idx_b = b.get("original_index", 0)
    return -1 if idx_a < idx_b else (1 if idx_a > idx_b else 0)


def rank_candidates(
    candidates: List[Any], 
    sub_scores_list: List[Dict[str, Optional[float]]], 
    raw_weights: Any = None
) -> List[Dict[str, Any]]:
    """Rank candidates by descending weighted score.
    
    Returns a list of structured internal dicts. Does NOT mutate candidate objects.
    Preserves original candidate order for exact score ties.
    """
    weights = normalize_weights(raw_weights)
    
    results = []
    for i, cand in enumerate(candidates):
        sub_scores = sub_scores_list[i]
        score = calculate_weighted_score(sub_scores, weights)
        
        cand_id = getattr(cand, "id", f"cand_{i}")
        cand_state = getattr(cand, "data_state", None)
        if isinstance(cand, dict):
            cand_id = cand.get("id", f"cand_{i}")
            cand_state = cand.get("data_state")
            
        pct = round(score * 100) if score is not None else None
        
        results.append({
            "id": cand_id,
            "data_state": cand_state,
            "score": score,
            "personal_match_pct": pct,
            "sub_scores": sub_scores,
            "original_index": i,
        })
        
    # Sort descending by score, applying C6 near-tie data-state logic
    results.sort(key=functools.cmp_to_key(compare_candidates))
    
    # Assign rank (1-indexed)
    for idx, res in enumerate(results):
        res["rank"] = idx + 1
        
    from recommendation_engine.config import ML_ENABLED
    if ML_ENABLED:
        try:
            from recommendation_engine.ml.predict import re_rank_candidates
            results = re_rank_candidates(results, raw_weights)
        except Exception:
            pass
            
    return results


def calculate_tradeoff_deltas(top_result: Dict[str, Any], alt_result: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Identify axes where alternative is strictly better (delta > 0)."""
    deltas = []
    top_scores = top_result.get("sub_scores", {})
    alt_scores = alt_result.get("sub_scores", {})
    
    axes = ["environmental", "accessibility", "affordability", "convenience"]
    for axis in axes:
        top_s = top_scores.get(axis)
        alt_s = alt_scores.get(axis)
        
        # Only compare if both are valid floats
        if top_s is not None and alt_s is not None:
            delta = alt_s - top_s
            if delta > 0:
                deltas.append({
                    "axis": axis,
                    "top_option_id": top_result["id"],
                    "alternative_option_id": alt_result["id"],
                    "top_value": top_s,
                    "alternative_value": alt_s,
                    "delta": delta
                })
    return deltas


def _get_max_weighted_delta(
    top_result: Dict[str, Any], 
    alt_result: Dict[str, Any], 
    weights: Dict[str, float]
) -> float:
    """Helper to find the largest meaningful user-prioritized difference."""
    deltas = calculate_tradeoff_deltas(top_result, alt_result)
    max_w_delta = -1.0
    for d in deltas:
        w_delta = d["delta"] * weights.get(d["axis"], 0.0)
        if w_delta > max_w_delta:
            max_w_delta = w_delta
    return max_w_delta


def generate_trade_offs(
    ranked_results: List[Dict[str, Any]], 
    raw_weights: Any = None
) -> Optional[Dict[str, Any]]:
    """Find the most relevant alternative and generate structured trade-offs.
    
    Resolves three-way near-ties by picking the alternative that exposes
    the largest meaningful difference on a user-prioritized axis.
    """
    if len(ranked_results) < 2:
        return None
        
    top_result = ranked_results[0]
    if top_result["score"] is None:
        return None
        
    weights = normalize_weights(raw_weights)
    
    # The immediate runner-up defines the closest score gap.
    runner_up = ranked_results[1]
    runner_up_score = runner_up["score"]
    
    if runner_up_score is None:
        return None
        
    # Gather near-tied alternatives within EPSILON of the runner-up score
    near_tied_alts = []
    for res in ranked_results[1:]:
        if res["score"] is not None and abs(runner_up_score - res["score"]) <= NEAR_TIE_EPSILON:
            near_tied_alts.append(res)
            
    # Resolve three-way near ties
    best_alt = near_tied_alts[0]
    best_alt_max_delta = -1.0
    
    for alt in near_tied_alts:
        max_w_delta = _get_max_weighted_delta(top_result, alt, weights)
        # Using strict > preserves original stable order for equal deltas
        if max_w_delta > best_alt_max_delta:
            best_alt = alt
            best_alt_max_delta = max_w_delta
            
    trade_offs = calculate_tradeoff_deltas(top_result, best_alt)
    
    if not trade_offs:
        return None
        
    return {
        "top_option_id": top_result["id"],
        "comparison_option_id": best_alt["id"],
        "trade_offs": trade_offs
    }
