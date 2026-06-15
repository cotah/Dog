"""Entrypoint da TALOA API (FastAPI)."""
import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.config import settings
from app.core.limiter import limiter

# Sentry — monitoramento de erros. Inicializado ANTES do FastAPI() para que a
# integracao FastAPI/Starlette (auto-habilitada pelo sentry-sdk[fastapi]) capture
# todas as excecoes nao tratadas. So liga se houver DSN configurado no ambiente.
# send_default_pii=False: nunca envia dados pessoais (email, IP, cookies, body)
# ao Sentry — alinhado as regras de privacidade/GDPR da TALOA.
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.APP_ENV,
        send_default_pii=False,
        traces_sample_rate=0.1,
    )

app = FastAPI(
    title=f"{settings.APP_NAME} API",
    version="0.1.0",
    description="Backend TALOA — toda a logica de negocio, auth e AI.",
)

# Rate limiting (slowapi) — protecao de abuso por IP.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
