import os
from pathlib import Path
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.database.models import Base

# Ensure SQLite file path points to a permanent local location if using sqlite
DB_URL = settings.database_url
if DB_URL.startswith("sqlite"):
    db_path = Path(__file__).resolve().parent.parent.parent / "travelsathi_dev.db"
    DB_URL = f"sqlite+aiosqlite:///{db_path}"

# Create async engine with robust pooling
engine = create_async_engine(
    DB_URL,
    echo=False,
    future=True,
)

# Async session factory
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining database sessions."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables and indexes."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
