"""
ml/features/weather_features.py
Feature extraction and scoring for meteorological conditions and seasonality.
"""

from typing import Dict, Any
import numpy as np

def extract_weather_feature_vector(weather_row: Dict[str, Any], is_indoor: bool = False) -> np.ndarray:
    """
    Normalizes temperature, rainfall, humidity, wind, and alert state:
    - temp_norm: centered around comfortable 24°C
    - rain_penalty: penalized heavy rainfall for outdoor activities
    - humidity_norm: centered around comfortable 50%
    - extreme_alert: binary penalty
    - indoor_shelter_bonus: reduces rain/monsoon penalty if attraction is indoors (museum, temple, palace)
    """
    temp = float(weather_row.get("temperature", 24.0))
    rain = float(weather_row.get("rainfall", 10.0))
    hum = float(weather_row.get("humidity", 55.0))
    wind = float(weather_row.get("wind_speed", 10.0))
    alert = float(weather_row.get("weather_alert", 0))

    temp_comfort = 1.0 - min(abs(temp - 24.0) / 20.0, 1.0)
    rain_impact = min(rain / 200.0, 1.0)
    if is_indoor:
        rain_impact *= 0.35  # Indoor attractions are resilient to rain

    hum_comfort = 1.0 - min(abs(hum - 50.0) / 50.0, 1.0)
    wind_comfort = 1.0 - min(max(wind - 15.0, 0.0) / 30.0, 1.0)

    return np.array([temp_comfort, rain_impact, hum_comfort, wind_comfort, alert], dtype=np.float32)

def is_month_in_season(best_season_str: str, month: int) -> int:
    """Checks whether the query month falls in destination best_season string."""
    s = str(best_season_str).lower()
    if "all year" in s or "throughout" in s:
        return 1
    months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    target = months[month - 1]
    return 1 if target in s else 0
