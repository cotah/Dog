"""Configuracao central da API (le variaveis do .env via pydantic-settings)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # ── Supabase ──
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    # ── App ──
    APP_NAME: str = "TALOA"
    APP_ENV: str = "development"
    TAG_PREFIX: str = "TAL"
    FRONTEND_URL: str = "https://taloa.ie"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # ── Anthropic (Etapa 13) ──
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-4-6"
    AI_MAX_MESSAGES_PER_SESSION: int = 20

    # ── Resend (Etapa 14) ──
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "hello@taloa.ie"

    # ── Sentry (opcional) ──
    SENTRY_DSN: str = ""

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
