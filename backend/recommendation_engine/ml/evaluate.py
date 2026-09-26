"""Evaluation script for the experimental ML re-ranker.

Compares Baseline (Rule-based) vs Experimental (ML Re-ranked) on synthetic data.
"""
import numpy as np
from recommendation_engine.ml.dataset import generate_synthetic_data
from recommendation_engine.ml.predict import load_model

def evaluate_model():
    print("--- ML Re-ranker Evaluation ---")
    print("WARNING: Data is 100% synthetic/demo data. Results do NOT reflect real user personalization accuracy.")
    
    # Generate test set
    X_test, y_test = generate_synthetic_data(num_samples=500)
    
    model = load_model()
    if model is None:
        print("Model not found. Run train.py first.")
        return
        
    y_pred = model.predict(X_test)
    
    # Baseline is predicting just the simple unweighted average or something
    # But wait, our rule-based system predicts `base_scores`.
    # Our synthetic data base_score is the dot product of axes and weights.
    base_scores = (X_test[:, 0]*X_test[:, 4] + X_test[:, 1]*X_test[:, 5] + X_test[:, 2]*X_test[:, 6] + X_test[:, 3]*X_test[:, 7])
    
    # Metric: Mean Absolute Error (MAE) on synthetic score
    mae_baseline = np.mean(np.abs(y_test - base_scores))
    mae_experimental = np.mean(np.abs(y_test - y_pred))
    
    print("\n--- Mean Absolute Error (lower is better) ---")
    print(f"Baseline (Rule-based ranking):   {mae_baseline:.4f}")
    print(f"Experimental (ML Re-ranking):  {mae_experimental:.4f}")
    
    if mae_experimental < mae_baseline:
        print("\nConclusion: The ML re-ranker successfully learns the synthetic non-linear preferences (e.g. data_state penalty) that the base rule-engine ignores.")
    else:
        print("\nConclusion: ML did not improve ranking on synthetic data.")
        
if __name__ == "__main__":
    evaluate_model()
