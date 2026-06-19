"""Schemas do Pet Diary e Health Records (Etapa 27).

REGRA: nada disto e publico. So o dono autenticado (ou admin) acede, sempre
validado server-side por ownership do pet + RLS.
"""
from typing import Literal

from pydantic import BaseModel, Field

ActivityType = Literal[
    "walk", "grooming", "bath", "nail_trim", "ear_clean", "vet_visit",
    "medication", "weight", "note", "shedding", "molting", "feeding",
    "uv_bath", "water_change", "dental", "hairball", "habitat_check",
    "beak_trim", "socialization", "parameters_check", "treatment",
]
RecordedBy = Literal["owner", "dogwalker", "system"]
RecordType = Literal[
    "vaccine", "deworming", "vet_visit", "medication",
    "allergy", "surgery", "weight", "dental",
]
ShedType = Literal["fur", "skin", "feathers"]
Intensity = Literal["light", "medium", "heavy"]


# ── Activities ──────────────────────────────────────────────
class ActivityCreate(BaseModel):
    activity_type: ActivityType
    duration_minutes: int | None = Field(default=None, ge=0, le=100000)
    distance_meters: int | None = Field(default=None, ge=0, le=10000000)
    notes: str | None = Field(default=None, max_length=2000)
    walker_name: str | None = Field(default=None, max_length=120)
    recorded_by: RecordedBy = "owner"
    occurred_at: str | None = None


class Activity(BaseModel):
    id: str
    activity_type: str
    duration_minutes: int | None = None
    distance_meters: int | None = None
    notes: str | None = None
    recorded_by: str = "owner"
    walker_name: str | None = None
    occurred_at: str | None = None
    created_at: str | None = None


# ── Health records ──────────────────────────────────────────
class HealthRecordCreate(BaseModel):
    record_type: RecordType
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    date: str
    next_due_date: str | None = None
    vet_name: str | None = Field(default=None, max_length=120)
    attachments: list[str] | None = None


class HealthRecordUpdate(BaseModel):
    record_type: RecordType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    date: str | None = None
    next_due_date: str | None = None
    vet_name: str | None = Field(default=None, max_length=120)
    attachments: list[str] | None = None


class HealthRecord(BaseModel):
    id: str
    record_type: str
    title: str
    description: str | None = None
    date: str
    next_due_date: str | None = None
    vet_name: str | None = None
    attachments: list[str] | None = None
    created_at: str | None = None


# ── Shedding / molting ──────────────────────────────────────
class SheddingCreate(BaseModel):
    shed_type: ShedType
    started_at: str
    ended_at: str | None = None
    intensity: Intensity | None = None
    was_complete: bool | None = None
    notes: str | None = Field(default=None, max_length=2000)


class SheddingUpdate(BaseModel):
    """Fechar/editar um periodo (ex: adicionar ended_at)."""
    ended_at: str | None = None
    intensity: Intensity | None = None
    was_complete: bool | None = None
    notes: str | None = Field(default=None, max_length=2000)


class SheddingRecord(BaseModel):
    id: str
    shed_type: str
    started_at: str
    ended_at: str | None = None
    intensity: str | None = None
    was_complete: bool | None = None
    notes: str | None = None
    created_at: str | None = None


# ── Weekly summary ──────────────────────────────────────────
class UpcomingDue(BaseModel):
    id: str
    record_type: str
    title: str
    next_due_date: str
    days_until: int  # negativo = expirado


class DiarySummary(BaseModel):
    walk_minutes_week: int = 0
    last_bath_at: str | None = None
    upcoming_due: list[UpcomingDue] = []
    last_weight_kg: float | None = None
    weight_change_kg: float | None = None  # vs pesagem anterior
