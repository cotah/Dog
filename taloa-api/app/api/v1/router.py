"""Agrega todas as rotas da versao v1 da API."""
from fastapi import APIRouter

from app.api.v1.routes import auth

api_router = APIRouter(prefix="/v1")
api_router.include_router(auth.router)
