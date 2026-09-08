import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.schemas.chat import ChatRequest, ChatResponse, SuggestedPrompt
from app.services.chat_service import ChatService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Multilingual Concierge Chatbot"])


@router.post("/message", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def process_chat_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Process tourist conversational query across 6 Indic languages
    (English, Hindi, Bengali, Tamil, Telugu, Marathi).
    Grounded in 12,293 verified destinations, PM-JUGA tribal homestays,
    and zero-commission DPI economics.
    """
    try:
        response = await ChatService.process_message(db, request)
        return response
    except Exception as exc:
        logger.error(f"Error processing concierge message: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate concierge response: {str(exc)}",
        )


@router.get("/prompts", response_model=List[SuggestedPrompt])
async def get_initial_prompts(
    language: str = Query("en", description="Indic language code (en, hi, bn, ta, te, mr)"),
):
    """
    Return localized initial prompt chips for the conversational concierge widget.
    """
    return ChatService.get_initial_prompts(language)
