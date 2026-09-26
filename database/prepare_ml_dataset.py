"""
database/prepare_ml_dataset.py
Person D — ML Data Support

Prepares a deterministic synthetic proxy dataset for Person C's
experimental Ridge Regression re-ranker.

IMPORTANT LIMITATIONS (must be read before use):
  Dataset type       : synthetic_proxy
  Real user rows     : 0
  Real booking rows  : 0
  Real labelled rows : 0
  Source entities    : Actual seeded MongoDB documents (transport_routes, hotels)
  Scenario gen       : Deterministic, random seed=42
  Target             : Synthetic proxy derived from the existing recommendation logic
                       NOT real traveler preferences, NOT booking outcomes.
  Feature extractor  : C's existing extract_features() — unchanged
  Target logic       : C's existing generate_synthetic_data() label formula — unchanged
  ML is disabled by default (ML_ENABLED=false in config)
  This script does NOT train or retrain any model
  This script does NOT modify any MongoDB document
  This script does NOT call SerpApi or RailRadar

Usage:
    cd <repo_root>
    python database/prepare_ml_dataset.py

Output:
    backend/recommendation_engine/ml/data/ml_dataset.jsonl
    backend/recommendation_engine/ml/data/README.md
"""

import os
import sys
import json
import math
import random
import numpy as np
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Path setup — run from repo root
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

SEED_DIR = REPO_ROOT / "database" / "seed_data"
OUTPUT_DIR = BACKEND_DIR / "recommendation_engine" / "ml" / "data"

RANDOM_SEED = 42
SCENARIOS_PER_ENTITY = 15

# 15 deterministic weight presets (one per scenario slot)
WEIGHT_PRESETS = [
    {"environmental": 0.4,  "accessibility": 0.4,  "affordability": 0.1,  "convenience": 0.1},
    {"environmental": 0.1,  "accessibility": 0.1,  "affordability": 0.7,  "convenience": 0.1},
    {"environmental": 0.25, "accessibility": 0.25, "affordability": 0.25, "convenience": 0.25},
    {"environmental": 0.1,  "accessibility": 0.6,  "affordability": 0.2,  "convenience": 0.1},
    {"environmental": 0.6,  "accessibility": 0.1,  "affordability": 0.1,  "convenience": 0.2},
    {"environmental": 0.2,  "accessibility": 0.2,  "affordability": 0.2,  "convenience": 0.4},
    {"environmental": 0.3,  "accessibility": 0.3,  "affordability": 0.3,  "convenience": 0.1},
    {"environmental": 0.15, "accessibility": 0.15, "affordability": 0.5,  "convenience": 0.2},
    {"environmental": 0.5,  "accessibility": 0.3,  "affordability": 0.1,  "convenience": 0.1},
    {"environmental": 0.1,  "accessibility": 0.4,  "affordability": 0.4,  "convenience": 0.1},
    {"environmental": 0.33, "accessibility": 0.33, "affordability": 0.17, "convenience": 0.17},
    {"environmental": 0.05, "accessibility": 0.05, "affordability": 0.85, "convenience": 0.05},
    {"environmental": 0.4,  "accessibility": 0.1,  "affordability": 0.1,  "convenience": 0.4},
    {"environmental": 0.2,  "accessibility": 0.5,  "affordability": 0.1,  "convenience": 0.2},
    {"environmental": 0.0,  "accessibility": 0.0,  "affordability": 1.0,  "convenience": 0.0},
]

DATA_STATE_PRIORITY = {
    "verified": 4, "reported": 3,
    "community_confirmed": 2, "demo_synthetic": 1, "not_verified": 0,
}


# ---------------------------------------------------------------------------
# Weight normalisation (mirrors rank.normalize_weights)
# ---------------------------------------------------------------------------
def normalize_weights(raw: Dict[str, float]) -> Dict[str, float]:
    axes = ["environmental", "accessibility", "affordability", "convenience"]
    cleaned = {a: max(0.0, float(raw.get(a, 0.0))) for a in axes}
    total = sum(cleaned.values())
    if total <= 0.0:
        return {a: 0.25 for a in axes}
    return {a: v / total for a, v in cleaned.items()}


# ---------------------------------------------------------------------------
# Sub-scoring helpers (mirrors scoring.py — batch normalisation)
# ---------------------------------------------------------------------------
def _is_truthy(val: Any) -> bool:
    if not val:
        return False
    if isinstance(val, str) and val.strip().lower() in ("unknown", "not_verified", "none", "false"):
        return False
    return True


def _extract_cost(c: dict) -> Optional[float]:
    v = c.get("cost_inr") or c.get("price_inr_per_night")
    try:
        return float(v) if v is not None else None
    except Exception:
        return None


def _extract_duration(c: dict) -> Optional[float]:
    v = c.get("duration_minutes")
    try:
        return float(v) if v is not None else None
    except Exception:
        return None


def _extract_co2e(c: dict) -> Optional[float]:
    em = c.get("emissions")
    if not em or not isinstance(em, dict):
        return None
    v = em.get("co2e_kg")
    try:
        return float(v) if v is not None else None
    except Exception:
        return None


def _extract_accessibility_ratio(c: dict) -> Optional[float]:
    items = c.get("accessibility_items") or []
    if not items:
        return None
    valid = [i for i in items if isinstance(i, dict) and i.get("data_state") != "not_verified"]
    if not valid:
        return None
    satisfied = sum(1 for i in valid if _is_truthy(i.get("value")))
    return float(satisfied) / len(valid)


def _normalize_axis(value: float, mn: float, mx: float, lower_is_better: bool) -> float:
    if mn == mx:
        return 1.0
    s = (mx - value) / (mx - mn) if lower_is_better else (value - mn) / (mx - mn)
    return max(0.0, min(1.0, s))


def _norm_batch(vals: List[Optional[float]], lower_is_better: bool) -> List[Optional[float]]:
    valid = [v for v in vals if v is not None]
    if not valid:
        return [None] * len(vals)
    mn, mx = min(valid), max(valid)
    return [_normalize_axis(v, mn, mx, lower_is_better) if v is not None else None for v in vals]


def compute_sub_scores(candidates: List[dict]) -> List[Dict[str, Optional[float]]]:
    """Batch sub-score computation — mirrors scoring.calculate_sub_scores()."""
    costs      = [_extract_cost(c) for c in candidates]
    durations  = [_extract_duration(c) for c in candidates]
    co2es      = [_extract_co2e(c) for c in candidates]
    acc_ratios = [_extract_accessibility_ratio(c) for c in candidates]

    aff = _norm_batch(costs,      lower_is_better=True)
    con = _norm_batch(durations,  lower_is_better=True)
    env = _norm_batch(co2es,      lower_is_better=True)
    acc = _norm_batch(acc_ratios, lower_is_better=False)

    return [
        {"affordability": aff[i], "convenience": con[i],
         "environmental": env[i], "accessibility": acc[i]}
        for i in range(len(candidates))
    ]


# ---------------------------------------------------------------------------
# Target logic — EXACTLY mirrors dataset.generate_synthetic_data() formula
# ---------------------------------------------------------------------------
def compute_target_raw(sub_scores: Dict[str, Optional[float]],
                       weights: Dict[str, float],
                       state_prio: float,
                       noise_val: float) -> float:
    """Synthetic proxy target — NOT real user preference data."""
    env  = sub_scores.get("environmental")  or 0.0
    acc  = sub_scores.get("accessibility")  or 0.0
    aff  = sub_scores.get("affordability")  or 0.0
    con  = sub_scores.get("convenience")    or 0.0

    ew = weights.get("environmental",  0.25)
    aw = weights.get("accessibility",  0.25)
    fw = weights.get("affordability",  0.25)
    cw = weights.get("convenience",    0.25)

    base        = env * ew + acc * aw + aff * fw + con * cw
    acc_penalty = -0.5 if (aw > 0.4 and acc < 0.2) else 0.0
    state_bonus = state_prio * 0.1

    return base + acc_penalty + state_bonus + noise_val


# ---------------------------------------------------------------------------
# Load seed files
# ---------------------------------------------------------------------------
def load_seed(name: str) -> List[dict]:
    path = SEED_DIR / name
    if not path.exists():
        print(f"[WARN] Seed file not found: {path}")
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_candidate_pool() -> List[dict]:
    routes = load_seed("transport_routes.json")
    hotels = load_seed("hotels.json")
    pool = []
    for r in routes:
        pool.append({"_source_collection": "transport_routes",
                     "_source_id": r.get("_id", r.get("id", "unknown")), **r})
    for h in hotels:
        pool.append({"_source_collection": "hotels",
                     "_source_id": h.get("_id", h.get("id", "unknown")), **h})
    return pool


# ---------------------------------------------------------------------------
# Feature extraction — delegates to C's actual extract_features()
# ---------------------------------------------------------------------------
def extract_features_via_c(candidate_ranked_dict: dict,
                            weights: dict) -> Optional[np.ndarray]:
    try:
        from recommendation_engine.ml.features import extract_features
        return extract_features(candidate_ranked_dict, weights)
    except Exception as e:
        print(f"[ERROR] C extract_features() failed for {candidate_ranked_dict.get('id')}: {e}")
        return None


# ---------------------------------------------------------------------------
# Dataset generation
# ---------------------------------------------------------------------------
def generate_rows(pool: List[dict], rng: np.random.Generator) -> List[dict]:
    sub_scores_all = compute_sub_scores(pool)

    total_scenarios = len(pool) * SCENARIOS_PER_ENTITY
    noise_draws = rng.normal(0, 0.05, total_scenarios)
    noise_idx = 0

    rows: List[dict] = []
    skipped = 0

    for i, cand in enumerate(pool):
        source_col  = cand["_source_collection"]
        source_id   = cand["_source_id"]
        data_state  = cand.get("data_state") or "not_verified"
        sub_scores  = sub_scores_all[i]
        state_prio  = float(DATA_STATE_PRIORITY.get(data_state, 0))

        for scenario_idx in range(SCENARIOS_PER_ENTITY):
            preset      = WEIGHT_PRESETS[scenario_idx % len(WEIGHT_PRESETS)]
            weights     = normalize_weights(preset)
            noise_val   = float(noise_draws[noise_idx])
            noise_idx  += 1

            # Build the dict structure exactly as rank.py hands it to predict.py
            candidate_ranked = {
                "id":             source_id,
                "data_state":     data_state,
                "score":          None,
                "sub_scores":     sub_scores,
                "original_index": i,
            }

            feat_vec = extract_features_via_c(candidate_ranked, weights)
            if feat_vec is None:
                skipped += 1
                continue

            y_raw = compute_target_raw(sub_scores, weights, state_prio, noise_val)

            rows.append({
                # Traceability
                "source_collection":  source_col,
                "source_id":          source_id,
                "scenario_index":     scenario_idx,
                "dataset_type":       "synthetic_proxy",
                "data_state_original": data_state,

                # Features (9 dims, exact order from features.py)
                "f0_env_score":   float(feat_vec[0]),
                "f1_acc_score":   float(feat_vec[1]),
                "f2_aff_score":   float(feat_vec[2]),
                "f3_con_score":   float(feat_vec[3]),
                "f4_env_weight":  float(feat_vec[4]),
                "f5_acc_weight":  float(feat_vec[5]),
                "f6_aff_weight":  float(feat_vec[6]),
                "f7_con_weight":  float(feat_vec[7]),
                "f8_state_prio":  float(feat_vec[8]),

                # Raw target (before batch normalisation)
                "y_raw": y_raw,
            })

    if skipped:
        print(f"[WARN] Skipped {skipped} rows due to feature extraction errors.")

    # Batch normalise target to [0, 1] — mirrors dataset.py
    ys = np.array([r["y_raw"] for r in rows], dtype=np.float64)
    y_min, y_max = ys.min(), ys.max()
    ys_norm = (ys - y_min) / (y_max - y_min) if y_max > y_min else np.zeros_like(ys)
    for j, row in enumerate(rows):
        row["y"] = float(ys_norm[j])

    return rows


# ---------------------------------------------------------------------------
# Leakage audit
# ---------------------------------------------------------------------------
def leakage_audit(rows: List[dict]) -> Dict[str, Any]:
    FEAT_KEYS = [
        "f0_env_score", "f1_acc_score", "f2_aff_score", "f3_con_score",
        "f4_env_weight", "f5_acc_weight", "f6_aff_weight", "f7_con_weight", "f8_state_prio",
    ]
    report: Dict[str, Any] = {}

    # Target-as-feature
    report["target_as_feature"] = "y" in FEAT_KEYS or "y_raw" in FEAT_KEYS

    # Duplicate feature vectors
    seen: set = set()
    dups = 0
    for row in rows:
        vec = tuple(row[k] for k in FEAT_KEYS)
        if vec in seen:
            dups += 1
        seen.add(vec)
    report["duplicate_feature_vectors"] = dups

    report["unique_source_ids"] = len(set(r["source_id"] for r in rows))

    report["PROXY_TARGET_RULE_DERIVED"] = (
        "PROXY-TARGET / RULE-DERIVED DATASET LIMITATION: "
        "Target y is derived from the same rule-based sub-scores that appear "
        "as features f0-f3. This model learns to approximate the rule engine, "
        "not real traveler preferences. "
        "This is a prototype-learning pipeline only."
    )
    return report


# ---------------------------------------------------------------------------
# Grouped train / val / test split
# ---------------------------------------------------------------------------
def grouped_split(rows: List[dict],
                  train_frac=0.70, val_frac=0.15,
                  seed: int = RANDOM_SEED) -> Tuple[List[dict], List[dict], List[dict]]:
    source_ids = list(set(r["source_id"] for r in rows))
    rng_local = random.Random(seed)
    rng_local.shuffle(source_ids)

    n = len(source_ids)
    n_train = max(1, math.floor(n * train_frac))
    n_val   = max(1, math.floor(n * val_frac))
    if n - n_train - n_val < 1 and n >= 3:
        n_val = max(0, n - n_train - 1)

    train_ids = set(source_ids[:n_train])
    val_ids   = set(source_ids[n_train:n_train + n_val])

    train = [r for r in rows if r["source_id"] in train_ids]
    val   = [r for r in rows if r["source_id"] in val_ids]
    test  = [r for r in rows if r["source_id"] not in train_ids | val_ids]
    return train, val, test


# ---------------------------------------------------------------------------
# Data quality report
# ---------------------------------------------------------------------------
def data_quality_report(rows, train, val, test, leakage) -> str:
    FEAT_KEYS = [
        "f0_env_score", "f1_acc_score", "f2_aff_score", "f3_con_score",
        "f4_env_weight", "f5_acc_weight", "f6_aff_weight", "f7_con_weight", "f8_state_prio",
    ]
    L = []
    L.append("=" * 62)
    L.append("DATA QUALITY REPORT")
    L.append("=" * 62)
    L.append(f"Total rows       : {len(rows)}")
    L.append(f"Train rows       : {len(train)}")
    L.append(f"Validation rows  : {len(val)}")
    L.append(f"Test rows        : {len(test)}")
    L.append(f"Unique sources   : {leakage['unique_source_ids']}")
    L.append(f"Dup feat vectors : {leakage['duplicate_feature_vectors']}")
    L.append(f"Target-as-feat   : {leakage['target_as_feature']}")

    L.append("\nNUMERIC FEATURES:")
    for k in FEAT_KEYS:
        v = np.array([r[k] for r in rows], dtype=np.float64)
        nulls = int(np.sum(np.isnan(v)))
        L.append(f"  {k:22s}  min={v.min():.4f}  max={v.max():.4f}  "
                 f"mean={v.mean():.4f}  null={nulls}")

    L.append("\ndata_state_original distribution:")
    states: Dict[str, int] = {}
    for r in rows:
        s = r.get("data_state_original", "MISSING")
        states[s] = states.get(s, 0) + 1
    for s, ct in sorted(states.items()):
        L.append(f"  {s:28s}: {ct}")

    L.append("\nsource_collection distribution:")
    cols: Dict[str, int] = {}
    for r in rows:
        c = r.get("source_collection", "MISSING")
        cols[c] = cols.get(c, 0) + 1
    for c, ct in sorted(cols.items()):
        L.append(f"  {c:28s}: {ct}")

    L.append("\nLEAKAGE AUDIT:")
    L.append(f"  {leakage['PROXY_TARGET_RULE_DERIVED']}")
    train_ids = set(r["source_id"] for r in train)
    test_ids  = set(r["source_id"] for r in test)
    overlap   = train_ids & test_ids
    L.append(f"  Train-test entity overlap: {len(overlap)} (MUST be 0)")
    if overlap:
        L.append(f"  OVERLAP IDs: {overlap}")

    L.append("\nSMALL DATASET WARNING:")
    L.append(f"  {leakage['unique_source_ids']} unique source entities.")
    L.append("  Evaluation metrics are illustrative only — not evidence of real performance.")
    L.append("=" * 62)
    return "\n".join(L)


# ---------------------------------------------------------------------------
# Write README
# ---------------------------------------------------------------------------
def write_readme(output_dir: Path, stats: dict):
    content = f"""# ML Re-Ranker Dataset

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
| Total rows | {stats['total']} |
| Train rows | {stats['train']} |
| Validation rows | {stats['val']} |
| Test rows | {stats['test']} |
| Unique source entities | {stats['unique_sources']} |
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
"""
    readme_path = output_dir / "README.md"
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] README written to {readme_path}")


# ---------------------------------------------------------------------------
# Model compatibility check
# ---------------------------------------------------------------------------
def model_compatibility_check():
    import pickle
    model_path = BACKEND_DIR / "recommendation_engine" / "ml" / "model.pkl"
    if not model_path.exists():
        print("[WARN] model.pkl not found.")
        return

    try:
        import sklearn
        inst = sklearn.__version__
    except Exception:
        inst = "unknown"

    try:
        import warnings
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            with open(model_path, "rb") as f:
                model = pickle.load(f)
            version_warns = [str(x.message) for x in w if "InconsistentVersion" in str(x.category)]
    except Exception as e:
        print(f"[ERROR] Cannot load model.pkl: {e}")
        return

    print(f"\nModel compatibility:")
    print(f"  Installed sklearn : {inst}")
    print(f"  Artifact sklearn  : 1.9.0")
    compatible = (inst == "1.9.0")
    print(f"  Compatible        : {'YES' if compatible else 'NO — C-OWNED FOLLOW-UP required'}")
    if version_warns:
        print(f"  Warning           : {version_warns[0][:120]}")

    # Quick inference smoke test with dummy data
    try:
        dummy = np.zeros((1, 9), dtype=np.float32)
        result = model.predict(dummy)
        print(f"  Inference test    : PASS (output={result[0]:.4f})")
    except Exception as e:
        print(f"  Inference test    : FAIL ({e})")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 62)
    print("D ML DATA PREPARATION — prepare_ml_dataset.py")
    print("Dataset type: synthetic_proxy | Real user rows: 0")
    print("=" * 62)

    rng = np.random.default_rng(RANDOM_SEED)

    pool = build_candidate_pool()
    n_routes = sum(1 for e in pool if e["_source_collection"] == "transport_routes")
    n_hotels = sum(1 for e in pool if e["_source_collection"] == "hotels")
    print(f"[OK] Loaded {len(pool)} seeded entities "
          f"({n_routes} routes, {n_hotels} hotels)")

    if not pool:
        print("[ERROR] No seeded entities found. Ensure database/seed_data/ is present.")
        sys.exit(1)

    rows = generate_rows(pool, rng)
    print(f"[OK] Generated {len(rows)} rows "
          f"(up to {SCENARIOS_PER_ENTITY} scenarios × {len(pool)} entities)")

    leakage = leakage_audit(rows)
    train, val, test = grouped_split(rows)
    print(f"[OK] Split: train={len(train)} / val={len(val)} / test={len(test)}")

    # Verify no overlap
    train_ids = set(r["source_id"] for r in train)
    test_ids  = set(r["source_id"] for r in test)
    overlap   = train_ids & test_ids
    if overlap:
        print(f"[ERROR] Train-test entity overlap: {overlap}")
        sys.exit(1)
    print("[OK] No train-test entity overlap")

    # Write JSONL
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    dataset_path = OUTPUT_DIR / "ml_dataset.jsonl"
    all_rows = (
        [dict(r, split="train") for r in train]
        + [dict(r, split="val") for r in val]
        + [dict(r, split="test") for r in test]
    )
    with open(dataset_path, "w", encoding="utf-8") as f:
        for row in all_rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"[OK] Dataset written to {dataset_path}")

    # Quality report
    report = data_quality_report(rows, train, val, test, leakage)
    print("\n" + report)

    # README
    write_readme(OUTPUT_DIR, {
        "total":  len(rows),
        "train":  len(train),
        "val":    len(val),
        "test":   len(test),
        "unique_sources": leakage["unique_source_ids"],
    })

    # Model compatibility
    model_compatibility_check()

    print("\n[DONE] D ML data preparation complete.")
    print("ML remains DISABLED by default (ML_ENABLED=false).")
    print("Rule-based recommendation engine is unchanged and unaffected.")


if __name__ == "__main__":
    main()
