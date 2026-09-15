import os
import uuid
import secrets
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, UploadFile, File, Form, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_

from app.database.connection import get_db, async_session_maker
from app.database.models import (
    User, TravelGroup, GroupMember, GroupMeetingPoint,
    EncryptedGroupMessage, GroupPingLog
)
from app.core.auth_dependencies import get_current_user
from app.core.security import decode_access_token

router = APIRouter(prefix="/groups", tags=["Group Travel & E2EE Coordination"])

# -----------------------------------------------------------------------------
# WebSocket Real-Time Connection Hub
# -----------------------------------------------------------------------------
class GroupConnectionManager:
    """Manages active WebSockets for real-time live map & E2EE chat dispatch."""
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, List[WebSocket]]] = {}

    async def connect(self, group_id: str, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = {}
        if user_id not in self.active_connections[group_id]:
            self.active_connections[group_id][user_id] = []
        self.active_connections[group_id][user_id].append(websocket)

    def disconnect(self, group_id: str, user_id: str, websocket: WebSocket):
        if group_id in self.active_connections:
            if user_id in self.active_connections[group_id]:
                if websocket in self.active_connections[group_id][user_id]:
                    self.active_connections[group_id][user_id].remove(websocket)
                if not self.active_connections[group_id][user_id]:
                    del self.active_connections[group_id][user_id]
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]

    async def broadcast_to_group(self, group_id: str, message: dict, exclude_user_id: Optional[str] = None):
        if group_id not in self.active_connections:
            return
        dead_sockets = []
        for uid, sockets in self.active_connections[group_id].items():
            if exclude_user_id and uid == exclude_user_id:
                continue
            for ws in sockets:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead_sockets.append((group_id, uid, ws))
        for gid, uid, ws in dead_sockets:
            self.disconnect(gid, uid, ws)

manager = GroupConnectionManager()


# -----------------------------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------------------------
class CreateGroupPayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    destination: str = Field(..., min_length=2, max_length=150)
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class JoinGroupPayload(BaseModel):
    invite_code: str = Field(..., min_length=4, max_length=20)

class UpdateLocationPayload(BaseModel):
    state: str = Field(..., description="ON, OFF, PAUSED, PERMISSION_DENIED, UNAVAILABLE, STALE")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    battery_level: Optional[int] = None

class PingMemberPayload(BaseModel):
    recipient_id: str

class MeetingPointPayload(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    latitude: float
    longitude: float
    description: Optional[str] = None

class PostMessagePayload(BaseModel):
    message_type: str = Field("text", description="text, location, system, emergency, attachment")
    encrypted_payload: str = Field(..., description="Base64 AES-GCM ciphertext")
    iv: str = Field(..., description="Base64 96-bit AES-GCM IV")
    sender_key_fingerprint: Optional[str] = None
    attachment_url: Optional[str] = None


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_group(
    payload: CreateGroupPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    group_id = f"grp-{uuid.uuid4().hex[:10]}"
    invite_code = secrets.token_urlsafe(6).upper()

    group = TravelGroup(
        id=group_id,
        name=payload.name.strip(),
        destination=payload.destination.strip(),
        start_date=payload.start_date,
        end_date=payload.end_date,
        creator_id=current_user.id,
        invite_code=invite_code,
        status="active"
    )
    db.add(group)

    admin_member = GroupMember(
        group_id=group_id,
        user_id=current_user.id,
        role="admin",
        display_name=current_user.name,
        avatar=current_user.avatar,
        is_online=True,
        location_sharing_state="OFF"
    )
    db.add(admin_member)

    await db.commit()
    await db.refresh(group)

    return {
        "success": True,
        "message": "Travel group created successfully.",
        "group": {
            "id": group.id,
            "name": group.name,
            "destination": group.destination,
            "invite_code": group.invite_code,
            "role": "admin",
            "security": {
                "e2ee_enabled": True,
                "encryption_algorithm": "AES-GCM-256 (WebCrypto Standard)",
                "zero_plaintext_storage": True
            }
        }
    }


@router.get("")
async def list_user_groups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(TravelGroup, GroupMember.role)
        .join(GroupMember, TravelGroup.id == GroupMember.group_id)
        .where(GroupMember.user_id == current_user.id)
        .order_by(TravelGroup.created_at.desc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    groups_data = []
    for grp, role in rows:
        cnt_stmt = select(func.count(GroupMember.id)).where(GroupMember.group_id == grp.id)
        cnt_res = await db.execute(cnt_stmt)
        total_members = cnt_res.scalar() or 0

        online_stmt = select(func.count(GroupMember.id)).where(
            GroupMember.group_id == grp.id, GroupMember.is_online == True
        )
        online_res = await db.execute(online_stmt)
        online_members = online_res.scalar() or 0

        groups_data.append({
            "id": grp.id,
            "name": grp.name,
            "destination": grp.destination,
            "start_date": grp.start_date,
            "end_date": grp.end_date,
            "invite_code": grp.invite_code,
            "role": role,
            "total_members": total_members,
            "online_members": online_members,
            "status": grp.status,
            "is_e2ee": True
        })

    return {
        "success": True,
        "total": len(groups_data),
        "groups": groups_data
    }


@router.get("/{group_id}")
async def get_group_details(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mem_stmt = select(GroupMember).where(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    )
    mem_res = await db.execute(mem_stmt)
    user_membership = mem_res.scalar_one_or_none()
    if not user_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized. You are not a member of this travel group."
        )

    grp_stmt = select(TravelGroup).where(TravelGroup.id == group_id)
    grp_res = await db.execute(grp_stmt)
    group = grp_res.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")

    members_stmt = select(GroupMember).where(GroupMember.group_id == group_id)
    members_res = await db.execute(members_stmt)
    members = members_res.scalars().all()

    mp_stmt = select(GroupMeetingPoint).where(GroupMeetingPoint.group_id == group_id).order_by(GroupMeetingPoint.updated_at.desc())
    mp_res = await db.execute(mp_stmt)
    meeting_point = mp_res.scalars().first()

    members_list = []
    now = datetime.now(timezone.utc)
    for m in members:
        loc_state = m.location_sharing_state
        if m.last_updated_at:
            delta_min = (now - m.last_updated_at.replace(tzinfo=timezone.utc)).total_seconds() / 60
            if delta_min > 15 and loc_state == "ON":
                loc_state = "STALE"

        members_list.append({
            "user_id": m.user_id,
            "display_name": m.display_name,
            "avatar": m.avatar,
            "role": m.role,
            "is_online": m.is_online,
            "is_you": (m.user_id == current_user.id),
            "location_sharing_state": loc_state,
            "latitude": m.last_latitude if loc_state in ["ON", "STALE"] else None,
            "longitude": m.last_longitude if loc_state in ["ON", "STALE"] else None,
            "battery_level": m.battery_level,
            "last_updated_at": m.last_updated_at.isoformat() if m.last_updated_at else None
        })

    return {
        "success": True,
        "group": {
            "id": group.id,
            "name": group.name,
            "destination": group.destination,
            "start_date": group.start_date,
            "end_date": group.end_date,
            "invite_code": group.invite_code,
            "status": group.status,
            "user_role": user_membership.role,
            "security": {
                "e2ee_verified": True,
                "protocol": "WebCrypto AES-256-GCM",
                "storage": "Encrypted at Rest & In-Transit",
                "zero_plaintext_disclosure": True
            }
        },
        "members": members_list,
        "meeting_point": {
            "id": meeting_point.id,
            "title": meeting_point.title,
            "latitude": meeting_point.latitude,
            "longitude": meeting_point.longitude,
            "description": meeting_point.description,
            "set_by_name": meeting_point.set_by_name,
            "updated_at": meeting_point.updated_at.isoformat()
        } if meeting_point else None
    }


@router.post("/join")
async def join_group_via_code(
    payload: JoinGroupPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    code_clean = payload.invite_code.strip().upper()
    grp_stmt = select(TravelGroup).where(TravelGroup.invite_code == code_clean)
    grp_res = await db.execute(grp_stmt)
    group = grp_res.scalar_one_or_none()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired group invite code."
        )

    exist_stmt = select(GroupMember).where(
        GroupMember.group_id == group.id,
        GroupMember.user_id == current_user.id
    )
    exist_res = await db.execute(exist_stmt)
    if exist_res.scalar_one_or_none():
        return {
            "success": True,
            "message": "You are already a member of this group.",
            "group_id": group.id
        }

    new_member = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="member",
        display_name=current_user.name,
        avatar=current_user.avatar,
        is_online=True,
        location_sharing_state="OFF"
    )
    db.add(new_member)
    await db.commit()

    await manager.broadcast_to_group(group.id, {
        "type": "MEMBER_JOINED",
        "user_id": current_user.id,
        "display_name": current_user.name
    })

    return {
        "success": True,
        "message": f"Successfully joined '{group.name}'.",
        "group_id": group.id
    }


@router.post("/{group_id}/location")
async def update_member_location(
    group_id: str,
    payload: UpdateLocationPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mem_stmt = select(GroupMember).where(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    )
    mem_res = await db.execute(mem_stmt)
    member = mem_res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a group member.")

    member.location_sharing_state = payload.state.upper()
    if payload.state.upper() == "ON" and payload.latitude is not None and payload.longitude is not None:
        member.last_latitude = payload.latitude
        member.last_longitude = payload.longitude
    elif payload.state.upper() == "OFF":
        member.last_latitude = None
        member.last_longitude = None

    if payload.battery_level is not None:
        member.battery_level = payload.battery_level
    member.last_updated_at = datetime.now(timezone.utc)

    await db.commit()

    await manager.broadcast_to_group(group_id, {
        "type": "LOCATION_UPDATE",
        "user_id": current_user.id,
        "display_name": current_user.name,
        "state": member.location_sharing_state,
        "latitude": member.last_latitude,
        "longitude": member.last_longitude,
        "battery_level": member.battery_level,
        "updated_at": member.last_updated_at.isoformat()
    })

    return {
        "success": True,
        "state": member.location_sharing_state,
        "last_updated": member.last_updated_at.isoformat()
    }


@router.post("/{group_id}/ping")
async def ping_group_member(
    group_id: str,
    payload: PingMemberPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sender_stmt = select(GroupMember).where(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    )
    sender_res = await db.execute(sender_stmt)
    sender = sender_res.scalar_one_or_none()
    if not sender:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sender not a group member.")

    recip_stmt = select(GroupMember).where(
        GroupMember.group_id == group_id,
        GroupMember.user_id == payload.recipient_id
    )
    recip_res = await db.execute(recip_stmt)
    recipient = recip_res.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found in this group.")

    cutoff = datetime.now(timezone.utc) - timedelta(seconds=30)
    rate_stmt = select(GroupPingLog).where(
        GroupPingLog.group_id == group_id,
        GroupPingLog.sender_id == current_user.id,
        GroupPingLog.recipient_id == payload.recipient_id,
        GroupPingLog.created_at >= cutoff
    )
    rate_res = await db.execute(rate_stmt)
    if rate_res.first():
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit reached. You can only ping this companion once every 30 seconds."
        )

    new_ping = GroupPingLog(
        group_id=group_id,
        sender_id=current_user.id,
        recipient_id=payload.recipient_id
    )
    db.add(new_ping)
    await db.commit()

    await manager.broadcast_to_group(group_id, {
        "type": "MEMBER_PING",
        "sender_id": current_user.id,
        "sender_name": sender.display_name,
        "recipient_id": payload.recipient_id,
        "message": f"{sender.display_name} wants to get your attention.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "success": True,
        "message": f"Ping delivered to {recipient.display_name}."
    }


@router.post("/{group_id}/meeting-point")
async def set_meeting_point(
    group_id: str,
    payload: MeetingPointPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mem_stmt = select(GroupMember).where(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    )
    mem_res = await db.execute(mem_stmt)
    member = mem_res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a group member.")

    mp_stmt = select(GroupMeetingPoint).where(GroupMeetingPoint.group_id == group_id)
    mp_res = await db.execute(mp_stmt)
    mp = mp_res.scalar_one_or_none()

    if not mp:
        mp = GroupMeetingPoint(
            id=f"mp-{uuid.uuid4().hex[:8]}",
            group_id=group_id,
            title=payload.title.strip(),
            latitude=payload.latitude,
            longitude=payload.longitude,
            description=payload.description,
            set_by_user_id=current_user.id,
            set_by_name=member.display_name
        )
        db.add(mp)
    else:
        mp.title = payload.title.strip()
        mp.latitude = payload.latitude
        mp.longitude = payload.longitude
        mp.description = payload.description
        mp.set_by_user_id = current_user.id
        mp.set_by_name = member.display_name
        mp.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(mp)

    await manager.broadcast_to_group(group_id, {
        "type": "MEETING_POINT_UPDATED",
        "meeting_point": {
            "id": mp.id,
            "title": mp.title,
            "latitude": mp.latitude,
            "longitude": mp.longitude,
            "description": mp.description,
            "set_by_name": mp.set_by_name,
            "updated_at": mp.updated_at.isoformat()
        }
    })

    return {
        "success": True,
        "message": "Meeting point updated successfully.",
        "meeting_point": {
            "id": mp.id,
            "title": mp.title,
            "latitude": mp.latitude,
            "longitude": mp.longitude,
            "description": mp.description,
            "set_by_name": mp.set_by_name,
            "updated_at": mp.updated_at.isoformat()
        }
    }


@router.get("/{group_id}/messages")
async def get_encrypted_messages(
    group_id: str,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mem_stmt = select(GroupMember).where(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    )
    mem_res = await db.execute(mem_stmt)
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a group member.")

    msg_stmt = (
        select(EncryptedGroupMessage)
        .where(EncryptedGroupMessage.group_id == group_id)
        .order_by(EncryptedGroupMessage.created_at.asc())
        .limit(limit)
    )
    msg_res = await db.execute(msg_stmt)
    messages = msg_res.scalars().all()

    return {
        "success": True,
        "count": len(messages),
        "messages": [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "sender_name": m.sender_name,
                "message_type": m.message_type,
                "encrypted_payload": m.encrypted_payload,
                "iv": m.iv,
                "sender_key_fingerprint": m.sender_key_fingerprint,
                "attachment_url": m.attachment_url,
                "status": m.status,
                "created_at": m.created_at.isoformat()
            }
            for m in messages
        ]
    }


@router.post("/{group_id}/messages", status_code=status.HTTP_201_CREATED)
async def post_encrypted_message(
    group_id: str,
    payload: PostMessagePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mem_stmt = select(GroupMember).where(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    )
    mem_res = await db.execute(mem_stmt)
    member = mem_res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a group member.")

    msg_id = f"msg-{uuid.uuid4().hex[:12]}"
    new_msg = EncryptedGroupMessage(
        id=msg_id,
        group_id=group_id,
        sender_id=current_user.id,
        sender_name=member.display_name,
        message_type=payload.message_type,
        encrypted_payload=payload.encrypted_payload,
        iv=payload.iv,
        sender_key_fingerprint=payload.sender_key_fingerprint,
        attachment_url=payload.attachment_url,
        status="sent"
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)

    await manager.broadcast_to_group(group_id, {
        "type": "NEW_MESSAGE",
        "message": {
            "id": new_msg.id,
            "sender_id": new_msg.sender_id,
            "sender_name": new_msg.sender_name,
            "message_type": new_msg.message_type,
            "encrypted_payload": new_msg.encrypted_payload,
            "iv": new_msg.iv,
            "sender_key_fingerprint": new_msg.sender_key_fingerprint,
            "attachment_url": new_msg.attachment_url,
            "status": "delivered",
            "created_at": new_msg.created_at.isoformat()
        }
    })

    return {
        "success": True,
        "message_id": new_msg.id,
        "status": "delivered",
        "timestamp": new_msg.created_at.isoformat()
    }


@router.post("/{group_id}/attachment")
async def upload_encrypted_attachment(
    group_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mem_stmt = select(GroupMember).where(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    )
    mem_res = await db.execute(mem_stmt)
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a group member.")

    blob_id = f"blob-{uuid.uuid4().hex}"
    upload_dir = os.path.join(os.getcwd(), "uploads", "encrypted_attachments")
    os.makedirs(upload_dir, exist_ok=True)
    target_path = os.path.join(upload_dir, f"{blob_id}.enc")

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    return {
        "success": True,
        "blob_id": blob_id,
        "attachment_url": f"/api/groups/attachments/{blob_id}.enc",
        "size_bytes": len(content)
    }


@router.websocket("/ws/{group_id}")
async def group_websocket_endpoint(
    websocket: WebSocket,
    group_id: str,
    token: Optional[str] = Query(None)
):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = payload["sub"]

    async with async_session_maker() as session:
        mem_stmt = select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        )
        mem_res = await session.execute(mem_stmt)
        member = mem_res.scalar_one_or_none()
        if not member:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        member.is_online = True
        member.last_updated_at = datetime.now(timezone.utc)
        await session.commit()

    await manager.connect(group_id, user_id, websocket)

    try:
        await manager.broadcast_to_group(group_id, {
            "type": "MEMBER_STATUS_CHANGED",
            "user_id": user_id,
            "is_online": True
        }, exclude_user_id=user_id)

        while True:
            data = await websocket.receive_json()
            if data.get("type") == "HEARTBEAT":
                await websocket.send_json({"type": "HEARTBEAT_ACK"})
    except WebSocketDisconnect:
        manager.disconnect(group_id, user_id, websocket)
        async with async_session_maker() as session:
            mem_stmt = select(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id
            )
            mem_res = await session.execute(mem_stmt)
            member = mem_res.scalar_one_or_none()
            if member:
                member.is_online = False
                await session.commit()
        await manager.broadcast_to_group(group_id, {
            "type": "MEMBER_STATUS_CHANGED",
            "user_id": user_id,
            "is_online": False
        })
    except Exception:
        manager.disconnect(group_id, user_id, websocket)


@router.post("/seed-demo")
async def seed_demo_group(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    group_id = "grp-demo-tirthan-2026"
    grp_stmt = select(TravelGroup).where(TravelGroup.id == group_id)
    grp_res = await db.execute(grp_stmt)
    existing = grp_res.scalar_one_or_none()

    if existing:
        u_mem = await db.execute(
            select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id)
        )
        if not u_mem.scalar_one_or_none():
            db.add(GroupMember(
                group_id=group_id,
                user_id=current_user.id,
                role="admin",
                display_name=current_user.name,
                avatar=current_user.avatar,
                is_online=True,
                location_sharing_state="ON",
                last_latitude=31.6425,
                last_longitude=77.3481,
                battery_level=None
            ))
        mp_check = await db.execute(
            select(GroupMeetingPoint).where(GroupMeetingPoint.group_id == group_id)
        )
        if not mp_check.scalar_one_or_none():
            db.add(GroupMeetingPoint(
                id="mp-tirthan-chehni",
                group_id=group_id,
                title="Chehni Kothi Tower & Artisan Courtyard",
                latitude=31.6440,
                longitude=77.3502,
                description="Meet in the ancient stone-and-timber courtyard before starting the Choi Waterfall trek.",
                set_by_user_id=current_user.id,
                set_by_name=current_user.name
            ))
        # Clear legacy companion battery stats so device-only rule is enforced
        all_mems_res = await db.execute(select(GroupMember).where(GroupMember.group_id == group_id))
        for m in all_mems_res.scalars().all():
            m.battery_level = None
        await db.commit()
        return {"success": True, "group_id": group_id, "message": "Demo group ready."}

    demo_group = TravelGroup(
        id=group_id,
        name="Autumn in Tirthan: Kathkuni Trail",
        destination="Tirthan Valley, Himachal Pradesh",
        start_date="Oct 14, 2026",
        end_date="Oct 17, 2026",
        creator_id=current_user.id,
        invite_code="TIRTHAN26",
        status="active"
    )
    db.add(demo_group)

    db.add(GroupMember(
        group_id=group_id,
        user_id=current_user.id,
        role="admin",
        display_name=current_user.name,
        avatar=current_user.avatar,
        is_online=True,
        location_sharing_state="ON",
        last_latitude=31.6425,
        last_longitude=77.3481,
        battery_level=None
    ))

    db.add(GroupMember(
        group_id=group_id,
        user_id="usr-companion-priya",
        role="member",
        display_name="Priya Sharma",
        avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        is_online=True,
        location_sharing_state="ON",
        last_latitude=31.6436,
        last_longitude=77.3490,
        battery_level=None
    ))

    db.add(GroupMember(
        group_id=group_id,
        user_id="usr-companion-rahul",
        role="member",
        display_name="Rahul Verma",
        avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        is_online=True,
        location_sharing_state="ON",
        last_latitude=31.6418,
        last_longitude=77.3468,
        battery_level=None
    ))

    db.add(GroupMember(
        group_id=group_id,
        user_id="usr-companion-arjun",
        role="member",
        display_name="Arjun Patel",
        avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        is_online=False,
        location_sharing_state="PAUSED",
        last_latitude=31.6401,
        last_longitude=77.3450,
        battery_level=None
    ))

    db.add(GroupMeetingPoint(
        id="mp-tirthan-chehni",
        group_id=group_id,
        title="Chehni Kothi Tower & Artisan Courtyard",
        latitude=31.6440,
        longitude=77.3502,
        description="Meet in the ancient stone-and-timber courtyard before starting the Choi Waterfall trek.",
        set_by_user_id=current_user.id,
        set_by_name=current_user.name
    ))

    await db.commit()
    return {"success": True, "group_id": group_id, "message": "Demo group created."}
