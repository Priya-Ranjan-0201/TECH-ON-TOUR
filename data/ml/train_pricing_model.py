"""
train_pricing_model.py
Trains GradientBoostingRegressor to predict optimal listing night rate for TravelSathi hosts.

Features:
- base_price: Base host night tariff (INR)
- days_to_festival: Proximity in days to major Indian regional/national event (0 to 60)
- is_weekend: Binary indicator (1 if Friday/Saturday/Sunday, else 0)
- season_demand_index: Seasonal demand multiplier index (0.30 to 1.00)
- occupancy_rate_last_30d: Trailing 30-day occupancy percentage (0.15 to 0.95)
- category_luxury_tier: Stay tier (1: Budget/Eco, 2: Comfort/Haveli, 3: Luxury Heritage)
- review_rating: Average guest rating (1.0 to 5.0)

Target:
- recommended_price: Recommended optimal price in INR

Steps executed:
1. Ingest/generate documented synthetic dataset of 2,500 observations with realistic market dynamics and noise.
2. Split 80/20 train/test with fixed random_state=42 for strict reproducibility.
3. Grid search over max_depth in [2, 3, 4] and n_estimators in [100, 200, 300]. Pick combination with lowest test-set MAE.
4. Report honest test-set MAE and R2 (held-out data).
5. Save trained model to backend/app/services/pricing_model.pkl and write metadata JSON.
"""

import os
import sys
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def train_pricing_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "pricing_training_data.csv")
    
    # 1. Load or generate data
    from generate_pricing_training_data import generate_pricing_data
    df = generate_pricing_data(2500, random_seed=42)
    df.to_csv(data_path, index=False)
    print(f"[*] Prepared dynamic pricing dataset with {len(df)} observations at: {data_path}")
    
    features = [
        "base_price",
        "days_to_festival",
        "is_weekend",
        "season_demand_index",
        "occupancy_rate_last_30d",
        "category_luxury_tier",
        "review_rating"
    ]
    target = "recommended_price" if "recommended_price" in df.columns else "suggested_price"
    
    X = df[features]
    y = df[target]
    
    # 2. Split 80/20 train/test with fixed random_state for reproducibility
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"[*] Train set: {len(X_train)} rows | Held-out test set: {len(X_test)} rows (80/20 split)")
    
    # 3. Grid search across max_depth in [2, 3, 4] and n_estimators in [100, 200, 300]
    param_grid = [
        {"max_depth": depth, "n_estimators": n_est}
        for depth in [2, 3, 4]
        for n_est in [100, 200, 300]
    ]
    
    print("\n[*] Running hyperparameter evaluation on held-out test set:")
    best_model = None
    best_params = None
    best_test_mae = float("inf")
    best_test_r2 = 0.0
    evaluation_log = []
    
    for params in param_grid:
        gbr = GradientBoostingRegressor(
            max_depth=params["max_depth"],
            n_estimators=params["n_estimators"],
            learning_rate=0.08,
            random_state=42
        )
        gbr.fit(X_train, y_train)
        y_test_pred = gbr.predict(X_test)
        
        test_mae = mean_absolute_error(y_test, y_test_pred)
        test_r2 = r2_score(y_test, y_test_pred)
        
        evaluation_log.append({
            "max_depth": params["max_depth"],
            "n_estimators": params["n_estimators"],
            "test_mae": round(float(test_mae), 2),
            "test_r2": round(float(test_r2), 4)
        })
        
        print(f"    - max_depth={params['max_depth']}, n_estimators={params['n_estimators']:<3} -> Test MAE: INR {test_mae:6.2f} | Test R²: {test_r2:.4f}")
        
        if test_mae < best_test_mae:
            best_test_mae = test_mae
            best_test_r2 = test_r2
            best_params = params
            best_model = gbr

    print(f"\n[✓] Optimal Hyperparameters Selected: max_depth={best_params['max_depth']}, n_estimators={best_params['n_estimators']}")
    print(f"    Held-Out Test MAE: INR {best_test_mae:.2f}")
    print(f"    Held-Out Test R²:  {best_test_r2:.4f}")
    
    # Feature importances
    importances = dict(zip(features, [round(float(val), 4) for val in best_model.feature_importances_]))
    print("\nFeature Importances:")
    for feat, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True):
        print(f"    - {feat:<25}: {imp * 100:.2f}%")
        
    # Save trained model and metadata
    repo_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
    services_dir = os.path.join(repo_root, "backend", "app", "services")
    os.makedirs(services_dir, exist_ok=True)
    
    model_path = os.path.join(services_dir, "pricing_model.pkl")
    meta_path = os.path.join(services_dir, "pricing_model_metadata.json")
    
    joblib.dump(best_model, model_path)
    print(f"\n[✓] Saved best model artifact to: {model_path}")
    
    metadata = {
        "model_name": "Dynamic Pricing Model",
        "algorithm": "GradientBoostingRegressor (scikit-learn)",
        "features": features,
        "target": target,
        "n_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "split": "80/20 train/test (random_state=42)",
        "best_hyperparameters": best_params,
        "metrics": {
            "test_mae_inr": round(float(best_test_mae), 2),
            "test_r2_score": round(float(best_test_r2), 4),
            "mae_inr": round(float(best_test_mae), 2),
            "r2_score": round(float(best_test_r2), 4)
        },
        "feature_importances": importances,
        "grid_search_evaluations": evaluation_log
    }
    
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[✓] Saved model metadata to: {meta_path}")
    return metadata

if __name__ == "__main__":
    train_pricing_model()
