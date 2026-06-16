"""Agrega todas as rotas da versao v1 da API."""
from fastapi import APIRouter

from app.api.v1.routes import (
    admin,
    admin_directory,
    admin_tags,
    ai,
    auth,
    billing,
    directory,
    found,
    leads,
    owner,
    pets,
    scans,
    tags,
    uploads,
    vets,
    webhooks,
)

api_router = APIRouter(prefix="/v1")
api_router.include_router(auth.router)
api_router.include_router(tags.router)
api_router.include_router(scans.router)
api_router.include_router(uploads.router)
api_router.include_router(found.router)
api_router.include_router(owner.router)
api_router.include_router(pets.router)
api_router.include_router(leads.router)
api_router.include_router(admin.router)
api_router.include_router(admin_tags.router)
api_router.include_router(vets.router)
api_router.include_router(directory.router)
api_router.include_router(admin_directory.router)
api_router.include_router(ai.router)
api_router.include_router(billing.router)
api_router.include_router(webhooks.router)
