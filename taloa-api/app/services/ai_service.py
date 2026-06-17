"""Agente de IA TALOA (TaloaChat): monta o prompt, faz streaming do Anthropic
e salva a conversa em ai_conversations para auditoria.

REGRA: nunca diagnosticar/prescrever (isso vive no system prompt). Aqui so
montamos o contexto dinamico e cuidamos de streaming, limite e persistencia.

Reunite Flow (Etapa 22): no context "reunite" o agente conduz 3 perguntas e
encerra com um marcador oculto `<<REUNITE_SUMMARY>>{json}`. O backend remove o
marcador do texto exibido, e ao detecta-lo cria um found_report + envia o
email-resumo ao dono — UMA vez por sessao (guard via ai_conversations.reunite_done).
"""
import json
import logging
from collections.abc import Iterator

import anthropic
from fastapi import HTTPException, status

from app.ai.system_prompt import (
    DIRECTORY_INSTRUCTIONS,
    REUNITE_FLOW_INSTRUCTIONS,
    TALOA_SYSTEM_PROMPT,
)
from app.config import settings
from app.core.supabase import get_service_client
from app.schemas.ai import ChatRequest
from app.schemas.auth import CurrentUser
from app.services import email_service

logger = logging.getLogger("taloa.ai")

MAX_MESSAGES_PER_SESSION = settings.AI_MAX_MESSAGES_PER_SESSION  # 20
MAX_TOKENS = 1024
REUNITE_MARKER = "<<REUNITE_SUMMARY>>"

# Cap de providers injetados no prompt (evita inflar o system prompt).
DIRECTORY_MAX = 60

# Labels legiveis para as categorias (so exibicao no prompt).
_CATEGORY_LABELS = {
    "vet_emergency": "Emergency vets",
    "vet_general": "Vets (general)",
    "vet_exotic": "Exotic vets",
    "grooming": "Grooming",
    "dog_walking": "Dog walking",
    "dog_daycare": "Dog day-care",
    "dog_hotel": "Boarding / dog hotels",
    "pet_sitting": "Pet sitting",
    "training": "Training",
    "pet_shop": "Pet shops",
    "fresh_food": "Fresh food",
    "homemade_treats": "Homemade treats",
    "taxi_dog": "Dog taxi / transport",
    "travel_services": "Travel services",
    "insurance": "Insurance",
    "photography": "Photography",
    "dog_fashion": "Dog fashion",
    "other": "Other",
}


def _directory_for_prompt(sb) -> str:
    """Lista compacta dos providers ativos (nome, telefone, area) por categoria.

    REGRA: NUNCA inclui email (nem o selecionamos). Telefone/area sao publicos
    (ja aparecem no /directory). Retorna "" se nao houver providers ativos.
    """
    res = (
        sb.table("service_providers")
        .select("name, category, phone, area")
        .eq("is_active", True)
        .order("category")
        .order("is_featured", desc=True)
        .order("name")
        .limit(DIRECTORY_MAX)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return ""
    by_cat: dict[str, list[str]] = {}
    for r in rows:
        cat = r.get("category") or "other"
        bits = [r.get("name") or "Unnamed"]
        if r.get("phone"):
            bits.append(str(r["phone"]))
        if r.get("area"):
            bits.append(str(r["area"]))
        by_cat.setdefault(cat, []).append(" — ".join(bits))
    lines = [
        f"{_CATEGORY_LABELS.get(cat, cat.replace('_', ' '))}: " + "; ".join(items)
        for cat, items in by_cat.items()
    ]
    return "\n".join(lines)


def _reunite_pet_context(sb, tag_code: str | None) -> dict:
    """Campos do pet seguros para um finder (server-side, autoritativo).

    NUNCA inclui medication, private_notes, vet info, nem contato do dono.
    """
    if not tag_code:
        return {}
    tag = (
        sb.table("tags").select("pet_id").eq("tag_code", tag_code).limit(1).execute()
    )
    if not tag.data or not tag.data[0].get("pet_id"):
        return {}
    pet_id = tag.data[0]["pet_id"]
    ctx: dict = {}
    pet = (
        sb.table("pets")
        .select("name, species, breed_or_morph, colour, sex")
        .eq("id", pet_id)
        .limit(1)
        .execute()
    )
    if pet.data:
        ctx.update(pet.data[0])
    prof = (
        sb.table("pet_profiles")
        .select("behaviour, allergies, likes, dislikes, public_notes")
        .eq("pet_id", pet_id)
        .limit(1)
        .execute()
    )
    if prof.data:
        ctx.update(prof.data[0])
    return ctx


def _build_system_prompt(req: ChatRequest, sb) -> str:
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
    elif req.context == "reunite":
        parts.append(REUNITE_FLOW_INSTRUCTIONS)
        # Directory de servicos locais (so no reunite): o bot pode recomendar
        # providers relevantes de forma natural, a partir desta lista.
        directory = _directory_for_prompt(sb)
        if directory:
            parts.append(DIRECTORY_INSTRUCTIONS)
            parts.append(directory)

    # Contexto do pet. No reunite buscamos server-side (autoritativo, inclui
    # behaviour/allergies); nos demais usamos o pet_context publico do client.
    if req.context == "reunite":
        pet = _reunite_pet_context(sb, req.tag_code)
        fields = (
            "name", "species", "breed_or_morph", "colour", "sex",
            "behaviour", "allergies", "likes", "dislikes", "public_notes",
        )
    else:
        pet = req.pet_context or {}
        fields = ("name", "species", "breed_or_morph", "colour", "sex", "status")

    safe = {k: pet.get(k) for k in fields if pet.get(k)}
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


# ── Reunite: marcador + conclusao ─────────────────────────────────────────────
def _split_marker(text: str) -> tuple[str, str | None]:
    """Separa o texto visivel do payload do marcador (se houver)."""
    idx = text.find(REUNITE_MARKER)
    if idx == -1:
        return text, None
    return text[:idx], text[idx + len(REUNITE_MARKER):]


def _parse_summary(raw: str | None) -> dict | None:
    """Parsing tolerante do JSON do marcador. Retorna None se invalido."""
    if not raw:
        return None
    raw = raw.strip()
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        data = json.loads(raw[start : end + 1])
    except (json.JSONDecodeError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def _owner_and_pet(sb, tag_code: str | None) -> tuple[str | None, str | None]:
    """Email do dono (server-side, nunca publico) e nome do pet, via tag_code."""
    if not tag_code:
        return None, None
    owner_email = pet_name = None
    tag = (
        sb.table("tags")
        .select("pet_id, owner_id")
        .eq("tag_code", tag_code)
        .limit(1)
        .execute()
    )
    if tag.data:
        t = tag.data[0]
        if t.get("owner_id"):
            owner = (
                sb.table("users")
                .select("email")
                .eq("id", t["owner_id"])
                .limit(1)
                .execute()
            )
            if owner.data:
                owner_email = owner.data[0].get("email")
        if t.get("pet_id"):
            pet = (
                sb.table("pets")
                .select("name")
                .eq("id", t["pet_id"])
                .limit(1)
                .execute()
            )
            if pet.data:
                pet_name = pet.data[0].get("name")
    return owner_email, pet_name


def _complete_reunite(sb, req: ChatRequest, summary: dict) -> None:
    """Idempotente: cria found_report + email-resumo ao dono, 1x por sessao.

    O guard atomico (update WHERE reunite_done = false) garante que mesmo um
    retry/duplo-stream nunca dispare dois emails.
    """
    flip = (
        sb.table("ai_conversations")
        .update({"reunite_done": True})
        .eq("session_id", req.session_id)
        .eq("reunite_done", False)
        .execute()
    )
    if not flip.data:
        return  # ja processado (ou a linha ainda nao existe)

    location = (str(summary.get("location") or "")).strip() or None
    pet_ok = (str(summary.get("pet_is_ok") or "")).strip()
    duration = (str(summary.get("duration") or "")).strip()
    recap = (str(summary.get("summary") or "")).strip()
    notes = (
        " | ".join(
            p
            for p in (
                f"Pet OK: {pet_ok}" if pet_ok else "",
                f"Can stay: {duration}" if duration else "",
                recap,
            )
            if p
        )
        or None
    )

    # Registra como found_report (aparece no dashboard do dono).
    try:
        sb.table("found_reports").insert(
            {
                "tag_code": req.tag_code,
                "found_area": location,
                "notes": notes,
                "finder_phone": req.finder_phone,
            }
        ).execute()
    except Exception:  # noqa: BLE001 — registro nao deve quebrar o email
        logger.warning("reunite found_report insert failed tag=%s", req.tag_code)

    owner_email, pet_name = _owner_and_pet(sb, req.tag_code)
    email_service.send_reunite_summary(
        owner_email=owner_email,
        pet_name=pet_name,
        tag_code=req.tag_code or "",
        pet_is_ok=pet_ok or None,
        location=location,
        duration=duration or None,
        finder_phone=req.finder_phone,
        summary=recap or None,
    )


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

    system_prompt = _build_system_prompt(req, sb)

    # Anthropic exige que a primeira mensagem seja do 'user'. A saudacao do
    # reunite e semeada como assistant no client; remove assistants iniciais.
    anthropic_messages = [{"role": m.role, "content": m.content} for m in req.messages]
    while anthropic_messages and anthropic_messages[0]["role"] == "assistant":
        anthropic_messages.pop(0)

    if not anthropic_messages:
        def _empty() -> Iterator[str]:
            yield "data: [DONE]\n\n"

        return _empty()

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def generator() -> Iterator[str]:
        accumulated = ""
        emitted = 0  # chars ja enviados ao cliente
        guard = len(REUNITE_MARKER) - 1
        try:
            with client.messages.stream(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=MAX_TOKENS,
                system=system_prompt,
                messages=anthropic_messages,
            ) as stream:
                for text in stream.text_stream:
                    accumulated += text
                    idx = accumulated.find(REUNITE_MARKER)
                    # Nunca emite o marcador (nem um inicio parcial dele).
                    safe = idx if idx != -1 else max(0, len(accumulated) - guard)
                    if safe > emitted:
                        piece = accumulated[emitted:safe]
                        emitted = safe
                        yield f"data: {json.dumps({'text': piece})}\n\n"
        except Exception:
            # Nao vaza detalhe do provider para o cliente.
            yield f"data: {json.dumps({'error': 'AI is temporarily unavailable.'})}\n\n"
        else:
            visible, raw_marker = _split_marker(accumulated)
            # Libera o texto visivel que ficou retido no final (sem marcador).
            if len(visible) > emitted:
                yield f"data: {json.dumps({'text': visible[emitted:]})}\n\n"
            visible = visible.rstrip()

            # Persiste o texto visivel (sem o marcador).
            try:
                _persist(sb, req, user, visible)
            except Exception:
                pass  # auditoria nao deve quebrar a resposta

            # Reunite: dispara found_report + email ao dono (idempotente).
            if req.context == "reunite":
                summary = _parse_summary(raw_marker)
                if summary:
                    try:
                        _complete_reunite(sb, req, summary)
                    except Exception:  # noqa: BLE001
                        logger.warning("reunite completion failed tag=%s", req.tag_code)
        yield "data: [DONE]\n\n"

    return generator()
