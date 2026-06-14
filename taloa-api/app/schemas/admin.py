"""Schemas do painel admin."""
from pydantic import BaseModel


class Metrics(BaseModel):
    total_tags: int
    active: int
    inactive: int
    lost: int
    disabled: int
    total_pets: int
    total_users: int
    total_leads: int


class ScanDaily(BaseModel):
    date: str
    count: int


class AdminTagRow(BaseModel):
    tag_code: str
    status: str
    pet_name: str | None = None
    owner_email: str | None = None
    activated_at: str | None = None
    scan_count: int = 0


class AdminLeadRow(BaseModel):
    id: str
    service_type: str
    status: str | None = None
    owner_name: str | None = None
    owner_email: str | None = None
    pet_name: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    message: str | None = None
    created_at: str | None = None


class VetClinic(BaseModel):
    id: str
    name: str
    phone: str
    address: str | None = None
    area: str | None = None
    species_supported: list[str] | None = None
    emergency_24h: bool = False
    hours: str | None = None
    website: str | None = None
    notes: str | None = None
    is_verified: bool = False
    is_active: bool = True


class AdminUserRow(BaseModel):
    id: str
    email: str
    name: str | None = None
    role: str
    created_at: str | None = None


class AdminOverview(BaseModel):
    metrics: Metrics
    scans_daily: list[ScanDaily]
    tags: list[AdminTagRow]
    leads: list[AdminLeadRow]
    vets: list[VetClinic]
    users: list[AdminUserRow]


# ── Mutacoes ──
class LeadStatusUpdate(BaseModel):
    status: str


class VetCreate(BaseModel):
    name: str
    phone: str
    address: str | None = None
    area: str | None = None
    species_supported: list[str] | None = None
    emergency_24h: bool = False
    hours: str | None = None
    website: str | None = None
    notes: str | None = None
    is_verified: bool = False
    is_active: bool = True


class VetUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None
    area: str | None = None
    species_supported: list[str] | None = None
    emergency_24h: bool | None = None
    hours: str | None = None
    website: str | None = None
    notes: str | None = None
    is_verified: bool | None = None
    is_active: bool | None = None


class UserRoleUpdate(BaseModel):
    role: str


class OkResponse(BaseModel):
    ok: bool = True
