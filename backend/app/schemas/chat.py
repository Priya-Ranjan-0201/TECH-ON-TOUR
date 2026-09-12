from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Any, Optional, List

class ChatMessage(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    sender: str = Field(default="user", description="'user' or 'assistant'")
    text: str = Field(default="", description="Message text content")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp string")

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any):
        if isinstance(data, dict):
            d = dict(data)
            if "role" in d and "sender" not in d:
                d["sender"] = d["role"]
            if "content" in d and "text" not in d:
                d["text"] = d["content"]
            return d
        return data


class ReferencedPOI(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    name: str
    category: str
    state: str
    rating: float
    price_range: Optional[str] = None
    image_url: Optional[str] = None
    action_type: str = "explore"  # "explore" or "book_homestay"
    distance_km: Optional[float] = None


class SuggestedPrompt(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    label: str
    query: str
    category: Optional[str] = None


class ChatRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message: str = Field(..., min_length=1, max_length=2000, description="User prompt or speech query")
    language: str = Field(default="en", description="Language code: en, hi, bn, ta, te, mr")
    session_id: Optional[str] = Field(default=None, description="Client session UUID")
    history: List[ChatMessage] = Field(default_factory=list, description="Recent conversation turns")
    latitude: Optional[float] = Field(default=None, description="Client latitude for location-aware queries")
    longitude: Optional[float] = Field(default=None, description="Client longitude for location-aware queries")
    city: Optional[str] = Field(default=None, description="Client detected city/state")


class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    response_text: str
    language: str
    referenced_pois: List[ReferencedPOI] = Field(default_factory=list)
    suggested_prompts: List[SuggestedPrompt] = Field(default_factory=list)
    session_id: str
    source: str  # "gemini-1.5-flash" or "rag-knowledge-engine"
