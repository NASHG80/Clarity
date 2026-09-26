"""Inference and integration script for ML re-ranker.

Applies the trained ML model safely over the rule-based rankings.
"""
import os
import pickle
import logging
from typing import List, Dict, Any, Optional

from recommendation_engine.ml.features import extract_features
from recommendation_engine.rank import normalize_weights

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")

_model = None

def load_model():
    """Lazy load the scikit-learn model."""
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            return None
        try:
            with open(MODEL_PATH, "rb") as f:
                _model = pickle.load(f)
        except Exception as e:
            logger.error(f"Failed to load ML model: {e}")
            return None
    return _model

def re_rank_candidates(
    ranked_candidates: List[Dict[str, Any]], 
    raw_weights: Any
) -> List[Dict[str, Any]]:
    """Re-ranks candidates using the experimental ML model.
    
    RULES PRESERVED:
    - Never reinstates filtered candidates (only operates on valid valid list)
    - Missing data remains missing (no inference)
    - Original trade-off metadata and badges are untouched
    - Safely falls back to rule-based order if ML fails
    """
    model = load_model()
    if model is None:
        return ranked_candidates
        
    weights = normalize_weights(raw_weights)
    
    scored_candidates = []
    for cand in ranked_candidates:
        try:
            features = extract_features(cand, weights)
            # Predict returns 1D array
            ml_score = model.predict(features.reshape(1, -1))[0]
            
            # We store the ML score for sorting, but do NOT overwrite 
            # the rule-based `personal_match_pct` or `score`
            cand_copy = dict(cand)
            cand_copy["ml_score"] = float(ml_score)
            scored_candidates.append(cand_copy)
        except Exception as e:
            logger.warning(f"ML extraction/prediction failed for candidate {cand.get('id')}: {e}")
            # Fallback for this specific candidate: just give it a low score
            # or better yet, if ANY fail, abort the whole ML layer to be safe
            return ranked_candidates
            
    # Sort descending by ML score
    scored_candidates.sort(key=lambda x: x["ml_score"], reverse=True)
    
    # Reassign rank (1-indexed) based on ML order
    for idx, res in enumerate(scored_candidates):
        res["rank"] = idx + 1
        
    return scored_candidates
