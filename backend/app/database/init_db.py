import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from app.database.models import Base, User
from app.database.connection import DB_URL, async_session_maker
from app.core.security import hash_password
from sqlalchemy import select

DEFAULT_PERSONAS = [
    {
        "id": "usr-901",
        "email": "aarav.sharma@travelsathi.in",
        "name": "Aarav Sharma",
        "role": "tourist",
        "phone": "+91 98765 43210",
        "password": "password123",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
    },
    {
        "id": "host-801",
        "email": "sunil.thakur@pineshade.in",
        "name": "Sunil Thakur",
        "role": "host",
        "phone": "+91 98123 45678",
        "password": "password123",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    {
        "id": "dmo-701",
        "email": "officer.tourism@nic.in",
        "name": "Dr. Rajesh Verma, IAS",
        "role": "dmo",
        "phone": "+91 94111 22334",
        "password": "password123",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
    },
    {
        "id": "admin-001",
        "email": "admin.ops@travelsathi.gov.in",
        "name": "Chief Security Officer",
        "role": "admin",
        "phone": "+91 99999 00000",
        "password": "password123",
        "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80"
    }
]

async def init_database():
    engine = create_async_engine(DB_URL, echo=False)
    # 1. Create missing tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[INIT DB] All database tables checked and created.")

    # 2. Seed default users
    async with async_session_maker() as session:
        for p in DEFAULT_PERSONAS:
            stmt = select(User).where(User.email == p["email"])
            res = await session.execute(stmt)
            existing = res.scalar_one_or_none()
            if not existing:
                new_user = User(
                    id=p["id"],
                    email=p["email"],
                    hashed_password=hash_password(p["password"]),
                    name=p["name"],
                    role=p["role"],
                    phone=p["phone"],
                    avatar=p["avatar"],
                    is_active=True
                )
                session.add(new_user)
                print(f"[INIT DB] Seeded user: {p['name']} ({p['email']} - {p['role']})")
        await session.commit()
    print("[INIT DB] Database initialization and user seeding complete.")

if __name__ == "__main__":
    asyncio.run(init_database())
