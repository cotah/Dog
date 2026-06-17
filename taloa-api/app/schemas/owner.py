"""Schemas do dashboard do dono e edicao de pet."""
from pydantic import BaseModel


class OwnerInfo(BaseModel):
    name: str | None = None
    email: str | None = None


class TagInfo(BaseModel):
    tag_code: str
    status: str
    tag_type: str | None = None


class LastScan(BaseModel):
    scanned_at: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None
    location_granted: bool = False


class PetSummary(BaseModel):
    id: str
    name: str
    species: str
    photo_url: str | None = None
    breed_or_morph: str | None = None
    sex: str | None = None
    age_years: int | None = None
    date_of_birth: str | None = None
    colour: str | None = None
    microchip: str | None = None
    # campos do perfil (para pre-preencher a edicao)
    allergies: str | None = None
    medication: str | None = None
    behaviour: str | None = None
    public_notes: str | None = None
    emergency_notes: str | None = None
    vet_name: str | None = None
    vet_phone: str | None = None
    show_phone: bool = True
    show_email: bool = False
    # campos por tag_type (Etapa 19)
    travel_notes: str | None = None
    airline_approved: bool | None = None
    habitat_temp_min: float | None = None
    habitat_temp_max: float | None = None
    feeding_schedule: str | None = None
    handling_notes: str | None = None
    lighting_notes: str | None = None
    humidity_notes: str | None = None
    critical_conditions: str | None = None
    critical_medication: str | None = None
    blood_type: str | None = None
    tag: TagInfo | None = None
    last_scan: LastScan | None = None


class FoundReportSummary(BaseModel):
    id: str
    tag_code: str | None = None
    pet_name: str | None = None
    found_area: str | None = None
    notes: str | None = None
    finder_phone: str | None = None
    created_at: str | None = None


class PawTransaction(BaseModel):
    points: int
    reason: str
    created_at: str | None = None


class PawPointsSummary(BaseModel):
    total: int = 0
    total_earned: int = 0
    transactions: list[PawTransaction] = []


class DashboardResponse(BaseModel):
    owner: OwnerInfo
    pets: list[PetSummary]
    pending_found_reports: list[FoundReportSummary]
    paw_points: PawPointsSummary = PawPointsSummary()


class PetUpdate(BaseModel):
    name: str | None = None
    species: str | None = None
    breed_or_morph: str | None = None
    sex: str | None = None
    age_years: int | None = None
    date_of_birth: str | None = None
    colour: str | None = None
    microchip: str | None = None
    photo_url: str | None = None
    # perfil
    allergies: str | None = None
    medication: str | None = None
    behaviour: str | None = None
    public_notes: str | None = None
    emergency_notes: str | None = None
    vet_name: str | None = None
    vet_phone: str | None = None
    show_phone: bool | None = None
    show_email: bool | None = None
    # campos por tag_type (Etapa 19)
    travel_notes: str | None = None
    airline_approved: bool | None = None
    habitat_temp_min: float | None = None
    habitat_temp_max: float | None = None
    feeding_schedule: str | None = None
    handling_notes: str | None = None
    lighting_notes: str | None = None
    humidity_notes: str | None = None
    critical_conditions: str | None = None
    critical_medication: str | None = None
    blood_type: str | None = None


class ActionResponse(BaseModel):
    ok: bool = True
    status: str | None = None
