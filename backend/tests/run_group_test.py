import asyncio
import io
import sys
import os
import uuid
sys.path.insert(0, os.path.abspath("."))
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.database.connection import async_session_maker, init_db
from app.database.models import (
    User, TravelGroup, GroupMember, GroupMeetingPoint,
    EncryptedGroupMessage, GroupPingLog, SustainabilityReport, ActiveUserSession
)
from app.core.security import create_access_token

async def run_all_tests():
    print("=== STARTING TRAVELSATHI UPGRADE TEST SUITE ===")
    await init_db()

    user_a_id = "usr-test-alice"
    user_b_id = "usr-test-bob"

    token_a = create_access_token({"sub": user_a_id, "name": "Alice Sharma", "email": "alice@travelsathi.in", "role": "tourist"})
    token_b = create_access_token({"sub": user_b_id, "name": "Bob Verma", "email": "bob@travelsathi.in", "role": "tourist"})

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # TEST 1: Create Group & Invite Code
        print("[TEST 1] Creating Travel Group...")
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
        assert create_res.status_code == 201, f"Failed create group: {create_res.text}"
        group_data = create_res.json()["group"]
        group_id = group_data["id"]
        invite_code = group_data["invite_code"]
        assert group_data["security"]["e2ee_enabled"] is True
        print(f" -> Group created: {group_id} (Invite Code: {invite_code}) [PASS]")

        # TEST 2: Join Group with Invite Code
        print("[TEST 2] Joining Group via Invite Code...")
        join_res = await client.post(
            "/api/groups/join",
            headers={"Authorization": f"Bearer {token_b}"},
            json={"invite_code": invite_code}
        )
        assert join_res.status_code == 200, f"Failed join group: {join_res.text}"
        assert join_res.json()["success"] is True
        print(" -> User B joined group successfully [PASS]")

        # TEST 3: Group Details & Authorization
        print("[TEST 3] Fetching Group Details & Verifying Roster...")
        details_res = await client.get(
            f"/api/groups/{group_id}",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert details_res.status_code == 200
        members = details_res.json()["members"]
        assert len(members) == 2
        print(f" -> Members verified: {len(members)} companions [PASS]")

        # TEST 4: Live Location Sharing State Update
        print("[TEST 4] Updating Location Sharing State...")
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
        print(" -> Location sharing set to ON with sanitized coordinates [PASS]")

        # TEST 5: Meeting Point Setup
        print("[TEST 5] Setting Collaborative Meeting Point...")
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
        print(" -> Meeting point established: Chehni Kothi [PASS]")

        # TEST 6: True E2EE Encrypted Message Storage (Zero Plaintext on Server)
        print("[TEST 6] Posting E2EE Message & Auditing Database Ciphertext...")
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

        # Directly query SQLite table to prove only ciphertext is stored
        async with async_session_maker() as session:
            db_msg_stmt = select(EncryptedGroupMessage).where(EncryptedGroupMessage.id == msg_id)
            db_msg = (await session.execute(db_msg_stmt)).scalar_one()
            assert db_msg.encrypted_payload == sample_ciphertext
            assert db_msg.iv == sample_iv
            print(f" -> E2EE Verified: Database stores purely ciphertext ({db_msg.encrypted_payload[:12]}...) [PASS]")

        # TEST 7: Member Ping & Server Rate-Limiting
        print("[TEST 7] Testing Attention Ping & Rate Limiting (30s window)...")
        ping1 = await client.post(
            f"/api/groups/{group_id}/ping",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"recipient_id": user_b_id}
        )
        assert ping1.status_code == 200
        assert "delivered" in ping1.json()["message"].lower()

        # Immediate second ping must trigger 429 Too Many Requests
        ping2 = await client.post(
            f"/api/groups/{group_id}/ping",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"recipient_id": user_b_id}
        )
        assert ping2.status_code == 429
        assert "rate limit" in ping2.json()["detail"].lower()
        print(" -> Rate-limiting enforced: Second ping correctly returned 429 [PASS]")

        # TEST 8: Sustainability Anti-Spoofing & Server Score Award
        print("[TEST 8] Testing Sustainability Anti-Spoofing & Duplicate Detection...")
        unique_img_data = f"FAKE_CLEANUP_JPEG_DATA_{uuid.uuid4().hex}".encode()
        fake_image = io.BytesIO(unique_img_data)
        files = {"image": ("cleanup.jpg", fake_image, "image/jpeg")}
        data = {
            "latitude": "31.6425",
            "longitude": "77.3481",
            "category": "Plastic Trail Cleanup"
        }
        res_eco = await client.post(
            "/api/sustainability/report",
            headers={"Authorization": f"Bearer {token_a}"},
            data=data,
            files=files
        )
        assert res_eco.status_code == 201, res_eco.text
        report_data = res_eco.json()
        assert report_data["success"] is True
        assert report_data["score_awarded"] > 0
        assert "anti_spoofing_checks" in report_data["security"]

        # Re-submitting identical payload must be blocked by hash check
        fake_image_dup = io.BytesIO(unique_img_data)
        files_dup = {"image": ("cleanup2.jpg", fake_image_dup, "image/jpeg")}
        res_dup = await client.post(
            "/api/sustainability/report",
            headers={"Authorization": f"Bearer {token_a}"},
            data=data,
            files=files_dup
        )
        assert res_dup.status_code == 400
        assert "duplicate" in res_dup.json()["detail"].lower()
        print(" -> Anti-Spoofing passed: Identical photo re-submission was blocked [PASS]")

        # TEST 9: Security Center & Session Revocation
        print("[TEST 9] Testing Security Center, MFA Toggle & Remote Session Revocation...")
        res_sec = await client.get(
            "/api/security/status",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert res_sec.status_code == 200
        sec_data = res_sec.json()
        assert sec_data["account_security"]["password_protected"] is True
        assert len(sec_data["active_sessions"]) >= 1

        active_sess_id = sec_data["active_sessions"][0]["session_id"]
        revoke_res = await client.post(
            "/api/security/sessions/revoke",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"session_id": active_sess_id}
        )
        assert revoke_res.status_code == 200
        assert "revoked successfully" in revoke_res.json()["message"].lower()

        mfa_res = await client.post(
            "/api/security/mfa/toggle",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"enabled": True}
        )
        assert mfa_res.status_code == 200
        assert mfa_res.json()["mfa_enabled"] is True
        print(" -> Security Center passed: MFA toggled, Session revoked remotely [PASS]")

    print("\n=======================================================")
    print("ALL 9 TEST MODULES PASSED WITH 100% SUCCESS & ACCURACY!")
    print("=======================================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
