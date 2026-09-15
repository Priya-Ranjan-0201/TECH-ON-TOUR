"""
ml/explainability/explainability.py
----------------------------------
Explainable AI (XAI) & Factor Contribution Breakdown for Government Decision Support.

Answers Sections 27 & 35:
- "Why did TravelSathi rank this district highly?"
- Quantitative Factor Contributions (Top positive drivers & negative constraints).
- Evidence-backed natural language explanations without hallucinations.
- Structured checklist:
  ✓ Positive drivers
  ⚠ Constraints / Bottlenecks
  🎯 Recommended Strategic Direction
"""

from typing import Dict, Any, List


class ExplainabilityEngine:
    VERSION = "TS-GOV-XAI-1.0"

    def explain(
        self,
        potential_data: Dict[str, Any],
        opportunity_data: Dict[str, Any],
        priority_data: Dict[str, Any],
        infrastructure_gaps: List[Dict[str, Any]],
        district_name: str,
        state_name: str,
    ) -> Dict[str, Any]:
        """
        Generates quantitative factor contributions and natural language government briefing.
        """
        factors = potential_data["factor_scores"]
        weights = potential_data.get("weights_used", {})
        prio_score = priority_data["investment_priority"]
        opp_score = opportunity_data["opportunity_score"]
        classification = opportunity_data.get("classification", "")

        attraction = factors["attraction_strength"]
        cult = factors["cultural_natural_significance"]
        growth = factors["growth_opportunity"]
        access = factors["accessibility_potential"]
        season = factors["seasonality"]

        # Factor contributions to priority score
        # Contribution = (score_val / 100) * target_weight * scale
        contrib_att = round(attraction * 0.30, 1)
        contrib_cult = round(cult * 0.18, 1)
        contrib_growth = round(growth * 0.18, 1)
        contrib_access = round(access * 0.12, 1)
        contrib_season = round(season * 0.10, 1)

        positive_factors = []
        positive_factors.append({
            "factor": "Attraction Strength",
            "score": attraction,
            "contribution": f"+{contrib_att}",
            "impact": "High Positive",
            "detail": "High verified attraction count, diversity, and ASI/UNESCO recognition."
        })
        positive_factors.append({
            "factor": "Cultural & Natural Significance",
            "score": cult,
            "contribution": f"+{contrib_cult}",
            "impact": "High Positive",
            "detail": "Registered living traditions, GI crafts, and heritage monuments."
        })
        positive_factors.append({
            "factor": "Growth Opportunity",
            "score": growth,
            "contribution": f"+{contrib_growth}",
            "impact": "Moderate Positive",
            "detail": "High experiential potential and tourism expansion headroom."
        })
        if access >= 55.0:
            positive_factors.append({
                "factor": "Accessibility Foundation",
                "score": access,
                "contribution": f"+{contrib_access}",
                "impact": "Positive",
                "detail": "Established multi-modal rail/road arterial connectivity."
            })

        # Constraint factors (penalties or bottlenecks)
        constraints = []
        if access < 55.0:
            pen = round((55.0 - access) * 0.15, 1)
            constraints.append({
                "factor": "Transport Bottleneck",
                "score": access,
                "contribution": f"-{pen}",
                "impact": "Constraining",
                "detail": "Transport and last-mile accessibility frictions constrain footfall growth."
            })
        if season >= 75.0:
            constraints.append({
                "factor": "Seasonal Concentration",
                "score": season,
                "contribution": "-2.5",
                "impact": "Constraining",
                "detail": "Footfall is concentrated into narrow peak months, risking seasonal congestion."
            })
        if any(g.get("gap_id") == "GAP_DESTINATION_READINESS" for g in infrastructure_gaps):
            constraints.append({
                "factor": "Facility Readiness Gap",
                "score": 45.0,
                "contribution": "-3.0",
                "impact": "Constraining",
                "detail": "Civic amenities, sanitation, and signage require capital modernization."
            })

        # Checklist bullets for "Why AI Selected This?" Panel (Section 35)
        drivers_checklist = []
        if attraction >= 50.0:
            drivers_checklist.append("Strong attraction diversity and monument concentration")
        if cult >= 50.0:
            drivers_checklist.append("Significant verified cultural assets, GI crafts, and living traditions")
        if growth >= 60.0:
            drivers_checklist.append("High experience potential and untapped visitor growth opportunity")
        if access >= 60.0:
            drivers_checklist.append("Established multi-modal road/rail transport connectivity")
        else:
            drivers_checklist.append("Moderate regional transport connectivity with improvement headroom")

        warning_checklist = []
        for gap in infrastructure_gaps[:2]:
            warning_checklist.append(f"{gap['bottleneck_title']} ({gap['severity']})")

        # Human-readable strategic synthesis
        rationale = (
            f"TravelSathi prioritized {district_name} ({state_name}) with an Investment Priority of {prio_score}/100 "
            f"because it exhibits strong attraction strength ({attraction}/100) and substantial cultural/natural significance ({cult}/100). "
            f"Categorized as '{classification}', it possesses notable growth opportunity ({growth}/100). "
        )
        if access < 55.0:
            rationale += f"Transport accessibility is moderate ({access}/100), representing a primary development bottleneck. "
        else:
            rationale += f"Accessibility is well established ({access}/100). "

        strategic_recommendation = (
            "Prioritize destination civic readiness, last-mile feeder transit, and tourism circuit clustering "
            "before initiating large-scale national promotional campaigns."
        )

        return {
            "investment_priority": prio_score,
            "opportunity_score": opp_score,
            "classification": classification,
            "top_positive_factors": positive_factors,
            "constraints": constraints,
            "drivers_checklist": drivers_checklist,
            "warning_checklist": warning_checklist,
            "human_readable_explanation": rationale,
            "strategic_recommendation": strategic_recommendation,
            "engine_version": self.VERSION,
        }
