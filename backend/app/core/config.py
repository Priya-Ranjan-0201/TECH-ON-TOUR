import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "TravelSathi API"
    app_env: str = "development"
    debug: bool = True
    port: int = 8000

    # Supabase / PostgreSQL
    supabase_url: str = Field(default="https://mock-ref.supabase.co")
    supabase_key: str = Field(default="mock-anon-key")
    database_url: str = Field(default="sqlite+aiosqlite:///./travelsathi_dev.db")

    # AI Keys
    gemini_api_key: str = Field(default="mock-gemini-key")
    groq_api_key: str = Field(default="mock-groq-key")

    # External APIs
    openweather_api_key: str = Field(default="mock-weather-key")
    calendarific_api_key: str = Field(default="mock-calendar-key")

    # Razorpay Test Mode
    razorpay_key_id: str = Field(default="rzp_test_mock")
    razorpay_key_secret: str = Field(default="mock_secret")

    # CORS
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()
