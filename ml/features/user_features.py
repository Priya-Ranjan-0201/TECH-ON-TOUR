"""
ml/features/user_features.py
Feature extraction and vectorization for travelers / users.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from ml.config.settings import INTEREST_TAGS, BUDGET_TIERS, CATEGORIES

def extract_user_feature_vector(user_row: Dict[str, Any]) -> np.ndarray:
    """
    Constructs a dense numerical feature representation for a user:
    - 17 interest tag affinities (0.0 to 1.0)
    - Budget tier one-hot [budget, mid, luxury]
    - Age group one-hot [18-25, 26-35, 36-50, 50+]
    - Primary category affinities
    """
    pref_acts = str(user_row.get("preferred_activities", "")).lower()
    pref_cats = str(user_row.get("preferred_categories", "")).lower()
    budget = str(user_row.get("budget", "mid")).lower()
    age_group = str(user_row.get("age_group", "26-35")).lower()

    # 1. Interest affinities (17 dimensions)
    interest_vec = [1.0 if tag in pref_acts else 0.0 for tag in INTEREST_TAGS]

    # 2. Budget tier (3 dimensions)
    budget_vec = [1.0 if b in budget else 0.0 for b in BUDGET_TIERS]

    # 3. Age group (4 dimensions)
    age_bins = ["18-25", "26-35", "36-50", "50+"]
    age_vec = [1.0 if a in age_group else 0.0 for a in age_bins]

    # 4. Category affinities (9 dimensions)
    cat_vec = [1.0 if c in pref_cats else 0.0 for c in CATEGORIES]

    return np.array(interest_vec + budget_vec + age_vec + cat_vec, dtype=np.float32)

def compute_user_preference_overlap(user_interests: List[str], dest_keywords: str) -> float:
    """Calculates Jaccard overlap between user selected interests and destination keywords."""
    if not user_interests or not dest_keywords:
        return 0.10
    dest_lower = dest_keywords.lower()
    hits = sum(1 for tag in user_interests if tag.lower() in dest_lower)
    return round(float(hits / max(len(user_interests), 1)), 3)
