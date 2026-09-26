"""Hard filters for recommendation engine: budget, time, mandatory accessibility.

These are pure functions that evaluate candidates (Transport or Accommodation)
against hard constraints. They do not score, rank, or access MongoDB.
"""

from typing import Any, List, Optional

from app.models.schemas import DataState

# Explicit mapping between API requirement labels and stored checklist labels
ACCESSIBILITY_LABEL_MAPPING = {
    "step_free": "step_free_entrance",
    # Add other exact mappings here as needed.
}


def _get_field(candidate: Any, field_name: str) -> Any:
    """Helper to get a field from either a Pydantic model/object or a dict."""
    if isinstance(candidate, dict):
        return candidate.get(field_name)
    return getattr(candidate, field_name, None)


def passes_budget(candidate: Any, budget_max: Optional[float]) -> bool:
    """Check if candidate's cost is within the budget maximum.
    
    Uses cost_inr for transport, price_inr_per_night for accommodation.
    Missing cost fails the filter (conservative).
    """
    if budget_max is None:
        return True

    cost = _get_field(candidate, "cost_inr")
    if cost is None:
        cost = _get_field(candidate, "price_inr_per_night")

    if cost is None:
        return False

    return cost <= budget_max


def passes_time(candidate: Any, time_max_hours: Optional[float]) -> bool:
    """Check if candidate's duration is within the maximum allowed time.
    
    Missing duration fails the filter (conservative).
    """
    if time_max_hours is None:
        return True

    duration_mins = _get_field(candidate, "duration_minutes")
    if duration_mins is None:
        return False

    return duration_mins <= time_max_hours * 60


def _is_truthy_semantic_value(value: Any) -> bool:
    """Check if a value represents a positive accessibility claim.
    
    None, 'unknown', 'not_verified', and False do not count as satisfied.
    """
    if not value:
        return False
    if isinstance(value, str) and value.strip().lower() in ("unknown", "not_verified", "none", "false"):
        return False
    return True


def passes_accessibility(
    candidate: Any, 
    accessibility_required: Optional[List[str]], 
    include_unverified: bool
) -> bool:
    """Check if candidate satisfies ALL mandatory accessibility requirements.
    
    If include_unverified is False (the default), items with data_state='not_verified'
    do NOT satisfy the requirement.
    """
    if not accessibility_required:
        return True

    # Get checklist items from accommodation candidates
    items = _get_field(candidate, "accessibility_items") or []

    for req in accessibility_required:
        target_label = ACCESSIBILITY_LABEL_MAPPING.get(req, req)
        satisfied = False

        # Check against checklist items
        for item in items:
            item_label = _get_field(item, "label")
            if item_label == target_label:
                val = _get_field(item, "value")
                state = _get_field(item, "data_state")
                
                # Check semantic truthiness or if unverified is explicitly included
                if _is_truthy_semantic_value(val):
                    if state != DataState.not_verified or include_unverified:
                        satisfied = True
                elif state == DataState.not_verified and include_unverified:
                    # C20: not_verified strictly implies value=None, so we allow it 
                    # if the label is present and include_unverified is explicitly True
                    satisfied = True
                break
                
        if not satisfied:
            # A mandatory requirement was not met. Fail fast.
            # We do NOT infer specific requirements from generic `accessibility` ratings.
            return False

    return True


def filter_candidates(
    candidates: List[Any],
    *,
    budget_max: Optional[float] = None,
    time_max_hours: Optional[float] = None,
    accessibility_required: Optional[List[str]] = None,
    include_unverified: bool = False,
) -> List[Any]:
    """Apply hard eligibility filters to a list of candidates.
    
    Returns candidates in their original relative order. Does not rank.
    """
    filtered = []
    for cand in candidates:
        if not passes_budget(cand, budget_max):
            continue
        if not passes_time(cand, time_max_hours):
            continue
        if not passes_accessibility(cand, accessibility_required, include_unverified):
            continue
            
        filtered.append(cand)
        
    return filtered
