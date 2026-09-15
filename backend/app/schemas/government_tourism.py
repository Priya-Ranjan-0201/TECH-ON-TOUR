"""
backend/app/schemas/government_tourism.py
-----------------------------------------
Strict Pydantic schemas for Government Tourism Investment Intelligence API.
Enforces Section 42 contract with zero-hallucination policy.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class GovScores(BaseModel):
    tourism_potential: float
    tourism_opportunity: float
    investment_priority: float
    infrastructure_readiness: Optional[float] = 65.0


class GovFactorScores(BaseModel):
    attraction_strength: float
    tourism_demand: Optional[float] = None
    cultural_natural_significance: float
    growth_opportunity: float
    accessibility_potential: float
    seasonality: float


class GovScatterPlot(BaseModel):
    x_demand_penetration: float
    y_tourism_potential: float
    quadrant: str
    quadrant_short: str
    quadrant_color: str
    x_readiness: Optional[float] = None
    gap_score: Optional[float] = None
    strategic_action: Optional[str] = None


class GovInfrastructureGap(BaseModel):
    gap_id: str
    category: str
    bottleneck_title: str
    severity: str
    evidence: str
    rationale: str
    reasons: List[str]
    recommended_interventions: List[str]
    expected_objective: str


class GovRecommendation(BaseModel):
    priority_rank: int
    action: str
    category: str
    reason: str
    evidence: str
    severity: str
    expected_objective: str
    data_required_for_execution: List[str]
    confidence: str


class GovEconomicImpact(BaseModel):
    additional_tourists: Optional[int] = None
    additional_spending: Optional[float] = None
    economic_activity: Optional[float] = None
    government_revenue: Optional[float] = None
    employment: Optional[int] = None
    economic_impact_multiple: Optional[str] = None
    payback_period_years: Optional[float] = None
    status: str
    note: str


class GovConfidence(BaseModel):
    score: float
    level: str
    data_quality_score: float
    reasons_positive: List[str]
    reasons_negative: List[str]
    reason: str


class GovDataProvenance(BaseModel):
    dataset_name: str
    source_name: str
    source_url: str
    data_year: int
    verification_status: str
    records_used: int


class GovModelMeta(BaseModel):
    version: str
    mode: str
    hourly_token: Optional[str] = None
    last_updated: str


class DestinationIntelligenceResponse(BaseModel):
    destination_id: str
    district: str
    state: str
    city: str
    canonical_name: str
    latitude: float
    longitude: float
    rank: int

    scores: GovScores
    factor_scores: GovFactorScores

    classification: str
    classification_description: str
    scatter_plot: GovScatterPlot
    readiness_comparison: Optional[Dict[str, Any]] = None
    priority_tier: str
    priority_badge: str
    primary_bottleneck: str
    recommended_primary_intervention: str

    infrastructure_gaps: List[GovInfrastructureGap]
    recommendations: List[GovRecommendation]
    investment_scenarios: List[Dict[str, Any]]
    economic_impact: GovEconomicImpact

    confidence: GovConfidence
    explainability: Dict[str, Any]
    asset_profile: Dict[str, Any]
    data_provenance: List[GovDataProvenance]
    model: GovModelMeta


class OverviewKPIResponse(BaseModel):
    total_destinations_analyzed: int
    high_priority_destinations: int
    high_tourism_potential_destinations: int
    untapped_opportunity_destinations: int
    average_connectivity: float
    average_tourism_potential: float
    average_readiness: Optional[float] = None
    average_confidence: float
    data_status: str
    last_data_update: str
    model_version: str
    hourly_token: str


class ScenarioRequestPayload(BaseModel):
    destination_id: str
    investment_crore: float = Field(..., gt=0.0, description="Investment budget in Crore INR")
    scenario_type: Optional[str] = Field("integrated", description="connectivity | accommodation | facilities | promotion | circuit | integrated")
    time_horizon_years: Optional[int] = Field(3, ge=1, le=10)


class CompareRequestPayload(BaseModel):
    destination_ids: List[str] = Field(..., min_length=2, max_length=5)


class AdvisorQueryPayload(BaseModel):
    question: str = Field(..., min_length=3)


class ReportRequestPayload(BaseModel):
    destination_id: Optional[str] = None
    state: Optional[str] = None
    format: Optional[str] = "json"  # "json" | "csv" | "summary"
