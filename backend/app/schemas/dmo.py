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


class ReadinessInputRequest(BaseModel):
    destination_id: int | str = Field(..., description="Target destination or district ID (e.g. 122 or 'CT0122')")
    accommodation: float = Field(..., ge=0.0, le=100.0, description="Accommodation score (25% weight)")
    transport: float = Field(..., ge=0.0, le=100.0, description="Transport & Accessibility score (20% weight)")
    connectivity: float = Field(..., ge=0.0, le=100.0, description="Connectivity score (15% weight)")
    food_hospitality: float = Field(..., ge=0.0, le=100.0, description="Food & Hospitality score (15% weight)")
    medical_safety: float = Field(..., ge=0.0, le=100.0, description="Medical & Safety score (15% weight)")
    other_amenities: float = Field(..., ge=0.0, le=100.0, description="Other Amenities score (10% weight)")
    updated_by: Optional[str] = Field(default=None, description="UUID or identifier of user submitting the input")


