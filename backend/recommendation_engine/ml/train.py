"""Training script for experimental ML re-ranker.

Trains a lightweight Ridge Regression model using D's prepared JSONL dataset.

SYNTHETIC PROXY DATASET — NOT REAL USER DATA.
Train only on split='train', validate on split='val'.
Artifact saved to model.pkl for use by predict.py.

Usage:
    python -m recommendation_engine.ml.train
"""
import os
import json
import pickle
import warnings
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error

FEATURE_COLS = ["f0_env_score", "f1_acc_score", "f2_aff_score", "f3_con_score",
                "f4_env_weight", "f5_acc_weight", "f6_aff_weight", "f7_con_weight",
                "f8_state_prio"]

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
DATASET_PATH = os.path.join(MODEL_DIR, "data", "ml_dataset.jsonl")


def load_split(split: str):
    """Load rows from the JSONL dataset matching a given split name."""
    rows = []
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            if row["split"] == split:
                rows.append(row)
    X = np.array([[r[col] for col in FEATURE_COLS] for r in rows], dtype=np.float32)
    y = np.array([r["y"] for r in rows], dtype=np.float32)
    return X, y, len(rows)


def train_model():
    """Train Ridge on split='train', validate on split='val', report metrics."""
    import sklearn
    print(f"Training sklearn version: {sklearn.__version__}")
    print(f"Runtime sklearn version: {sklearn.__version__}")
    print()

    print(f"Loading dataset from: {DATASET_PATH}")
    X_train, y_train, n_train = load_split("train")
    X_val, y_val, n_val = load_split("val")
    _, _, n_test = load_split("test")

    print(f"train rows: {n_train}")
    print(f"validation rows: {n_val}")
    print(f"test rows: {n_test}")
    print()

    print("Training ML Re-ranker (Ridge Regression, alpha=1.0)...")
    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)

    train_mae = mean_absolute_error(y_train, model.predict(X_train))
    val_mae = mean_absolute_error(y_val, model.predict(X_val))
    print(f"Train MAE: {train_mae:.4f}")
    print(f"Validation MAE: {val_mae:.4f}")
    print()

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"Model saved to: {MODEL_PATH}")

    # Verify no InconsistentVersionWarning on reload
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        with open(MODEL_PATH, "rb") as f:
            pickle.load(f)
        version_warnings = [x for x in w if "InconsistentVersionWarning" in str(x.category)]

    if version_warnings:
        print(f"Artifact load warning: {version_warnings[0].message}")
    else:
        print("Artifact load warning: NONE")


if __name__ == "__main__":
    train_model()
