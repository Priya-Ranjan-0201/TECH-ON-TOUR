import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.schemas.chat import ChatRequest, ChatResponse, SuggestedPrompt
from app.services.chat_service import ChatService
from app.core.rate_limit import rate_limit_ai

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Multilingual Concierge Chatbot"])


@router.post("/concierge", dependencies=[Depends(rate_limit_ai)])
@router.post("/message", dependencies=[Depends(rate_limit_ai)])
async def process_chat_message(
    chat_req: ChatRequest,
    raw_req: Request,
    stream: bool = Query(False, description="Enable Server-Sent Events (SSE) token streaming"),
    db: AsyncSession = Depends(get_db),
):
    """
    Process tourist conversational query across 6 Indic languages
    (English, Hindi, Bengali, Tamil, Telugu, Marathi).
    Enforces strict 6-message rolling history constraint.
    Supports both Server-Sent Events (SSE) streaming and standard JSON responses.
    """
    # Enforce 6-message rolling history
    if len(chat_req.history) > 6:
        chat_req.history = chat_req.history[-6:]

    # Check if client requested streaming via query param or header
    accept_header = raw_req.headers.get("accept", "")
    wants_stream = stream or "text/event-stream" in accept_header

    if wants_stream:
        return StreamingResponse(
            ChatService.stream_concierge_response(db, chat_req),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )

    try:
        response = await ChatService.process_message(db, chat_req)
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
