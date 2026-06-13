"""Entrypoint da TALOA API (FastAPI)."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import settings

app = FastAPI(
    title=f"{settings.APP_NAME} API",
    version="0.1.0",
    description="Backend TALOA — toda a logica de negocio, auth e AI.",
)

# CORS: so as origens permitidas (web local + producao)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "service": settings.APP_NAME, "env": settings.APP_ENV}
