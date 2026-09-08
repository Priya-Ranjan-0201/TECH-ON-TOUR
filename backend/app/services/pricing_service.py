"""
Dynamic Pricing Co-Pilot Service.
Provides calendar-aware demand surge pricing heuristics for local homestays and community hosts
based on Indian cultural festivals, seasonal tourism peaks, and weekend demand cycles.
Framed as an MVP heuristic engine with XGBoost in the production roadmap.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any


class PricingService:
    """Service providing festival-aware dynamic room tariff optimization for hosts."""

    # Major Indian Cultural & Regional Tourism Demand Drivers
    FESTIVALS_AND_PEAKS = [
        {
            "id": "fest_pushkar",
            "name": "Pushkar Camel Fair & Kartik Purnima",
            "state": "Rajasthan",
            "months": [10, 11],
            "surge_pct": 22,
            "demand_tier": "Very High",
            "description": "Massive global footfall for livestock fair, desert camping, and Brahma temple pilgrimages."
        },
        {
            "id": "fest_diwali",
            "name": "Diwali & New Year Holiday Circuit",
            "state": "Pan-India",
            "months": [10, 11],
            "surge_pct": 25,
            "demand_tier": "Extreme",
            "description": "Nationwide holiday travel surge across heritage circuits, hill stations, and spiritual centers."
        },
        {
            "id": "fest_dussehra",
            "name": "Navratri, Dussehra & Durga Puja",
            "state": "West Bengal",
            "months": [9, 10],
            "surge_pct": 20,
            "demand_tier": "High",
            "description": "Immense cultural tourism influx for Pandal circuits, Mysore Dasara, and Kullu Dussehra."
        },
        {
            "id": "fest_hornbill",
            "name": "Hornbill Festival (Festival of Festivals)",
            "state": "Nagaland",
            "months": [12],
            "surge_pct": 30,
            "demand_tier": "Extreme",
            "description": "100% homestay occupancy across Kisama & Kohima for indigenous Naga warrior dances and craft fairs."
        },
        {
            "id": "fest_rann",
            "name": "Rann Utsav (White Desert Festival)",
            "state": "Gujarat",
            "months": [11, 12, 1, 2],
            "surge_pct": 24,
            "demand_tier": "Very High",
            "description": "Full moon desert stays, Kutchi artisan embroidery exhibitions, and folk music galas."
        },
        {
            "id": "fest_hemis",
            "name": "Hemis Tsechu & High Himalayan Summer",
            "state": "Ladakh",
            "months": [6, 7, 8],
            "surge_pct": 25,
            "demand_tier": "High",
            "description": "Monastery mask dances and high-altitude trekking peak across Leh, Nubra, and Pangong."
        },
        {
            "id": "fest_onam",
            "name": "Onam & Backwater Boat Races",
            "state": "Kerala",
            "months": [8, 9],
            "surge_pct": 20,
            "demand_tier": "High",
            "description": "Nehru Trophy boat race, authentic Sadya feasts, and monsoon rejuvenation Ayurveda peak."
        },
        {
            "id": "fest_newyear",
            "name": "Winter Sun & New Year Escapes",
            "state": "Goa",
            "months": [12, 1],
            "surge_pct": 30,
            "demand_tier": "Extreme",
            "description": "Peak coastal tourism and music festivals across North and South Goa."
        },
        {
            "id": "fest_himalayan_spring",
            "name": "Himalayan Apple Blossom & Spring Season",
            "state": "Himachal Pradesh",
            "months": [4, 5, 6],
            "surge_pct": 18,
            "demand_tier": "High",
            "description": "Plains heat escape travel toward Jibhi, Tirthan, Spiti, and Kinnaur valleys."
        }
    ]

    @classmethod
    def get_pricing_recommendation(
        cls,
        state: str,
        base_tariff_inr: float = 1650.0,
        current_month: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calculates algorithmic tariff suggestions for a host listing.
        Incorporates festival proximity, state match, and weekend demand.
        """
        if current_month is None:
            current_month = datetime.utcnow().month

        matching_events = []
        highest_surge = 0
        primary_reason = "Standard off-peak competitive pricing"

        for event in cls.FESTIVALS_AND_PEAKS:
            # Check state match or pan-india
            is_state_match = (
                event["state"].lower() == "pan-india" or
                event["state"].lower() in state.lower() or
                state.lower() in event["state"].lower()
            )
            is_active_month = current_month in event["months"]

            if is_state_match and is_active_month:
                matching_events.append(event)
                if event["surge_pct"] > highest_surge:
                    highest_surge = event["surge_pct"]
                    primary_reason = f"{event['name']} ({event['description']})"

        # If no active festival, apply base weekend/seasonal heuristic
        if highest_surge == 0:
            highest_surge = 12  # Standard high-demand weekend heuristic
            primary_reason = "Upcoming Weekend Surge: Regional urban travelers escaping for 2-3 day micro-vacations."

        recommended_tariff = round(base_tariff_inr * (1 + highest_surge / 100.0), 0)
        potential_monthly_gain = round((recommended_tariff - base_tariff_inr) * 16, 0)  # ~16 peak nights

        return {
            "state": state,
            "current_base_tariff_inr": base_tariff_inr,
            "recommended_tariff_inr": recommended_tariff,
            "surge_percentage": highest_surge,
            "estimated_monthly_upside_inr": potential_monthly_gain,
            "demand_driver": primary_reason,
            "matching_cultural_events": [e["name"] for e in matching_events],
            "algorithm_info": {
                "engine": "TravelSathi Dynamic Pricing Co-Pilot (Heuristic Rule Engine)",
                "roadmap_target": "Edge XGBoost Multi-Variable Regression (Footfall + Weather + Fuel)",
                "zero_commission_advantage": "Host receives 97% of tariff (100% of price increase goes directly to host, not OTA)"
            }
        }

    @classmethod
    def get_upcoming_festivals(cls, state: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns upcoming festival demand alerts."""
        if not state or state == "All India":
            return cls.FESTIVALS_AND_PEAKS

        filtered = [
            f for f in cls.FESTIVALS_AND_PEAKS
            if f["state"].lower() == "pan-india" or state.lower() in f["state"].lower()
        ]
        return filtered if filtered else cls.FESTIVALS_AND_PEAKS[:4]
