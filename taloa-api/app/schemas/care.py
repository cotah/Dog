"""Schemas do Pet Sitter Share (Etapa 25).

REGRA: o care link mostra o perfil COMPLETO (medicacao, notas privadas, telefone
do dono) — mas NUNCA endereco nem email do dono.
"""
from typing import Literal

from pydantic import BaseModel

from app.schemas.diary import Activity, HealthRecord

# Duracoes permitidas para o link (mapeadas para dias no service).
CareDuration = Literal["3d", "1w", "2w", "1mo"]


class CareShareCreate(BaseModel):
    pet_id: str
    duration: CareDuration = "1w"
    show_diary: bool = False  # mostrar diario read-only no care link (opt-in)


class CareShare(BaseModel):
    """Resumo de um share (para o dono gerir)."""
    id: str
    token: str
    expires_at: str
    is_active: bool = True
    show_diary: bool = False
    created_at: str | None = None
    care_url: str | None = None


class CareProfile(BaseModel):
    """Perfil completo que o carer ve em /care/[token]."""
    pet_name: str
    species: str
    breed_or_morph: str | None = None
    sex: str | None = None
    age_years: int | None = None
    date_of_birth: str | None = None
    colour: str | None = None
    photo_url: str | None = None
    tag_code: str | None = None
    tag_type: str | None = None
    # cuidados
    medication: str | None = None
    allergies: str | None = None
    behaviour: str | None = None
    likes: str | None = None
    dislikes: str | None = None
    feeding_schedule: str | None = None
    emergency_notes: str | None = None
    public_notes: str | None = None
    private_notes: str | None = None      # instrucoes privadas do dono (so no care link)
    # habitat (exoticos)
    habitat_temp_min: float | None = None
    habitat_temp_max: float | None = None
    humidity_notes: str | None = None
    lighting_notes: str | None = None
    handling_notes: str | None = None
    # vet + dono
    vet_name: str | None = None
    vet_phone: str | None = None
    owner_phone: str | None = None        # SEMPRE visivel no care link (o objetivo)
    # validade (para mostrar ao carer)
    expires_at: str | None = None
    # diario read-only (so se o dono ativou show_diary) — Etapa 27.5
    show_diary: bool = False
    diary_activities: list[Activity] = []  # ultimas 10
    diary_health: list[HealthRecord] = []  # next_due_date nos proximos 60 dias
