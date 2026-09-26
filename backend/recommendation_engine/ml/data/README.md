# ML Re-Ranker Dataset

## MANDATORY DISCLAIMER

**Dataset type:** synthetic prototype / proxy
**Real user rows:** 0
**Real booking outcomes:** 0
**Real historical ranking labels:** 0
**Source entities:** Existing seeded MongoDB records (transport_routes, hotels)
**Scenario generation:** Deterministic
**Random seed:** 42
**Target:** Synthetic proxy derived from the existing recommendation logic

This target is a synthetic proxy derived from the existing recommendation logic.
It is NOT a real traveler preference, booking outcome, or observed user behavior label.

Do NOT describe this dataset as real-world training data, user behavior data,
observed traveler preferences, or production learning data.

---

## Statistics

| Metric | Value |
|--------|-------|
| Total rows | 450 |
| Train rows | 315 |
| Validation rows | 60 |
| Test rows | 75 |
| Unique source entities | 30 |
| Source collections | transport_routes, hotels |
| Features | 9 (f0–f8) |
| Target field | y (synthetic proxy, normalized to [0,1]) |
| dataset_type | synthetic_proxy (internal metadata only) |

---

## Split Strategy

Grouped by `source_id` — same entity never appears in both train and test.
Approximate split: 70% train / 15% validation / 15% test (by entity count).

---

## Files

| File | Contents |
|------|----------|
| `ml_dataset.jsonl` | All rows (train + val + test), each with `split` field |
| `README.md` | This file |

---

## Feature Reference

See `backend/recommendation_engine/ml/ML_DATASET_SPEC.md` for full feature table.

---

## sklearn Version Notice

`model.pkl` was saved with sklearn 1.9.0; current install is 1.8.0.
**C-OWNED FOLLOW-UP:** Retrain model.pkl on the current sklearn version before enabling ML.

---

## PROXY-TARGET / RULE-DERIVED DATASET LIMITATION

Target y is derived from the same rule-based sub-scores that appear as features f0–f3.
The model cannot learn preferences beyond what the rule engine already captures.
This is a prototype-learning pipeline only.
