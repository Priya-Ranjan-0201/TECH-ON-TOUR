"""
ml/config/settings.py
Central Configuration and Hyperparameters for TravelSathi / DESHORA Recommendation Engine.
"""

import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ML_DIR = BASE_DIR / "ml"
DATA_DIR = ML_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
EXTERNAL_DATA_DIR = DATA_DIR / "external"
MODELS_DIR = ML_DIR / "models"
EMBEDDINGS_DIR = ML_DIR / "embeddings"
EVALUATION_DIR = ML_DIR / "evaluation"

# Master catalog from repository data
PLACES_CSV_PATH = BASE_DIR / "data" / "places.csv"

# Global Reproducibility
RANDOM_SEED = 42

# Taxonomies
INTEREST_TAGS = [
    "adventure", "nature", "heritage", "spiritual", "beach", "mountain",
    "food", "nightlife", "shopping", "wildlife", "budget", "luxury",
    "family", "solo", "couple", "short_trip", "long_trip"
]

BUDGET_TIERS = ["budget", "mid", "luxury"]

CATEGORIES = [
    "heritage", "nature", "spiritual", "adventure", "beach",
    "wildlife", "hill_station", "cultural", "urban"
]

INTERACTION_WEIGHTS = {
    "view": 1.0,
    "click": 2.0,
    "save": 4.0,
    "share": 5.0,
    "itinerary_add": 6.0,
    "booking": 10.0,
    "positive_rating": 8.0,
    "rejection": -5.0,
    "skip": -2.0
}

# Initial Ensemble Ranking Weights (starting values, subject to learned optimization)
ENSEMBLE_WEIGHTS = {
    "personalization": 0.30,
    "season_weather": 0.20,
    "preference_match": 0.15,
    "nearby_relevance": 0.10,
    "popularity_trend": 0.10,
    "similarity": 0.10,
    "demand_crowd": 0.05
}

MONTH_NAMES = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
]

SEASON_LABELS = ["Excellent", "Good", "Moderate", "Poor", "Not Recommended"]
CROWD_LABELS = ["Low", "Moderate", "High", "Very High"]
