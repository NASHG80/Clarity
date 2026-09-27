"""Sub-scoring functions for recommendation engine.

Calculates normalized [0.0, 1.0] individual axis scores for:
  - affordability (lower cost is better)
  - environmental (lower emissions is better)
  - accessibility (higher ratio of satisfied explicit claims is better)
  - convenience (lower duration is better)

These are pure deterministic functions. They do not rank or weight total scores.
Missing or unreliable data produces `None`, never an artificial 0.0 score.
"""

from typing import Any, Dict, List, Optional

from app.models.schemas import DataState
from recommendation_engine.filters import _get_field, _is_truthy_semantic_value


def normalize(value: float, min_val: float, max_val: float, lower_is_better: bool = False) -> float:
    """Min-Max normalize a numeric value to [0.0, 1.0].
    
    If all valid candidates have the exact same value (min_val == max_val),
    returns 1.0. This is a normalization safeguard, not an objective claim 
    of perfection.
    """
    if min_val == max_val:
        return 1.0
        
    if lower_is_better:
        score = (max_val - value) / (max_val - min_val)
    else:
        score = (value - min_val) / (max_val - min_val)
        
    # Defensive clamp
    return max(0.0, min(1.0, score))


def _score_numeric_axis(
    candidates: List[Any], 
    extract_func: callable, 
    lower_is_better: bool
) -> List[Optional[float]]:
    """Generic helper to extract, find min/max, and normalize an axis across candidates."""
    raw_values = [extract_func(c) for c in candidates]
    valid_values = [v for v in raw_values if v is not None]
    
    if not valid_values:
        return [None] * len(candidates)
        
    min_val = min(valid_values)
    max_val = max(valid_values)
    
    scores = []
    for val in raw_values:
        if val is None:
            scores.append(None)
        else:
            scores.append(normalize(val, min_val, max_val, lower_is_better))
            
    return scores


def extract_cost(candidate: Any) -> Optional[float]:
    """Extract cost_inr (transport) or price_inr_per_night (accommodation) or total_cost_inr (journey)."""
    cost = _get_field(candidate, "cost_inr")
    if cost is None:
        cost = _get_field(candidate, "price_inr_per_night")
    if cost is None:
        cost = _get_field(candidate, "total_cost_inr")
    
    try:
        return float(cost) if cost is not None else None
    except (ValueError, TypeError):
        return None


def extract_duration(candidate: Any) -> Optional[float]:
    """Extract duration_minutes or total_duration_minutes."""
    duration = _get_field(candidate, "duration_minutes")
    if duration is None:
        duration = _get_field(candidate, "total_duration_minutes")
    try:
        return float(duration) if duration is not None else None
    except (ValueError, TypeError):
        return None


def extract_emissions(candidate: Any) -> Optional[float]:
    """Extract co2e_kg from a valid emissions object or total_co2_kg."""
    total_co2 = _get_field(candidate, "total_co2_kg")
    if total_co2 is not None:
        try:
            return float(total_co2)
        except (ValueError, TypeError):
            pass

    emissions = _get_field(candidate, "emissions")
    if not emissions:
        return None
        
    co2e = _get_field(emissions, "co2e_kg")
    try:
        return float(co2e) if co2e is not None else None
    except (ValueError, TypeError):
        return None


def extract_accessibility_ratio(candidate: Any) -> Optional[float]:
    """Extract accessibility ratio from explicitly scored checklist items.
    
    not_verified items are excluded entirely from the denominator (they are 
    unavailable info, not negative evidence).
    If no reliable explicit items exist, returns None.
    """
    items = _get_field(candidate, "accessibility_items")
    if not items:
        # If no explicit checklist is available, we do not infer accessibility
        # from generic ratings or other proxies.
        return None
        
    valid_items = []
    for item in items:
        state = _get_field(item, "data_state")
        if state != DataState.not_verified:
            valid_items.append(item)
            
    if not valid_items:
        return None
        
    satisfied = 0
    for item in valid_items:
        val = _get_field(item, "value")
        if _is_truthy_semantic_value(val):
            satisfied += 1
            
    return float(satisfied) / len(valid_items)


def score_affordability(candidates: List[Any]) -> List[Optional[float]]:
    """Calculate normalized affordability scores (lower cost is better)."""
    return _score_numeric_axis(candidates, extract_cost, lower_is_better=True)


def score_convenience(candidates: List[Any]) -> List[Optional[float]]:
    """Calculate normalized convenience scores (lower duration is better)."""
    return _score_numeric_axis(candidates, extract_duration, lower_is_better=True)


def score_environmental(candidates: List[Any]) -> List[Optional[float]]:
    """Calculate normalized environmental scores (lower co2e_kg is better)."""
    return _score_numeric_axis(candidates, extract_emissions, lower_is_better=True)


def score_accessibility(candidates: List[Any]) -> List[Optional[float]]:
    """Calculate normalized accessibility scores (higher ratio is better)."""
    # Use candidate-set normalization on the extracted explicit ratio.
    return _score_numeric_axis(candidates, extract_accessibility_ratio, lower_is_better=False)


def extract_walking(candidate: Any) -> Optional[float]:
    walk = _get_field(candidate, "total_walking_m")
    try:
        return float(walk) if walk is not None else None
    except (ValueError, TypeError):
        return None

def extract_transfers(candidate: Any) -> Optional[float]:
    transfers = _get_field(candidate, "transfer_count")
    try:
        return float(transfers) if transfers is not None else None
    except (ValueError, TypeError):
        return None

def score_walking(candidates: List[Any]) -> List[Optional[float]]:
    return _score_numeric_axis(candidates, extract_walking, lower_is_better=True)

def score_transfers(candidates: List[Any]) -> List[Optional[float]]:
    return _score_numeric_axis(candidates, extract_transfers, lower_is_better=True)


def calculate_sub_scores(candidates: List[Any]) -> List[Dict[str, Optional[float]]]:
    """Calculate all axis sub-scores for a candidate set."""
    if not candidates:
        return []
        
    affordability = score_affordability(candidates)
    convenience = score_convenience(candidates)
    environmental = score_environmental(candidates)
    accessibility = score_accessibility(candidates)
    walking = score_walking(candidates)
    transfers = score_transfers(candidates)
    
    results = []
    for i in range(len(candidates)):
        results.append({
            "affordability": affordability[i],
            "convenience": convenience[i],
            "environmental": environmental[i],
            "accessibility": accessibility[i],
            "walking": walking[i],
            "transfers": transfers[i],
        })
        
    return results


def apply_sustainability_boost(
    candidates: List[Any],
    sub_scores_list: List[Dict[str, Optional[float]]],
    sustainability_preferred: Optional[List[str]],
    boost_per_match: float = 0.15,
) -> List[Dict[str, Optional[float]]]:
    """Boost the environmental sub-score for candidates with matching sustainability items.

    Rules (AGENTS.md §2.1, §2.2):
      - This is a soft ranking preference ONLY — never a hard filter.
      - Only sustainability_items with data_state != 'not_verified' are eligible for boosting.
      - 'not_verified' items are never boosted — their value is null/omitted and carries
        no positive evidence.
      - The boost is additive on the environmental sub-score, capped at 1.0.
      - If sustainability_preferred is empty or None, the list is returned unchanged.
      - If a candidate has no environmental sub-score (None), it stays None — we do not
        fabricate an environmental score merely because sustainability items matched.
      - Zero hotel results will never be caused solely by a sustainability preference.
    """
    if not sustainability_preferred:
        return sub_scores_list

    preferred_set = set(sustainability_preferred)
    result = []

    for cand, scores in zip(candidates, sub_scores_list):
        new_scores = dict(scores)
        items = _get_field(cand, "sustainability_items") or []

        bonus = 0.0
        for item in items:
            label = _get_field(item, "label")
            state = _get_field(item, "data_state")
            # Only boost verified evidence — not_verified items are never boosted.
            if label in preferred_set and state not in (None, "not_verified", DataState.not_verified):
                bonus += boost_per_match

        if bonus > 0.0 and new_scores.get("environmental") is not None:
            new_scores["environmental"] = min(1.0, new_scores["environmental"] + bonus)

        result.append(new_scores)

    return result
