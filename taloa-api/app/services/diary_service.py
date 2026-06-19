"""Pet Diary, Health Records e Shedding (Etapa 27).

Tres areas separadas:
  - pet_activities       — logs rapidos (passeio, banho, peso, alimentacao...)
  - pet_health_records   — registos formais com next_due_date (alertas)
  - pet_shedding_records — periodos de troca de pelo/pele/penas

Tudo via service-role com checagem de ownership do pet em CADA request
(mesmo padrao do care_service). Nunca exposto publicamente.

O peso e guardado como numero no campo notes da atividade 'weight' (a tabela
nao tem coluna numerica de peso). O resumo faz parse para a evolucao.
"""
import re
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core.supabase import get_service_client
from app.schemas.auth import CurrentUser
from app.schemas.diary import (
    Activity,
    ActivityCreate,
    DiarySummary,
    HealthRecord,
    HealthRecordCreate,
    HealthRecordUpdate,
    SheddingCreate,
    SheddingRecord,
    SheddingUpdate,
    UpcomingDue,
)

_DUE_WINDOW_DAYS = 60


def _own_pet_or_403(sb, user: CurrentUser, pet_id: str) -> dict:
    res = sb.table("pets").select("owner_id").eq("id", pet_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    if res.data[0]["owner_id"] != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return res.data[0]


def _owned_row_or_403(sb, table: str, row_id: str, user: CurrentUser, pet_id: str) -> dict:
    res = (
        sb.table(table)
        .select("id, owner_id, pet_id")
        .eq("id", row_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    row = res.data[0]
    if row["pet_id"] != pet_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    if row["owner_id"] != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return row


def _parse_weight(notes: str | None) -> float | None:
    if not notes:
        return None
    m = re.search(r"\d+(?:[.,]\d+)?", notes)
    if not m:
        return None
    try:
        return float(m.group(0).replace(",", "."))
    except ValueError:
        return None


# ── Activities ──────────────────────────────────────────────
def _to_activity(r: dict) -> Activity:
    return Activity(
        id=r["id"],
        activity_type=r["activity_type"],
        duration_minutes=r.get("duration_minutes"),
        distance_meters=r.get("distance_meters"),
        notes=r.get("notes"),
        recorded_by=r.get("recorded_by", "owner"),
        walker_name=r.get("walker_name"),
        occurred_at=r.get("occurred_at"),
        created_at=r.get("created_at"),
    )


def list_activities(
    user: CurrentUser, pet_id: str, limit: int = 50, offset: int = 0
) -> list[Activity]:
    sb = get_service_client()
    _own_pet_or_403(sb, user, pet_id)
    res = (
        sb.table("pet_activities")
        .select("*")
        .eq("pet_id", pet_id)
        .order("occurred_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return [_to_activity(r) for r in (res.data or [])]


def create_activity(user: CurrentUser, pet_id: str, body: ActivityCreate) -> Activity:
    sb = get_service_client()
    _own_pet_or_403(sb, user, pet_id)
    payload: dict = {
        "pet_id": pet_id,
        "owner_id": user.id,
        "activity_type": body.activity_type,
        "duration_minutes": body.duration_minutes,
        "distance_meters": body.distance_meters,
        "notes": body.notes,
        "walker_name": body.walker_name,
        "recorded_by": body.recorded_by,
    }
    if body.occurred_at:
        payload["occurred_at"] = body.occurred_at
    res = sb.table("pet_activities").insert(payload).execute()
    return _to_activity(res.data[0])


def delete_activity(user: CurrentUser, pet_id: str, activity_id: str) -> None:
    sb = get_service_client()
    _owned_row_or_403(sb, "pet_activities", activity_id, user, pet_id)
    sb.table("pet_activities").delete().eq("id", activity_id).execute()


# ── Health records ──────────────────────────────────────────
def _to_health(r: dict) -> HealthRecord:
    return HealthRecord(
        id=r["id"],
        record_type=r["record_type"],
        title=r["title"],
        description=r.get("description"),
        date=r["date"],
        next_due_date=r.get("next_due_date"),
        vet_name=r.get("vet_name"),
        attachments=r.get("attachments"),
        created_at=r.get("created_at"),
    )


def list_health(user: CurrentUser, pet_id: str) -> list[HealthRecord]:
    sb = get_service_client()
    _own_pet_or_403(sb, user, pet_id)
    res = (
        sb.table("pet_health_records")
        .select("*")
        .eq("pet_id", pet_id)
        .order("date", desc=True)
        .execute()
    )
    return [_to_health(r) for r in (res.data or [])]


def create_health(user: CurrentUser, pet_id: str, body: HealthRecordCreate) -> HealthRecord:
    sb = get_service_client()
    _own_pet_or_403(sb, user, pet_id)
    payload = {
        "pet_id": pet_id,
        "owner_id": user.id,
        "record_type": body.record_type,
        "title": body.title,
        "description": body.description,
        "date": body.date,
        "next_due_date": body.next_due_date,
        "vet_name": body.vet_name,
        "attachments": body.attachments,
    }
    res = sb.table("pet_health_records").insert(payload).execute()
    return _to_health(res.data[0])


def update_health(
    user: CurrentUser, pet_id: str, record_id: str, body: HealthRecordUpdate
) -> HealthRecord:
    sb = get_service_client()
    _owned_row_or_403(sb, "pet_health_records", record_id, user, pet_id)
    patch = body.model_dump(exclude_unset=True)
    if not patch:
        res = sb.table("pet_health_records").select("*").eq("id", record_id).execute()
        return _to_health(res.data[0])
    res = (
        sb.table("pet_health_records")
        .update(patch)
        .eq("id", record_id)
        .execute()
    )
    return _to_health(res.data[0])


def delete_health(user: CurrentUser, pet_id: str, record_id: str) -> None:
    sb = get_service_client()
    _owned_row_or_403(sb, "pet_health_records", record_id, user, pet_id)
    sb.table("pet_health_records").delete().eq("id", record_id).execute()


# ── Shedding / molting ──────────────────────────────────────
def _to_shedding(r: dict) -> SheddingRecord:
    return SheddingRecord(
        id=r["id"],
        shed_type=r["shed_type"],
        started_at=r["started_at"],
        ended_at=r.get("ended_at"),
        intensity=r.get("intensity"),
        was_complete=r.get("was_complete"),
        notes=r.get("notes"),
        created_at=r.get("created_at"),
    )


def list_shedding(user: CurrentUser, pet_id: str) -> list[SheddingRecord]:
    sb = get_service_client()
    _own_pet_or_403(sb, user, pet_id)
    res = (
        sb.table("pet_shedding_records")
        .select("*")
        .eq("pet_id", pet_id)
        .order("started_at", desc=True)
        .execute()
    )
    return [_to_shedding(r) for r in (res.data or [])]


def create_shedding(user: CurrentUser, pet_id: str, body: SheddingCreate) -> SheddingRecord:
    sb = get_service_client()
    _own_pet_or_403(sb, user, pet_id)
    payload = {
        "pet_id": pet_id,
        "owner_id": user.id,
        "shed_type": body.shed_type,
        "started_at": body.started_at,
        "ended_at": body.ended_at,
        "intensity": body.intensity,
        "was_complete": body.was_complete,
        "notes": body.notes,
    }
    res = sb.table("pet_shedding_records").insert(payload).execute()
    return _to_shedding(res.data[0])


def update_shedding(
    user: CurrentUser, pet_id: str, shedding_id: str, body: SheddingUpdate
) -> SheddingRecord:
    sb = get_service_client()
    _owned_row_or_403(sb, "pet_shedding_records", shedding_id, user, pet_id)
    patch = body.model_dump(exclude_unset=True)
    if not patch:
        res = sb.table("pet_shedding_records").select("*").eq("id", shedding_id).execute()
        return _to_shedding(res.data[0])
    res = (
        sb.table("pet_shedding_records")
        .update(patch)
        .eq("id", shedding_id)
        .execute()
    )
    return _to_shedding(res.data[0])


# ── Weekly summary ──────────────────────────────────────────
def diary_summary(user: CurrentUser, pet_id: str) -> DiarySummary:
    sb = get_service_client()
    _own_pet_or_403(sb, user, pet_id)
    today = date.today()
    week_ago_iso = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    # minutos de passeio nos ultimos 7 dias
    walks = (
        sb.table("pet_activities")
        .select("duration_minutes")
        .eq("pet_id", pet_id)
        .eq("activity_type", "walk")
        .gte("occurred_at", week_ago_iso)
        .execute()
    )
    walk_minutes = sum((w.get("duration_minutes") or 0) for w in (walks.data or []))

    # ultimo banho
    bath = (
        sb.table("pet_activities")
        .select("occurred_at")
        .eq("pet_id", pet_id)
        .eq("activity_type", "bath")
        .order("occurred_at", desc=True)
        .limit(1)
        .execute()
    )
    last_bath = bath.data[0]["occurred_at"] if bath.data else None

    # proximas renovacoes (next_due_date nos proximos 60 dias, ou ja expiradas)
    limit_date = (today + timedelta(days=_DUE_WINDOW_DAYS)).isoformat()
    due = (
        sb.table("pet_health_records")
        .select("id, record_type, title, next_due_date")
        .eq("pet_id", pet_id)
        .not_.is_("next_due_date", "null")
        .lte("next_due_date", limit_date)
        .order("next_due_date", desc=False)
        .execute()
    )
    upcoming: list[UpcomingDue] = []
    for r in due.data or []:
        ndd = r["next_due_date"]
        try:
            days = (date.fromisoformat(ndd) - today).days
        except ValueError:
            continue
        upcoming.append(
            UpcomingDue(
                id=r["id"],
                record_type=r["record_type"],
                title=r["title"],
                next_due_date=ndd,
                days_until=days,
            )
        )

    # ultima pesagem e evolucao (peso guardado em notes da atividade 'weight')
    weights = (
        sb.table("pet_activities")
        .select("notes, occurred_at")
        .eq("pet_id", pet_id)
        .eq("activity_type", "weight")
        .order("occurred_at", desc=True)
        .limit(2)
        .execute()
    )
    last_weight = None
    weight_change = None
    if weights.data:
        last_weight = _parse_weight(weights.data[0].get("notes"))
        if len(weights.data) > 1 and last_weight is not None:
            prev = _parse_weight(weights.data[1].get("notes"))
            if prev is not None:
                weight_change = round(last_weight - prev, 3)

    return DiarySummary(
        walk_minutes_week=walk_minutes,
        last_bath_at=last_bath,
        upcoming_due=upcoming,
        last_weight_kg=last_weight,
        weight_change_kg=weight_change,
    )
