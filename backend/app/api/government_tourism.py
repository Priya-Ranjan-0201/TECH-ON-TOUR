"""
backend/app/api/government_tourism.py
-------------------------------------
Government Tourism Investment Intelligence API Routes (Section 52).

Guarded by Server-Side Zero-Trust RBAC:
Allowed roles: 'government', 'dmo', 'admin', 'gov', 'analyst'.
Enforces strict decision-support semantics and zero hallucination.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.database.models import User
from app.core.auth_dependencies import require_role, get_current_user
from app.services.government_tourism_service import get_government_tourism_service, GovernmentTourismService
from app.core.rate_limit import rate_limit_ai
from app.schemas.government_tourism import (
    OverviewKPIResponse,
    DestinationIntelligenceResponse,
    ScenarioRequestPayload,
    AdvisorQueryPayload,
    ReportRequestPayload,
)

router = APIRouter(
    prefix="/government/tourism",
    tags=["Government Tourism Investment Intelligence"],
    dependencies=[Depends(require_role(["government", "dmo", "admin", "gov", "analyst"]))]
)


@router.get("/overview", response_model=OverviewKPIResponse)
async def get_government_overview(
    service: GovernmentTourismService = Depends(get_government_tourism_service)
):
    """
    Returns executive KPI summary, model status, coverage, and hourly telemetry.
    """
    return service.get_overview()


@router.get("/rankings")
async def get_district_rankings(
    state: Optional[str] = Query(None, description="Filter by state name"),
    priority: Optional[str] = Query(None, description="Filter by priority tier: Critical | High | Medium | Moderate"),
    classification: Optional[str] = Query(None, description="Filter by 8-class taxonomy"),
    search: Optional[str] = Query(None, description="Search district, city or state"),
    limit: int = Query(508, ge=1, le=508),
    service: GovernmentTourismService = Depends(get_government_tourism_service)
):
    """
    Returns priority-sorted district rankings across all 508 destinations.
    """
    return service.get_rankings(
        state=state,
        priority=priority,
        classification=classification,
        search=search,
        limit=limit
    )


@router.get("/destination/{destination_id}")
async def get_destination_intelligence(
    destination_id: str,
    service: GovernmentTourismService = Depends(get_government_tourism_service)
):
    """
    Returns full intelligence profile, 'Why Did AI Select This?' breakdown,
    infrastructure bottlenecks, and action plan for a specific destination.
    """
    profile = service.get_destination_profile(destination_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{destination_id}' not found in canonical 508 district registry."
        )
    return profile


@router.get("/compare")
async def compare_districts(
    ids: str = Query(..., description="Comma-separated destination IDs, e.g., 'CT0001,CT0455,CT0340' (2 to 5 IDs)"),
    service: GovernmentTourismService = Depends(get_government_tourism_service)
):
    """
    Compares 2 to 5 districts with comparative trade-off and strategic analysis.
    """
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    if not (2 <= len(id_list) <= 5):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="District comparison requires between 2 and 5 destination IDs."
        )
    try:
        return service.compare_districts(id_list)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )


@router.post("/scenario")
async def simulate_investment_scenario(
    payload: ScenarioRequestPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    service: GovernmentTourismService = Depends(get_government_tourism_service)
):
    """
    Simulates capital intervention scenarios (Connectivity, Accommodation, Facilities, Promotion, Circuits, Integrated).
    Validates capital amounts and logs audit trail.
    """
    try:
        return await service.simulate_scenario(
            destination_id=payload.destination_id,
            investment_crore=payload.investment_crore,
            scenario_type=payload.scenario_type or "integrated",
            time_horizon_years=payload.time_horizon_years or 3,
            current_user=current_user,
            db=db
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )


@router.get("/map")
async def get_map_layers(
    layer: str = Query("investment_priority", description="Layer: investment_priority | tourism_potential | tourism_opportunity | accessibility | cultural | attraction | activity | infrastructure_gap"),
    service: GovernmentTourismService = Depends(get_government_tourism_service)
):
    """
    Returns geospatial coordinates and dynamic layer intensity values for all 508 destinations.
    """
    return service.get_map_layers(layer_name=layer)


@router.get("/recommendations")
async def get_ranked_recommendations(
    limit: int = Query(25, ge=1, le=100),
    service: GovernmentTourismService = Depends(get_government_tourism_service)
):
    """
    Returns prioritized national government action plan items.
    """
    return service.get_ranked_recommendations(limit=limit)


@router.get("/methodology")
async def get_methodology(
    service: GovernmentTourismService = Depends(get_government_tourism_service)
):
    """
    Returns model methodology, formulas, weighting distribution, and decision-support limitations.
    """
    return service.get_methodology()


@router.get("/sources")
async def get_data_sources(
    service: GovernmentTourismService = Depends(get_government_tourism_service)
):
    """
    Returns catalog of official government sources and evidence provenance.
    """
    return service.get_sources_provenance()


@router.post("/advisor", dependencies=[Depends(rate_limit_ai)])
async def query_ai_advisor(
    payload: AdvisorQueryPayload,
    service: GovernmentTourismService = Depends(get_government_tourism_service)
):
    """
    AI Government Advisor. Answers queries strictly based on verified evidence with source citations.
    """
    return service.answer_advisor_query(payload.question)


@router.post("/report")
async def generate_government_report(
    payload: ReportRequestPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    service: GovernmentTourismService = Depends(get_government_tourism_service)
):
    """
    Generates a structured government tourism investment report with executive summary and audit log.
    """
    try:
        return await service.generate_report(
            destination_id=payload.destination_id,
            state=payload.state,
            format_type=payload.format or "json",
            current_user=current_user,
            db=db
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
