"""DMO Command Center request schemas."""

from typing import Optional

from pydantic import BaseModel, Field


class PermitToggleRequest(BaseModel):
    destination: str = Field(..., description="Destination to lock/unlock")
    state: str = Field(..., description="State/UT")
    is_locked: bool = Field(..., description="True to activate eco-permit lock and divert traffic")


class StaffingOverrideRequest(BaseModel):
    police: int = Field(..., ge=0, description="Override police personnel count")
    medical: int = Field(..., ge=0, description="Override medical/paramedic count")
    sanitation: int = Field(..., ge=0, description="Override sanitation crew count")
    notes: str = Field(default="", description="Reason for override")


class InvestmentRecommendRequest(BaseModel):
    budget_crore: float = Field(default=25.0, ge=0.5, description="Capital investment allocation in crore INR")
    state: Optional[str] = Field(default=None, description="Optional state filter")

