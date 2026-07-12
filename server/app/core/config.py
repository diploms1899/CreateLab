"""Application configuration via environment variables."""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Resolve .env path relative to this config file (server/app/core/ -> server/)
_ENV_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")


class Settings(BaseSettings):
    """Server configuration loaded from environment or .env file."""
    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8")

    app_name: str = "CoreV2 CreateLab Server"
    debug: bool = False

    # Database (db_url avoids collision with system DATABASE_URL env var)
    db_url: str = "sqlite+aiosqlite:///./data/createlab.db"

    # JWT
    jwt_secret_key: str = "change-this-in-production-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 30

    # Server
    host: str = "0.0.0.0"
    port: int = 8443
    cors_origins: list[str] = ["http://localhost:1420", "http://localhost:5173", "tauri://localhost", "https://tauri.localhost"]

    # DeepSeek
    deepseek_api_key: Optional[str] = None
    deepseek_model: str = "deepseek-chat"
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    deepseek_max_tokens: int = 8192
    deepseek_temperature: float = 0.3

    # Synchronization
    max_delta_size_bytes: int = 10 * 1024 * 1024  # 10 MB
    sync_interval_seconds: int = 30

    # Workspace
    max_workspace_size_mb: int = 500
    allowed_file_extensions: list[str] = [
        ".ino", ".cpp", ".h", ".hpp", ".c", ".json",
        ".md", ".txt", ".toml", ".yaml", ".yml",
    ]


settings = Settings()
