"""
Recommendation Model Retraining Service.
Trains GradientBoostingClassifier on destination features and user interaction patterns.
Evaluates on test split, logs ROC-AUC, accuracy, and saves model atomically.
"""

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score, accuracy_score, f1_score, precision_score
from sklearn.model_selection import train_test_split

logger = logging.getLogger("recommendation_retrain")

SERVICES_DIR = Path(__file__).resolve().parent
MODEL_PATH = SERVICES_DIR / "recommendation_model.pkl"
METADATA_PATH = SERVICES_DIR / "recommendation_model_metadata.json"

FEATURES = [
    "interest_overlap_score",
    "distance_km",
    "season_match",
    "past_category_affinity",
    "avg_rating",
    "price_tier_match",
    "global_popularity_30d"
]

def generate_recommendation_dataset(n_samples: int = 15000, random_state: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(random_state)
    
    interest_overlap = rng.uniform(0.0, 1.0, n_samples)
    distance_km = rng.exponential(scale=180.0, size=n_samples) + 5.0
    distance_km = np.clip(distance_km, 2.0, 2500.0)
    
    # 40% season match rate reflecting realistic monthly travel
    season_match = rng.choice([0, 1], p=[0.60, 0.40], size=n_samples)
    category_affinity = rng.uniform(0.1, 1.0, n_samples)
    avg_rating = np.clip(rng.normal(loc=4.2, scale=0.5, size=n_samples), 2.5, 5.0)
    price_tier = rng.choice([0, 1], p=[0.35, 0.65], size=n_samples)
    popularity = rng.integers(20, 1000, size=n_samples)

    # Conversion probability formula
    logits = (
        interest_overlap * 2.2
        - (distance_km / 600.0) * 0.8
        + season_match * 1.4
        + category_affinity * 1.8
        + (avg_rating - 3.5) * 1.2
        + price_tier * 0.9
        + (np.log1p(popularity) / 7.0) * 0.6
        - 2.4
    )
    probs = 1.0 / (1.0 + np.exp(-logits))
    converted = (rng.uniform(0, 1, n_samples) < probs).astype(int)

    return pd.DataFrame({
        "interest_overlap_score": np.round(interest_overlap, 3),
        "distance_km": np.round(distance_km, 1),
        "season_match": season_match,
        "past_category_affinity": np.round(category_affinity, 3),
        "avg_rating": np.round(avg_rating, 2),
        "price_tier_match": price_tier,
        "global_popularity_30d": popularity,
        "converted": converted
    })

def retrain_recommendation_model(n_samples: int = 15000) -> Dict[str, Any]:
    logger.info("Starting recommendation model retraining...")
    df = generate_recommendation_dataset(n_samples=n_samples)
    
    X = df[FEATURES]
    y = df["converted"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    model = GradientBoostingClassifier(
        n_estimators=120,
        learning_rate=0.08,
        max_depth=4,
        min_samples_split=4,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)
    
    auc = float(roc_auc_score(y_test, y_pred_proba))
    acc = float(accuracy_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    
    # Save model
    temp_path = MODEL_PATH.with_suffix(".tmp")
    joblib.dump(model, temp_path)
    temp_path.replace(MODEL_PATH)
    
    importances = {feat: round(float(imp), 4) for feat, imp in zip(FEATURES, model.feature_importances_)}
    
    metadata = {
        "model_name": "Recommendation Ranking Model",
        "algorithm": "GradientBoostingClassifier (scikit-learn)",
        "features": FEATURES,
        "target": "converted",
        "n_samples": n_samples,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "last_trained_utc": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "roc_auc": round(auc, 4),
            "accuracy": round(acc, 4),
            "f1_score": round(f1, 4),
            "precision": round(prec, 4)
        },
        "feature_importances": importances
    }
    
    import json
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    logger.info(f"Recommendation model retrained successfully. ROC-AUC: {auc:.4f}, Accuracy: {acc:.4f}")
    return metadata

if __name__ == "__main__":
    meta = retrain_recommendation_model()
    print("Retrained Recommendation Model Metrics:", meta["metrics"])
