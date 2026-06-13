"""Cliente Supabase com service role (server-side apenas).

A service role IGNORA o RLS — por isso so pode existir aqui no backend,
nunca no frontend. Toda a autorizacao de negocio e feita no FastAPI.
"""
from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


@lru_cache
def get_service_client() -> Client:
    """Cliente unico (cacheado) usando a SERVICE ROLE key."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
