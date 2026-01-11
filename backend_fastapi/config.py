"""
Application configuration settings.

This module defines all configuration variables used across the application,
loaded from environment variables with sensible defaults.
"""

import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "Society Management API"
    app_version: str = "1.0.0"
    debug: bool = True

    # Database
    database_url: str

    # Supabase Configuration
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000"]

    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@societymanagement.com"

    # File Upload
    max_file_size: int = 10485760  # 10MB
    upload_dir: str = "uploads"

    class Config:
        """Pydantic config class."""

        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from env


settings = Settings()
