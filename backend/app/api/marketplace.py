"""
Reverse Marketplace & Host Seller Hub API Endpoints.
Powers tourist RFPs broadcast from itineraries, 1-click competitive host bidding,
and dynamic pricing co-pilot intelligence for local hosts.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

import json
from app.database.connection import get_db
from app.database.models import Guide, HourlySignalCache
from app.schemas.marketplace import CreateRFPRequest, SubmitBidRequest, ApplyPricingRequest
from app.services.marketplace_service import MarketplaceService
from app.services.pricing_service import PricingService

router = APIRouter(tags=["Marketplace & Host Hub"])


@router.get("/marketplace/rfps")
async def list_open_rfps(
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List open tourist RFPs broadcast from AI itineraries, filtered by state.
    """
    return await MarketplaceService.list_open_rfps(db, state=state)


@router.post("/marketplace/rfp", status_code=status.HTTP_201_CREATED)
async def create_tourist_rfp(
    payload: CreateRFPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Broadcast a traveler RFP to verified local hosts in the target district.
    """
    return await MarketplaceService.create_rfp(db, payload.model_dump())


@router.post("/marketplace/bid", status_code=status.HTTP_201_CREATED)
async def submit_host_bid(
    payload: SubmitBidRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Host submits a competitive zero-commission bid on an open tourist RFP.
    """
    result = await MarketplaceService.submit_bid(db, payload.model_dump())
    if "error" in result:
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result


@router.post("/marketplace/bid/{bid_id}/accept")
async def accept_host_bid(
    bid_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Traveler accepts a host bid, generating a confirmed booking with 97% host payout.
    """
    result = await MarketplaceService.accept_bid(db, bid_id=bid_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result




@router.get("/experiences")
async def list_experiences(
    state: Optional[str] = Query(None, description="Filter by state (e.g. 'Chhattisgarh')"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """
    List authentic local experiences and masterclasses led by verified local guides.
    """
    stmt = select(Guide).where(Guide.is_available == True)
    if state and state.lower() != "all":
        stmt = stmt.where(func.lower(Guide.state) == state.strip().lower())
    stmt = stmt.order_by(Guide.rating.desc()).limit(limit)
    res = await db.execute(stmt)
    guides = res.scalars().all()

    EXPERIENCE_METADATA = {
        "guide-001": {
            "title": "Bastar Dhokra Bell-Metal Casting & Forest Trail",
            "image": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&auto=format&fit=crop",
            "duration": "4 Hours (Half Day)",
            "highlights": ["Hands-on lost-wax Dhokra bronze casting", "Foraged tribal herbal tea session", "Direct Maria craft cooperative purchase"],
            "slots": ["09:00 AM", "02:30 PM"],
            "badge": "PM-JUGA Tribal Craft Immersion"
        },
        "guide-002": {
            "title": "Hampi Vijayanagara Living Heritage & Coracle Trail",
            "image": "https://images.unsplash.com/photo-1600100397608-f010f421f1d1?w=800&auto=format&fit=crop",
            "duration": "3.5 Hours",
            "highlights": ["Ancient aqueducts and stone acoustics", "Tungabhadra coracle river crossing", "Uncrowded Vitthala bazaar sunset view"],
            "slots": ["06:30 AM", "03:45 PM"],
            "badge": "UNESCO Certified Heritage Walk"
        },
        "guide-003": {
            "title": "Spiti 1000-Year Monastery & Marine Fossil Walk",
            "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
            "duration": "5 Hours",
            "highlights": ["Ancient Tethys Ocean ammonite fossil exploration", "Langza Buddha statue high-altitude meditation", "Herbal seabuckthorn tea with village elder"],
            "slots": ["08:30 AM", "01:30 PM"],
            "badge": "High Altitude Tribal Trail"
        },
        "guide-004": {
            "title": "Old Jaipur Havelis & Hand-Block Print Masterclass",
            "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
            "duration": "3 Hours",
            "highlights": ["Centuries-old Shekhawati fresco restoration", "Natural vegetable dye hand-block printing on organic khadi", "Rooftop masala chai overlooking Hawa Mahal"],
            "slots": ["09:30 AM", "03:00 PM"],
            "badge": "Govt Certified Heritage Scout"
        },
        "guide-005": {
            "title": "Wayanad Rainforest Herbal Trail & Tribal Lore",
            "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop",
            "duration": "4 Hours",
            "highlights": ["Wild cardamom, pepper and endemic cinnamon identification", "Stingless bee honey extraction demonstration", "Kurichiya tribal archery and folk storytelling"],
            "slots": ["07:30 AM", "02:00 PM"],
            "badge": "PM-JUGA Ecological Immersion"
        },
        "guide-006": {
            "title": "Sacred Ganga Ghats & Ayurvedic Herb Walk",
            "image": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop",
            "duration": "3 Hours",
            "highlights": ["Ancient Himalayan medicinal flora walk", "Private quiet morning sand ghat pranayama", "Traditional brass singing bowl sound meditation"],
            "slots": ["06:00 AM", "04:30 PM"],
            "badge": "Vedic Wellness Certified"
        }
    }

    results = []
    for g in guides:
        meta = EXPERIENCE_METADATA.get(g.user_id, {
            "title": f"Authentic Regional Immersion with {g.full_name}",
            "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
            "duration": "3 Hours",
            "highlights": [f"Guided exploration of {g.district} by certified expert", f"Spoken in {g.languages_spoken}", "100% direct payment to local guide"],
            "slots": ["09:00 AM", "02:00 PM"],
            "badge": "Govt Certified Local Guide"
        })
        hourly = float(g.hourly_rate_inr or 300)
        total_price = int(hourly * 3.5)
        results.append({
            "id": g.guide_id,
            "guide_id": g.guide_id,
            "title": meta["title"],
            "hostName": g.full_name,
            "hostTitle": f"Certified Tour Guide ({g.license_number or 'Govt Registered'})",
            "location": f"{g.district}, {g.state}",
            "district": g.district,
            "state": g.state,
            "image": meta["image"],
            "rating": float(g.rating or 4.9),
            "reviewsCount": 24 + int((g.rating or 4.9) * 5),
            "duration": meta["duration"],
            "totalPrice": total_price,
            "pricePerPerson": int(hourly),
            "groupSize": "Small Group (Max 6 travelers)",
            "description": f"Immersive, eco-conscious regional experience led by {g.full_name}, official guide in {g.district}, {g.state}. Includes deep cultural context and heritage lore.",
            "highlights": meta["highlights"],
            "scheduleSlots": meta["slots"],
            "verificationBadge": meta["badge"],
            "phone": g.phone_number,
            "languages": g.languages_spoken
        })

    # Fetch active hourly token
    token_stmt = select(HourlySignalCache).where(
        HourlySignalCache.signal_type == "hourly_token",
        HourlySignalCache.signal_key == "active_token"
    )
    token_res = await db.execute(token_stmt)
    token_row = token_res.scalar_one_or_none()
    active_token = "tok_hourly_live"
    if token_row and token_row.payload_json:
        try:
            active_token = json.loads(token_row.payload_json).get("hourly_token", "tok_hourly_live")
        except Exception:
            pass

    # Fetch cached IHG curated experiences
    ihg_stmt = select(HourlySignalCache).where(
        HourlySignalCache.signal_type == "hidden_gems_curated",
        HourlySignalCache.signal_key == "ihg_experiences"
    )
    ihg_res = await db.execute(ihg_stmt)
    ihg_row = ihg_res.scalar_one_or_none()
    if ihg_row and ihg_row.payload_json:
        try:
            ihg_items = json.loads(ihg_row.payload_json)
            for idx, item in enumerate(ihg_items[:10]):
                pricing = item.get("pricing_inr") or 2500
                results.append({
                    "id": f"ihg-exp-{idx+1:03d}",
                    "guide_id": f"guide-ihg-{idx+1:03d}",
                    "title": item.get("name"),
                    "hostName": "India Hidden Gems Certified Specialist",
                    "hostTitle": f"Curated Expedition Leader (Verified: {active_token})",
                    "location": "Remote Island / Western Ghats / Tribal Belt",
                    "district": "Offbeat Circuit",
                    "state": "National Eco-Reserve",
                    "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
                    "rating": 4.95,
                    "reviewsCount": 48,
                    "duration": item.get("duration") or "Half Day",
                    "totalPrice": int(pricing),
                    "pricePerPerson": int(pricing * 0.8),
                    "groupSize": "Small Group (Max 8 travelers)",
                    "description": item.get("description") or f"Curated offbeat experience: {item.get('name')}.",
                    "highlights": item.get("highlights") or ["100% verified local hosts", "Zero mass-tourism interference", "Community-led benefit"],
                    "scheduleSlots": ["06:30 AM", "03:30 PM"],
                    "verificationBadge": "India Hidden Gems Verified",
                    "phone": "+91 84510 07321",
                    "languages": "English, Hindi, Regional",
                    "hourly_token": active_token
                })
        except Exception:
            pass

    return {
        "total": len(results),
        "hourly_token": active_token,
        "results": results
    }
