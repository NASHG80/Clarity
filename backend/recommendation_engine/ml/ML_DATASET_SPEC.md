# ML Re-Ranker Dataset Specification
> **Person D — ML Data Support Document**
> Generated: 2026-09-26 | Traced from actual implementation, not inferred.

---

## 1. Model Overview

| Property        | Value                                                   |
|-----------------|---------------------------------------------------------|
| Model class     | `sklearn.linear_model.Ridge`                         |
| Alpha           | 1.0                                                     |
| Feature count   | 9                                                       |
| Feature dtype   | `np.float32`                                          |
| Artifact path   | `backend/recommendation_engine/ml/model.pkl`         |
| Artifact format | Python `pickle`                                       |
| Extractor       | `recommendation_engine.ml.features.extract_features()`|
| Inference fn    | `recommendation_engine.ml.predict.re_rank_candidates()`|
| ML guard        | `recommendation_engine.config.ML_ENABLED` (default: `false`) |

---

## 2. Runtime Call Graph (traced from actual code)

`
POST /api/search/transport (or /accommodation)
  down
filters.filter_candidates()          -- hard filters: budget / time / accessibility
  down
scoring.calculate_sub_scores()       -- per-axis scores [0.0-1.0] or None
  down
rank.rank_candidates()               -- weighted score, near-tie by data_state
  down
  if ML_ENABLED:                     -- rank.py line 179
    ml.predict.re_rank_candidates()  -- ONLY reorders already-filtered list
      down
      ml.features.extract_features() -- per candidate
      down
      model.predict(features)        -- returns ml_score float
    sort by ml_score descending      -- internal only, never in API response
    on any exception -> return rule-based ranked_candidates unchanged
  down
generate_trade_offs()                -- uses rule-based sub_scores, unaffected by ML
  down
response (TransportResult / HotelResult) -- extra=forbid strips ml_score
`

---

## 3. Feature Specification Table

All 9 features are derived from the rule-based pipeline output AFTER hard filters.
They are NEVER sourced directly from raw MongoDB documents.

Feature 0: env_score
  Type: float32
  Source: candidate["sub_scores"]["environmental"]
  Transformation: passed through; `or 0.0` if None (features.py line 24)
  Range: [0.0, 1.0]
  Missing handling: None -> 0.0 (C existing code)
  Rule-derived: YES
  Safe for training: YES (caveat 1 below)

Feature 1: acc_score
  Type: float32
  Source: candidate["sub_scores"]["accessibility"]
  Transformation: passed through; `or 0.0` if None (features.py line 25)
  Range: [0.0, 1.0]
  Missing handling: None -> 0.0 (C existing code)
  Rule-derived: YES
  Safe for training: YES (caveat 1 below)

Feature 2: aff_score
  Type: float32
  Source: candidate["sub_scores"]["affordability"]
  Transformation: passed through; `or 0.0` if None (features.py line 26)
  Range: [0.0, 1.0]
  Missing handling: None -> 0.0 (C existing code)
  Rule-derived: YES
  Safe for training: YES (caveat 1 below)

Feature 3: con_score
  Type: float32
  Source: candidate["sub_scores"]["convenience"]
  Transformation: passed through; `or 0.0` if None (features.py line 27)
  Range: [0.0, 1.0]
  Missing handling: None -> 0.0 (C existing code)
  Rule-derived: YES
  Safe for training: YES (caveat 1 below)

Feature 4: env_weight
  Type: float32
  Source: User request weights["environmental"]
  Transformation: passed through from normalize_weights()
  Range: [0.0, 1.0]
  Missing handling: default 0.25
  Rule-derived: NO
  Safe for training: YES

Feature 5: acc_weight
  Type: float32
  Source: User request weights["accessibility"]
  Transformation: passed through from normalize_weights()
  Range: [0.0, 1.0]
  Missing handling: default 0.25
  Rule-derived: NO
  Safe for training: YES

Feature 6: aff_weight
  Type: float32
  Source: User request weights["affordability"]
  Transformation: passed through from normalize_weights()
  Range: [0.0, 1.0]
  Missing handling: default 0.25
  Rule-derived: NO
  Safe for training: YES

Feature 7: con_weight
  Type: float32
  Source: User request weights["convenience"]
  Transformation: passed through from normalize_weights()
  Range: [0.0, 1.0]
  Missing handling: default 0.25
  Rule-derived: NO
  Safe for training: YES

Feature 8: state_prio
  Type: float32
  Source: candidate["data_state"]
  Transformation: verified=4, reported=3, community_confirmed=2, demo_synthetic=1, not_verified=0, unknown=0
  Range: {0,1,2,3,4}
  Missing handling: unknown state -> 0.0
  Rule-derived: YES
  Safe for training: YES (caveat 2 below)

CAVEAT 1 - Missing-value conflation:
C's features.py uses `or 0.0` to replace None sub-scores with 0.0.
A candidate with genuinely absent accessibility data (not_verified -> acc_score=None)
produces acc_score=0.0, IDENTICAL to a candidate whose verified checklist is all-false.
The ML model cannot distinguish these two cases. Do NOT change C's feature extractor.

CAVEAT 2 - not_verified vs unknown:
Both `not_verified` and any unrecognized state map to 0.0. This is correct for current scope.

---

## 4. Target Definition

target(y) = base_score + acc_penalty + state_bonus + Gaussian_noise

Where:
  base_score = env_score*env_wt + acc_score*acc_wt + aff_score*aff_wt + con_score*con_wt
  acc_penalty = -0.5 if (acc_weight > 0.4 AND acc_score < 0.2) else 0.0
  state_bonus = state_prio * 0.1
  noise ~ N(0, 0.05), seed=42

The target is min-max normalized to [0, 1] over the training batch.

CRITICAL DISCLAIMER:
This target is a synthetic proxy derived from the existing recommendation logic.
It is NOT a real traveler preference, booking outcome, or observed user behavior label.

---

## 5. ML Enable/Disable Behaviour

- ML_ENABLED default: false (config.py line 22)
- ML_ENABLED=false: branch skipped entirely (rank.py lines 178-184)
- ML_ENABLED=true + model missing: returns rule-based order
- ML_ENABLED=true + inference exception: returns rule-based order
- ml_score never reaches API response (Pydantic extra=forbid blocks it)

---

## 6. sklearn Version Status

  Installed version : 1.8.0
  Artifact version  : 1.9.0
  Compatible        : NO (InconsistentVersionWarning on load)
  Action required   : C-OWNED FOLLOW-UP - Retrain model.pkl on sklearn 1.8.0
