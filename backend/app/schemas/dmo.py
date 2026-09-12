"""DMO Command Center request schemas."""

from pydantic import BaseModel, Field


class PermitToggleRequest(BaseModel):
    destination: str = Field(..., description="Destination to lock/unlock")
    state: str = Field(..., description="State/UT")
    is_locked: bool = Field(..., description="True to activate eco-permit lock and divert traffic")
