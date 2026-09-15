"""
ml/models/infrastructure_gap.py
-------------------------------
Rule-Based Diagnostic & Infrastructure Gap Engine for Government Tourism Intelligence.

Evaluates:
- Transport & last-mile accessibility bottlenecks
- Accommodation & homestay capacity gaps
- Peak-season mobility & crowd pressure
- Destination readiness (sanitation, drinking water, visitor facilities)
- Under-promoted cultural assets
- Concentration risks & cluster circuit opportunities
- Environmental sensitivity & eco-sustainability constraints (Section 50)
"""

from typing import Dict, Any, List, Optional


class InfrastructureGapEngine:
    VERSION = "TS-GOV-INFRA-1.0"

    def diagnose_gaps(
        self,
        potential_score: float,
        attraction_strength: float,
        cultural_natural_significance: float,
        accessibility_potential: float,
        seasonality: float,
        uniqueness_score: float,
        asset_profile: Dict[str, Any],
        demand_penetration_proxy: float,
    ) -> List[Dict[str, Any]]:
        """
        Executes diagnostic rule checks and returns structured bottleneck assessments.
        """
        gaps = []

        road_score = asset_profile.get("road_connectivity_score", 65.0)
        rail_score = asset_profile.get("rail_connectivity_score", 35.0)
        air_score = asset_profile.get("air_connectivity_score", 20.0)
        tot_attractions = asset_profile.get("total_attractions", 1)
        tot_cultural = asset_profile.get("verified_cultural_assets", 1)

        # Rule 1: Transport & Connectivity Bottleneck
        # High attraction strength + low connectivity
        if attraction_strength >= 55.0 and accessibility_potential < 55.0:
            reasons = []
            actions = []
            if air_score <= 30.0:
                reasons.append("No direct commercial airport connection; reliant on distant regional hubs.")
                actions.append("Improve last-mile feeder shuttles and airport transit corridors")
            if rail_score <= 40.0:
                reasons.append("Limited direct express rail connectivity.")
                actions.append("Upgrade railway station passenger amenities & direct train linkages")
            if road_score < 70.0:
                reasons.append("NH/SH arterial road surface and signage require modernization.")
                actions.append("Widen arterial approach highways & implement multilingual tourist signage")

            gaps.append({
                "gap_id": "GAP_CONNECTIVITY",
                "category": "Connectivity",
                "bottleneck_title": "Transport & Last-Mile Access Bottleneck",
                "severity": "Critical" if accessibility_potential < 45.0 else "High",
                "evidence": f"Attraction strength is high ({attraction_strength}/100) while accessibility is constrained ({accessibility_potential}/100).",
                "rationale": "High intrinsic tourism value is currently constrained by transport frictions and transit duration.",
                "reasons": reasons or ["Low multimodal access score relative to tourism attraction density."],
                "recommended_interventions": actions or [
                    "Improve last-mile tourist transit corridors",
                    "Introduce dedicated tourist express coaches",
                    "Establish standardized wayfinding signage"
                ],
                "expected_objective": "Improve destination accessibility and reduce transit friction",
            })

        # Rule 2: Destination Readiness & Tourist Facility Gap
        # High asset density but lacking basic amenities
        if (attraction_strength >= 50.0 or cultural_natural_significance >= 60.0):
            gaps.append({
                "gap_id": "GAP_DESTINATION_READINESS",
                "category": "Visitor Amenities",
                "bottleneck_title": "Destination Readiness & Facility Gap",
                "severity": "High" if (tot_attractions + tot_cultural) >= 4 else "Medium",
                "evidence": f"Verified tourism assets ({tot_attractions} attractions, {tot_cultural} cultural traditions) require modern facilitation infrastructure.",
                "rationale": "Visitors require standardized basic hygiene, clean drinking water, and informational facilitation.",
                "reasons": [
                    "Need for standardized public sanitation facilities.",
                    "Lack of centralized tourist facilitation & interpretation center.",
                    "Digital ticketing & automated guidance gaps."
                ],
                "recommended_interventions": [
                    "Construct eco-friendly Swachh tourist toilets & RO drinking water kiosks",
                    "Establish comprehensive Tourist Facilitation Centre (TFC) with digital interpretation",
                    "Deploy QR-coded multilingual audio guides & emergency tourist helpdesks",
                    "Ensure universal barrier-free physical accessibility for Divyangjan"
                ],
                "expected_objective": "Elevate destination civic readiness and visitor satisfaction index",
            })

        # Rule 3: Under-Promoted Cultural Tourism Opportunity
        if cultural_natural_significance >= 65.0 and demand_penetration_proxy < 65.0:
            gaps.append({
                "gap_id": "GAP_CULTURAL_PROMOTION",
                "category": "Cultural Promotion",
                "bottleneck_title": "Under-Promoted Cultural & Heritage Opportunity",
                "severity": "High" if cultural_natural_significance >= 75.0 else "Medium",
                "evidence": f"Cultural significance score is {cultural_natural_significance}/100 with {tot_cultural} registered living traditions, but visitor penetration is only {demand_penetration_proxy}/100.",
                "rationale": "Exceptional intangible cultural heritage, handicrafts, or folklore lack organized national narrative marketing.",
                "reasons": [
                    "Limited experiential packaging of traditional master crafts.",
                    "Absence of curated cultural walking trails & living heritage festivals.",
                    "Artisans lack direct experiential market linkage platforms."
                ],
                "recommended_interventions": [
                    "Curate guided cultural heritage walks & living craft masterclasses",
                    "Develop direct artisan craft bazaars with GI / handloom verification",
                    "Integrate into regional thematic circuits under Swadesh Darshan 2.0",
                    "Launch digital storytelling and cultural branding campaign"
                ],
                "expected_objective": "Catalyze high-value experiential tourism and artisan livelihood generation",
            })

        # Rule 4: Peak-Season Mobility & Pressure Bottleneck
        if seasonality >= 72.0 or demand_penetration_proxy >= 70.0:
            gaps.append({
                "gap_id": "GAP_MOBILITY_PRESSURE",
                "category": "Mobility & Parking",
                "bottleneck_title": "Seasonal Concentration & Mobility Bottleneck",
                "severity": "High" if seasonality >= 80.0 else "Medium",
                "evidence": f"Seasonality score is {seasonality}/100, indicating intense footfall concentration during peak months.",
                "rationale": "High seasonal surge risks urban vehicular gridlock, parking distress, and pedestrian conflict.",
                "reasons": [
                    "Concentrated seasonal arrivals overwhelm core precinct roads.",
                    "Insufficient organized peripheral parking.",
                    "Absence of dynamic traffic and crowd telemetry."
                ],
                "recommended_interventions": [
                    "Develop peripheral multi-modal parking plazas outside city core",
                    "Operate dedicated electric shuttle loop buses into heritage zones",
                    "Establish pedestrian-only heritage promenades during peak hours",
                    "Implement dynamic real-time traffic diversion and slot booking"
                ],
                "expected_objective": "Mitigate congestion and preserve local urban livability",
            })

        # Rule 5: Sustainable Tourism & Carrying Capacity Constraint (Section 50)
        # Always included for high ecological/natural potential to enforce environmental protection
        if uniqueness_score >= 70.0 or asset_profile.get("natural_attractions", 0) >= 1:
            gaps.append({
                "gap_id": "GAP_SUSTAINABILITY",
                "category": "Sustainability & Ecology",
                "bottleneck_title": "Ecological Vulnerability & Carrying-Capacity Constraint",
                "severity": "Critical" if asset_profile.get("natural_attractions", 0) >= 2 else "High",
                "evidence": f"Sensitive ecological environment (Natural score / Uniqueness: {uniqueness_score}/100).",
                "rationale": "Development must not degrade delicate biodiversity, forest canopies, or water bodies.",
                "reasons": [
                    "Carrying-capacity threshold must not be exceeded by mass concrete construction.",
                    "Solid and liquid waste treatment infrastructure is imperative.",
                    "Visitor dispersal required to prevent habitat disruption."
                ],
                "recommended_interventions": [
                    "Institute automated carrying-capacity monitoring & timed entry permits",
                    "Mandate decentralized zero-discharge sewage treatment & waste composting",
                    "Promote community-managed low-impact homestays over commercial mega-resorts",
                    "Enforce strict plastic-free buffer zones and electric vehicle mobility"
                ],
                "expected_objective": "Ensure long-term ecological resilience and heritage conservation",
            })

        # Rule 6: Tourism Concentration Risk & Cluster Development
        if tot_attractions >= 3 and tot_cultural >= 2:
            gaps.append({
                "gap_id": "GAP_CIRCUIT_DIVERSIFICATION",
                "category": "Circuit Development",
                "bottleneck_title": "Precinct Concentration & Circuit Dispersal Opportunity",
                "severity": "Medium",
                "evidence": f"Dense cluster of {tot_attractions} attractions and {tot_cultural} cultural points within single municipal radius.",
                "rationale": "Dispersing tourists into peripheral satellite heritage sites extends average dwell time.",
                "reasons": [
                    "Tourists concentrate heavily in single core monument, causing localized wear.",
                    "Peripheral satellite attractions remain under-visited."
                ],
                "recommended_interventions": [
                    "Design integrated 2-day / 3-day regional destination circuit routes",
                    "Develop connecting scenic feeder roads to rural/suburban satellite spots",
                    "Offer bundled multi-attraction digital passes"
                ],
                "expected_objective": "Extend tourist length of stay and distribute economic benefit to rural periphery",
            })

        return gaps
