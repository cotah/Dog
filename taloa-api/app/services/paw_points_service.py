"""Paw Points (Etapa 20): saldo + historico + regras de ganho.

`award` e idempotente quando recebe `ref` (ex: pet_id, tag_code, invoice_id):
o indice unico (user, reason, ref) garante "uma vez por pet/tag".
"""
from datetime import datetime, timezone

from app.core.supabase import get_service_client


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def award(user_id: str | None, points: int, reason: str, ref: str | None = None) -> None:
    """Credita pontos uma unica vez por (user, reason, ref). Best-effort."""
    if not user_id:
        return
    sb = get_service_client()

    if ref is not None:
        existing = (
            sb.table("paw_points_transactions")
            .select("id")
            .eq("user_id", user_id)
            .eq("reason", reason)
            .eq("ref", ref)
            .limit(1)
            .execute()
        )
        if existing.data:
            return  # ja premiado

    try:
        sb.table("paw_points_transactions").insert(
            {"user_id": user_id, "points": points, "reason": reason, "ref": ref}
        ).execute()
    except Exception:
        return  # corrida no indice unico -> ja existe

    _add_balance(sb, user_id, points)


def _add_balance(sb, user_id: str, points: int) -> None:
    row = (
        sb.table("paw_points")
        .select("points, total_earned")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if row.data:
        cur = row.data[0]
        sb.table("paw_points").update(
            {
                "points": cur["points"] + points,
                "total_earned": cur["total_earned"] + max(points, 0),
                "updated_at": _now(),
            }
        ).eq("user_id", user_id).execute()
    else:
        sb.table("paw_points").insert(
            {
                "user_id": user_id,
                "points": points,
                "total_earned": max(points, 0),
            }
        ).execute()


# ── Regras de ganho por pet (foto / vet / perfil 100%) ──────────
# Perfil "100%": foto + raca/morph + alergias + comportamento + vet.
def evaluate_pet(user_id: str | None, pet: dict, profile: dict) -> None:
    if not user_id:
        return
    pet_id = pet["id"]

    if pet.get("photo_url"):
        award(user_id, 20, "pet_photo", pet_id)
    if profile.get("vet_name"):
        award(user_id, 30, "pet_vet", pet_id)

    complete = all(
        [
            pet.get("photo_url"),
            pet.get("breed_or_morph"),
            profile.get("allergies"),
            profile.get("behaviour"),
            profile.get("vet_name"),
        ]
    )
    if complete:
        award(user_id, 50, "profile_complete", pet_id)


# ── Leitura para o dashboard ────────────────────────────────────
def get_summary(user_id: str) -> dict:
    sb = get_service_client()
    pp = (
        sb.table("paw_points")
        .select("points, total_earned")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    total = pp.data[0]["points"] if pp.data else 0
    total_earned = pp.data[0]["total_earned"] if pp.data else 0

    txs = (
        sb.table("paw_points_transactions")
        .select("points, reason, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    return {
        "total": total,
        "total_earned": total_earned,
        "transactions": txs.data or [],
    }
