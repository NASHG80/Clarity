"""Thresholds and epsilon values — single source of truth"""
import os

TIE_BREAK_EPSILON = 0.01
ML_ENABLED = os.getenv("ML_ENABLED", "false").lower() == "true"
