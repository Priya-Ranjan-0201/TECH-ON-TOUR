from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database.connection import get_db
from app.database.models import AntiOvertourismPair
from app.schemas.insights import AntiOvertourismListResponse, AntiOvertourismItem

router = APIRouter(prefix="/anti-overtourism", tags=["Anti-Overtourism & Sustainability"])


@router.get("/alternatives", response_model=AntiOvertourismListResponse)
async def get_alternatives(
    popular_destination: Optional[str] = Query(None, description="Popular hotspot name (e.g. 'Manali', 'Shimla', 'Ooty')"),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve curated anti-overtourism alternative circuits that divert footfall
    from congested tourist hotspots to nearby culturally rich hidden gems.
    """
    stmt = select(AntiOvertourismPair)

    if popular_destination:
        stmt = stmt.where(func.lower(AntiOvertourismPair.popular_name).like(f"%{popular_destination.strip().lower()}%"))

    res = await db.execute(stmt)
    pairs = res.scalars().all()

    return AntiOvertourismListResponse(
        count=len(pairs),
        circuits=[AntiOvertourismItem.model_validate(p) for p in pairs]
    )
