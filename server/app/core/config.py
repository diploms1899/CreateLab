"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Server configuration loaded from environment or .env file."""

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
    cors_origins: list[str] = ["*"]

    # DeepSeek
    deepseek_api_key: Optional[str] = None
    deepseek_model: str = "deepseek-coder"
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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
