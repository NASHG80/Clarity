"""Features extraction for experimental ML re-ranker.

Extracts numerical features from rule-based scoring output.
"""
import numpy as np
from typing import Dict, Any

def extract_features(candidate: Dict[str, Any], weights: Dict[str, float]) -> np.ndarray:
    """Extract deterministic numerical features for ML ranking.
    
    Features (9 dimensions):
    0: Rule-based Environmental Sub-score (0-1)
    1: Rule-based Accessibility Sub-score (0-1)
    2: Rule-based Affordability Sub-score (0-1)
    3: Rule-based Convenience Sub-score (0-1)
    4: Environmental User Weight
    5: Accessibility User Weight
    6: Affordability User Weight
    7: Convenience User Weight
    8: Data State Priority (0 for not_verified, 4 for verified)
    """
    sub_scores = candidate.get("sub_scores", {})
    
    env_score = sub_scores.get("environmental") or 0.0
    acc_score = sub_scores.get("accessibility") or 0.0
    aff_score = sub_scores.get("affordability") or 0.0
    con_score = sub_scores.get("convenience") or 0.0
    
    env_wt = weights.get("environmental", 0.25)
    acc_wt = weights.get("accessibility", 0.25)
    aff_wt = weights.get("affordability", 0.25)
    con_wt = weights.get("convenience", 0.25)
    
    state = candidate.get("data_state")
    priority_map = {
        "verified": 4.0,
        "reported": 3.0,
        "community_confirmed": 2.0,
        "demo_synthetic": 1.0,
        "not_verified": 0.0,
    }
    state_prio = priority_map.get(state, 0.0)
    
    features = [
        env_score,
        acc_score,
        aff_score,
        con_score,
        env_wt,
        acc_wt,
        aff_wt,
        con_wt,
        state_prio
    ]
    
    return np.array(features, dtype=np.float32)
