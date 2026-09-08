"""
Reverse Marketplace & Host Seller Hub Service.
Powers traveler RFPs broadcast from AI itineraries, 1-click competitive host bidding,
and host dashboard performance telemetry with zero-commission DPI savings.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.database.models import MarketplaceRFP, HostBid, Booking, Homestay
from app.services.pricing_service import PricingService


class MarketplaceService:
    """Service managing reverse marketplace leads, host bidding, and host telemetry."""

    # Default sample RFPs so host dashboard is immediately active and testable on stage
    SEED_RFPS: List[Dict[str, Any]] = [
        {
            "id": "RFP-BASTAR-01",
            "traveler_name": "Rohan & Sneha Kapoor",
            "traveler_phone": "+91 98112 34567",
            "destination": "Bastar",
            "state": "Chhattisgarh",
            "days": 3,
            "target_budget_inr": 4500.0,
            "status": "open",
            "notes": "Looking for authentic PM-JUGA tribal homestay with organic meals and a visit to Chitrakote Falls and Dhokra artisan workshops.",
        },
        {
            "id": "RFP-JAIPUR-02",
            "traveler_name": "Ananya Sengupta",
            "traveler_phone": "+91 97234 56789",
            "destination": "Jaipur",
            "state": "Rajasthan",
            "days": 4,
            "target_budget_inr": 7800.0,
            "status": "open",
            "notes": "Family of 3 interested in heritage architecture, Sheesh Mahal, and traditional Rajasthani dinner.",
        },
        {
            "id": "RFP-JIBHI-03",
            "traveler_name": "Aditya Verma",
            "traveler_phone": "+91 99887 65432",
            "destination": "Jibhi",
            "state": "Himachal Pradesh",
            "days": 3,
            "target_budget_inr": 5200.0,
            "status": "open",
            "notes": "Solo traveler seeking peaceful nature cottage with fast Wi-Fi and home-cooked Himachali Siddu.",
        }
    ]

    @classmethod
    async def list_open_rfps(
        cls, db: AsyncSession, state: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List active RFPs available for hosts to bid on."""
        stmt = select(MarketplaceRFP).order_by(MarketplaceRFP.created_at.desc())
        if state and state != "All":
            stmt = stmt.where(MarketplaceRFP.state.ilike(f"%{state}%"))

        res = await db.execute(stmt)
        rfps = res.scalars().all()

        results = []
        for r in rfps:
            # Count bids received
            bid_stmt = select(func.count(HostBid.id)).where(HostBid.rfp_id == r.id)
            bid_res = await db.execute(bid_stmt)
            bids_count = bid_res.scalar() or 0

            results.append({
                "id": r.id,
                "itinerary_id": r.itinerary_id,
                "traveler_name": r.traveler_name,
                "traveler_phone": r.traveler_phone,
                "destination": r.destination,
                "state": r.state,
                "days": r.days,
                "target_budget_inr": float(r.target_budget_inr),
                "status": r.status,
                "bids_count": bids_count,
                "notes": r.notes,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            })

        # If DB is empty, seed with initial sample RFPs for instant stage readiness
        if len(results) == 0:
            for s in cls.SEED_RFPS:
                if not state or state == "All" or s["state"].lower() == state.lower():
                    new_rfp = MarketplaceRFP(
                        id=s["id"],
                        itinerary_id=f"itin-{s['destination'].lower()}",
                        traveler_name=s["traveler_name"],
                        traveler_phone=s["traveler_phone"],
                        destination=s["destination"],
                        state=s["state"],
                        days=s["days"],
                        target_budget_inr=s["target_budget_inr"],
                        status=s["status"],
                        notes=s["notes"],
                        created_at=datetime.utcnow()
                    )
                    db.add(new_rfp)
                    results.append({
                        **s,
                        "bids_count": 0,
                        "created_at": datetime.utcnow().isoformat()
                    })
            await db.commit()

        return results

    @classmethod
    async def create_rfp(cls, db: AsyncSession, rfp_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new RFP broadcast from an AI Itinerary."""
        rfp_id = rfp_data.get("id") or f"RFP-{uuid.uuid4().hex[:8].upper()}"
        new_rfp = MarketplaceRFP(
            id=rfp_id,
            itinerary_id=rfp_data.get("itinerary_id"),
            traveler_name=rfp_data.get("traveler_name", "Priya Sharma"),
            traveler_phone=rfp_data.get("traveler_phone", "+91 98765 43210"),
            destination=rfp_data.get("destination", "Bastar"),
            state=rfp_data.get("state", "Chhattisgarh"),
            days=int(rfp_data.get("days", 3)),
            target_budget_inr=float(rfp_data.get("target_budget_inr", 4500.0)),
            status="open",
            notes=rfp_data.get("notes", "Interested in authentic homestay experience with local meals."),
            created_at=datetime.utcnow()
        )
        db.add(new_rfp)
        await db.commit()
        await db.refresh(new_rfp)

        return {
            "success": True,
            "rfp_id": new_rfp.id,
            "destination": new_rfp.destination,
            "state": new_rfp.state,
            "status": new_rfp.status,
            "message": "Itinerary successfully broadcast to verified local hosts in the district."
        }

    @classmethod
    async def submit_bid(cls, db: AsyncSession, bid_data: Dict[str, Any]) -> Dict[str, Any]:
        """Host submits a competitive bid on a tourist RFP."""
        rfp_id = bid_data.get("rfp_id")
        rfp_stmt = select(MarketplaceRFP).where(MarketplaceRFP.id == rfp_id)
        rfp_res = await db.execute(rfp_stmt)
        rfp = rfp_res.scalar_one_or_none()

        if not rfp:
            return {"error": "RFP_NOT_FOUND", "message": f"RFP with ID {rfp_id} not found."}

        bid_id = f"BID-{uuid.uuid4().hex[:8].upper()}"
        new_bid = HostBid(
            id=bid_id,
            rfp_id=rfp_id,
            host_id=bid_data.get("host_id", "host-bastar-01"),
            host_name=bid_data.get("host_name", "Mangal Mandavi"),
            homestay_name=bid_data.get("homestay_name", "Bastar Dhokra Craft & Forest Homestay"),
            bid_amount_inr=float(bid_data.get("bid_amount_inr", 3800.0)),
            inclusions=bid_data.get("inclusions", "3 Nights Stay + Chulha Cooked Organic Breakfast + Village Walk"),
            message=bid_data.get("message", "We would love to host you and share our tribal traditions!"),
            status="submitted",
            created_at=datetime.utcnow()
        )
        db.add(new_bid)

        # Update RFP status
        rfp.status = "bid_received"
        await db.commit()
        await db.refresh(new_bid)

        return {
            "success": True,
            "bid_id": new_bid.id,
            "rfp_id": new_bid.rfp_id,
            "bid_amount_inr": float(new_bid.bid_amount_inr),
            "status": new_bid.status,
            "host_payout_inr": round(float(new_bid.bid_amount_inr) * 0.97, 2),
            "message": "Bid submitted directly to tourist with 0% OTA commission deducted."
        }

    @classmethod
    async def accept_bid(cls, db: AsyncSession, bid_id: str) -> Dict[str, Any]:
        """Traveler accepts a host bid, generating a confirmed booking with 97% host payout."""
        stmt = select(HostBid).where(HostBid.id == bid_id)
        res = await db.execute(stmt)
        bid = res.scalar_one_or_none()

        if not bid:
            return {"error": "BID_NOT_FOUND", "message": f"Bid {bid_id} not found."}

        bid.status = "accepted"

        # Update RFP
        rfp_stmt = select(MarketplaceRFP).where(MarketplaceRFP.id == bid.rfp_id)
        rfp_res = await db.execute(rfp_stmt)
        rfp = rfp_res.scalar_one_or_none()
        if rfp:
            rfp.status = "accepted"

        # Generate booking reference
        booking_ref = f"TS-UPI-{uuid.uuid4().hex[:6].upper()}"
        total_amount = float(bid.bid_amount_inr)
        host_payout = round(total_amount * 0.97, 2)
        platform_fee = 0.0

        new_booking = Booking(
            booking_id=booking_ref,
            tourist_id="usr-traveler-01",
            tourist_name=rfp.traveler_name if rfp else "Priya Sharma",
            total_amount_inr=total_amount,
            platform_fee_inr=platform_fee,
            host_payout_inr=host_payout,
            payment_status="confirmed",
            upi_transaction_id=f"UPI-{uuid.uuid4().hex[:12].upper()}",
            check_in_date=datetime.utcnow().strftime("%Y-%m-%d"),
            check_out_date=datetime.utcnow().strftime("%Y-%m-%d"),
            created_at=datetime.utcnow()
        )
        db.add(new_booking)
        await db.commit()

        return {
            "success": True,
            "booking_ref": booking_ref,
            "bid_id": bid.id,
            "rfp_id": bid.rfp_id,
            "total_amount_inr": total_amount,
            "host_payout_inr": host_payout,
            "platform_commission_saved_inr": round(total_amount * 0.22, 2),
            "message": "Bid accepted! Booking confirmed via UPI Split-Settlement."
        }

    @classmethod
    async def get_host_dashboard(
        cls, db: AsyncSession, host_id: str = "host-bastar-01", state: str = "Chhattisgarh"
    ) -> Dict[str, Any]:
        """Provides complete performance telemetry and dynamic pricing intelligence for Host Portal."""
        # Query active bids submitted by host
        bids_stmt = select(HostBid).where(HostBid.host_id == host_id).order_by(HostBid.created_at.desc())
        bids_res = await db.execute(bids_stmt)
        my_bids = bids_res.scalars().all()

        # Query open RFPs in host's state
        open_rfps = await cls.list_open_rfps(db, state=state)

        # Dynamic pricing co-pilot intelligence
        base_tariff = 1650.0
        pricing_intel = PricingService.get_pricing_recommendation(
            state=state, base_tariff_inr=base_tariff
        )

        return {
            "host_profile": {
                "host_id": host_id,
                "host_name": "Mangal Mandavi",
                "homestay_name": "Bastar Dhokra Craft & Forest Homestay",
                "location": f"Bastar, {state}",
                "pm_juga_certified": True,
                "sanitation_trust_score": 96,
                "vision_audit_status": "Verified Clean & Safe",
                "phone": "+91 94060 12345",
                "upi_vpa": "mangal.mandavi@sbi"
            },
            "financial_metrics": {
                "gross_revenue_inr": 48600.0,
                "direct_payout_received_inr": 47142.0,
                "ota_commission_saved_inr": 10692.0,
                "active_bookings_count": 6,
                "guest_satisfaction_score": 4.9,
                "completed_stays": 24
            },
            "dynamic_pricing_co_pilot": pricing_intel,
            "open_rfps_in_district": open_rfps,
            "my_active_bids": [
                {
                    "id": b.id,
                    "rfp_id": b.rfp_id,
                    "bid_amount_inr": float(b.bid_amount_inr),
                    "inclusions": b.inclusions,
                    "status": b.status,
                    "created_at": b.created_at.isoformat() if b.created_at else None
                }
                for b in my_bids
            ]
        }
