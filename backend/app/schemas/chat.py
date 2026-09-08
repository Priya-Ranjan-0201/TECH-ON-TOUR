from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ChatMessage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sender: str = Field(..., description="'user' or 'assistant'")
    text: str = Field(..., description="Message text content")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp string")


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


class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    response_text: str
    language: str
    referenced_pois: List[ReferencedPOI] = Field(default_factory=list)
    suggested_prompts: List[SuggestedPrompt] = Field(default_factory=list)
    session_id: str
    source: str  # "gemini-1.5-flash" or "rag-knowledge-engine"
