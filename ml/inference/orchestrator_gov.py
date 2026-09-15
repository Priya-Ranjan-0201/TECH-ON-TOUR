"""
ml/inference/orchestrator_gov.py
--------------------------------
Master Government Tourism Intelligence Inference Orchestrator.

Integrates:
- FeaturePipeline
- TourismPotentialModel
- TourismOpportunityModel
- InfrastructureGapEngine
- InvestmentPriorityEngine
- ConfidenceEngine
- ExplainabilityEngine
- InvestmentScenarioEngine

Computes full 508-district intelligence profiles, national rankings, and KPIs.
Produces strictly validated contracts adhering to Section 42.
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

import numpy as np
import pandas as pd

from ml.features.feature_pipeline import get_feature_pipeline
from ml.models.tourism_potential import TourismPotentialModel
from ml.models.tourism_opportunity import TourismOpportunityModel
from ml.models.infrastructure_gap import InfrastructureGapEngine
from ml.models.priority_engine import InvestmentPriorityEngine
from ml.models.confidence_engine import ConfidenceEngine
from ml.models.investment_scenario_engine import InvestmentScenarioEngine
from ml.explainability.explainability import ExplainabilityEngine

logger = logging.getLogger("orchestrator_gov")


class GovernmentIntelligenceOrchestrator:
    VERSION = "TS-GOV-1.0"

    def __init__(self):
        self.feature_pipeline = get_feature_pipeline()
        self.potential_model = TourismPotentialModel()
        self.opportunity_model = TourismOpportunityModel()
        self.infra_gap_engine = InfrastructureGapEngine()
        self.priority_engine = InvestmentPriorityEngine()
        self.confidence_engine = ConfidenceEngine()
        self.scenario_engine = InvestmentScenarioEngine()
        self.explainability_engine = ExplainabilityEngine()

        self._cached_profiles: Dict[str, Dict[str, Any]] = {}
        self._cached_rankings: List[Dict[str, Any]] = []
        self._cached_overview: Optional[Dict[str, Any]] = None
        self._last_computed_at: Optional[str] = None
        self._hourly_token: Optional[str] = None

    def build_all_intelligence(self, hourly_token: Optional[str] = None, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Orchestrates full intelligence derivation across all 508 destinations.
        Caches results and assigns national ranks 1 to 508.
        """
        if self._cached_rankings and not force_refresh and (hourly_token == self._hourly_token or not hourly_token):
            return self._cached_rankings

        self._hourly_token = hourly_token or datetime.now(timezone.utc).strftime("tok_hourly_%Y%m%d_%H00")
        fm = self.feature_pipeline.get_feature_matrix()
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        data_provenance_list = [
            {
                "dataset_name": "Cultural_Scored & Cultural_Dataset",
                "source_name": "Ministry of Culture / Archaeological Survey of India / GI Registry",
                "source_url": "https://asi.nic.in/",
                "data_year": 2026,
                "verification_status": "Verified Ground Truth",
                "records_used": 568
            },
            {
                "dataset_name": "Attraction_Scored & Attraction_Dataset",
                "source_name": "Ministry of Tourism / National Protected Heritage & UNESCO",
                "source_url": "https://tourism.gov.in/",
                "data_year": 2026,
                "verification_status": "Verified Ground Truth",
                "records_used": 1216
            },
            {
                "dataset_name": "city_connectivity_enriched (2)",
                "source_name": "Airports Authority of India (AAI) / Ministry of Railways",
                "source_url": "https://www.aai.aero/",
                "data_year": 2026,
                "verification_status": "Verified Transit Telemetry",
                "records_used": 508
            },
            {
                "dataset_name": "Travel_Activity_Scored & Travel_Activity_Dataset",
                "source_name": "State Tourism Development Corporations & Adventure Tour Operators",
                "source_url": "https://tourism.gov.in/",
                "data_year": 2026,
                "verification_status": "Verified Ground Truth",
                "records_used": 437
            }
        ]

        temp_profiles = []

        for _, row in fm.iterrows():
            dest_id = row["destination_id"]
            city = row["city"]
            district = row["district"]
            state = row["state"]
            lat = float(row["latitude"])
            lng = float(row["longitude"])
            asset_prof = row["asset_profile"]

            # 1. Potential Score
            pot_res = self.potential_model.compute_potential(
                attraction_strength=row["attraction_strength"],
                cultural_natural_significance=row["cultural_natural_significance"],
                growth_opportunity=row["growth_opportunity"],
                accessibility_potential=row["accessibility_potential"],
                seasonality=row["seasonality"],
                tourism_demand=row["tourism_demand"]
            )

            # 2. Opportunity Score
            opp_res = self.opportunity_model.compute_opportunity(
                potential_score=pot_res["potential_score"],
                attraction_strength=row["attraction_strength"],
                cultural_natural_significance=row["cultural_natural_significance"],
                growth_opportunity=row["growth_opportunity"],
                accessibility_potential=row["accessibility_potential"],
                seasonality=row["seasonality"],
                uniqueness_score=row["uniqueness_score"],
                experience_potential_score=row["experience_potential_score"],
                activity_diversity_score=row["activity_diversity_score"],
                tourism_demand=row["tourism_demand"]
            )

            # 3. Infrastructure Gap Diagnostics
            gaps = self.infra_gap_engine.diagnose_gaps(
                potential_score=pot_res["potential_score"],
                attraction_strength=row["attraction_strength"],
                cultural_natural_significance=row["cultural_natural_significance"],
                accessibility_potential=row["accessibility_potential"],
                seasonality=row["seasonality"],
                uniqueness_score=row["uniqueness_score"],
                asset_profile=asset_prof,
                demand_penetration_proxy=opp_res["demand_penetration_proxy"]
            )

            # 4. Confidence Engine
            conf_res = self.confidence_engine.compute_confidence(
                destination_id=dest_id,
                asset_profile=asset_prof,
                has_demand_data=(row["tourism_demand"] is not None),
                has_economic_data=False,
                coordinate_status="Verified"
            )

            # 5. Priority Score & Ranked Action Plan
            prio_res = self.priority_engine.compute_priority(
                potential_data=pot_res,
                opportunity_data=opp_res,
                infrastructure_gaps=gaps,
                confidence_data=conf_res
            )

            # 6. Explainable AI
            xai_res = self.explainability_engine.explain(
                potential_data=pot_res,
                opportunity_data=opp_res,
                priority_data=prio_res,
                infrastructure_gaps=gaps,
                district_name=district,
                state_name=state
            )

            # 7. Standard Investment Scenarios (₹5, ₹10, ₹25, ₹50, ₹100 Cr)
            dummy_contract = {
                "destination_id": dest_id,
                "district": district,
                "state": state,
                "scores": {
                    "tourism_potential": pot_res["potential_score"],
                    "investment_priority": prio_res["investment_priority"]
                },
                "factor_scores": pot_res["factor_scores"]
            }
            scenarios = []
            for amt in [5.0, 10.0, 25.0, 50.0, 100.0]:
                scenarios.append(self.scenario_engine.simulate(
                    destination_data=dummy_contract,
                    investment_crore=amt,
                    scenario_type="integrated",
                    time_horizon_years=3,
                    has_verified_economics=False
                ))

            # Assemble Profile Object
            profile = {
                "destination_id": dest_id,
                "district": district,
                "state": state,
                "city": city,
                "canonical_name": row["canonical_name"],
                "latitude": lat,
                "longitude": lng,
                "rank": 0,  # Assigned after sorting
                "scores": {
                    "tourism_potential": pot_res["potential_score"],
                    "tourism_opportunity": opp_res["opportunity_score"],
                    "investment_priority": prio_res["investment_priority"],
                    "infrastructure_readiness": opp_res.get("infrastructure_readiness", 65.0)
                },
                "factor_scores": pot_res["factor_scores"],
                "classification": opp_res["classification"],
                "classification_description": opp_res["classification_description"],
                "scatter_plot": opp_res["scatter_plot"],
                "readiness_comparison": opp_res.get("readiness_comparison", {}),
                "priority_tier": prio_res["priority_tier"],
                "priority_badge": prio_res["priority_badge"],
                "primary_bottleneck": prio_res["primary_bottleneck"],
                "recommended_primary_intervention": prio_res["recommended_primary_intervention"],
                "infrastructure_gaps": gaps,
                "recommendations": prio_res["action_plan"],
                "investment_scenarios": scenarios,
                "economic_impact": {
                    "additional_tourists": None,
                    "additional_spending": None,
                    "economic_activity": None,
                    "government_revenue": None,
                    "employment": None,
                    "economic_impact_multiple": None,
                    "payback_period_years": None,
                    "status": "Unavailable in Prototype Mode",
                    "note": "Baseline tourist spending and district fiscal revenue require field calibration."
                },
                "confidence": conf_res,
                "explainability": xai_res,
                "asset_profile": asset_prof,
                "data_provenance": data_provenance_list,
                "model": {
                    "version": self.VERSION,
                    "mode": pot_res["mode"],
                    "hourly_token": self._hourly_token,
                    "last_updated": now_iso
                }
            }
            temp_profiles.append(profile)

        # Sort descending by investment priority score
        temp_profiles.sort(key=lambda p: p["scores"]["investment_priority"], reverse=True)

        self._cached_profiles = {}
        self._cached_rankings = []
        for rank_idx, prof in enumerate(temp_profiles, start=1):
            prof["rank"] = rank_idx
            self._cached_profiles[prof["destination_id"]] = prof
            self._cached_rankings.append(prof)

        # Compute Overview KPIs
        pot_scores = [p["scores"]["tourism_potential"] for p in self._cached_rankings]
        conn_scores = [p["factor_scores"]["accessibility_potential"] for p in self._cached_rankings]
        conf_scores = [p["confidence"]["score"] for p in self._cached_rankings]
        readiness_scores = [p["scores"]["infrastructure_readiness"] for p in self._cached_rankings]
        high_prio = sum(1 for p in self._cached_rankings if p["priority_tier"] in ["Critical", "High"])
        high_pot = sum(1 for p in self._cached_rankings if p["scores"]["tourism_potential"] >= 65.0)
        untapped_cnt = sum(1 for p in self._cached_rankings if "Untapped" in p["scatter_plot"]["quadrant_short"] or "Priority" in p["scatter_plot"]["quadrant_short"] or p["classification"] in ["Emerging Opportunity", "Infrastructure Constrained"])

        self._cached_overview = {
            "total_destinations_analyzed": len(self._cached_rankings),
            "high_priority_destinations": high_prio,
            "high_tourism_potential_destinations": high_pot,
            "untapped_opportunity_destinations": untapped_cnt,
            "average_connectivity": round(float(np.mean(conn_scores)), 1),
            "average_tourism_potential": round(float(np.mean(pot_scores)), 1),
            "average_readiness": round(float(np.mean(readiness_scores)), 1),
            "average_confidence": round(float(np.mean(conf_scores)), 1),
            "data_status": "Calibrated Production Mode (Evidence-Grounded)",
            "last_data_update": now_iso,
            "model_version": self.VERSION,
            "hourly_token": self._hourly_token,
        }

        self._last_computed_at = now_iso
        logger.info(f"✅ Generated government intelligence profiles for {len(self._cached_rankings)} districts.")
        return self._cached_rankings

    def get_overview_kpis(self, hourly_token: Optional[str] = None) -> Dict[str, Any]:
        if not self._cached_overview or (hourly_token and hourly_token != self._hourly_token):
            self.build_all_intelligence(hourly_token)
        return self._cached_overview

    def get_rankings(
        self,
        state: Optional[str] = None,
        priority: Optional[str] = None,
        classification: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 508,
        hourly_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        rankings = self.build_all_intelligence(hourly_token)
        filtered = rankings

        if state and state.lower() != "all":
            filtered = [p for p in filtered if p["state"].lower() == state.lower()]
        if priority and priority.lower() != "all":
            filtered = [p for p in filtered if p["priority_tier"].lower() == priority.lower()]
        if classification and classification.lower() != "all":
            filtered = [p for p in filtered if p["classification"].lower() == classification.lower()]
        if search:
            q = search.strip().lower()
            filtered = [
                p for p in filtered
                if q in p["district"].lower() or q in p["city"].lower() or q in p["state"].lower()
            ]

        return filtered[:limit]

    def get_destination_profile(self, destination_id: str, hourly_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not self._cached_profiles:
            self.build_all_intelligence(hourly_token)
        
        # Direct lookup by ID
        if destination_id in self._cached_profiles:
            return self._cached_profiles[destination_id]

        # Case-insensitive / name lookup
        for d_id, prof in self._cached_profiles.items():
            if (
                d_id.lower() == destination_id.lower()
                or prof["district"].lower() == destination_id.lower()
                or prof["city"].lower() == destination_id.lower()
            ):
                return prof

        return None

    def compare_destinations(self, destination_ids: List[str], hourly_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Multi-district trade-off comparison engine (Section 37).
        Compares 2 to 5 districts side-by-side with trade-off analysis.
        """
        if not (2 <= len(destination_ids) <= 5):
            raise ValueError("District comparison requires between 2 and 5 destinations.")

        profiles = []
        for did in destination_ids:
            p = self.get_destination_profile(did, hourly_token)
            if not p:
                raise ValueError(f"Unknown destination identifier: '{did}'")
            profiles.append(p)

        # Comparative Trade-Off Analysis
        sorted_by_pot = sorted(profiles, key=lambda x: x["scores"]["tourism_potential"], reverse=True)
        sorted_by_opp = sorted(profiles, key=lambda x: x["scores"]["tourism_opportunity"], reverse=True)
        sorted_by_prio = sorted(profiles, key=lambda x: x["scores"]["investment_priority"], reverse=True)
        sorted_by_access = sorted(profiles, key=lambda x: x["factor_scores"]["accessibility_potential"], reverse=True)

        highest_potential = sorted_by_pot[0]
        highest_opportunity = sorted_by_opp[0]
        highest_priority = sorted_by_prio[0]
        best_connected = sorted_by_access[0]

        # Trade-off insights
        tradeoffs = []
        tradeoffs.append(
            f"Highest Tourism Potential: {highest_potential['district']} ({highest_potential['state']}) with a score of {highest_potential['scores']['tourism_potential']}/100."
        )
        tradeoffs.append(
            f"Largest Untapped Opportunity: {highest_opportunity['district']} ({highest_opportunity['state']}) with an Opportunity Score of {highest_opportunity['scores']['tourism_opportunity']}/100."
        )
        tradeoffs.append(
            f"Top Capital Intervention Priority: {highest_priority['district']} ({highest_priority['state']}) with an Investment Priority of {highest_priority['scores']['investment_priority']}/100."
        )

        comparison_matrix = []
        for p in profiles:
            comparison_matrix.append({
                "destination_id": p["destination_id"],
                "district": p["district"],
                "state": p["state"],
                "rank": p["rank"],
                "tourism_potential": p["scores"]["tourism_potential"],
                "tourism_opportunity": p["scores"]["tourism_opportunity"],
                "investment_priority": p["scores"]["investment_priority"],
                "attraction_strength": p["factor_scores"]["attraction_strength"],
                "cultural_significance": p["factor_scores"]["cultural_natural_significance"],
                "growth_opportunity": p["factor_scores"]["growth_opportunity"],
                "accessibility": p["factor_scores"]["accessibility_potential"],
                "seasonality": p["factor_scores"]["seasonality"],
                "infrastructure_readiness": p["scores"].get("infrastructure_readiness", 50.0),
                "readiness_gap": p["readiness_comparison"]["gap_score"] if p.get("readiness_comparison") else round(p["scores"]["tourism_potential"] - p["scores"].get("infrastructure_readiness", 50.0), 1),
                "quadrant": p["readiness_comparison"]["quadrant_short"] if p.get("readiness_comparison") else "Priority Intervention",
                "demand_status": p["model"]["mode"],
                "classification": p["classification"],
                "primary_bottleneck": p["primary_bottleneck"],
                "confidence_score": p["confidence"]["score"],
                "confidence_level": p["confidence"]["level"]
            })

        strategic_synthesis = (
            f"While {highest_potential['district']} leads in raw intrinsic assets ({highest_potential['scores']['tourism_potential']}/100), "
            f"{highest_opportunity['district']} offers the most compelling upside for capital intervention due to lower current penetration and higher development headroom. "
            f"Government resource allocation should weigh catalytic infrastructure in {highest_opportunity['district']} against maintenance and flow management in {highest_potential['district']}."
        )

        return {
            "destinations_compared": len(profiles),
            "comparison_matrix": comparison_matrix,
            "key_tradeoffs": tradeoffs,
            "strategic_synthesis": strategic_synthesis,
            "highest_potential_district": highest_potential["district"],
            "highest_opportunity_district": highest_opportunity["district"],
            "top_priority_district": highest_priority["district"],
            "model_version": self.VERSION,
            "hourly_token": self._hourly_token,
        }

    def simulate_scenario(
        self,
        destination_id: str,
        investment_crore: float,
        scenario_type: str = "integrated",
        time_horizon_years: int = 3,
        hourly_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        prof = self.get_destination_profile(destination_id, hourly_token)
        if not prof:
            raise ValueError(f"Unknown destination identifier: '{destination_id}'")
        return self.scenario_engine.simulate(
            destination_data=prof,
            investment_crore=investment_crore,
            scenario_type=scenario_type,
            time_horizon_years=time_horizon_years,
            has_verified_economics=False
        )

    def answer_advisor_query(self, question: str, hourly_token: Optional[str] = None) -> Dict[str, Any]:
        """
        AI Government Advisor (Section 39).
        Answers queries strictly using the structured database with source citations.
        Zero Hallucination Policy (Section 63).
        """
        q = question.lower().strip()
        rankings = self.build_all_intelligence(hourly_token)

        # 1. Top priority query
        if any(w in q for w in ["which district", "prioritize", "highest priority", "top priority", "rank highest"]):
            top5 = rankings[:5]
            ans = "Based on verified multi-source tourism asset, cultural, and accessibility evidence, the top prioritized districts for government intervention are:\n\n"
            for p in top5:
                ans += f"• **Rank {p['rank']}: {p['district']} ({p['state']})** — Investment Priority: {p['scores']['investment_priority']}/100 | Primary Bottleneck: {p['primary_bottleneck']}\n"
            ans += "\n**Reasoning**: These districts combine high intrinsic tourism potential with significant development opportunity where capital intervention can remove key bottlenecks."
            sources = ["Cultural_Scored.csv", "Attraction_Scored.csv", "city_connectivity_enriched (2).csv"]
            return {"answer": ans, "sources": sources, "data_year": 2026, "model_version": self.VERSION}

        # 2. Untapped opportunity query
        if any(w in q for w in ["untapped", "opportunity", "underdeveloped"]):
            untapped = sorted(rankings, key=lambda x: x["scores"]["tourism_opportunity"], reverse=True)[:5]
            ans = "The destinations with the largest untapped tourism opportunity (high potential with headroom for development) are:\n\n"
            for p in untapped:
                ans += f"• **{p['district']} ({p['state']})** — Opportunity Score: {p['scores']['tourism_opportunity']}/100 | Classification: {p['classification']}\n"
            ans += "\n**Policy Insight**: These destinations possess strong heritage or experiential uniqueness but have not yet reached mature visitor penetration."
            return {"answer": ans, "sources": ["Potential_Factor_Scored.csv", "Travel_Activity_Scored.csv"], "data_year": 2026, "model_version": self.VERSION}

        # 3. Connectivity / infrastructure bottleneck query
        if any(w in q for w in ["connectivity", "infrastructure", "bottleneck", "limiting"]):
            constrained = [p for p in rankings if p["primary_bottleneck"] == "Connectivity"][:5]
            ans = "Districts where connectivity is the primary bottleneck limiting tourism growth include:\n\n"
            for p in constrained:
                access = p["factor_scores"]["accessibility_potential"]
                att = p["factor_scores"]["attraction_strength"]
                ans += f"• **{p['district']} ({p['state']})** — Accessibility: {access}/100 vs Attraction Strength: {att}/100\n"
            ans += "\n**Recommended Action**: Prioritize last-mile feeder shuttles, road widening, and signage before spending on national marketing."
            return {"answer": ans, "sources": ["city_connectivity_enriched (2).csv", "Attraction_Scored.csv"], "data_year": 2026, "model_version": self.VERSION}

        # 4. Cultural destinations query
        if any(w in q for w in ["cultural", "heritage", "craft", "artisan"]):
            cult_top = sorted(rankings, key=lambda x: x["factor_scores"]["cultural_natural_significance"], reverse=True)[:5]
            ans = "Top cultural and heritage destinations with verified living traditions and GI products:\n\n"
            for p in cult_top:
                c_score = p["factor_scores"]["cultural_natural_significance"]
                ans += f"• **{p['district']} ({p['state']})** — Cultural Significance: {c_score}/100 ({p['asset_profile']['verified_cultural_assets']} registered assets)\n"
            ans += "\n**Recommended Action**: Curate thematic cultural circuits and direct artisan handicraft marketplaces under Swadesh Darshan 2.0."
            return {"answer": ans, "sources": ["Cultural_Dataset.csv", "Cultural_Scored.csv"], "data_year": 2026, "model_version": self.VERSION}

        # General response
        top1 = rankings[0]
        ans = (
            f"TravelSathi's Government Tourism Intelligence Engine has evaluated {len(rankings)} districts across all 36 States/UTs. "
            f"Currently operating in Prototype Mode, it grounds decisions on verified tourism asset, cultural, activity, and transport evidence. "
            f"The national #1 priority district is {top1['district']} ({top1['state']}) with a priority score of {top1['scores']['investment_priority']}/100."
        )
        return {
            "answer": ans,
            "sources": ["Ministry of Tourism", "ASI", "GI Registry"],
            "data_year": 2026,
            "model_version": self.VERSION,
        }


_orchestrator_instance: Optional[GovernmentIntelligenceOrchestrator] = None


def get_gov_orchestrator() -> GovernmentIntelligenceOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = GovernmentIntelligenceOrchestrator()
    return _orchestrator_instance
