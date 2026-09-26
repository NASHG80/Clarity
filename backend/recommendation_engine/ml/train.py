"""Training script for experimental ML re-ranker.

Trains a lightweight Ridge Regression model on synthetic data.
"""
import os
import pickle
from sklearn.linear_model import Ridge
from recommendation_engine.ml.dataset import generate_synthetic_data

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")

def train_model():
    print("Generating synthetic data...")
    X, y = generate_synthetic_data(num_samples=2000)
    
    print("Training ML Re-ranker (Ridge Regression)...")
    model = Ridge(alpha=1.0)
    model.fit(X, y)
    
    score = model.score(X, y)
    print(f"Training R^2 Score (on synthetic data): {score:.4f}")
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_model()
