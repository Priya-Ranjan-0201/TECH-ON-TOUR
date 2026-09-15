"""
ml/schemas/contract.py
----------------------
Strict Backend & Model Output JSON Contract for Government Decision Support (Section 42).
Never returns fake numerical values for unavailable fields.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ScoresSchema(BaseModel):
    tourism_potential: float = Field(..., ge=0.0, le=100.0)
    tourism_opportunity: float = Field(..., ge=0.0, le=100.0)
    investment_priority: float = Field(..., ge=0.0, le=100.0)


class FactorScoresSchema(BaseModel):
    attraction_strength: float = Field(..., ge=0.0, le=100.0)
    tourism_demand: Optional[float] = None
    cultural_natural_significance: float = Field(..., ge=0.0, le=100.0)
    growth_opportunity: float = Field(..., ge=0.0, le=100.0)
    accessibility_potential: float = Field(..., ge=0.0, le=100.0)
    seasonality: float = Field(..., ge=0.0, le=100.0)


class InfrastructureGapItem(BaseModel):
    gap_id: str
    category: str
    bottleneck_title: str
    severity: str
    evidence: str
    rationale: str
    reasons: List[str]
    recommended_interventions: List[str]
    expected_objective: str


class RecommendationItem(BaseModel):
    priority_rank: int
    action: str
    category: str
    reason: str
    evidence: str
    severity: str
    expected_objective: str
    data_required_for_execution: List[str]
    confidence: str


class EconomicImpactSchema(BaseModel):
    additional_tourists: Optional[int] = None
    additional_spending: Optional[float] = None
    economic_activity: Optional[float] = None
    government_revenue: Optional[float] = None
    employment: Optional[int] = None
    economic_impact_multiple: Optional[str] = None
    payback_period_years: Optional[float] = None
    status: str
    note: str


class ConfidenceSchema(BaseModel):
    score: float = Field(..., ge=0.0, le=100.0)
    level: str  # "High" | "Medium" | "Low"
    data_quality_score: float
    reasons_positive: List[str]
    reasons_negative: List[str]
    reason: str


class DataProvenanceItem(BaseModel):
    dataset_name: str
    source_name: str
    source_url: str
    data_year: int
    verification_status: str
    records_used: int


class ModelMetaSchema(BaseModel):
    version: str
    mode: str  # "prototype" | "production"
    hourly_token: Optional[str] = None
    last_updated: str


class DestinationIntelligenceContract(BaseModel):
    destination_id: str
    district: str
    state: str
    city: str
    canonical_name: str
    latitude: float
    longitude: float
    rank: int

    scores: ScoresSchema
    factor_scores: FactorScoresSchema

    classification: str
    classification_description: str
    scatter_plot: Dict[str, Any]

    infrastructure_gaps: List[InfrastructureGapItem]
    recommendations: List[RecommendationItem]
    investment_scenarios: List[Dict[str, Any]]
    economic_impact: EconomicImpactSchema

    confidence: ConfidenceSchema
    explainability: Dict[str, Any]
    asset_profile: Dict[str, Any]
    data_provenance: List[DataProvenanceItem]
    model: ModelMetaSchema


class OverviewKPISchema(BaseModel):
    total_destinations_analyzed: int
    high_priority_destinations: int
    high_tourism_potential_destinations: int
    untapped_opportunity_destinations: int
    average_connectivity: float
    average_tourism_potential: float
    average_confidence: float
    data_status: str
    last_data_update: str
    model_version: str
    hourly_token: str
