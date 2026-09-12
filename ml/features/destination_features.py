"""
ml/features/destination_features.py
Feature extraction and normalization for destinations.
"""

from typing import Dict, Any, List
import numpy as np
import pandas as pd

def extract_destination_feature_vector(dest_row: Dict[str, Any]) -> np.ndarray:
    """
    Extracts normalized quantitative destination attributes:
    - 9 semantic scores (family, solo, couple, adventure, nature, heritage, religious, nightlife, accessibility) [0.0 - 1.0]
    - Popularity score [0.0 - 1.0]
    - Normalized budget [0.0 - 1.0]
    - Recommended duration [1 - 7] normalized
    """
    sem_scores = [
        float(dest_row.get("family_score", 5.0)) / 10.0,
        float(dest_row.get("solo_score", 5.0)) / 10.0,
        float(dest_row.get("couple_score", 5.0)) / 10.0,
        float(dest_row.get("adventure_score", 5.0)) / 10.0,
        float(dest_row.get("nature_score", 5.0)) / 10.0,
        float(dest_row.get("heritage_score", 5.0)) / 10.0,
        float(dest_row.get("religious_score", 5.0)) / 10.0,
        float(dest_row.get("nightlife_score", 3.0)) / 10.0,
        float(dest_row.get("accessibility_score", 7.0)) / 10.0,
    ]
    pop = float(dest_row.get("popularity_score", 0.5))
    avg_budget = float(dest_row.get("average_budget", 3000.0))
    norm_budget = float(np.clip(avg_budget / 12000.0, 0.05, 1.0))
    rec_days = float(dest_row.get("recommended_days", 2)) / 7.0

    return np.array(sem_scores + [pop, norm_budget, rec_days], dtype=np.float32)

def compute_budget_tier_match(user_budget: str, dest_avg_budget: float) -> float:
    """Computes budget alignment score (1.0 = exact match, 0.5 = adjacent, 0.1 = mismatch)."""
    b = str(user_budget).lower()
    if "bud" in b:
        return 1.0 if dest_avg_budget <= 2500 else (0.5 if dest_avg_budget <= 5000 else 0.1)
    elif "lux" in b:
        return 1.0 if dest_avg_budget >= 5500 else (0.6 if dest_avg_budget >= 3000 else 0.2)
    else:  # mid
        return 1.0 if 2000 <= dest_avg_budget <= 6500 else 0.5
