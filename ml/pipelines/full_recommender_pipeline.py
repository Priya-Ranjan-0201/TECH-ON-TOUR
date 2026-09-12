"""
ml/pipelines/full_recommender_pipeline.py
-----------------------------------------
End-to-end test and validation runner for the multi-model recommendation engine.
Simulates varied traveler personas (Budget Solo Hiker, Luxury Couple, Heritage Explorer)
and verifies multi-model scoring, ranking, diversity, and explanations.
"""

import json
from ml.inference.orchestrator import orchestrator

def run_pipeline_demo():
    print("=================================================================")
    print("      TRAVELSATHI / DESHORA: MULTI-MODEL RECOMMENDATION DEMO     ")
    print("=================================================================")

    personas = [
        {
            "name": "Arjun (Budget Solo Adventure Traveler)",
            "profile": {
                "travel_style": "adventure",
                "budget": "budget",
                "preferred_categories": "adventure, mountains",
                "preferred_activities": "trekking, rafting, camping",
                "age_group": "18-24"
            },
            "context": {
                "month": 9,
                "month_name": "September",
                "temperature": 20.0,
                "rainfall": 15.0,
                "is_weekend": 1
            }
        },
        {
            "name": "Pooja & Rohan (Luxury Cultural Couple)",
            "profile": {
                "travel_style": "heritage",
                "budget": "luxury",
                "preferred_categories": "heritage, culture, food",
                "preferred_activities": "palaces, monuments, fine dining",
                "age_group": "25-34"
            },
            "context": {
                "month": 11,
                "month_name": "November",
                "temperature": 22.0,
                "rainfall": 2.0,
                "is_weekend": 0
            }
        }
    ]

    for p in personas:
        print(f"\n[*] Evaluating Persona: {p['name']}")
        recs = orchestrator.recommend(
            user_profile=p["profile"],
            context=p["context"],
            top_k=5
        )

        for item in recs:
            print(f"    #{item['ranking_position']} {item['name']} ({item['state']})")
            print(f"       Final Score: {item['final_score']} | Confidence: {item['confidence']}")
            print(f"       Scores: M1={item['model_scores']['m1_personalization']} | "
                  f"M2 Weather={item['model_scores']['m2_weather_class']} | "
                  f"M5 Trend={item['model_scores']['m5_trend_status']} | "
                  f"M6 Crowd={item['model_scores']['m6_crowd_level']}")
            print(f"       Explanations: {item['recommendation_reasons']}")
            print()

if __name__ == "__main__":
    run_pipeline_demo()
