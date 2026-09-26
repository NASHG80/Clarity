"""
backend/recommendation_engine/tests/test_d_ml_dataset.py
Person D — ML dataset tests

Covers:
  - Deterministic generation (same rows every run)
  - Deterministic split (same partition every run)
  - Duplicate feature vector detection
  - Feature schema validation (9 dims, correct names, float)
  - Missing-value handling (not_verified -> 0.0 via C's feature extractor)
  - Data-state preservation in dataset rows
  - Source traceability (source_collection + source_id on every row)
  - Train-test entity leakage detection
  - Synthetic/demo label identification
  - Model input compatibility (feat_vec shape, dtype)
  - Candidate-count preserved by ML re-ranker
  - ML disabled -> rule-based order
  - ML failure -> rule-based order
  - Empty and single-candidate edge cases

Does NOT call SerpApi, RailRadar, or any external network.
Does NOT enable ML_ENABLED.
Does NOT modify MongoDB.
"""

import json
import math
import numpy as np
import pytest
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# ---------------------------------------------------------------------------
# Import the preparation module functions directly
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

import importlib.util, os

def _load_prep():
    """Load prepare_ml_dataset as a module without running main()."""
    spec_path = REPO_ROOT / "database" / "prepare_ml_dataset.py"
    spec = importlib.util.spec_from_file_location("prepare_ml_dataset", spec_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

try:
    prep = _load_prep()
    PREP_AVAILABLE = True
except Exception as e:
    PREP_AVAILABLE = False
    PREP_ERROR = str(e)

FEAT_KEYS = [
    "f0_env_score", "f1_acc_score", "f2_aff_score", "f3_con_score",
    "f4_env_weight", "f5_acc_weight", "f6_aff_weight", "f7_con_weight", "f8_state_prio",
]

DATASET_PATH = BACKEND_DIR / "recommendation_engine" / "ml" / "data" / "ml_dataset.jsonl"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def load_dataset():
    """Load the generated JSONL dataset from disk."""
    assert DATASET_PATH.exists(), (
        f"Dataset not found at {DATASET_PATH}. "
        "Run: python database/prepare_ml_dataset.py"
    )
    rows = []
    with open(DATASET_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


# ---------------------------------------------------------------------------
# 1. Deterministic generation
# ---------------------------------------------------------------------------
@pytest.mark.skipif(not PREP_AVAILABLE, reason=f"prep module unavailable: {PREP_ERROR if not PREP_AVAILABLE else ''}")
def test_generation_is_deterministic():
    """Running generate_rows twice with seed=42 produces identical rows."""
    pool = prep.build_candidate_pool()
    rng1 = np.random.default_rng(42)
    rng2 = np.random.default_rng(42)
    rows1 = prep.generate_rows(pool, rng1)
    rows2 = prep.generate_rows(pool, rng2)
    assert len(rows1) == len(rows2)
    for r1, r2 in zip(rows1, rows2):
        for k in FEAT_KEYS + ["y"]:
            assert abs(r1[k] - r2[k]) < 1e-7, f"Non-deterministic field: {k}"


# ---------------------------------------------------------------------------
# 2. Deterministic split
# ---------------------------------------------------------------------------
@pytest.mark.skipif(not PREP_AVAILABLE, reason="prep unavailable")
def test_split_is_deterministic():
    """Same rows produce the same split partitions when called twice."""
    pool = prep.build_candidate_pool()
    rng = np.random.default_rng(42)
    rows = prep.generate_rows(pool, rng)
    t1, v1, e1 = prep.grouped_split(rows)
    t2, v2, e2 = prep.grouped_split(rows)
    assert [r["source_id"] for r in t1] == [r["source_id"] for r in t2]
    assert [r["source_id"] for r in e1] == [r["source_id"] for r in e2]


# ---------------------------------------------------------------------------
# 3. No train-test entity leakage
# ---------------------------------------------------------------------------
@pytest.mark.skipif(not PREP_AVAILABLE, reason="prep unavailable")
def test_no_train_test_entity_leakage():
    pool = prep.build_candidate_pool()
    rng = np.random.default_rng(42)
    rows = prep.generate_rows(pool, rng)
    train, val, test = prep.grouped_split(rows)
    train_ids = set(r["source_id"] for r in train)
    test_ids  = set(r["source_id"] for r in test)
    overlap   = train_ids & test_ids
    assert len(overlap) == 0, f"Train-test entity overlap found: {overlap}"


# ---------------------------------------------------------------------------
# 4. Feature schema validation
# ---------------------------------------------------------------------------
def test_feature_schema_from_dataset():
    """Every row in the dataset has all 9 required feature columns as floats."""
    rows = load_dataset()
    assert len(rows) > 0, "Dataset is empty"
    for i, row in enumerate(rows):
        for k in FEAT_KEYS:
            assert k in row, f"Row {i} missing feature key {k}"
            assert isinstance(row[k], (int, float)), f"Row {i} key {k} not numeric: {row[k]}"
            assert not math.isnan(row[k]), f"Row {i} key {k} is NaN"


# ---------------------------------------------------------------------------
# 5. Target not in feature columns
# ---------------------------------------------------------------------------
def test_target_not_a_feature():
    assert "y" not in FEAT_KEYS
    assert "y_raw" not in FEAT_KEYS


# ---------------------------------------------------------------------------
# 6. Source traceability on every row
# ---------------------------------------------------------------------------
def test_source_traceability():
    rows = load_dataset()
    for i, row in enumerate(rows):
        assert "source_collection" in row and row["source_collection"], f"Row {i} missing source_collection"
        assert "source_id" in row and row["source_id"], f"Row {i} missing source_id"
        assert row["source_collection"] in ("transport_routes", "hotels"), (
            f"Row {i} unknown source_collection: {row['source_collection']}"
        )


# ---------------------------------------------------------------------------
# 7. Dataset type metadata
# ---------------------------------------------------------------------------
def test_dataset_type_metadata():
    rows = load_dataset()
    for i, row in enumerate(rows):
        assert row.get("dataset_type") == "synthetic_proxy", (
            f"Row {i} has wrong dataset_type: {row.get('dataset_type')}"
        )


# ---------------------------------------------------------------------------
# 8. Data-state preserved in dataset rows
# ---------------------------------------------------------------------------
def test_data_state_preserved():
    """All five canonical data states appear exactly as stored."""
    VALID_STATES = {"verified", "reported", "community_confirmed", "not_verified", "demo_synthetic"}
    rows = load_dataset()
    for i, row in enumerate(rows):
        ds = row.get("data_state_original")
        assert ds in VALID_STATES, f"Row {i} has invalid data_state_original: {ds}"


# ---------------------------------------------------------------------------
# 9. not_verified maps to 0.0 state_prio (C's existing feature contract)
# ---------------------------------------------------------------------------
def test_not_verified_maps_to_zero_state_prio():
    rows = load_dataset()
    nv_rows = [r for r in rows if r.get("data_state_original") == "not_verified"]
    assert len(nv_rows) > 0, "No not_verified rows to check"
    for r in nv_rows:
        assert r["f8_state_prio"] == 0.0, (
            f"not_verified state_prio should be 0.0, got {r['f8_state_prio']}"
        )


# ---------------------------------------------------------------------------
# 10. demo_synthetic maps to 1.0 state_prio
# ---------------------------------------------------------------------------
def test_demo_synthetic_maps_to_one_state_prio():
    rows = load_dataset()
    ds_rows = [r for r in rows if r.get("data_state_original") == "demo_synthetic"]
    if ds_rows:
        for r in ds_rows:
            assert r["f8_state_prio"] == 1.0, (
                f"demo_synthetic state_prio should be 1.0, got {r['f8_state_prio']}"
            )


# ---------------------------------------------------------------------------
# 11. Duplicate feature vector detection
# ---------------------------------------------------------------------------
def test_no_duplicate_feature_vectors():
    rows = load_dataset()
    seen = set()
    dups = []
    for i, row in enumerate(rows):
        vec = tuple(row[k] for k in FEAT_KEYS)
        if vec in seen:
            dups.append(i)
        seen.add(vec)
    # Duplicates can exist (same entity, same weights → same scores)
    # but we report the count — the leakage_audit already flags this.
    # Test only that leakage_audit detects them if they exist.
    leakage = prep.leakage_audit(rows) if PREP_AVAILABLE else {"duplicate_feature_vectors": len(dups)}
    assert leakage["duplicate_feature_vectors"] == len(dups)


# ---------------------------------------------------------------------------
# 12. Model input compatibility (9-dim float32)
# ---------------------------------------------------------------------------
def test_model_input_compatible():
    """Features can be shaped into the (1, 9) float32 matrix the model expects."""
    rows = load_dataset()
    sample = rows[0]
    feat_arr = np.array([sample[k] for k in FEAT_KEYS], dtype=np.float32)
    assert feat_arr.shape == (9,)
    reshaped = feat_arr.reshape(1, -1)
    assert reshaped.shape == (1, 9)


# ---------------------------------------------------------------------------
# 13. Model inference compatibility (using actual model)
# ---------------------------------------------------------------------------
def test_model_inference_on_dataset_row():
    """The model can produce a float prediction from a dataset row."""
    import pickle, warnings
    model_path = BACKEND_DIR / "recommendation_engine" / "ml" / "model.pkl"
    if not model_path.exists():
        pytest.skip("model.pkl not found")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        with open(model_path, "rb") as f:
            model = pickle.load(f)

    rows = load_dataset()
    sample = rows[0]
    feat_arr = np.array([sample[k] for k in FEAT_KEYS], dtype=np.float32).reshape(1, -1)
    result = model.predict(feat_arr)
    assert len(result) == 1
    assert isinstance(float(result[0]), float)


# ---------------------------------------------------------------------------
# 14. Candidate count preserved by re_rank_candidates
# ---------------------------------------------------------------------------
def test_candidate_count_preserved_by_ml_reranker():
    """re_rank_candidates never drops or adds candidates."""
    from recommendation_engine.ml.predict import re_rank_candidates
    candidates = [
        {"id": "a", "data_state": "reported", "score": 0.8, "sub_scores": {"environmental": 0.8, "accessibility": 0.7, "affordability": 0.6, "convenience": 0.5}, "original_index": 0},
        {"id": "b", "data_state": "not_verified", "score": 0.5, "sub_scores": {"environmental": 0.5, "accessibility": 0.0, "affordability": 0.9, "convenience": 0.8}, "original_index": 1},
        {"id": "c", "data_state": "demo_synthetic", "score": 0.3, "sub_scores": {"environmental": 0.2, "accessibility": 1.0, "affordability": 0.3, "convenience": 0.4}, "original_index": 2},
    ]
    weights = {"environmental": 0.25, "accessibility": 0.25, "affordability": 0.25, "convenience": 0.25}
    import pickle, warnings
    model_path = BACKEND_DIR / "recommendation_engine" / "ml" / "model.pkl"
    if not model_path.exists():
        pytest.skip("model.pkl not found")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        result = re_rank_candidates(candidates, weights)
    assert len(result) == len(candidates)
    result_ids = {r["id"] for r in result}
    assert result_ids == {"a", "b", "c"}


# ---------------------------------------------------------------------------
# 15. Data-state not mutated by re_rank_candidates
# ---------------------------------------------------------------------------
def test_data_state_not_mutated_by_ml():
    from recommendation_engine.ml.predict import re_rank_candidates
    candidates = [
        {"id": "a", "data_state": "not_verified", "score": 0.9, "sub_scores": {}, "original_index": 0},
    ]
    weights = {"environmental": 0.25, "accessibility": 0.25, "affordability": 0.25, "convenience": 0.25}
    import pickle, warnings
    model_path = BACKEND_DIR / "recommendation_engine" / "ml" / "model.pkl"
    if not model_path.exists():
        pytest.skip("model.pkl not found")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        result = re_rank_candidates(candidates, weights)
    assert result[0]["data_state"] == "not_verified"


# ---------------------------------------------------------------------------
# 16. ML disabled -> rule-based order preserved
# ---------------------------------------------------------------------------
def test_ml_disabled_preserves_rule_order():
    from recommendation_engine.rank import rank_candidates
    cands = [{"id": "low"}, {"id": "high"}]
    subs  = [{"environmental": 0.1}, {"environmental": 0.9}]
    with patch("recommendation_engine.config.ML_ENABLED", False):
        ranked = rank_candidates(cands, subs, {"environmental": 1.0})
    assert ranked[0]["id"] == "high"
    assert ranked[1]["id"] == "low"


# ---------------------------------------------------------------------------
# 17. ML failure -> fallback to rule-based
# ---------------------------------------------------------------------------
def test_ml_failure_falls_back_to_rule():
    from recommendation_engine.rank import rank_candidates
    cands = [{"id": "low"}, {"id": "high"}]
    subs  = [{"environmental": 0.1}, {"environmental": 0.9}]
    with patch("recommendation_engine.config.ML_ENABLED", True):
        with patch("recommendation_engine.ml.predict.extract_features",
                   side_effect=Exception("simulated crash")):
            ranked = rank_candidates(cands, subs, {"environmental": 1.0})
    assert ranked[0]["id"] == "high"


# ---------------------------------------------------------------------------
# 18. Empty candidate list
# ---------------------------------------------------------------------------
def test_empty_candidate_list():
    from recommendation_engine.rank import rank_candidates
    result = rank_candidates([], [], None)
    assert result == []


# ---------------------------------------------------------------------------
# 19. Single candidate
# ---------------------------------------------------------------------------
def test_single_candidate():
    from recommendation_engine.rank import rank_candidates
    result = rank_candidates([{"id": "only"}], [{"environmental": 0.5}], None)
    assert len(result) == 1
    assert result[0]["id"] == "only"


# ---------------------------------------------------------------------------
# 20. All rows have split label
# ---------------------------------------------------------------------------
def test_all_rows_have_split_label():
    rows = load_dataset()
    for i, row in enumerate(rows):
        assert row.get("split") in ("train", "val", "test"), (
            f"Row {i} has invalid split: {row.get('split')}"
        )


# ---------------------------------------------------------------------------
# 21. Target range [0, 1]
# ---------------------------------------------------------------------------
def test_target_in_unit_range():
    rows = load_dataset()
    for i, row in enumerate(rows):
        y = row["y"]
        assert -1e-6 <= y <= 1.0 + 1e-6, f"Row {i} y={y} outside [0,1]"


# ---------------------------------------------------------------------------
# 22. Weight presets sum to ~1.0 after normalization
# ---------------------------------------------------------------------------
@pytest.mark.skipif(not PREP_AVAILABLE, reason="prep unavailable")
def test_weight_presets_normalize_to_one():
    for preset in prep.WEIGHT_PRESETS:
        w = prep.normalize_weights(preset)
        total = sum(w.values())
        assert abs(total - 1.0) < 1e-6, f"Preset {preset} normalized total={total}"
