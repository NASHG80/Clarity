"""
Central configuration for the recommendation engine (Task D17).

Single source of truth for confirmation thresholds and tie-breaking epsilon values.
Shared across backend scoring, database verification scripts, and confirmation logic.
"""

import os

# Number of community confirmations required for an item's data_state
# to transition to "community_confirmed" (see docs/DATA_MODEL.md & docs/TEAM_SPLIT.md D6, D17).
CONFIRMATION_THRESHOLD: int = int(os.getenv("CONFIRMATION_THRESHOLD", "3"))

# Epsilon tolerance for considering scores to be a "near-tie" before applying
# the data-state tie-breaking logic: verified > reported > community_confirmed > demo_synthetic
# (see docs/TEAM_SPLIT.md C6 & D17).
TIE_BREAKING_EPSILON: float = float(os.getenv("TIE_BREAKING_EPSILON", "0.01"))

# Canonical alias
EPSILON: float = TIE_BREAKING_EPSILON
TIE_BREAK_EPSILON: float = TIE_BREAKING_EPSILON
ML_ENABLED = os.getenv("ML_ENABLED", "false").lower() == "true"
