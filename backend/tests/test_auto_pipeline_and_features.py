import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.connection import async_session_maker
from app.database.models import Booking, SOSEvent, PipelineRun


@pytest.mark.asyncio
async def test_pipeline_status_and_trigger():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Pipeline status check
        status_res = await ac.get("/api/admin/pipeline/status")
        assert status_res.status_code == 200
        data = status_res.json()
        assert "schedule" in data
        assert "mae_inr" in data or data.get("status") in ("success", "idle", "running")

        # 2. Pipeline trigger refresh
        trigger_res = await ac.post("/api/admin/pipeline/trigger-refresh")
        assert trigger_res.status_code == 200
        trig_data = trigger_res.json()
        assert trig_data["status"] == "success"
        assert "mae_inr" in trig_data
        assert "r2_score" in trig_data
        assert trig_data["rows_used"] > 0


@pytest.mark.asyncio
async def test_routing_directions_and_fallback():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "start_lat": 26.9124,
            "start_lng": 75.7873,
            "end_lat": 26.9855,
            "end_lng": 75.8513
        }
        res = await ac.post("/api/routing/directions", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["distance_km"] > 0
        assert data["duration_min"] > 0
        assert len(data["coordinates"]) >= 2
        assert "google_maps_nav_url" in data
        assert "provider" in data


@pytest.mark.asyncio
async def test_booking_overlap_rejection_and_payment_failure():
    from app.database.connection import async_session_maker
    from app.database.models import Booking
    from sqlalchemy import delete

    async def _clean():
        async with async_session_maker() as session:
            await session.execute(
                delete(Booking).where(Booking.tourist_name.in_(["Ananya Roy", "Kabir Mehta", "Cancelled Traveler"]))
            )
            await session.commit()

    await _clean()

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            import time
            from datetime import date, timedelta
            offset_days = (int(time.time() * 1000) % 1000) + 200
            start = date.today() + timedelta(days=offset_days)
            in1 = start.strftime("%Y-%m-%d")
            out1 = (start + timedelta(days=5)).strftime("%Y-%m-%d")
            overlap_in = (start + timedelta(days=2)).strftime("%Y-%m-%d")
            overlap_out = (start + timedelta(days=4)).strftime("%Y-%m-%d")
            fail_in = (start + timedelta(days=10)).strftime("%Y-%m-%d")
            fail_out = (start + timedelta(days=12)).strftime("%Y-%m-%d")

            # Step 1: Create a confirmed booking
            booking1_payload = {
                "homestay_id": "da488d44-9a2a-4108-8d18-8218b7c73dee",
                "place_name": "Tirthan Valley River Retreat",
                "guest_name": "Ananya Roy",
                "guest_phone": "+91 98765 43210",
                "guest_email": "ananya@example.com",
                "check_in": in1,
                "check_out": out1,
                "amount": 6000.0,
                "razorpay_payment_id": f"pay_test_{int(time.time())}",
                "payment_status": "confirmed"
            }
            res1 = await ac.post("/api/checkout/direct-booking", json=booking1_payload)
            assert res1.status_code == 200
            b1_data = res1.json()
            assert b1_data["success"] is True
            assert b1_data["status"] == "confirmed"
            assert b1_data["booking_reference"].startswith("TS-")

            # Step 2: Attempt overlapping booking for the same property
            overlap_payload = {
                "homestay_id": "da488d44-9a2a-4108-8d18-8218b7c73dee",
                "place_name": "Tirthan Valley River Retreat",
                "guest_name": "Kabir Mehta",
                "guest_phone": "+91 98765 11111",
                "guest_email": "kabir@example.com",
                "check_in": overlap_in,
                "check_out": overlap_out,
                "amount": 2400.0,
                "razorpay_payment_id": f"pay_test_ovl_{int(time.time())}",
                "payment_status": "confirmed"
            }
            res_overlap = await ac.post("/api/checkout/direct-booking", json=overlap_payload)
            assert res_overlap.status_code == 400
            assert "already booked" in res_overlap.json()["detail"]

            # Step 3: Explicit payment failure path
            failed_payload = {
                "homestay_id": "da488d44-9a2a-4108-8d18-8218b7c73dee",
                "place_name": "Tirthan Valley River Retreat",
                "guest_name": "Cancelled Traveler",
                "guest_phone": "+91 98765 22222",
                "guest_email": "cancelled@example.com",
                "check_in": fail_in,
                "check_out": fail_out,
                "amount": 2400.0,
                "payment_status": "failed"
            }
            res_fail = await ac.post("/api/checkout/direct-booking", json=failed_payload)
            assert res_fail.status_code == 200
            fail_data = res_fail.json()
            assert fail_data["success"] is False
            assert fail_data["status"] == "failed"
    finally:
        await _clean()


@pytest.mark.asyncio
async def test_sos_dispatch_and_audit():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        sos_payload = {
            "traveler_name": "Vikram Malhotra",
            "phone": "+91 98111 22233",
            "latitude": 31.6425,
            "longitude": 77.3481,
            "location_name": "Banjar, Tirthan Valley, Himachal Pradesh",
            "details": "Lost near river trail in fading light, need local assistance"
        }
        res = await ac.post("/api/safety/sos", json=sos_payload)
        assert res.status_code == 200
        sos_data = res.json()
        assert sos_data["sos_event_id"].startswith("SOS-")
        assert sos_data["status"] == "active_emergency_logged"
        assert len(sos_data["emergency_contacts"]) >= 3
        # Check HP tourist police is matched
        contacts_str = " ".join(c["name"] + c["number"] for c in sos_data["emergency_contacts"])
        assert "112" in contacts_str
        assert "HP Tourist Police" in contacts_str or "1363" in contacts_str

        # Verify audit retrieval in admin
        admin_sos_res = await ac.get("/api/admin/sos/events")
        assert admin_sos_res.status_code == 200
        events = admin_sos_res.json()["events"]
        assert any(e["event_id"] == sos_data["sos_event_id"] for e in events)


@pytest.mark.asyncio
async def test_personalized_itinerary_grounding():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Spiritual itinerary
        res_spiritual = await ac.post("/api/itinerary/generate", json={
            "destination": "Rajasthan",
            "state": "Rajasthan",
            "days": 2,
            "budget": "budget",
            "pace": "moderate",
            "interests": ["Spiritual & Temples"]
        })
        assert res_spiritual.status_code in (200, 201)
        data_spiritual = res_spiritual.json()
        spiritual_stops = [s["destination_name"].lower() for d in data_spiritual["days_schedule"] for s in d["stops"]]

        # Nature itinerary
        res_nature = await ac.post("/api/itinerary/generate", json={
            "destination": "Rajasthan",
            "state": "Rajasthan",
            "days": 2,
            "budget": "moderate",
            "pace": "moderate",
            "interests": ["Nature & Wildlife"]
        })
        assert res_nature.status_code in (200, 201)
        data_nature = res_nature.json()
        nature_stops = [s["destination_name"].lower() for d in data_nature["days_schedule"] for s in d["stops"]]

        # They must be verifiably distinct sets of stops
        assert spiritual_stops != nature_stops
        # Spiritual stops should feature mandir/temple/dargah/ghat
        spiritual_text = " ".join(spiritual_stops)
        assert any(k in spiritual_text for k in ["temple", "mandir", "dargah", "ghat", "pushkar"])
        # Nature stops should feature park/lake/sanctuary
        nature_text = " ".join(nature_stops)
        assert any(k in nature_text for k in ["park", "lake", "sanctuary", "garden", "wildlife"])
