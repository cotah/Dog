"""Agente de IA TALOA (TaloaChat): monta o prompt, faz streaming do Anthropic
e salva a conversa em ai_conversations para auditoria.

REGRA: nunca diagnosticar/prescrever (isso vive no system prompt). Aqui so
montamos o contexto dinamico e cuidamos de streaming, limite e persistencia.
"""
import json
from collections.abc import Iterator

import anthropic
from fastapi import HTTPException, status

from app.ai.system_prompt import TALOA_SYSTEM_PROMPT
from app.config import settings
from app.core.supabase import get_service_client
from app.schemas.ai import ChatRequest
from app.schemas.auth import CurrentUser

MAX_MESSAGES_PER_SESSION = settings.AI_MAX_MESSAGES_PER_SESSION  # 20
MAX_TOKENS = 1024


def _build_system_prompt(req: ChatRequest) -> str:
    """System prompt base + contexto dinamico da pagina."""
    parts = [TALOA_SYSTEM_PROMPT]

    if req.context == "emergency":
        parts.append(
            "\n\nCONTEXT: The user is on TALOA's Emergency Vet Directory page "
            "for Dublin. Encourage them to use the verified clinics listed there "
            "and to call ahead. If this is an emergency, they should contact a "
            "vet immediately."
        )
    elif req.context == "lost_pet":
        parts.append(
            "\n\nCONTEXT: The user is viewing a pet that is currently marked as "
            "LOST. Help a finder contact the owner and keep the pet safe, or help "
            "the owner with sensible next steps."
        )

    pet = req.pet_context or {}
    if pet:
        # Apenas campos publicos/seguros do pet (nunca endereco do dono).
        safe = {
            k: pet.get(k)
            for k in ("name", "species", "breed_or_morph", "colour", "sex", "status")
            if pet.get(k)
        }
        if safe:
            details = ", ".join(f"{k}: {v}" for k, v in safe.items())
            parts.append(f"\n\nThe pet on this page — {details}.")

    return "".join(parts)


def _session_user_count(sb, session_id: str) -> int:
    """Quantas mensagens do usuario ja foram persistidas nesta sessao."""
    res = (
        sb.table("ai_conversations")
        .select("messages")
        .eq("session_id", session_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        return 0
    stored = res.data[0].get("messages") or []
    return sum(1 for m in stored if m.get("role") == "user")


def _persist(
    sb,
    req: ChatRequest,
    user: CurrentUser | None,
    assistant_text: str,
) -> None:
    """Upsert da conversa por session_id (auditoria)."""
    full = [m.model_dump() for m in req.messages]
    full.append({"role": "assistant", "content": assistant_text})

    existing = (
        sb.table("ai_conversations")
        .select("id")
        .eq("session_id", req.session_id)
        .limit(1)
        .execute()
    )
    row = {
        "user_id": user.id if user else None,
        "tag_code": req.tag_code,
        "session_id": req.session_id,
        "messages": full,
        "context": req.context,
    }
    if existing.data:
        sb.table("ai_conversations").update(row).eq(
            "id", existing.data[0]["id"]
        ).execute()
    else:
        sb.table("ai_conversations").insert(row).execute()


def stream_chat(req: ChatRequest, user: CurrentUser | None) -> Iterator[str]:
    """Gera eventos SSE com a resposta do agente e persiste ao final."""
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI assistant is not configured yet.",
        )

    sb = get_service_client()

    # Limite de 20 mensagens por sessao (regra de seguranca / custo).
    incoming_user = sum(1 for m in req.messages if m.role == "user")
    if incoming_user > MAX_MESSAGES_PER_SESSION or (
        _session_user_count(sb, req.session_id) >= MAX_MESSAGES_PER_SESSION
    ):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You've reached the limit of this chat session.",
        )

    system_prompt = _build_system_prompt(req)
    anthropic_messages = [{"role": m.role, "content": m.content} for m in req.messages]
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def generator() -> Iterator[str]:
        chunks: list[str] = []
        try:
            with client.messages.stream(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=MAX_TOKENS,
                system=system_prompt,
                messages=anthropic_messages,
            ) as stream:
                for text in stream.text_stream:
                    chunks.append(text)
                    yield f"data: {json.dumps({'text': text})}\n\n"
        except Exception:
            # Nao vaza detalhe do provider para o cliente.
            yield f"data: {json.dumps({'error': 'AI is temporarily unavailable.'})}\n\n"
        else:
            # Persiste so quando deu certo.
            try:
                _persist(sb, req, user, "".join(chunks))
            except Exception:
                pass  # auditoria nao deve quebrar a resposta
        yield "data: [DONE]\n\n"

    return generator()
