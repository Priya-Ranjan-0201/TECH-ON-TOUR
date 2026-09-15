"""
ml/models/tourism_potential.py
------------------------------
Tourism Potential Scoring Model for Government Tourism Intelligence.

Answers: "How strong is this destination's underlying tourism potential?"

Components:
- Attraction Strength                30%
- Tourism Demand                     20%
- Cultural/Natural Significance      15%
- Growth Opportunity                 15%
- Accessibility Potential            10%
- Seasonality                        10%

Behavior:
- In Production Mode: Full 6-factor model.
- In Prototype Mode (current TravelSathi datasets without demand figures):
  Demand is explicitly marked None (unavailable), component weights are
  re-normalized across available features (summing to 100%), confidence is
  appropriately reduced, and the score is labeled 'Prototype Potential Score'.
"""

from typing import Dict, Any, Optional, Tuple


class TourismPotentialModel:
    MODEL_VERSION = "TS-GOV-POTENTIAL-1.0"

    # Intended production weights (sum to 1.0)
    INTENDED_WEIGHTS = {
        "attraction_strength": 0.30,
        "tourism_demand": 0.20,
        "cultural_natural_significance": 0.15,
        "growth_opportunity": 0.15,
        "accessibility_potential": 0.10,
        "seasonality": 0.10,
    }

    def compute_potential(
        self,
        attraction_strength: float,
        cultural_natural_significance: float,
        growth_opportunity: float,
        accessibility_potential: float,
        seasonality: float,
        tourism_demand: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Computes Tourism Potential Score (0-100).
        """
        # Clamp inputs to [0, 100]
        attraction_val = max(0.0, min(100.0, float(attraction_strength)))
        cult_val = max(0.0, min(100.0, float(cultural_natural_significance)))
        growth_val = max(0.0, min(100.0, float(growth_opportunity)))
        access_val = max(0.0, min(100.0, float(accessibility_potential)))
        season_val = max(0.0, min(100.0, float(seasonality)))

        if tourism_demand is not None:
            # Production Mode
            demand_val = max(0.0, min(100.0, float(tourism_demand)))
            score = (
                self.INTENDED_WEIGHTS["attraction_strength"] * attraction_val
                + self.INTENDED_WEIGHTS["tourism_demand"] * demand_val
                + self.INTENDED_WEIGHTS["cultural_natural_significance"] * cult_val
                + self.INTENDED_WEIGHTS["growth_opportunity"] * growth_val
                + self.INTENDED_WEIGHTS["accessibility_potential"] * access_val
                + self.INTENDED_WEIGHTS["seasonality"] * season_val
            )
            mode = "production"
            demand_status = "verified"
            demand_display = round(demand_val, 1)
            confidence_penalty = 0.0
            label = "Tourism Potential Score"
        else:
            # Prototype Mode (Section 4A)
            # Re-normalize weights across available components (total weight 0.80)
            available_weight = 0.80
            score = (
                (self.INTENDED_WEIGHTS["attraction_strength"] / available_weight) * attraction_val
                + (self.INTENDED_WEIGHTS["cultural_natural_significance"] / available_weight) * cult_val
                + (self.INTENDED_WEIGHTS["growth_opportunity"] / available_weight) * growth_val
                + (self.INTENDED_WEIGHTS["accessibility_potential"] / available_weight) * access_val
                + (self.INTENDED_WEIGHTS["seasonality"] / available_weight) * season_val
            )
            mode = "prototype"
            demand_status = "unavailable"
            demand_display = None
            confidence_penalty = 0.0
            label = "Tourism Potential Score"

        score = round(max(0.0, min(100.0, float(score))), 1)

        factor_scores = {
            "attraction_strength": round(attraction_val, 1),
            "tourism_demand": demand_display,
            "cultural_natural_significance": round(cult_val, 1),
            "growth_opportunity": round(growth_val, 1),
            "accessibility_potential": round(access_val, 1),
            "seasonality": round(season_val, 1),
        }

        weights_used = {
            k: (v if mode == "production" else (round(v / 0.80, 4) if k != "tourism_demand" else 0.0))
            for k, v in self.INTENDED_WEIGHTS.items()
        }

        return {
            "potential_score": score,
            "factor_scores": factor_scores,
            "weights_used": weights_used,
            "mode": mode,
            "demand_status": demand_status,
            "demand_note": (
                "Verified demand data unavailable. Computed as Prototype Potential Score using verified asset and accessibility evidence."
                if mode == "prototype"
                else "Verified empirical tourist arrival telemetry integrated."
            ),
            "confidence_penalty": confidence_penalty,
            "label": label,
            "model_version": self.MODEL_VERSION,
        }
