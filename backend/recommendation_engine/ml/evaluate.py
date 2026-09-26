"""Evaluation script for the experimental ML re-ranker.

Uses the held-out split='test' partition from D's prepared JSONL dataset.

SYNTHETIC PROXY EVALUATION — NOT REAL USER PERFORMANCE.
These results reflect learning from a rule-derived synthetic target.
They do NOT indicate real traveler preference accuracy.

Usage:
    python -m recommendation_engine.ml.evaluate
"""
import os
import json
import pickle
import numpy as np
from sklearn.metrics import mean_absolute_error

FEATURE_COLS = ["f0_env_score", "f1_acc_score", "f2_aff_score", "f3_con_score",
                "f4_env_weight", "f5_acc_weight", "f6_aff_weight", "f7_con_weight",
                "f8_state_prio"]

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
DATASET_PATH = os.path.join(MODEL_DIR, "data", "ml_dataset.jsonl")


def load_split(split: str):
    rows = []
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            if row["split"] == split:
                rows.append(row)
    X = np.array([[r[col] for col in FEATURE_COLS] for r in rows], dtype=np.float32)
    y = np.array([r["y"] for r in rows], dtype=np.float32)
    return X, y, len(rows)


def evaluate_model():
    print("=" * 60)
    print("SYNTHETIC PROXY EVALUATION — NOT REAL USER PERFORMANCE")
    print("=" * 60)
    print()
    print("WARNING: Dataset is 100% synthetic/demo data, derived from")
    print("the rule-based recommendation logic. Results do NOT reflect")
    print("real traveler preferences or booking outcomes.")
    print()

    if not os.path.exists(MODEL_PATH):
        print("ERROR: model.pkl not found. Run train.py first.")
        return

    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    X_test, y_test, n_test = load_split("test")
    print(f"Evaluating on test split ({n_test} rows)...")
    print()

    y_pred = model.predict(X_test)

    # Baseline: rule-based weighted sum (the weighted-sum the rule engine already computes)
    # Reproduced from the dataset's own target formula — base_score without acc_penalty/state_bonus
    base_scores = (X_test[:, 0] * X_test[:, 4] +
                   X_test[:, 1] * X_test[:, 5] +
                   X_test[:, 2] * X_test[:, 6] +
                   X_test[:, 3] * X_test[:, 7])

    mae_baseline = mean_absolute_error(y_test, base_scores)
    mae_experimental = mean_absolute_error(y_test, y_pred)

    print("--- Mean Absolute Error (lower is better) ---")
    print(f"Baseline (Rule-based weighted sum): {mae_baseline:.4f}")
    print(f"Experimental (ML Ridge re-ranker):  {mae_experimental:.4f}")
    print()

    if mae_experimental < mae_baseline:
        print("Observation: ML re-ranker reduces MAE vs baseline on the synthetic")
        print("test split. This reflects learning the acc_penalty and state_bonus")
        print("terms — not real user preferences.")
    else:
        print("Observation: ML did not reduce MAE vs baseline on test split.")

    print()
    print("=" * 60)
    print("SYNTHETIC PROXY EVALUATION — NOT REAL USER PERFORMANCE")
    print("=" * 60)


if __name__ == "__main__":
    evaluate_model()
