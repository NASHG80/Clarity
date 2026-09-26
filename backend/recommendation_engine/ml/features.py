"""Features extraction for experimental ML re-ranker.

Extracts numerical features from rule-based scoring output.

MISSING-DATA HANDLING — READ BEFORE CHANGING
=============================================
The 9-feature interface uses `score or 0.0` to replace None sub-scores.

This means a candidate whose accessibility data is not_verified (acc_score=None)
produces f1_acc_score=0.0, IDENTICAL to a candidate whose fully-verified
accessibility checklist is all-false.

The Ridge model CANNOT distinguish these two cases from features alone.
This is a documented limitation (ML_DATASET_SPEC.md §3, CAVEAT 1).

DO NOT treat 0.0 as "verified-false accessibility" in any traveler-facing output.
DO NOT infer accessibility from this feature value.
The data_state field (f8_state_prio) provides an orthogonal signal but
does not resolve the ambiguity for per-axis scores.

The 9-feature interface is preserved exactly as specified in ML_DATASET_SPEC.md.
"""
import numpy as np
from typing import Dict, Any, Optional

# Sentinel: maps to state_prio=0.0, same as not_verified.
# Used to distinguish 'unknown state' in tests.
STATE_PRIORITY: Dict[str, float] = {
    "verified": 4.0,
    "reported": 3.0,
    "community_confirmed": 2.0,
    "demo_synthetic": 1.0,
    "not_verified": 0.0,
}

# Fallback for any state not in STATE_PRIORITY (including None)
UNKNOWN_STATE_PRIORITY: float = 0.0


def extract_features(candidate: Dict[str, Any], weights: Dict[str, float]) -> np.ndarray:
    """Extract deterministic 9-feature vector for ML ranking.

    Features (9 dimensions, dtype=float32):
      f0: env_score   — Environmental sub-score [0.0, 1.0]; None -> 0.0 *
      f1: acc_score   — Accessibility sub-score [0.0, 1.0]; None -> 0.0 *
      f2: aff_score   — Affordability sub-score [0.0, 1.0]; None -> 0.0 *
      f3: con_score   — Convenience sub-score   [0.0, 1.0]; None -> 0.0 *
      f4: env_weight  — User environmental weight  (normalised, sums to 1)
      f5: acc_weight  — User accessibility weight  (normalised, sums to 1)
      f6: aff_weight  — User affordability weight  (normalised, sums to 1)
      f7: con_weight  — User convenience weight    (normalised, sums to 1)
      f8: state_prio  — Data-state priority {0,1,2,3,4}

    * None -> 0.0 is a known limitation: the model cannot distinguish a
      genuinely-zero verified score from a not_verified absent score.
      See module docstring and ML_DATASET_SPEC.md §3 CAVEAT 1.
      Never infer accessibility from a 0.0 value here.
    """
    sub_scores = candidate.get("sub_scores", {})

    # Missing sub-scores collapse to 0.0 — known limitation (see module docstring)
    env_score: float = sub_scores.get("environmental") or 0.0
    acc_score: float = sub_scores.get("accessibility") or 0.0
    aff_score: float = sub_scores.get("affordability") or 0.0
    con_score: float = sub_scores.get("convenience") or 0.0

    env_wt: float = weights.get("environmental", 0.25)
    acc_wt: float = weights.get("accessibility", 0.25)
    aff_wt: float = weights.get("affordability", 0.25)
    con_wt: float = weights.get("convenience", 0.25)

    state = candidate.get("data_state")
    state_prio: float = STATE_PRIORITY.get(state, UNKNOWN_STATE_PRIORITY)

    features = [
        env_score,
        acc_score,
        aff_score,
        con_score,
        env_wt,
        acc_wt,
        aff_wt,
        con_wt,
        state_prio,
    ]

    return np.array(features, dtype=np.float32)
