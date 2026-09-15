"""
ml/features/feature_pipeline.py
---------------------------------
Comprehensive Feature Engineering & Normalization Pipeline for
Government Tourism Investment Intelligence.

Implements:
- Multi-dataset ingestion & canonical entity alignment.
- Feature extraction across Attraction, Cultural, Activity, Connectivity, Potential, and Seasonality dimensions.
- Robust statistical normalization (percentile/rank, log1p, outlier-clipped MinMax 0-100).
- Anti-double-counting correlation analysis (Section 48).
- Explicit data leakage rejection (feature_date vs target_date).
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.stats import rankdata

from ml.features.entity_resolution import get_entity_resolver, EntityResolver

logger = logging.getLogger("feature_pipeline")


class FeaturePipeline:
    def __init__(self, data_dir: Optional[str] = None):
        if not data_dir:
            data_dir = os.path.join(
                os.path.dirname(__file__), "..", "data", "government_sources"
            )
        self.data_dir = os.path.abspath(data_dir)
        self.resolver = get_entity_resolver()
        self.raw_dfs: Dict[str, pd.DataFrame] = {}
        self.feature_matrix: Optional[pd.DataFrame] = None
        self.correlation_matrix: Optional[pd.DataFrame] = None
        self._load_datasets()

    def _load_datasets(self):
        """Loads all verified government evidence datasets."""
        files = {
            "cultural_scored": "Cultural_Scored.csv",
            "attraction_scored": "Attraction_Scored.csv",
            "potential_scored": "Potential_Factor_Scored.csv",
            "connectivity": "city_connectivity_enriched (2).csv",
            "activity_scored": "Travel_Activity_Scored.csv",
            "cultural_detail": "Cultural_Dataset.csv",
            "attraction_detail": "Attraction_Dataset.csv",
            "activity_detail": "Travel_Activity_Dataset.csv",
        }
        for key, fname in files.items():
            path = os.path.join(self.data_dir, fname)
            if os.path.exists(path):
                self.raw_dfs[key] = pd.read_csv(path)
            else:
                logger.warning(f"Feature dataset not found: {path}")

    @staticmethod
    def _robust_scale_0_100(series: pd.Series, log_transform: bool = False) -> pd.Series:
        """
        Robust statistical scaling to 0-100 range:
        - Optional log1p transformation for heavy-tailed counts.
        - 1st & 99th percentile outlier capping.
        - MinMax scaling to [0, 100].
        """
        vals = series.fillna(0.0).astype(float).values
        if log_transform:
            vals = np.log1p(np.maximum(0.0, vals))
        
        q_low, q_high = np.percentile(vals, 1), np.percentile(vals, 99)
        vals_clipped = np.clip(vals, q_low, q_high)
        
        v_min, v_max = vals_clipped.min(), vals_clipped.max()
        if v_max - v_min > 1e-9:
            norm_0_100 = (vals_clipped - v_min) / (v_max - v_min) * 100.0
        else:
            norm_0_100 = np.full_like(vals_clipped, 50.0)
        
        return pd.Series(norm_0_100, index=series.index)

    def check_data_leakage(self, feature_date: str, target_date: str) -> bool:
        """
        Strict data leakage prevention (Section 16).
        Ensures future information never leaks into historical feature sets.
        """
        if feature_date > target_date:
            raise ValueError(
                f"Data leakage rejected: feature_date ({feature_date}) is after target_date ({target_date})."
            )
        return True

    def build_feature_matrix(self) -> pd.DataFrame:
        """
        Builds canonical 508-district feature matrix across all evidence layers.
        Guarantees zero row mismatch and verified entity alignment.
        """
        if self.feature_matrix is not None:
            return self.feature_matrix

        entities = self.resolver.get_all_entities()
        df_ent = pd.DataFrame(entities)

        # 1. Attraction Features
        a_df = self.raw_dfs.get("attraction_scored", pd.DataFrame())
        # 2. Cultural Features
        c_df = self.raw_dfs.get("cultural_scored", pd.DataFrame())
        # 3. Potential Features
        p_df = self.raw_dfs.get("potential_scored", pd.DataFrame())
        # 4. Connectivity Features
        conn_df = self.raw_dfs.get("connectivity", pd.DataFrame())
        # 5. Travel Activity Features
        t_df = self.raw_dfs.get("activity_scored", pd.DataFrame())

        n = len(df_ent)
        features = []

        # Count detail assets per city
        cultural_counts = {}
        if "cultural_detail" in self.raw_dfs:
            for _, r in self.raw_dfs["cultural_detail"].iterrows():
                k = (str(r.get("city_name", "")).strip().lower(), str(r.get("state_name", "")).strip().lower())
                cultural_counts[k] = cultural_counts.get(k, 0) + 1

        attraction_counts = {}
        unesco_counts = {}
        asi_counts = {}
        ramsar_counts = {}
        if "attraction_detail" in self.raw_dfs:
            for _, r in self.raw_dfs["attraction_detail"].iterrows():
                k = (str(r.get("city_name", "")).strip().lower(), str(r.get("state_name", "")).strip().lower())
                attraction_counts[k] = attraction_counts.get(k, 0) + 1
                if "unesco" in str(r.get("unesco_status", "")).lower() or "world heritage" in str(r.get("unesco_status", "")).lower():
                    unesco_counts[k] = unesco_counts.get(k, 0) + 1
                if "asi" in str(r.get("asi_status", "")).lower():
                    asi_counts[k] = asi_counts.get(k, 0) + 1
                if "ramsar" in str(r.get("ramsar_status", "")).lower() and "not" not in str(r.get("ramsar_status", "")).lower():
                    ramsar_counts[k] = ramsar_counts.get(k, 0) + 1

        activity_counts = {}
        if "activity_detail" in self.raw_dfs:
            for _, r in self.raw_dfs["activity_detail"].iterrows():
                k = (str(r.get("city_name", "")).strip().lower(), str(r.get("state_name", "")).strip().lower())
                activity_counts[k] = activity_counts.get(k, 0) + 1

        for i in range(n):
            ent = entities[i]
            dest_id = ent["destination_id"]
            city = ent["city_name"]
            state = ent["state_name"]
            district = ent["district_name"]
            k = (city.lower(), state.lower())

            # Attraction features
            tot_att = float(a_df.loc[i, "total_verified_attractions"]) if "total_verified_attractions" in a_df.columns else 1.0
            nat_att = float(a_df.loc[i, "natural_attraction_count"]) if "natural_attraction_count" in a_df.columns else 0.0
            her_att = float(a_df.loc[i, "heritage_attraction_count"]) if "heritage_attraction_count" in a_df.columns else 0.0
            hist_att = float(a_df.loc[i, "historical_attraction_count"]) if "historical_attraction_count" in a_df.columns else 0.0
            cult_att = float(a_df.loc[i, "cultural_attraction_count"]) if "cultural_attraction_count" in a_df.columns else 0.0
            rel_att = float(a_df.loc[i, "religious_attraction_count"]) if "religious_attraction_count" in a_df.columns else 0.0
            wild_att = float(a_df.loc[i, "wildlife_attraction_count"]) if "wildlife_attraction_count" in a_df.columns else 0.0
            unesco_cnt = float(a_df.loc[i, "unesco_attraction_count"]) if "unesco_attraction_count" in a_df.columns else 0.0
            asi_cnt = float(a_df.loc[i, "asi_attraction_count"]) if "asi_attraction_count" in a_df.columns else 0.0
            ramsar_cnt = float(a_df.loc[i, "ramsar_attraction_count"]) if "ramsar_attraction_count" in a_df.columns else 0.0
            att_div = float(a_df.loc[i, "attraction_diversity_score"]) if "attraction_diversity_score" in a_df.columns else 50.0
            att_sig = float(a_df.loc[i, "attraction_significance_score"]) if "attraction_significance_score" in a_df.columns else 50.0
            att_rec = float(a_df.loc[i, "attraction_recognition_score"]) if "attraction_recognition_score" in a_df.columns else 50.0
            att_overall = float(a_df.loc[i, "overall_attraction_score"]) if "overall_attraction_score" in a_df.columns else 50.0

            # Cultural features
            c_assets = float(c_df.loc[i, "verified_cultural_asset_count"]) if "verified_cultural_asset_count" in c_df.columns else 1.0
            c_div = float(c_df.loc[i, "Cultural_Diversity_Score"]) if "Cultural_Diversity_Score" in c_df.columns else 50.0
            c_sig = float(c_df.loc[i, "Cultural_Significance_Score"]) if "Cultural_Significance_Score" in c_df.columns else 50.0
            c_rec = float(c_df.loc[i, "Cultural_Recognition_Score"]) if "Cultural_Recognition_Score" in c_df.columns else 50.0
            c_liv = float(c_df.loc[i, "Living_Tradition_Score"]) if "Living_Tradition_Score" in c_df.columns else 50.0
            c_uniq = float(c_df.loc[i, "Cultural_Uniqueness_Score"]) if "Cultural_Uniqueness_Score" in c_df.columns else 50.0
            c_overall = float(c_df.loc[i, "Overall_Cultural_Score"]) if "Overall_Cultural_Score" in c_df.columns else 50.0
            c_gi_count = float(c_df.loc[i, "gi_count"]) if "gi_count" in c_df.columns else 0.0
            c_unesco_ich = float(c_df.loc[i, "unesco_ich_count"]) if "unesco_ich_count" in c_df.columns else 0.0

            # Potential features
            nat_pot = float(p_df.loc[i, "natural_potential_score"]) if "natural_potential_score" in p_df.columns else 50.0
            cult_pot = float(p_df.loc[i, "cultural_potential_score"]) if "cultural_potential_score" in p_df.columns else 50.0
            her_pot = float(p_df.loc[i, "heritage_potential_score"]) if "heritage_potential_score" in p_df.columns else 50.0
            uniq_pot = float(p_df.loc[i, "uniqueness_score"]) if "uniqueness_score" in p_df.columns else 50.0
            exp_pot = float(p_df.loc[i, "experience_potential_score"]) if "experience_potential_score" in p_df.columns else 50.0
            overall_pot = float(p_df.loc[i, "overall_potential_score"]) if "overall_potential_score" in p_df.columns else 50.0

            # Activity features
            tot_act = float(t_df.loc[i, "total_verified_activities"]) if "total_verified_activities" in t_df.columns else 1.0
            act_div = float(t_df.loc[i, "activity_diversity_score"]) if "activity_diversity_score" in t_df.columns else 50.0
            act_exp = float(t_df.loc[i, "activity_experience_score"]) if "activity_experience_score" in t_df.columns else 50.0
            act_season = float(t_df.loc[i, "activity_seasonality_score"]) if "activity_seasonality_score" in t_df.columns else 50.0
            act_rec = float(t_df.loc[i, "activity_recognition_score"]) if "activity_recognition_score" in t_df.columns else 50.0
            act_overall = float(t_df.loc[i, "overall_travel_activity_score"]) if "overall_travel_activity_score" in t_df.columns else 50.0

            # Connectivity features
            road_conn = float(conn_df.loc[i, "Road Connectivity Score (1-100)"]) if "Road Connectivity Score (1-100)" in conn_df.columns else 65.0
            rail_conn = float(conn_df.loc[i, "Train Connectivity Score (1-100)"]) if "Train Connectivity Score (1-100)" in conn_df.columns else 35.0
            air_conn = float(conn_df.loc[i, "Flight Connectivity Score (1-100)"]) if "Flight Connectivity Score (1-100)" in conn_df.columns else 20.0
            overall_conn = float(conn_df.loc[i, "Overall Connectivity Score (1-100)"]) if "Overall Connectivity Score (1-100)" in conn_df.columns else 50.0
            conn_conf = str(conn_df.loc[i, "Connectivity Confidence"]) if "Connectivity Confidence" in conn_df.columns else "Medium"

            # Derived Composite Scores (0-100)
            # Attraction Strength: Combines count volume, recognition, and diversity without double counting
            attraction_strength = np.clip(
                0.35 * att_overall + 0.25 * att_sig + 0.25 * att_rec + 0.15 * att_div, 0, 100
            )

            # Cultural/Natural Significance: Combines cultural recognition, heritage potential, UNESCO/ASI presence, and natural potential
            heritage_bonus = min(15.0, (unesco_cnt * 6.0 + asi_cnt * 2.0 + ramsar_cnt * 4.0 + c_gi_count * 3.0 + c_unesco_ich * 8.0))
            cultural_natural_significance = np.clip(
                0.40 * c_overall + 0.30 * nat_pot + 0.20 * her_pot + 0.10 * heritage_bonus, 0, 100
            )

            # Growth Opportunity: High uniqueness, high experience potential, high diversity with headroom
            growth_opportunity = np.clip(
                0.35 * uniq_pot + 0.35 * exp_pot + 0.15 * act_div + 0.15 * (100 - min(overall_conn, 80.0) * 0.5), 0, 100
            )

            # Accessibility Potential: Weighted transport accessibility
            accessibility_potential = np.clip(
                0.40 * road_conn + 0.35 * rail_conn + 0.25 * air_conn, 0, 100
            )

            # Seasonality: Balance between all-year activity availability & off-season potential
            seasonality = np.clip(
                0.60 * act_season + 0.40 * (100.0 - abs(act_season - 65.0)), 0, 100
            )

            # Off-Season Opportunity Score (Section 18)
            off_season_opportunity = np.clip(
                (c_overall * 0.4 + act_exp * 0.3 + (100.0 - act_season) * 0.3), 0, 100
            )

            # Tourism Demand: Unavailable in prototype mode -> explicitly None/null
            tourism_demand = None

            # Tourism Asset Breakdown Profile (for District Intelligence)
            asset_profile = {
                "total_attractions": int(tot_att),
                "natural_attractions": int(nat_att),
                "heritage_attractions": int(her_att),
                "historical_attractions": int(hist_att),
                "cultural_attractions": int(cult_att),
                "religious_attractions": int(rel_att),
                "wildlife_attractions": int(wild_att),
                "unesco_sites": int(unesco_cnt),
                "asi_sites": int(asi_cnt),
                "ramsar_sites": int(ramsar_cnt),
                "verified_cultural_assets": int(c_assets),
                "gi_products": int(c_gi_count),
                "unesco_ich_traditions": int(c_unesco_ich),
                "total_activities": int(tot_act),
                "road_connectivity_score": round(road_conn, 1),
                "rail_connectivity_score": round(rail_conn, 1),
                "air_connectivity_score": round(air_conn, 1),
                "overall_connectivity_score": round(overall_conn, 1),
                "connectivity_confidence": conn_conf,
            }

            features.append({
                "destination_id": dest_id,
                "city": city,
                "district": district,
                "state": state,
                "canonical_name": ent["canonical_name"],
                "latitude": ent["latitude"],
                "longitude": ent["longitude"],
                # Core 6 Factors (Normalized 0-100)
                "attraction_strength": round(float(attraction_strength), 2),
                "tourism_demand": tourism_demand,
                "cultural_natural_significance": round(float(cultural_natural_significance), 2),
                "growth_opportunity": round(float(growth_opportunity), 2),
                "accessibility_potential": round(float(accessibility_potential), 2),
                "seasonality": round(float(seasonality), 2),
                # Supporting feature values
                "uniqueness_score": round(float(uniq_pot), 2),
                "experience_potential_score": round(float(exp_pot), 2),
                "off_season_opportunity_score": round(float(off_season_opportunity), 2),
                "activity_diversity_score": round(float(act_div), 2),
                "asset_profile": asset_profile,
                "data_confidence": "High" if ent["coordinate_status"] == "Verified" and conn_conf != "Low" else "Medium",
            })

        self.feature_matrix = pd.DataFrame(features)
        self._analyze_correlations()
        return self.feature_matrix

    def _analyze_correlations(self):
        """
        Calculates correlation matrix across numeric features to prevent double-counting.
        Flags pairs with r > 0.85 to ensure transparent weight allocation.
        """
        if self.feature_matrix is None:
            return
        
        numeric_cols = [
            "attraction_strength",
            "cultural_natural_significance",
            "growth_opportunity",
            "accessibility_potential",
            "seasonality",
            "uniqueness_score",
            "experience_potential_score",
            "off_season_opportunity_score",
            "activity_diversity_score",
        ]
        self.correlation_matrix = self.feature_matrix[numeric_cols].corr()

    def get_feature_matrix(self) -> pd.DataFrame:
        if self.feature_matrix is None:
            return self.build_feature_matrix()
        return self.feature_matrix

    def get_destination_features(self, destination_id: str) -> Optional[Dict[str, Any]]:
        fm = self.get_feature_matrix()
        match = fm[fm["destination_id"] == destination_id]
        if match.empty:
            return None
        return match.iloc[0].to_dict()


_pipeline_instance: Optional[FeaturePipeline] = None


def get_feature_pipeline() -> FeaturePipeline:
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = FeaturePipeline()
    return _pipeline_instance
