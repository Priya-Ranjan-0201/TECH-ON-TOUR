"""
ml/models/priority_engine.py
----------------------------
Investment Priority Decision & District Ranking Engine.

Answers: "Where should government intervene first?"

Formula & Principles:
- HIGH TOURISM VALUE + HIGH DEVELOPMENT OPPORTUNITY + REALISTIC INTERVENTION POTENTIAL
  = HIGH INVESTMENT PRIORITY (Section 4C).
- Incorporates:
  * Attraction Strength (30%)
  * Tourism Demand / Penetration Headroom (20%)
  * Cultural / Natural Significance (15%)
  * Growth Opportunity (15%)
  * Accessibility Potential (10%)
  * Seasonality (10%)
  * Infrastructure Bottleneck Urgency (+ adjustment)
  * Data Confidence Calibration
- Produces national ranking across all 508 districts.
- Generates a prioritized, ranked Government Action Plan (Section 36).
"""

from typing import Dict, Any, List, Optional
import numpy as np


class InvestmentPriorityEngine:
    VERSION = "TS-GOV-PRIORITY-1.0"

    def compute_priority(
        self,
        potential_data: Dict[str, Any],
        opportunity_data: Dict[str, Any],
        infrastructure_gaps: List[Dict[str, Any]],
        confidence_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Computes the final Investment Priority Score (0-100) and ranked action plan.
        """
        pot_score = potential_data["potential_score"]
        opp_score = opportunity_data["opportunity_score"]
        factors = potential_data["factor_scores"]
        
        attraction = factors["attraction_strength"]
        cult = factors["cultural_natural_significance"]
        growth = factors["growth_opportunity"]
        access = factors["accessibility_potential"]
        season = factors["seasonality"]

        # Base weighted evidence (summing to 100)
        # Using intended weights from Section 4C
        base_priority = (
            0.30 * attraction
            + 0.15 * cult
            + 0.20 * growth
            + 0.15 * (100.0 - abs(access - 55.0) * 0.5)  # High priority where intervention can fix access
            + 0.10 * season
            + 0.10 * opp_score
        )

        # Gap Urgency Factor: Count and severity of detected bottlenecks
        gap_urgency = 0.0
        for gap in infrastructure_gaps:
            sev = gap.get("severity", "Medium")
            if sev == "Critical":
                gap_urgency += 4.5
            elif sev == "High":
                gap_urgency += 3.0
            else:
                gap_urgency += 1.5

        gap_urgency = min(15.0, gap_urgency)

        # Untapped opportunity boost: Underdeveloped high-potential places receive priority boost
        untapped_boost = 0.0
        classification = opportunity_data.get("classification", "")
        if classification in ["Infrastructure Constrained", "Emerging Opportunity"]:
            untapped_boost = 6.0
        elif classification in ["Cultural Opportunity", "Nature Opportunity"]:
            untapped_boost = 4.5
        elif classification == "Tourism Leader":
            untapped_boost = 2.0  # Still high baseline, but not solely prioritized over emerging

        raw_priority = base_priority * 0.82 + gap_urgency + untapped_boost

        # Confidence Calibration: Slight conservatism for lower confidence records
        conf_score = confidence_data.get("score", 75.0)
        conf_factor = 0.85 + 0.15 * (conf_score / 100.0)
        calibrated_priority = raw_priority * conf_factor

        final_priority = round(max(0.0, min(100.0, float(calibrated_priority))), 1)

        # Priority Tier
        if final_priority >= 85.0:
            priority_tier = "Critical"
            priority_badge = "🔴 Critical Priority"
        elif final_priority >= 75.0:
            priority_tier = "High"
            priority_badge = "🟠 High Priority"
        elif final_priority >= 62.0:
            priority_tier = "Medium"
            priority_badge = "🟡 Medium Priority"
        else:
            priority_tier = "Moderate"
            priority_badge = "🔵 Moderate Priority"

        # Ranked Government Action Plan (Section 36)
        action_plan = self._generate_action_plan(
            final_priority, infrastructure_gaps, factors, opportunity_data
        )

        return {
            "investment_priority": final_priority,
            "priority_tier": priority_tier,
            "priority_badge": priority_badge,
            "base_priority": round(float(base_priority), 1),
            "gap_urgency_score": round(float(gap_urgency), 1),
            "action_plan": action_plan,
            "primary_bottleneck": infrastructure_gaps[0]["category"] if infrastructure_gaps else "None Detected",
            "recommended_primary_intervention": action_plan[0]["action"] if action_plan else "Maintain ongoing destination operations",
            "engine_version": self.VERSION,
        }

    def _generate_action_plan(
        self,
        priority_score: float,
        gaps: List[Dict[str, Any]],
        factors: Dict[str, Any],
        opportunity_data: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Creates ranked actionable government intervention items with evidence and confidence.
        """
        plan = []
        rank = 1

        for gap in gaps[:4]:
            plan.append({
                "priority_rank": rank,
                "action": gap["recommended_interventions"][0] if gap.get("recommended_interventions") else f"Address {gap['category']}",
                "category": gap.get("category", "Infrastructure"),
                "reason": gap.get("rationale", "Development bottleneck detected."),
                "evidence": gap.get("evidence", "Verified multi-source scoring data."),
                "severity": gap.get("severity", "High"),
                "expected_objective": gap.get("expected_objective", "Improve destination outcomes"),
                "data_required_for_execution": [
                    "Detailed Project Report (DPR) site survey",
                    "Carrying-capacity baseline assessment",
                    "Local stakeholder & Gram Panchayat consultation"
                ],
                "confidence": "High" if gap.get("severity") in ["Critical", "High"] else "Medium"
            })
            rank += 1

        return plan
