import io
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.database.connection import async_session_maker
from app.database.models import (
    User, TravelGroup, GroupMember, GroupMeetingPoint,
    EncryptedGroupMessage, GroupPingLog, SustainabilityReport, ActiveUserSession
)
from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_group_travel_and_e2ee_flow():
    user_a_id = "usr-test-alice"
    user_b_id = "usr-test-bob"

    token_a = create_access_token({"sub": user_a_id, "name": "Alice Sharma", "email": "alice@travelsathi.in", "role": "tourist"})
    token_b = create_access_token({"sub": user_b_id, "name": "Bob Verma", "email": "bob@travelsathi.in", "role": "tourist"})

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # A. Create a new Travel Group
        create_res = await client.post(
            "/api/groups",
            headers={"Authorization": f"Bearer {token_a}"},
            json={
                "name": "Himalayan Ridge Circuit",
                "destination": "Tirthan Valley, HP",
                "start_date": "2026-10-14",
                "end_date": "2026-10-18"
            }
        )
        assert create_res.status_code == 201, create_res.text
        group_data = create_res.json()["group"]
        group_id = group_data["id"]
        invite_code = group_data["invite_code"]
        assert group_data["security"]["e2ee_enabled"] is True

        # B. User B joins via invite code
        join_res = await client.post(
            "/api/groups/join",
            headers={"Authorization": f"Bearer {token_b}"},
            json={"invite_code": invite_code}
        )
        assert join_res.status_code == 200, join_res.text
        assert join_res.json()["success"] is True

        # C. Retrieve group details
        details_res = await client.get(
            f"/api/groups/{group_id}",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert details_res.status_code == 200
        members = details_res.json()["members"]
        assert len(members) == 2

        # D. Update location sharing state
        loc_res = await client.post(
            f"/api/groups/{group_id}/location",
            headers={"Authorization": f"Bearer {token_a}"},
            json={
                "state": "ON",
                "latitude": 31.6425,
                "longitude": 77.3481,
                "battery_level": 89
            }
        )
        assert loc_res.status_code == 200
        assert loc_res.json()["state"] == "ON"

        # E. Collaborative Meeting Point
        mp_res = await client.post(
            f"/api/groups/{group_id}/meeting-point",
            headers={"Authorization": f"Bearer {token_a}"},
            json={
                "title": "Chehni Kothi Ancient Granary",
                "latitude": 31.6440,
                "longitude": 77.3502,
                "description": "Gather near traditional Kathkuni timber courtyard"
            }
        )
        assert mp_res.status_code == 200
        assert mp_res.json()["meeting_point"]["title"] == "Chehni Kothi Ancient Granary"

        # F. Post True E2EE Encrypted Message
        sample_ciphertext = "8vXkL1mNpQ9w2Z4T90AkqPlm=="
        sample_iv = "aW5pdGlhbGl6YXRpb252ZWN0b3I="
        msg_res = await client.post(
            f"/api/groups/{group_id}/messages",
            headers={"Authorization": f"Bearer {token_a}"},
            json={
                "message_type": "text",
                "encrypted_payload": sample_ciphertext,
                "iv": sample_iv,
                "sender_key_fingerprint": "fp-alice-key-1"
            }
        )
        assert msg_res.status_code == 201
        msg_id = msg_res.json()["message_id"]

        # G. CRITICAL E2EE AUDIT: Verify Database stores ONLY ciphertext and NOT plaintext!
        async with async_session_maker() as session:
            db_msg_stmt = select(EncryptedGroupMessage).where(EncryptedGroupMessage.id == msg_id)
            db_msg = (await session.execute(db_msg_stmt)).scalar_one()
            assert db_msg.encrypted_payload == sample_ciphertext
            assert db_msg.iv == sample_iv

        # H. Ping Member & Enforce Rate Limiting
        ping1 = await client.post(
            f"/api/groups/{group_id}/ping",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"recipient_id": user_b_id}
        )
        assert ping1.status_code == 200
        assert "delivered" in ping1.json()["message"].lower()

        # Immediate second ping must be rejected with 429 Too Many Requests
        ping2 = await client.post(
            f"/api/groups/{group_id}/ping",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"recipient_id": user_b_id}
        )
        assert ping2.status_code == 429
        assert "rate limit" in ping2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_sustainability_and_anti_spoofing():
    user_id = "usr-eco-tester"
    token = create_access_token({"sub": user_id, "name": "Eco Scout", "role": "tourist"})

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        fake_image = io.BytesIO(b"FAKE_CLEANUP_JPEG_DATA_ABC_1234567890")
        files = {"image": ("cleanup.jpg", fake_image, "image/jpeg")}
        data = {
            "latitude": "31.6425",
            "longitude": "77.3481",
            "category": "Plastic Trail Cleanup"
        }

        res = await client.post(
            "/api/sustainability/report",
            headers={"Authorization": f"Bearer {token}"},
            data=data,
            files=files
        )
        assert res.status_code == 201, res.text
        report_data = res.json()
        assert report_data["success"] is True
        assert report_data["score_awarded"] > 0
        assert "anti_spoofing_checks" in report_data["security"]

        # Duplicate submission with identical image payload must be blocked
        fake_image_dup = io.BytesIO(b"FAKE_CLEANUP_JPEG_DATA_ABC_1234567890")
        files_dup = {"image": ("cleanup2.jpg", fake_image_dup, "image/jpeg")}
        res_dup = await client.post(
            "/api/sustainability/report",
            headers={"Authorization": f"Bearer {token}"},
            data=data,
            files=files_dup
        )
        assert res_dup.status_code == 400
        assert "duplicate" in res_dup.json()["detail"].lower()


@pytest.mark.asyncio
async def test_security_center_and_session_revocation():
    user_id = "usr-sec-tester"
    token = create_access_token({"sub": user_id, "name": "Security Audit User", "role": "tourist"})

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get(
            "/api/security/status",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        sec_data = res.json()
        assert sec_data["account_security"]["password_protected"] is True
        assert len(sec_data["active_sessions"]) >= 1

        active_sess_id = sec_data["active_sessions"][0]["session_id"]

        revoke_res = await client.post(
            "/api/security/sessions/revoke",
            headers={"Authorization": f"Bearer {token}"},
            json={"session_id": active_sess_id}
        )
        assert revoke_res.status_code == 200
        assert "revoked successfully" in revoke_res.json()["message"].lower()

        mfa_res = await client.post(
            "/api/security/mfa/toggle",
            headers={"Authorization": f"Bearer {token}"},
            json={"enabled": True}
        )
        assert mfa_res.status_code == 200
        assert mfa_res.json()["mfa_enabled"] is True
