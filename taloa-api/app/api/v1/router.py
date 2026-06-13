"""Agrega todas as rotas da versao v1 da API."""
from fastapi import APIRouter

from app.api.v1.routes import auth, found, scans, tags, uploads

api_router = APIRouter(prefix="/v1")
api_router.include_router(auth.router)
api_router.include_router(tags.router)
api_router.include_router(scans.router)
api_router.include_router(uploads.router)
api_router.include_router(found.router)
