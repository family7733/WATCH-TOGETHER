import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "SHADOW STUDIO"
    environment: str = os.getenv("ENV", "development")

    # Security
    jwt_secret_key: str = os.getenv("JWT_SECRET", "change-me-in-prod")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # Database
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@db:5432/smartfilms",
    )

    # TMDB
    tmdb_api_key: str | None = os.getenv("TMDB_API_KEY")
    tmdb_read_token: str | None = os.getenv("TMDB_READ_TOKEN")

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


