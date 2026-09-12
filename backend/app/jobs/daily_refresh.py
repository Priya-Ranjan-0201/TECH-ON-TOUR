"""
Daily ML Refresh Job.
Pulls fresh external signals, recomputes derived features,
retrains the pricing model on the updated dataset, and logs the run to pipeline_runs.
Run via APScheduler (in-process) and manually triggered via Admin Panel for live demo.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any

from app.database.connection import async_session_maker
from app.database.models import PipelineRun
from app.services.external_data import (
    fetch_upcoming_festivals,
    fetch_trend_scores,
    fetch_weather_forecast,
)
from app.services.pricing_retrain import retrain_pricing_model

logger = logging.getLogger("daily_refresh")


async def run_daily_refresh() -> Dict[str, Any]:
    """
    Executes the data refresh and model retraining pipeline.
    Persists the run record into the database `pipeline_runs` table.
    Guarantees that on any failure, the existing model remains active.
    """
    run_start = datetime.now(timezone.utc)
    run_iso = run_start.isoformat()
    logger.info(f"Daily ML refresh pipeline triggered at {run_iso}")

    try:
        festivals = fetch_upcoming_festivals()
        trends = fetch_trend_scores()
        weather = fetch_weather_forecast()
        logger.info(
            f"Fetched {len(festivals)} festivals, {len(trends)} trend scores, {len(weather)} weather records."
        )

        # Retrain the model on the updated feature space
        metrics = retrain_pricing_model(rows=1600)
        logger.info(f"Model retrained. MAE: ₹{metrics['mae']:.2f}, R2: {metrics['r2']:.3f}")

        # Persist audit record in pipeline_runs
        async with async_session_maker() as session:
            run_record = PipelineRun(
                run_at=run_iso,
                status="success",
                mae=metrics["mae"],
                r2=metrics["r2"],
                rows_used=metrics["rows_used"],
                error=None,
            )
            session.add(run_record)
            await session.commit()
            await session.refresh(run_record)

        return {
            "status": "success",
            "run_at": run_iso,
            "mae": metrics["mae"],
            "mae_inr": metrics.get("mae_inr", metrics["mae"]),
            "r2": metrics["r2"],
            "r2_score": metrics.get("r2_score", metrics["r2"]),
            "rows_used": metrics["rows_used"],
            "festivals_count": len(festivals),
            "trends_count": len(trends),
            "weather_count": len(weather),
            "model_version": "1.1.0-autorefresh",
        }

    except Exception as exc:
        error_msg = str(exc)
        logger.error(f"Daily ML refresh failed: {error_msg}")

        # Log failure record in pipeline_runs
        try:
            async with async_session_maker() as session:
                fail_record = PipelineRun(
                    run_at=run_iso,
                    status="failed",
                    mae=None,
                    r2=None,
                    rows_used=None,
                    error=error_msg,
                )
                session.add(fail_record)
                await session.commit()
        except Exception as db_exc:
            logger.error(f"Failed to record pipeline failure into database: {db_exc}")

        # Return fallback status without taking model down
        return {
            "status": "failed",
            "run_at": run_iso,
            "error": error_msg,
            "note": "Existing model file preserved and serving uninterrupted.",
        }
