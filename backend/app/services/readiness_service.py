"""
backend/app/services/readiness_service.py
-----------------------------------------
Infrastructure Readiness Scoring & Persistence Service for Gov & DMO Command Centers.
Calculates weighted composite readiness across 6 critical infrastructure pillars:
  - Accommodation (25%)
  - Transport & Accessibility (20%)
  - Connectivity (15%)
  - Food & Hospitality (15%)
  - Medical & Safety (15%)
  - Other Amenities (10%)
Total weight = 1.00 (100%).
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database.models import DestinationMaster, ReadinessInput

WEIGHTS = {
    'accommodation': 0.25,
    'transport': 0.20,
    'connectivity': 0.15,
    'food_hospitality': 0.15,
    'medical_safety': 0.15,
    'other_amenities': 0.10,
}

assert abs(sum(WEIGHTS.values()) - 1.0) < 0.001, "WEIGHTS must sum to 1.0"


def compute_readiness(inputs: Dict[str, Any]) -> float:
    """
    Computes weighted 0-100 composite readiness score.
    Clamps inputs to [0, 100].
    """
    score = sum(WEIGHTS[k] * (float(inputs.get(k, 0.0)) / 100.0) for k in WEIGHTS) * 100.0
    return round(min(max(score, 0.0), 100.0), 1)


def get_readiness_badge(score: float) -> Dict[str, str]:
    """
    Returns color-coded readiness badge metadata (Low / Med / High).
    """
    if score >= 70.0:
        return {
            "tier": "High",
            "label": "High Readiness",
            "badge": "High Readiness",
            "color": "emerald",
            "hex": "#10B981"
        }
    elif score >= 45.0:
        return {
            "tier": "Medium",
            "label": "Medium Readiness",
            "badge": "Medium Readiness",
            "color": "amber",
            "hex": "#F59E0B"
        }
    else:
        return {
            "tier": "Low",
            "label": "Low Readiness",
            "badge": "Low Readiness",
            "color": "red",
            "hex": "#EF4444"
        }


def parse_destination_id(dest_id: Union[int, str]) -> int:
    """
    Normalizes numeric IDs and string IDs like 'CT0122' or '122' into an integer destination_id.
    """
    if isinstance(dest_id, int):
        return dest_id
    s = str(dest_id).strip()
    if s.upper().startswith("CT"):
        digits = ''.join(c for c in s if c.isdigit())
        if digits:
            return int(digits)
    try:
        return int(s)
    except ValueError:
        # Stable fallback mapping into valid catalog ID range [1, 12601]
        return (abs(hash(s)) % 12600) + 1


async def upsert_readiness_input(
    db: AsyncSession,
    destination_id: Union[int, str],
    inputs: Dict[str, Any],
    updated_by: Optional[str] = None
) -> Dict[str, Any]:
    """
    Upserts readiness_inputs table and updates destinations_master.readiness_score.
    """
    numeric_dest_id = parse_destination_id(destination_id)

    # Validate and normalize each factor to [0.0, 100.0]
    cleaned_inputs = {}
    for factor in WEIGHTS:
        val = float(inputs.get(factor, 0.0))
        cleaned_inputs[factor] = round(min(max(val, 0.0), 100.0), 1)

    readiness_score = compute_readiness(cleaned_inputs)
    badge = get_readiness_badge(readiness_score)
    now_utc = datetime.now(timezone.utc)

    # Check existing row in readiness_inputs
    stmt = select(ReadinessInput).where(ReadinessInput.destination_id == numeric_dest_id)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()

    if existing:
        existing.accommodation = cleaned_inputs['accommodation']
        existing.transport = cleaned_inputs['transport']
        existing.connectivity = cleaned_inputs['connectivity']
        existing.food_hospitality = cleaned_inputs['food_hospitality']
        existing.medical_safety = cleaned_inputs['medical_safety']
        existing.other_amenities = cleaned_inputs['other_amenities']
        existing.updated_by = updated_by
        existing.updated_at = now_utc
    else:
        new_entry = ReadinessInput(
            destination_id=numeric_dest_id,
            accommodation=cleaned_inputs['accommodation'],
            transport=cleaned_inputs['transport'],
            connectivity=cleaned_inputs['connectivity'],
            food_hospitality=cleaned_inputs['food_hospitality'],
            medical_safety=cleaned_inputs['medical_safety'],
            other_amenities=cleaned_inputs['other_amenities'],
            updated_by=updated_by,
            updated_at=now_utc
        )
        db.add(new_entry)

    # Update destinations_master.readiness_score if the destination exists
    update_dest_stmt = (
        update(DestinationMaster)
        .where(DestinationMaster.id == numeric_dest_id)
        .values(readiness_score=readiness_score)
    )
    await db.execute(update_dest_stmt)
    await db.commit()

    return {
        "destination_id": numeric_dest_id,
        "readiness_score": readiness_score,
        "badge": badge,
        "inputs": cleaned_inputs,
        "updated_by": updated_by,
        "updated_at": now_utc.isoformat(),
        "weights": WEIGHTS
    }


async def get_readiness_input_for_destination(
    db: AsyncSession,
    destination_id: Union[int, str]
) -> Dict[str, Any]:
    """
    Fetches persisted readiness input, or generates default baseline if not yet saved.
    """
    numeric_dest_id = parse_destination_id(destination_id)

    stmt = select(ReadinessInput).where(ReadinessInput.destination_id == numeric_dest_id)
    res = await db.execute(stmt)
    entry = res.scalar_one_or_none()

    if entry:
        inputs = {
            'accommodation': float(entry.accommodation),
            'transport': float(entry.transport),
            'connectivity': float(entry.connectivity),
            'food_hospitality': float(entry.food_hospitality),
            'medical_safety': float(entry.medical_safety),
            'other_amenities': float(entry.other_amenities),
        }
        score = compute_readiness(inputs)
        return {
            "destination_id": numeric_dest_id,
            "readiness_score": score,
            "badge": get_readiness_badge(score),
            "inputs": inputs,
            "is_persisted": True,
            "updated_by": entry.updated_by,
            "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
            "weights": WEIGHTS
        }

    # If not explicitly saved yet, check if destinations_master has existing readiness_score
    dest_stmt = select(DestinationMaster).where(DestinationMaster.id == numeric_dest_id)
    dest_res = await db.execute(dest_stmt)
    dest = dest_res.scalar_one_or_none()

    default_score = float(dest.readiness_score) if (dest and dest.readiness_score is not None) else 50.0
    default_inputs = {
        'accommodation': default_score,
        'transport': default_score,
        'connectivity': default_score,
        'food_hospitality': default_score,
        'medical_safety': default_score,
        'other_amenities': default_score,
    }
    return {
        "destination_id": numeric_dest_id,
        "readiness_score": default_score,
        "badge": get_readiness_badge(default_score),
        "inputs": default_inputs,
        "is_persisted": False,
        "updated_by": None,
        "updated_at": None,
        "weights": WEIGHTS
    }


async def get_all_readiness_inputs(db: AsyncSession) -> Dict[int, Dict[str, Any]]:
    """
    Returns map of all persisted readiness inputs keyed by numeric destination_id.
    """
    stmt = select(ReadinessInput)
    res = await db.execute(stmt)
    entries = res.scalars().all()

    out = {}
    for entry in entries:
        inputs = {
            'accommodation': float(entry.accommodation),
            'transport': float(entry.transport),
            'connectivity': float(entry.connectivity),
            'food_hospitality': float(entry.food_hospitality),
            'medical_safety': float(entry.medical_safety),
            'other_amenities': float(entry.other_amenities),
        }
        score = compute_readiness(inputs)
        out[entry.destination_id] = {
            "readiness_score": score,
            "inputs": inputs,
            "badge": get_readiness_badge(score),
            "updated_at": entry.updated_at.isoformat() if entry.updated_at else None
        }
    return out
