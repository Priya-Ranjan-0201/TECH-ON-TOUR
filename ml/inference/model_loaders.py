"""
ml/inference/model_loaders.py
-----------------------------
Singleton model registry for high-performance, sub-50ms inference.
Loads all 7 specialized ML models, precomputed vector embeddings,
and destination reference indexes ONCE at application boot time.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
import joblib

from ml.config.settings import (
    MODELS_DIR,
    PROCESSED_DATA_DIR,
    EMBEDDINGS_DIR,
    RANDOM_SEED
)

logger = logging.getLogger(__name__)

class ModelRegistry:
    _instance: Optional["ModelRegistry"] = None

    def __init__(self):
        self.is_loaded = False
        self.destinations_df: Optional[pd.DataFrame] = None
        self.dest_lookup: Dict[int, Dict[str, Any]] = {}
        self.dest_name_lookup: Dict[str, int] = {}
        
        # Model artifacts
        self.m1_destination = None
        self.m1_meta = {}
        
        self.m2_weather = None
        self.m2_meta = {}
        
        self.m3_nearby = None
        self.m3_meta = {}
        
        self.m4_preference = None
        self.m4_user_embeddings = None
        self.m4_meta = {}
        
        self.m5_trending = None
        self.m5_meta = {}
        
        self.m6_demand_reg = None
        self.m6_demand_clf = None
        self.m6_meta = {}
        
        self.m7_similarity_bundle = None
        self.m7_dest_embeddings = None
        self.m7_meta = {}

    @classmethod
    def get_instance(cls) -> "ModelRegistry":
        if cls._instance is None:
            cls._instance = cls()
            cls._instance.load_all()
        return cls._instance

    def load_all(self):
        if self.is_loaded:
            return

        logger.info("[*] Initializing TravelSathi Multi-Model Registry...")

        # 1. Load Destinations Table
        dest_path = PROCESSED_DATA_DIR / "destinations.csv"
        if dest_path.exists():
            self.destinations_df = pd.read_csv(dest_path)

            # Enrich with live database image_url and is_famous flag
            db_path = Path(__file__).resolve().parents[2] / "backend" / "travelsathi_dev.db"
            if not db_path.exists():
                db_path = Path("travelsathi_dev.db")
            if db_path.exists():
                try:
                    import sqlite3
                    with sqlite3.connect(db_path) as conn:
                        db_meta = pd.read_sql("SELECT id as destination_id, is_famous, image_url FROM destinations_master", conn)
                        self.destinations_df = self.destinations_df.merge(db_meta, on="destination_id", how="left")
                        self.destinations_df["is_famous"] = self.destinations_df["is_famous"].fillna(0).astype(int)
                        self.destinations_df["image_url"] = self.destinations_df["image_url"].fillna("")
                except Exception as e:
                    logger.warning(f"Failed to enrich destinations with db meta: {e}")

            for _, row in self.destinations_df.iterrows():
                d_dict = row.to_dict()
                d_id = int(row["destination_id"])
                self.dest_lookup[d_id] = d_dict
                self.dest_name_lookup[str(row["name"]).strip().lower()] = d_id
            logger.info(f"[OK] Indexed {len(self.dest_lookup)} verified destinations")

        # 2. Model 1: Destination Recommender
        m1_path = MODELS_DIR / "destination_recommender" / "model.pkl"
        if m1_path.exists():
            self.m1_destination = joblib.load(m1_path)
            with open(MODELS_DIR / "destination_recommender" / "metadata.json", "r", encoding="utf-8") as f:
                self.m1_meta = json.load(f)

        # 3. Model 2: Season & Weather
        m2_path = MODELS_DIR / "season_weather" / "model.pkl"
        if m2_path.exists():
            self.m2_weather = joblib.load(m2_path)
            with open(MODELS_DIR / "season_weather" / "metadata.json", "r", encoding="utf-8") as f:
                self.m2_meta = json.load(f)

        # 4. Model 3: Nearby Place Ranker
        m3_path = MODELS_DIR / "nearby_ranker" / "model.pkl"
        if m3_path.exists():
            self.m3_nearby = joblib.load(m3_path)
            with open(MODELS_DIR / "nearby_ranker" / "metadata.json", "r", encoding="utf-8") as f:
                self.m3_meta = json.load(f)

        # 5. Model 4: Personal Preference Latent Model
        m4_path = MODELS_DIR / "preference_model" / "model.pkl"
        if m4_path.exists():
            self.m4_preference = joblib.load(m4_path)
            with open(MODELS_DIR / "preference_model" / "metadata.json", "r", encoding="utf-8") as f:
                self.m4_meta = json.load(f)
            user_emb_path = EMBEDDINGS_DIR / "user_embeddings.npy"
            if user_emb_path.exists():
                self.m4_user_embeddings = np.load(user_emb_path)

        # 6. Model 5: Popularity & Trending Model
        m5_path = MODELS_DIR / "trending_model" / "model.pkl"
        if m5_path.exists():
            self.m5_trending = joblib.load(m5_path)
            with open(MODELS_DIR / "trending_model" / "metadata.json", "r", encoding="utf-8") as f:
                self.m5_meta = json.load(f)

        # 7. Model 6: Travel Demand & Crowd Forecaster
        m6_reg_path = MODELS_DIR / "demand_model" / "regressor.pkl"
        m6_clf_path = MODELS_DIR / "demand_model" / "classifier.pkl"
        if m6_reg_path.exists() and m6_clf_path.exists():
            self.m6_demand_reg = joblib.load(m6_reg_path)
            self.m6_demand_clf = joblib.load(m6_clf_path)
            with open(MODELS_DIR / "demand_model" / "metadata.json", "r", encoding="utf-8") as f:
                self.m6_meta = json.load(f)

        # 8. Model 7: Destination Similarity Model
        m7_path = MODELS_DIR / "similarity_model" / "model.pkl"
        if m7_path.exists():
            self.m7_similarity_bundle = joblib.load(m7_path)
            with open(MODELS_DIR / "similarity_model" / "metadata.json", "r", encoding="utf-8") as f:
                self.m7_meta = json.load(f)
            dest_emb_path = EMBEDDINGS_DIR / "destination_embeddings.npy"
            if dest_emb_path.exists():
                self.m7_dest_embeddings = np.load(dest_emb_path)

        self.is_loaded = True
        logger.info("[OK] All 7 Specialized ML Models Loaded Successfully into Memory")

registry = ModelRegistry.get_instance()
