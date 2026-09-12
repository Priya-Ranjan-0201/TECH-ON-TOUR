"""
ml/evaluation/evaluate_all.py
----------------------------
Aggregates validation and held-out test metrics from all 7 models
into a standardized evaluation report.
"""

import sys
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from ml.config.settings import MODELS_DIR, EVALUATION_DIR

def generate_global_evaluation_report():
    print("=================================================================")
    print("      TRAVELSATHI / DESHORA: 7-MODEL EVALUATION BENCHMARK        ")
    print("=================================================================")

    report = {
        "framework": "TravelSathi Specialized Multi-Model Recommendation Engine",
        "evaluation_strategy": "Strict temporal and held-out test splits without data leakage",
        "models": {}
    }

    model_keys = [
        ("MODEL 1: Destination Recommender (LTR)", "destination_recommender"),
        ("MODEL 2: Season & Weather Suitability", "season_weather"),
        ("MODEL 3: Nearby Place Ranker", "nearby_ranker"),
        ("MODEL 4: Personal Preference Latent Model", "preference_model"),
        ("MODEL 5: Popularity & Trending Model", "trending_model"),
        ("MODEL 6: Travel Demand & Crowd Forecaster", "demand_model"),
        ("MODEL 7: Destination Similarity Model", "similarity_model"),
    ]

    for display_name, folder_name in model_keys:
        meta_path = MODELS_DIR / folder_name / "metadata.json"
        if meta_path.exists():
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
            report["models"][folder_name] = {
                "name": display_name,
                "version": meta.get("model_version", "v1.0.0"),
                "algorithm": meta.get("algorithm", meta.get("classifier_algorithm", "Unknown")),
                "metrics": meta.get("metrics", {}),
                "features": meta.get("features", [])
            }
            print(f"\n[+] {display_name}:")
            print(f"    Algorithm: {report['models'][folder_name]['algorithm']}")
            for k, v in meta.get("metrics", {}).items():
                print(f"    {k}: {v}")
        else:
            print(f"[-] Missing metadata for {folder_name}")

    out_file = EVALUATION_DIR / "evaluation_report.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"\n[OK] Complete multi-model evaluation report exported to {out_file}")
    return report

if __name__ == "__main__":
    generate_global_evaluation_report()
