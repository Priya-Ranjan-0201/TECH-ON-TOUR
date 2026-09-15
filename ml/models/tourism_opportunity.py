"""
ml/models/tourism_opportunity.py
--------------------------------
Tourism Opportunity Scoring & Destination Classification Model.

Answers: "How much untapped tourism opportunity exists, and what is the infrastructure readiness?"

Opportunity separates:
- High potential + high readiness = Established successful national anchor
- High potential + low readiness = Priority infrastructure intervention (high-yield CapEx)

Generates:
- Opportunity Score (0-100)
- Infrastructure Readiness Index (0-100)
- 8-Class Evidence-Based Taxonomy
- Strategic Potential vs. Readiness Quadrant Coordinates
"""

from typing import Dict, Any, Optional
import numpy as np


class TourismOpportunityModel:
    MODEL_VERSION = "TS-GOV-OPPORTUNITY-2.0"

    def compute_opportunity(
        self,
        potential_score: float,
        attraction_strength: float,
        cultural_natural_significance: float,
        growth_opportunity: float,
        accessibility_potential: float,
        seasonality: float,
        uniqueness_score: float = 50.0,
        experience_potential_score: float = 50.0,
        activity_diversity_score: float = 50.0,
        tourism_demand: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Calculates Tourism Opportunity Score, Infrastructure Readiness Score & Classification.
        """
        pot = max(0.0, min(100.0, float(potential_score)))
        access = max(0.0, min(100.0, float(accessibility_potential)))
        uniq = max(0.0, min(100.0, float(uniqueness_score)))
        exp = max(0.0, min(100.0, float(experience_potential_score)))
        div = max(0.0, min(100.0, float(activity_diversity_score)))
        cult = max(0.0, min(100.0, float(cultural_natural_significance)))

        # 1. Infrastructure Readiness Index (0-100)
        # Empirical synthesis of multi-modal transit accessibility, activity facility density,
        # experiential tourism infrastructure, and seasonal operating stability
        infra_readiness = (
            0.40 * access
            + 0.25 * exp
            + 0.20 * div
            + 0.15 * seasonality
        )
        infra_readiness = round(max(15.0, min(98.0, float(infra_readiness))), 1)

        # 2. Demand / Penetration Proxy
        if tourism_demand is not None:
            demand_penetration_proxy = max(0.0, min(100.0, float(tourism_demand)))
            penetration_source = "Verified Empirical Telemetry"
        else:
            demand_penetration_proxy = infra_readiness
            penetration_source = "Calibrated Infrastructure Readiness & Transit Access Index"

        # 3. Untapped Opportunity Factor:
        # Measures intrinsic asset strength against infrastructure headroom
        headroom = max(0.0, 100.0 - infra_readiness)
        asset_richness = (0.35 * uniq + 0.35 * exp + 0.15 * div + 0.15 * cult) / 100.0
        
        # Scaling factor: Range [0.75, 1.30]
        untapped_factor = 0.75 + 0.35 * (asset_richness) + 0.20 * (headroom / 100.0)

        raw_opportunity = pot * untapped_factor
        opportunity_score = round(max(0.0, min(100.0, float(raw_opportunity))), 1)

        # 4. 8-Class Evidence-Based Taxonomy
        if pot >= 70.0 and infra_readiness >= 65.0:
            classification = "Tourism Leader"
            class_desc = "Established tourism anchor with high asset strength and mature visitor access."
        elif pot >= 65.0 and infra_readiness < 55.0 and access < 50.0:
            classification = "Infrastructure Constrained"
            class_desc = "Substantial tourism potential hindered by transport and last-mile connectivity."
        elif pot >= 65.0 and infra_readiness < 60.0:
            classification = "Emerging Opportunity"
            class_desc = "High-potential destination with substantial untapped visitor and economic growth headroom."
        elif cult >= 75.0 and infra_readiness < 65.0:
            classification = "Cultural Opportunity"
            class_desc = "Exceptional verified heritage and cultural traditions capable of cultural circuit promotion."
        elif uniq >= 80.0 and exp >= 75.0 and infra_readiness < 60.0:
            classification = "Nature Opportunity"
            class_desc = "Distinctive ecological and natural landscape ideal for sustainable low-impact eco-tourism."
        elif pot >= 55.0 and infra_readiness < 45.0:
            classification = "Underdeveloped Potential"
            class_desc = "Nascent destination with notable tourism assets requiring foundational readiness investment."
        elif infra_readiness >= 75.0 and pot < 60.0:
            classification = "Saturated / Pressure Risk"
            class_desc = "High footfall density relative to intrinsic asset capacity requiring dispersal and flow control."
        else:
            classification = "Low Priority"
            class_desc = "Moderate assets and limited growth opportunity; lower prioritization for immediate capital intervention."

        # 5. Strategic Potential vs. Readiness Comparison Analysis
        is_high_pot = pot >= 55.0
        is_high_readiness = infra_readiness >= 55.0
        gap_score = round(float(pot - infra_readiness), 1)

        if is_high_pot and not is_high_readiness:
            r_quadrant = "Q2 • High Potential, Low Readiness (Priority Infrastructure Intervention)"
            r_short = "Priority Infrastructure Intervention"
            r_color = "#087F8C"  # Deep Teal
            r_action = "Highest priority for capital allocation: upgrade last-mile roads, power reliability, and civic amenities to unlock latent tourism potential."
        elif is_high_pot and is_high_readiness:
            r_quadrant = "Q1 • High Potential, High Readiness (National Tourism Anchor)"
            r_short = "National Tourism Anchor"
            r_color = "#102A2E"  # Dark Teal
            r_action = "Mature destination with strong capacity. Focus on carrying-capacity preservation, heritage conservation, and high-value experiential tourism."
        elif not is_high_pot and is_high_readiness:
            r_quadrant = "Q3 • Emerging Potential, High Readiness (Circuit Diversion Ready)"
            r_short = "Circuit Diversion Ready"
            r_color = "#F28C28"  # Orange
            r_action = "Infrastructure exceeds current demand. Prime candidate for routing overflow tourists from saturated hubs to reduce congestion."
        else:
            r_quadrant = "Q4 • Foundational Potential, Low Readiness (Foundational Capacity)"
            r_short = "Foundational Capacity"
            r_color = "#8A9BA8"  # Slate Gray
            r_action = "Community-based rural tourism, skill building, and basic sanitation prior to major capital expenditure."

        return {
            "opportunity_score": opportunity_score,
            "untapped_factor": round(float(untapped_factor), 2),
            "demand_penetration_proxy": round(float(demand_penetration_proxy), 1),
            "infrastructure_readiness": infra_readiness,
            "penetration_source": penetration_source,
            "classification": classification,
            "classification_description": class_desc,
            "scatter_plot": {
                "x_demand_penetration": infra_readiness,
                "y_tourism_potential": round(float(pot), 1),
                "quadrant": r_quadrant,
                "quadrant_short": r_short,
                "quadrant_color": r_color,
                "x_readiness": infra_readiness,
                "gap_score": gap_score,
                "strategic_action": r_action,
            },
            "readiness_comparison": {
                "readiness_score": infra_readiness,
                "potential_score": round(float(pot), 1),
                "gap_score": gap_score,
                "quadrant": r_quadrant,
                "quadrant_short": r_short,
                "quadrant_color": r_color,
                "strategic_action": r_action,
            },
            "model_version": self.MODEL_VERSION,
        }
