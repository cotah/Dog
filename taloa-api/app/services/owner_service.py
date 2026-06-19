"""Logica do dashboard do dono: listar pets, marcar lost/found, editar pet.

Toda acao verifica que o pet pertence ao usuario logado (ou admin).
"""
from datetime import date, timedelta

from fastapi import HTTPException, status

from app.core.supabase import get_service_client
from app.schemas.auth import CurrentUser
from app.schemas.owner import (
    DashboardResponse,
    FoundReportSummary,
    HealthAlert,
    LastScan,
    OwnerInfo,
    PawPointsSummary,
    PetSummary,
    PetUpdate,
    TagInfo,
)
from app.services import paw_points_service

# Janela do badge de alerta de saude no pet card (Etapa 27).
_HEALTH_ALERT_DAYS = 30

PET_FIELDS = {
    "name",
    "species",
    "breed_or_morph",
    "sex",
    "age_years",
    "date_of_birth",
    "colour",
    "microchip",
    "photo_url",
}
PROFILE_FIELDS = {
    "allergies",
    "medication",
    "behaviour",
    "public_notes",
    "emergency_notes",
    "vet_name",
    "vet_phone",
    "show_phone",
    "show_email",
    # campos por tag_type (Etapa 19)
    "travel_notes",
    "airline_approved",
    "habitat_temp_min",
    "habitat_temp_max",
    "feeding_schedule",
    "handling_notes",
    "lighting_notes",
    "humidity_notes",
    "critical_conditions",
    "critical_medication",
    "blood_type",
}


def _get_owned_pet(sb, user: CurrentUser, pet_id: str) -> dict:
    res = sb.table("pets").select("*").eq("id", pet_id).limit(1).execute()
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pet nao encontrado"
        )
    pet = res.data[0]
    if pet["owner_id"] != user.id and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado"
        )
    return pet


def _tag_for_pet(sb, pet_id: str) -> dict | None:
    res = (
        sb.table("tags")
        .select("tag_code, status, tag_type")
        .eq("pet_id", pet_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def _health_alert_for_pet(sb, pet_id: str) -> HealthAlert | None:
    """Health record mais proximo a vencer dentro de 30 dias (ou ja expirado)."""
    today = date.today()
    limit_date = (today + timedelta(days=_HEALTH_ALERT_DAYS)).isoformat()
    res = (
        sb.table("pet_health_records")
        .select("title, record_type, next_due_date")
        .eq("pet_id", pet_id)
        .not_.is_("next_due_date", "null")
        .lte("next_due_date", limit_date)
        .order("next_due_date", desc=False)
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    row = res.data[0]
    try:
        days = (date.fromisoformat(row["next_due_date"]) - today).days
    except (ValueError, TypeError):
        return None
    return HealthAlert(
        title=row["title"],
        record_type=row["record_type"],
        next_due_date=row["next_due_date"],
        days_until=days,
    )


def get_dashboard(user: CurrentUser) -> DashboardResponse:
    sb = get_service_client()

    owner_res = (
        sb.table("users").select("name, email").eq("id", user.id).limit(1).execute()
    )
    owner = owner_res.data[0] if owner_res.data else {}

    pets_res = (
        sb.table("pets")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at")
        .execute()
    )

    pets: list[PetSummary] = []
    tag_codes: list[str] = []
    code_to_pet_name: dict[str, str] = {}

    for p in pets_res.data or []:
        tag = _tag_for_pet(sb, p["id"])
        prof_res = (
            sb.table("pet_profiles")
            .select("*")
            .eq("pet_id", p["id"])
            .limit(1)
            .execute()
        )
        prof = prof_res.data[0] if prof_res.data else {}

        last_scan = None
        if tag:
            tag_codes.append(tag["tag_code"])
            code_to_pet_name[tag["tag_code"]] = p["name"]
            scan_res = (
                sb.table("scans")
                .select("scanned_at, location_lat, location_lng, location_granted")
                .eq("tag_code", tag["tag_code"])
                .order("scanned_at", desc=True)
                .limit(1)
                .execute()
            )
            if scan_res.data:
                last_scan = LastScan(**scan_res.data[0])

        pets.append(
            PetSummary(
                id=p["id"],
                name=p["name"],
                species=p["species"],
                photo_url=p.get("photo_url"),
                breed_or_morph=p.get("breed_or_morph"),
                sex=p.get("sex"),
                age_years=p.get("age_years"),
                date_of_birth=p.get("date_of_birth"),
                colour=p.get("colour"),
                microchip=p.get("microchip"),
                allergies=prof.get("allergies"),
                medication=prof.get("medication"),
                behaviour=prof.get("behaviour"),
                public_notes=prof.get("public_notes"),
                emergency_notes=prof.get("emergency_notes"),
                vet_name=prof.get("vet_name"),
                vet_phone=prof.get("vet_phone"),
                show_phone=bool(prof.get("show_phone", True)),
                show_email=bool(prof.get("show_email", False)),
                travel_notes=prof.get("travel_notes"),
                airline_approved=prof.get("airline_approved"),
                habitat_temp_min=prof.get("habitat_temp_min"),
                habitat_temp_max=prof.get("habitat_temp_max"),
                feeding_schedule=prof.get("feeding_schedule"),
                handling_notes=prof.get("handling_notes"),
                lighting_notes=prof.get("lighting_notes"),
                humidity_notes=prof.get("humidity_notes"),
                critical_conditions=prof.get("critical_conditions"),
                critical_medication=prof.get("critical_medication"),
                blood_type=prof.get("blood_type"),
                tag=TagInfo(**tag) if tag else None,
                last_scan=last_scan,
                health_alert=_health_alert_for_pet(sb, p["id"]),
            )
        )

    pending: list[FoundReportSummary] = []
    if tag_codes:
        fr_res = (
            sb.table("found_reports")
            .select("*")
            .in_("tag_code", tag_codes)
            .eq("status", "open")
            .order("created_at", desc=True)
            .execute()
        )
        for fr in fr_res.data or []:
            pending.append(
                FoundReportSummary(
                    id=fr["id"],
                    tag_code=fr.get("tag_code"),
                    pet_name=code_to_pet_name.get(fr.get("tag_code")),
                    found_area=fr.get("found_area"),
                    notes=fr.get("notes"),
                    finder_phone=fr.get("finder_phone"),
                    created_at=fr.get("created_at"),
                )
            )

    return DashboardResponse(
        owner=OwnerInfo(name=owner.get("name"), email=owner.get("email")),
        pets=pets,
        pending_found_reports=pending,
        paw_points=PawPointsSummary(**paw_points_service.get_summary(user.id)),
    )


def mark_lost(user: CurrentUser, pet_id: str) -> str:
    sb = get_service_client()
    _get_owned_pet(sb, user, pet_id)
    tag = _tag_for_pet(sb, pet_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este pet nao tem tag vinculada",
        )
    sb.table("tags").update({"status": "lost"}).eq(
        "tag_code", tag["tag_code"]
    ).execute()
    sb.table("lost_reports").insert(
        {"pet_id": pet_id, "tag_code": tag["tag_code"], "status": "active"}
    ).execute()
    return "lost"


def mark_found(user: CurrentUser, pet_id: str) -> str:
    sb = get_service_client()
    _get_owned_pet(sb, user, pet_id)
    tag = _tag_for_pet(sb, pet_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este pet nao tem tag vinculada",
        )
    sb.table("tags").update({"status": "active"}).eq(
        "tag_code", tag["tag_code"]
    ).execute()
    sb.table("lost_reports").update({"status": "found"}).eq("pet_id", pet_id).eq(
        "status", "active"
    ).execute()
    return "active"


def update_pet(user: CurrentUser, pet_id: str, data: PetUpdate) -> None:
    sb = get_service_client()
    pet = _get_owned_pet(sb, user, pet_id)

    payload = data.model_dump(exclude_unset=True)
    pet_update = {k: v for k, v in payload.items() if k in PET_FIELDS}
    prof_update = {k: v for k, v in payload.items() if k in PROFILE_FIELDS}

    if pet_update:
        sb.table("pets").update(pet_update).eq("id", pet_id).execute()

    if prof_update:
        existing = (
            sb.table("pet_profiles")
            .select("id")
            .eq("pet_id", pet_id)
            .limit(1)
            .execute()
        )
        if existing.data:
            sb.table("pet_profiles").update(prof_update).eq(
                "pet_id", pet_id
            ).execute()
        else:
            sb.table("pet_profiles").insert(
                {"pet_id": pet_id, **prof_update}
            ).execute()

    # Paw Points: avalia foto / vet / perfil 100% (idempotente). Os pontos vao
    # para o DONO do pet (nao para um admin que esteja editando).
    fresh_pet = sb.table("pets").select("*").eq("id", pet_id).limit(1).execute()
    fresh_prof = (
        sb.table("pet_profiles").select("*").eq("pet_id", pet_id).limit(1).execute()
    )
    if fresh_pet.data:
        p = fresh_pet.data[0]
        prof = fresh_prof.data[0] if fresh_prof.data else {}
        paw_points_service.evaluate_pet(p.get("owner_id"), p, prof)
