"""Logica do painel admin: overview (metricas, scans, tabelas) e mutacoes."""
from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core.supabase import get_service_client
from app.schemas.admin import (
    AdminLeadRow,
    AdminOverview,
    AdminTagRow,
    AdminUserRow,
    LeadStatusUpdate,
    Metrics,
    ScanDaily,
    VetClinic,
    VetCreate,
    VetUpdate,
)

LEAD_STATUSES = {"new", "contacted", "converted", "lost"}
ROLES = {"owner", "admin", "partner"}


def get_overview() -> AdminOverview:
    sb = get_service_client()

    tags = (
        sb.table("tags").select("*").order("created_at", desc=True).execute().data or []
    )
    pets = sb.table("pets").select("id, name, owner_id").execute().data or []
    users = (
        sb.table("users")
        .select("id, email, name, role, created_at")
        .order("created_at")
        .execute()
        .data
        or []
    )
    leads = (
        sb.table("leads").select("*").order("created_at", desc=True).execute().data
        or []
    )
    vets = (
        sb.table("vet_clinics").select("*").order("name").execute().data or []
    )
    scans = sb.table("scans").select("tag_code, scanned_at").execute().data or []

    pet_by_id = {p["id"]: p for p in pets}
    user_by_id = {u["id"]: u for u in users}

    # contagem de scans por tag e por dia
    scan_count_by_tag: Counter = Counter()
    daily: Counter = Counter()
    for s in scans:
        code = s.get("tag_code")
        if code:
            scan_count_by_tag[code] += 1
        when = s.get("scanned_at")
        if when:
            daily[when[:10]] += 1  # YYYY-MM-DD

    status_counter = Counter(t["status"] for t in tags)
    metrics = Metrics(
        total_tags=len(tags),
        active=status_counter.get("active", 0),
        inactive=status_counter.get("inactive", 0),
        lost=status_counter.get("lost", 0),
        disabled=status_counter.get("disabled", 0),
        total_pets=len(pets),
        total_users=len(users),
        total_leads=len(leads),
    )

    # ultimos 30 dias (preenche zeros)
    today = datetime.now(timezone.utc).date()
    scans_daily = [
        ScanDaily(
            date=(today - timedelta(days=i)).isoformat(),
            count=daily.get((today - timedelta(days=i)).isoformat(), 0),
        )
        for i in range(29, -1, -1)
    ]

    tags_table = [
        AdminTagRow(
            tag_code=t["tag_code"],
            status=t["status"],
            pet_name=(pet_by_id.get(t.get("pet_id")) or {}).get("name"),
            owner_email=(user_by_id.get(t.get("owner_id")) or {}).get("email"),
            activated_at=t.get("activated_at"),
            scan_count=scan_count_by_tag.get(t["tag_code"], 0),
        )
        for t in tags
    ]

    leads_table = [
        AdminLeadRow(
            id=lead["id"],
            service_type=lead["service_type"],
            status=lead.get("status"),
            owner_name=(user_by_id.get(lead.get("owner_id")) or {}).get("name"),
            owner_email=(user_by_id.get(lead.get("owner_id")) or {}).get("email"),
            pet_name=(pet_by_id.get(lead.get("pet_id")) or {}).get("name"),
            created_at=lead.get("created_at"),
        )
        for lead in leads
    ]

    vets_table = [VetClinic(**v) for v in vets]

    users_table = [
        AdminUserRow(
            id=u["id"],
            email=u["email"],
            name=u.get("name"),
            role=u["role"],
            created_at=u.get("created_at"),
        )
        for u in users
    ]

    return AdminOverview(
        metrics=metrics,
        scans_daily=scans_daily,
        tags=tags_table,
        leads=leads_table,
        vets=vets_table,
        users=users_table,
    )


def update_lead_status(lead_id: str, data: LeadStatusUpdate) -> None:
    if data.status not in LEAD_STATUSES:
        raise HTTPException(status_code=400, detail="Status invalido")
    sb = get_service_client()
    sb.table("leads").update({"status": data.status}).eq("id", lead_id).execute()


def create_vet(data: VetCreate) -> None:
    sb = get_service_client()
    sb.table("vet_clinics").insert(data.model_dump()).execute()


def update_vet(vet_id: str, data: VetUpdate) -> None:
    sb = get_service_client()
    payload = data.model_dump(exclude_unset=True)
    if payload:
        sb.table("vet_clinics").update(payload).eq("id", vet_id).execute()


def update_user_role(user_id: str, role: str) -> None:
    if role not in ROLES:
        raise HTTPException(status_code=400, detail="Role invalido")
    sb = get_service_client()
    sb.table("users").update({"role": role}).eq("id", user_id).execute()
