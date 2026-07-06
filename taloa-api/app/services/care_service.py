"""Pet Sitter Share (Etapa 25): links temporarios de cuidado.

REGRA: o token expira por expires_at e e revogavel por is_active — ambos
verificados server-side em cada request. Nunca endereco/email do dono;
telefone do dono SEMPRE visivel no care link.
"""
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.config import settings
from app.core.supabase import get_service_client
from app.schemas.auth import CurrentUser
from app.schemas.care import CareProfile, CareShare, CareShareCreate
from app.services.diary_service import _to_activity, _to_health

# Janela dos health records mostrados ao carer (next_due_date nos proximos N dias).
_DIARY_HEALTH_WINDOW_DAYS = 60
_DIARY_ACTIVITY_LIMIT = 10

_DURATION_DAYS = {"3d": 3, "1w": 7, "2w": 14, "1mo": 30}


def _care_url(token: str) -> str:
    return f"{settings.FRONTEND_URL}/care/{token}"


def _own_pet_or_403(sb, user: CurrentUser, pet_id: str) -> dict:
    res = sb.table("pets").select("owner_id").eq("id", pet_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    if res.data[0]["owner_id"] != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return res.data[0]


def _to_share(row: dict) -> CareShare:
    return CareShare(
        id=row["id"],
        token=row["token"],
        expires_at=row["expires_at"],
        is_active=row.get("is_active", True),
        show_diary=bool(row.get("show_diary", False)),
        created_at=row.get("created_at"),
        care_url=_care_url(row["token"]),
    )


def create_share(user: CurrentUser, body: CareShareCreate) -> CareShare:
    sb = get_service_client()
    _own_pet_or_403(sb, user, body.pet_id)
    days = _DURATION_DAYS[body.duration]
    expires_at = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    res = (
        sb.table("care_shares")
        .insert(
            {
                "pet_id": body.pet_id,
                "owner_id": user.id,
                "expires_at": expires_at,
                "is_active": True,
                "show_diary": body.show_diary,
            }
        )
        .execute()
    )
    return _to_share(res.data[0])


def list_shares(user: CurrentUser, pet_id: str) -> list[CareShare]:
    """Shares ATIVOS e nao expirados do pet (do dono)."""
    sb = get_service_client()
    _own_pet_or_403(sb, user, pet_id)
    now = datetime.now(timezone.utc).isoformat()
    res = (
        sb.table("care_shares")
        .select("*")
        .eq("pet_id", pet_id)
        .eq("is_active", True)
        .gt("expires_at", now)
        .order("created_at", desc=True)
        .execute()
    )
    return [_to_share(r) for r in (res.data or [])]


def revoke_share(user: CurrentUser, share_id: str) -> None:
    sb = get_service_client()
    res = sb.table("care_shares").select("owner_id").eq("id", share_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found")
    if res.data[0]["owner_id"] != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    sb.table("care_shares").update({"is_active": False}).eq("id", share_id).execute()


def get_care(token: str) -> CareProfile:
    """Publico: perfil completo do pet se o token estiver ativo e nao expirado.

    A expiracao e a revogacao sao verificadas na propria query (server-side).
    """
    sb = get_service_client()
    now = datetime.now(timezone.utc).isoformat()
    share_res = (
        sb.table("care_shares")
        .select("pet_id, owner_id, expires_at, show_diary")
        .eq("token", token)
        .eq("is_active", True)
        .gt("expires_at", now)
        .limit(1)
        .execute()
    )
    if not share_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Link expired or invalid"
        )
    share = share_res.data[0]

    pet_res = sb.table("pets").select("*").eq("id", share["pet_id"]).limit(1).execute()
    if not pet_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    pet = pet_res.data[0]

    prof_res = (
        sb.table("pet_profiles").select("*").eq("pet_id", share["pet_id"]).limit(1).execute()
    )
    prof = prof_res.data[0] if prof_res.data else {}

    # Telefone do dono — SEMPRE no care link (nunca email/endereco).
    owner_phone = None
    if share.get("owner_id"):
        owner_res = (
            sb.table("users").select("phone").eq("id", share["owner_id"]).limit(1).execute()
        )
        if owner_res.data:
            owner_phone = owner_res.data[0].get("phone")

    tag_res = (
        sb.table("tags")
        .select("tag_code, tag_type")
        .eq("pet_id", share["pet_id"])
        .limit(1)
        .execute()
    )
    tag = tag_res.data[0] if tag_res.data else {}

    # Diario read-only — so se o dono ativou show_diary neste link. Apenas dados
    # do PET (atividades + health records); nunca dados privados do dono.
    show_diary = bool(share.get("show_diary", False))
    diary_activities = []
    diary_health = []
    if show_diary:
        act_res = (
            sb.table("pet_activities")
            .select("*")
            .eq("pet_id", share["pet_id"])
            .order("occurred_at", desc=True)
            .limit(_DIARY_ACTIVITY_LIMIT)
            .execute()
        )
        diary_activities = [_to_activity(r) for r in (act_res.data or [])]

        limit_date = (date.today() + timedelta(days=_DIARY_HEALTH_WINDOW_DAYS)).isoformat()
        health_res = (
            sb.table("pet_health_records")
            .select("*")
            .eq("pet_id", share["pet_id"])
            .not_.is_("next_due_date", "null")
            .lte("next_due_date", limit_date)
            .order("next_due_date", desc=False)
            .execute()
        )
        diary_health = [_to_health(r) for r in (health_res.data or [])]

    return CareProfile(
        pet_name=pet["name"],
        species=pet["species"],
        breed_or_morph=pet.get("breed_or_morph"),
        sex=pet.get("sex"),
        age_years=pet.get("age_years"),
        date_of_birth=pet.get("date_of_birth"),
        colour=pet.get("colour"),
        photo_url=pet.get("photo_url"),
        tag_code=tag.get("tag_code"),
        tag_type=tag.get("tag_type"),
        medication=prof.get("medication"),
        allergies=prof.get("allergies"),
        behaviour=prof.get("behaviour"),
        likes=prof.get("likes"),
        dislikes=prof.get("dislikes"),
        feeding_schedule=prof.get("feeding_schedule"),
        emergency_notes=prof.get("emergency_notes"),
        public_notes=prof.get("public_notes"),
        private_notes=prof.get("private_notes"),
        habitat_temp_min=prof.get("habitat_temp_min"),
        habitat_temp_max=prof.get("habitat_temp_max"),
        humidity_notes=prof.get("humidity_notes"),
        lighting_notes=prof.get("lighting_notes"),
        handling_notes=prof.get("handling_notes"),
        vet_name=prof.get("vet_name"),
        vet_phone=prof.get("vet_phone"),
        owner_phone=owner_phone,
        expires_at=share["expires_at"],
        show_diary=show_diary,
        diary_activities=diary_activities,
        diary_health=diary_health,
    )
