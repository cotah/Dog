"""Logica do painel admin: overview (metricas, scans, tabelas) e mutacoes."""
from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core.supabase import get_service_client
from app.schemas.admin import (
    AdminFoundReportRow,
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
TAG_TYPES = {
    "collar_tag",
    "cat_collar_tag",
    "travel_id",
    "habitat_id",
    "emergency_card",
}


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
    found_reports = (
        sb.table("found_reports")
        .select("*")
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )

    pet_by_id = {p["id"]: p for p in pets}
    user_by_id = {u["id"]: u for u in users}
    tag_by_code = {t["tag_code"]: t for t in tags}

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
        pending_found=sum(1 for fr in found_reports if fr.get("status") == "open"),
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
            tag_type=t.get("tag_type"),
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
            contact_name=lead.get("contact_name"),
            contact_email=lead.get("contact_email"),
            contact_phone=lead.get("contact_phone"),
            message=lead.get("message"),
            created_at=lead.get("created_at"),
        )
        for lead in leads
    ]

    def _owner_email_for_code(code: str | None) -> str | None:
        tag = tag_by_code.get(code) if code else None
        if not tag:
            return None
        return (user_by_id.get(tag.get("owner_id")) or {}).get("email")

    def _pet_name_for_code(code: str | None) -> str | None:
        tag = tag_by_code.get(code) if code else None
        if not tag:
            return None
        return (pet_by_id.get(tag.get("pet_id")) or {}).get("name")

    found_table = [
        AdminFoundReportRow(
            id=fr["id"],
            tag_code=fr.get("tag_code"),
            pet_name=_pet_name_for_code(fr.get("tag_code")),
            owner_email=_owner_email_for_code(fr.get("tag_code")),
            found_area=fr.get("found_area"),
            notes=fr.get("notes"),
            finder_phone=fr.get("finder_phone"),
            status=fr.get("status"),
            created_at=fr.get("created_at"),
        )
        for fr in found_reports
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
        found_reports=found_table,
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


def update_tag_type(tag_code: str, tag_type: str) -> None:
    if tag_type not in TAG_TYPES:
        raise HTTPException(status_code=400, detail="tag_type invalido")
    sb = get_service_client()
    sb.table("tags").update({"tag_type": tag_type}).eq("tag_code", tag_code).execute()
