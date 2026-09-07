"""Application settings loaded from environment variables."""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/content_db"
    )
    @field_validator("database_url", mode="before")
    @classmethod
    def async_database_url(cls, value: str) -> str:
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return value.replace(prefix, "postgresql+asyncpg://", 1)
        return value

    # When true, seed script runs on startup if the courses table is empty.
    # Keep false in production; useful for local docker-compose demos.
    run_seed_on_startup: bool = False
    service_name: str = "content-service"
    api_prefix: str = "/api/v1"


settings = Settings()
