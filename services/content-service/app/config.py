"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/content_db"
    )
    # When true, seed script runs on startup if the courses table is empty.
    # Keep false in production; useful for local docker-compose demos.
    run_seed_on_startup: bool = False
    service_name: str = "content-service"
    api_prefix: str = "/api/v1"


settings = Settings()
