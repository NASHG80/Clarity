"""Dataset generation for experimental ML re-ranker.

LIMITATION: Interaction data (`analytics_events`) is currently entirely synthetic 
and limited to 2-3 demo businesses. There is insufficient legitimate data 
to train a real-world personalization model.

This module generates a transparent SYNTHETIC training strategy to simulate 
a dataset for the ML experiment.
"""
import numpy as np

def generate_synthetic_data(num_samples=1000):
    """Generates synthetic feature vectors and labels for training.
    
    Label logic (synthetic): 
    Travelers generally prefer higher sub-scores but strongly penalize 
    not_verified data states and low accessibility if weight is high.
    """
    np.random.seed(42)
    
    # Features: [env_score, acc_score, aff_score, con_score, env_wt, acc_wt, aff_wt, con_wt, state_prio]
    X = np.random.rand(num_samples, 9)
    
    # Normalize weights so they sum to 1
    w_sum = X[:, 4:8].sum(axis=1, keepdims=True)
    X[:, 4:8] = X[:, 4:8] / w_sum
    
    # Overwrite state_prio with discrete values 0 to 4
    X[:, 8] = np.random.choice([0, 1, 2, 3, 4], size=num_samples)
    
    # Synthetic target: base score is weighted sum
    base_scores = (X[:, 0]*X[:, 4] + X[:, 1]*X[:, 5] + X[:, 2]*X[:, 6] + X[:, 3]*X[:, 7])
    
    # Penalty if accessibility weight is high but score is low
    acc_penalty = np.where((X[:, 5] > 0.4) & (X[:, 1] < 0.2), -0.5, 0.0)
    
    # Bonus for verified (4) or reported (3)
    state_bonus = X[:, 8] * 0.1
    
    y = base_scores + acc_penalty + state_bonus + np.random.normal(0, 0.05, num_samples)
    
    # Normalize y to 0-1 range roughly
    y = (y - y.min()) / (y.max() - y.min())
    return X, y
