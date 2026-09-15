"""
backend/app/services/government_tourism_service.py
--------------------------------------------------
Government Tourism Intelligence Service.

Acts as the backend business logic bridge for:
- Orchestrating multi-source evidence derivation
- Precomputed profile caching and sub-millisecond retrieval
- Multi-district trade-off comparison (2-5 destinations)
- Capital intervention scenario simulation
- AI Government Advisor queries with zero-hallucination citations
- Integration with hourly_token telemetry and audit_logs
"""

import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models import AuditLog, User
from app.services.recommendation_service import get_current_hourly_token
from ml.inference.orchestrator_gov import get_gov_orchestrator, GovernmentIntelligenceOrchestrator

logger = logging.getLogger("government_tourism_service")


class GovernmentTourismService:
    def __init__(self):
        self.orchestrator: GovernmentIntelligenceOrchestrator = get_gov_orchestrator()

    def get_overview(self) -> Dict[str, Any]:
        """Returns top-level KPIs, data status, and model metadata."""
        token = get_current_hourly_token()
        return self.orchestrator.get_overview_kpis(hourly_token=token)

    def get_rankings(
        self,
        state: Optional[str] = None,
        priority: Optional[str] = None,
        classification: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 508,
    ) -> List[Dict[str, Any]]:
        """Returns sorted and filtered priority rankings across all 508 districts."""
        token = get_current_hourly_token()
        return self.orchestrator.get_rankings(
            state=state,
            priority=priority,
            classification=classification,
            search=search,
            limit=limit,
            hourly_token=token,
        )

    def get_destination_profile(self, destination_id: str) -> Optional[Dict[str, Any]]:
        """Returns full intelligence profile for single destination."""
        token = get_current_hourly_token()
        return self.orchestrator.get_destination_profile(destination_id, hourly_token=token)

    def get_map_layers(self, layer_name: str = "investment_priority") -> List[Dict[str, Any]]:
        """
        Returns geospatial map points with active layer intensity.
        Supported layers: investment_priority, tourism_potential, tourism_opportunity,
        accessibility, cultural, attraction, activity, infrastructure_gap.
        """
        token = get_current_hourly_token()
        rankings = self.orchestrator.build_all_intelligence(hourly_token=token)
        points = []

        layer_key = layer_name.lower().strip()

        for p in rankings:
            scores = p["scores"]
            factors = p["factor_scores"]
            
            if layer_key == "tourism_potential":
                layer_val = scores["tourism_potential"]
                layer_label = "Tourism Potential Score"
            elif layer_key == "tourism_opportunity":
                layer_val = scores["tourism_opportunity"]
                layer_label = "Tourism Opportunity Score"
            elif layer_key == "accessibility":
                layer_val = factors["accessibility_potential"]
                layer_label = "Accessibility Potential"
            elif layer_key == "cultural":
                layer_val = factors["cultural_natural_significance"]
                layer_label = "Cultural & Natural Significance"
            elif layer_key == "attraction":
                layer_val = factors["attraction_strength"]
                layer_label = "Attraction Strength"
            elif layer_key == "activity":
                layer_val = p.get("activity_diversity_score", factors["growth_opportunity"])
                layer_label = "Activity & Growth Potential"
            elif layer_key == "infrastructure_gap":
                layer_val = 100.0 - factors["accessibility_potential"]
                layer_label = "Infrastructure Gap Index"
            else:
                layer_val = scores["investment_priority"]
                layer_label = "Investment Priority Score"

            points.append({
                "destination_id": p["destination_id"],
                "district": p["district"],
                "state": p["state"],
                "city": p["city"],
                "canonical_name": p["canonical_name"],
                "latitude": p["latitude"],
                "longitude": p["longitude"],
                "rank": p["rank"],
                "value": round(float(layer_val), 1),
                "layer_label": layer_label,
                "priority_tier": p["priority_tier"],
                "priority_badge": p["priority_badge"],
                "classification": p["classification"],
                "primary_bottleneck": p["primary_bottleneck"],
                "investment_priority": scores["investment_priority"],
                "tourism_potential": scores["tourism_potential"],
                "tourism_opportunity": scores["tourism_opportunity"],
                "confidence_score": p["confidence"]["score"],
            })

        return points

    def compare_districts(self, destination_ids: List[str]) -> Dict[str, Any]:
        """Compares 2 to 5 districts with comparative trade-off insights."""
        token = get_current_hourly_token()
        return self.orchestrator.compare_destinations(destination_ids, hourly_token=token)

    async def simulate_scenario(
        self,
        destination_id: str,
        investment_crore: float,
        scenario_type: str = "integrated",
        time_horizon_years: int = 3,
        current_user: Optional[User] = None,
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        """Simulates capital scenario and records audit log."""
        token = get_current_hourly_token()
        result = self.orchestrator.simulate_scenario(
            destination_id=destination_id,
            investment_crore=investment_crore,
            scenario_type=scenario_type,
            time_horizon_years=time_horizon_years,
            hourly_token=token,
        )

        # Audit log integration (Section 51)
        if db and current_user:
            try:
                log_entry = AuditLog(
                    actor_id=current_user.id,
                    actor_email=current_user.email,
                    action="INVESTMENT_SCENARIO_SIMULATED",
                    target_id=destination_id,
                    details=json.dumps({
                        "investment_crore": investment_crore,
                        "scenario_type": scenario_type,
                        "hourly_token": token,
                        "projected_priority": result["score_projection"]["projected_investment_priority"]
                    })
                )
                db.add(log_entry)
                await db.commit()
            except Exception as exc:
                logger.warning(f"Failed to write audit log: {exc}")

        return result

    def get_ranked_recommendations(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns top prioritized actionable government interventions nationally."""
        token = get_current_hourly_token()
        rankings = self.orchestrator.build_all_intelligence(hourly_token=token)
        recommendations = []

        for p in rankings[:limit]:
            for r in p.get("recommendations", [])[:2]:
                recommendations.append({
                    "destination_id": p["destination_id"],
                    "district": p["district"],
                    "state": p["state"],
                    "national_rank": p["rank"],
                    "investment_priority": p["scores"]["investment_priority"],
                    "action": r["action"],
                    "category": r["category"],
                    "severity": r["severity"],
                    "reason": r["reason"],
                    "evidence": r["evidence"],
                    "expected_objective": r["expected_objective"],
                    "confidence": r["confidence"],
                })

        return recommendations

    def get_methodology(self) -> Dict[str, Any]:
        """Returns formal methodology, weight distributions, and limitations."""
        return {
            "title": "TravelSathi Tourism Investment Intelligence Methodology",
            "model_version": "TS-GOV-1.0",
            "framework": "Multi-Stage Hybrid Intelligence Decision Support System",
            "decision_support_disclaimer": (
                "IMPORTANT: This is a government decision-support system. It NEVER presents AI estimates "
                "as guaranteed government revenue, guaranteed tourist growth, guaranteed ROI, or guaranteed employment. "
                "All projections indicate: Estimated, Model-based, Scenario, Confidence, Data coverage, Source, and Assumptions. "
                "Missing data is never fabricated."
            ),
            "scoring_weights": {
                "intended_production_weights": {
                    "Attraction Strength": "30%",
                    "Tourism Demand": "20%",
                    "Cultural / Natural Significance": "15%",
                    "Growth Opportunity": "15%",
                    "Accessibility Potential": "10%",
                    "Seasonality": "10%"
                },
                "prototype_weights_fallback": {
                    "Attraction Strength": "37.5% (re-weighted across available 0.80 weight)",
                    "Cultural / Natural Significance": "18.75%",
                    "Growth Opportunity": "18.75%",
                    "Accessibility Potential": "12.5%",
                    "Seasonality": "12.5%",
                    "Tourism Demand": "Unavailable (None)"
                }
            },
            "definitions": {
                "Tourism Potential Score": "Quantifies underlying asset strength, cultural significance, and natural potential independent of current promotional saturation.",
                "Tourism Opportunity Score": "Quantifies untapped development upside (Potential × Untapped Opportunity Factor). Separates high-performing leaders from high-potential underdeveloped destinations.",
                "Investment Priority Score": "Decision ranking synthesizing asset value, untapped opportunity, infrastructure bottleneck urgency, and data confidence.",
                "Data Quality Score": "Independent metric evaluating evidence completeness, freshness, and official verification tier (0-100).",
                "Model Confidence Score": "Reflects epistemic uncertainty, missing variable penalties, and calibration reliability (0-100)."
            },
            "limitations": [
                "The system provides decision support and does not replace statutory administrative approval.",
                "Current prototype operates on verified asset, cultural, activity, and transport evidence. Empirical tourist arrival time-series and district fiscal revenue datasets are pending field telemetry integration.",
                "Interventions assume compliance with local environmental carrying capacity and heritage preservation guidelines under ASI."
            ],
            "verified_sources": [
                "Ministry of Tourism, Government of India (data.tourism.gov.in)",
                "Archaeological Survey of India (ASI) Centrally Protected Monuments",
                "Geographical Indications Registry of India (Intellectual Property India)",
                "UNESCO World Heritage Centre & Representative List of Intangible Cultural Heritage",
                "Airports Authority of India (AAI) & Ministry of Railways",
                "State Tourism Development Corporations"
            ]
        }

    def get_sources_provenance(self) -> List[Dict[str, Any]]:
        """Returns catalog of all ingested evidence sources with verification tiers."""
        return [
            {
                "source_id": "SRC_CULTURE",
                "dataset_name": "Cultural_Scored & Cultural_Dataset",
                "authority": "Ministry of Culture / ASI / GI Registry",
                "url": "https://asi.nic.in/",
                "records": 568,
                "tier": "Tier 1 - Government of India Official Ground Truth",
                "description": "Registered cultural assets, traditional crafts, handlooms, folk dances, UNESCO ICH, and GI products.",
                "status": "Verified"
            },
            {
                "source_id": "SRC_ATTRACTION",
                "dataset_name": "Attraction_Scored & Attraction_Dataset",
                "authority": "Ministry of Tourism / National Protected Heritage",
                "url": "https://tourism.gov.in/",
                "records": 1216,
                "tier": "Tier 1 - Government of India Official Ground Truth",
                "description": "Centrally protected monuments, natural wonders, historical shrines, and Ramsar wetland sites.",
                "status": "Verified"
            },
            {
                "source_id": "SRC_CONNECTIVITY",
                "dataset_name": "city_connectivity_enriched (2)",
                "authority": "Airports Authority of India (AAI) / Indian Railways",
                "url": "https://www.aai.aero/",
                "records": 508,
                "tier": "Tier 1 - National Infrastructure Telemetry",
                "description": "Multi-modal road, railway station proximity, and airport flight accessibility indicators.",
                "status": "Verified"
            },
            {
                "source_id": "SRC_ACTIVITY",
                "dataset_name": "Travel_Activity_Scored & Travel_Activity_Dataset",
                "authority": "State Tourism Development Corporations",
                "url": "https://tourism.gov.in/",
                "records": 437,
                "tier": "Tier 2 - State Tourism Boards",
                "description": "Adventure, nature, wildlife, spiritual, and cultural travel activity offerings with seasonality.",
                "status": "Verified"
            }
        ]

    def answer_advisor_query(self, question: str) -> Dict[str, Any]:
        """AI Government Tourism Advisor (Section 39). Strictly evidence-grounded."""
        token = get_current_hourly_token()
        return self.orchestrator.answer_advisor_query(question, hourly_token=token)

    async def generate_report(
        self,
        destination_id: Optional[str] = None,
        state: Optional[str] = None,
        format_type: str = "json",
        current_user: Optional[User] = None,
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        """Generates comprehensive government investment report."""
        token = get_current_hourly_token()
        kpis = self.orchestrator.get_overview_kpis(hourly_token=token)
        rankings = self.orchestrator.build_all_intelligence(hourly_token=token)
        filtered = rankings

        if state and state.lower() != "all":
            filtered = [p for p in filtered if p["state"].lower() == state.lower()]

        if destination_id:
            target = self.orchestrator.get_destination_profile(destination_id, hourly_token=token)
            if not target:
                raise ValueError(f"Unknown destination: '{destination_id}'")
            profile_report = target
        else:
            profile_report = filtered[0] if filtered else None

        report = {
            "title": "Government Tourism Investment Intelligence Report",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "hourly_token": token,
            "data_status": "Prototype Mode (Evidence-Grounded)",
            "model_version": "TS-GOV-1.0",
            "executive_summary": (
                f"Evaluation of {kpis['total_destinations_analyzed']} districts across India identifies "
                f"{kpis['high_priority_destinations']} high-priority intervention zones and {kpis['untapped_opportunity_destinations']} "
                f"destinations with substantial untapped growth opportunity. Primary development friction is transport and last-mile connectivity."
            ),
            "national_kpis": kpis,
            "top_priority_destinations": [
                {
                    "rank": p["rank"],
                    "district": p["district"],
                    "state": p["state"],
                    "investment_priority": p["scores"]["investment_priority"],
                    "tourism_potential": p["scores"]["tourism_potential"],
                    "opportunity_score": p["scores"]["tourism_opportunity"],
                    "primary_bottleneck": p["primary_bottleneck"],
                    "recommended_action": p["recommended_primary_intervention"],
                    "confidence": p["confidence"]["level"]
                }
                for p in filtered[:10]
            ],
            "focus_destination_profile": profile_report,
            "methodology_summary": self.get_methodology()["decision_support_disclaimer"],
            "data_sources": self.get_sources_provenance()
        }

        # Audit log for report generation
        if db and current_user:
            try:
                log_entry = AuditLog(
                    actor_id=current_user.id,
                    actor_email=current_user.email,
                    action="GOVERNMENT_TOURISM_REPORT_GENERATED",
                    target_id=destination_id or state or "national",
                    details=json.dumps({"format": format_type, "hourly_token": token})
                )
                db.add(log_entry)
                await db.commit()
            except Exception as exc:
                logger.warning(f"Failed to record report audit log: {exc}")

        return report


_service_instance: Optional[GovernmentTourismService] = None


def get_government_tourism_service() -> GovernmentTourismService:
    global _service_instance
    if _service_instance is None:
        _service_instance = GovernmentTourismService()
    return _service_instance
