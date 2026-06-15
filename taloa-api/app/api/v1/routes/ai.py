"""Rota do agente de IA TALOA (TaloaChat) — streaming SSE."""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.core.limiter import limiter
from app.core.security import get_optional_user
from app.schemas.ai import ChatRequest
from app.schemas.auth import CurrentUser
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat")
@limiter.limit("30/minute")
def chat(
    request: Request,
    body: ChatRequest,
    user: CurrentUser | None = Depends(get_optional_user),
) -> StreamingResponse:
    """Responde via streaming (Server-Sent Events).

    Auth opcional: funciona em paginas publicas e logado no dashboard.
    """
    stream = ai_service.stream_chat(body, user)
    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
