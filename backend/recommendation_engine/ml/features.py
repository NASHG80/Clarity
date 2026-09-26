"""Features extraction for experimental ML re-ranker.

Extracts numerical features from rule-based scoring output.

MISSING-DATA HANDLING — READ BEFORE CHANGING
=============================================
The 9-feature interface maps all None sub-scores to 0.0.

This means a candidate whose accessibility data is not_verified (acc_score=None)
produces f1_acc_score=0.0, IDENTICAL to a candidate whose fully-verified
accessibility checklist is all-false.

KNOWN ML LIMITATION (documented, not hidden):
  The Ridge model cannot distinguish these two cases from the feature vector alone.
  f8_state_prio provides an orthogonal signal (not_verified=0.0, verified=4.0)
  but does not resolve the per-axis ambiguity within a single axis score.
  See ML_DATASET_SPEC.md section 3 CAVEAT 1.

WHAT IS FIXED HERE (vs the previous 'score or 0.0' form):
  The previous code used `score or 0.0` (Python truthiness test).
  This is semantically wrong: a genuine verified score of 0.0 is falsy,
  so `0.0 or 0.0` treated a real zero identically to None at the code level.
  The fix uses the explicit _score_to_float() helper with an `is not None` check:
    None  -> 0.0  (missing/not_verified path — explicit)
    0.0   -> 0.0  (genuine verified zero — code path preserved, not confused with None)
    0.5   -> 0.5  (normal score — unchanged)
  Numeric output to the Ridge model is identical in all cases.
  9-feature interface unchanged. Dataset remains compatible. No retraining required.

WHAT MUST NOT HAPPEN:
  DO NOT treat the 0.0 feature value as "verified-false" in any traveler-facing output.
  DO NOT infer accessibility status from a 0.0 value here.
  DO NOT expose ml_score to API responses.
"""
import numpy as np
from typing import Dict, Any

# Maps data_state strings to numeric priority for f8_state_prio.
# Exported so tests can assert on the exact mapping without hardcoding.
STATE_PRIORITY: Dict[str, float] = {
    "verified": 4.0,
    "reported": 3.0,
    "community_confirmed": 2.0,
    "demo_synthetic": 1.0,
    "not_verified": 0.0,
}

# Fallback priority for any state not in STATE_PRIORITY (including None).
UNKNOWN_STATE_PRIORITY: float = 0.0


def _score_to_float(score: object) -> float:
    """Convert a sub-score to float for the feature vector.

    Uses explicit `is not None` identity check — NOT `score or 0.0` truthiness.

    Reason: a genuine verified score of 0.0 is falsy in Python; using truthiness
    would collapse it to the default 0.0 identically to a missing/None score at
    the code-intent level, hiding the semantic distinction even though the numeric
    output is the same (both are 0.0).

    Args:
        score: The raw sub-score value from the rule-based pipeline.
               Expected to be a float in [0.0, 1.0] or None.

    Returns:
        float(score) if score is not None, else 0.0.
    """
    return float(score) if score is not None else 0.0


def extract_features(candidate: Dict[str, Any], weights: Dict[str, float]) -> np.ndarray:
    """Extract deterministic 9-feature vector for ML ranking.

    Features (9 dimensions, dtype=float32):
      f0: env_score   -- Environmental sub-score [0.0, 1.0]; None -> 0.0 (see dagger below)
      f1: acc_score   -- Accessibility sub-score [0.0, 1.0]; None -> 0.0 (see dagger below)
      f2: aff_score   -- Affordability sub-score [0.0, 1.0]; None -> 0.0 (see dagger below)
      f3: con_score   -- Convenience sub-score   [0.0, 1.0]; None -> 0.0 (see dagger below)
      f4: env_weight  -- User environmental weight  (normalised, sums to 1)
      f5: acc_weight  -- User accessibility weight  (normalised, sums to 1)
      f6: aff_weight  -- User affordability weight  (normalised, sums to 1)
      f7: con_weight  -- User convenience weight    (normalised, sums to 1)
      f8: state_prio  -- Data-state priority {0,1,2,3,4}

    Dagger: Both None (missing/not_verified) and 0.0 (genuine verified zero) map to
      0.0 in the feature vector. This is the documented ML limitation; the
      Ridge model cannot distinguish them. See module docstring and
      ML_DATASET_SPEC.md section 3 CAVEAT 1. The explicit is-not-None check in
      _score_to_float() ensures the code preserves semantic intent even though
      the numeric output is the same. Never infer accessibility status from 0.0.
    """
    sub_scores = candidate.get("sub_scores", {})

    # _score_to_float uses explicit `is not None` — see module docstring for rationale
    env_score = _score_to_float(sub_scores.get("environmental"))
    acc_score = _score_to_float(sub_scores.get("accessibility"))
    aff_score = _score_to_float(sub_scores.get("affordability"))
    con_score = _score_to_float(sub_scores.get("convenience"))

    env_wt: float = weights.get("environmental", 0.25)
    acc_wt: float = weights.get("accessibility", 0.25)
    aff_wt: float = weights.get("affordability", 0.25)
    con_wt: float = weights.get("convenience", 0.25)

    state = candidate.get("data_state")
    state_prio: float = STATE_PRIORITY.get(state, UNKNOWN_STATE_PRIORITY)

    return np.array(
        [env_score, acc_score, aff_score, con_score,
         env_wt, acc_wt, aff_wt, con_wt, state_prio],
        dtype=np.float32,
    )
