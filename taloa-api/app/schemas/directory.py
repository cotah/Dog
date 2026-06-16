"""Schemas do Partners Directory (Etapa 23).

REGRA: o email do provider NUNCA sai em resposta publica (decisao 3A). Por isso
`PublicProvider` nao tem `email` (nem `notes`/`is_active`, que sao internos);
`AdminProvider` (so admin) inclui esses campos.
"""
from typing import Literal

from pydantic import BaseModel, Field

# As 18 categorias do diretorio (mesma lista do CHECK da migration 0008).
ProviderCategory = Literal[
    "vet_emergency", "vet_general", "vet_exotic",
    "grooming", "dog_walking", "dog_daycare", "dog_hotel", "pet_sitting",
    "training", "pet_shop", "fresh_food", "homemade_treats",
    "taxi_dog", "travel_services", "insurance", "photography",
    "dog_fashion", "other",
]


class PublicProvider(BaseModel):
    """Provider como visto pelo publico — SEM email/notes/is_active."""
    id: str
    name: str
    category: str
    description: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    area: str | None = None
    eircode: str | None = None
    species_supported: list[str] | None = None
    emergency_24h: bool = False
    hours: str | None = None
    price_range: str | None = None
    languages: list[str] | None = None
    is_verified: bool = False
    is_featured: bool = False
    is_taloa_partner: bool = False
    partner_discount: str | None = None
    photo_url: str | None = None
    logo_url: str | None = None
    rating: float | None = None
    review_count: int = 0


class AdminProvider(PublicProvider):
    """Provider completo (so admin) — inclui campos internos."""
    email: str | None = None
    notes: str | None = None
    is_active: bool = True
    created_at: str | None = None
    updated_at: str | None = None


class CategoryCount(BaseModel):
    category: str
    count: int


class ProviderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: ProviderCategory
    description: str | None = Field(default=None, max_length=2000)
    phone: str | None = Field(default=None, max_length=40)
    email: str | None = Field(default=None, max_length=200)
    website: str | None = Field(default=None, max_length=300)
    address: str | None = Field(default=None, max_length=300)
    area: str | None = Field(default=None, max_length=120)
    eircode: str | None = Field(default=None, max_length=20)
    species_supported: list[str] | None = None
    emergency_24h: bool = False
    hours: str | None = Field(default=None, max_length=200)
    price_range: str | None = Field(default=None, max_length=10)
    languages: list[str] | None = None
    is_verified: bool = False
    is_featured: bool = False
    is_active: bool = True
    is_taloa_partner: bool = False
    partner_discount: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)
    photo_url: str | None = Field(default=None, max_length=500)
    logo_url: str | None = Field(default=None, max_length=500)
    rating: float | None = Field(default=None, ge=0, le=5)
    review_count: int = Field(default=0, ge=0)


class ProviderUpdate(BaseModel):
    """PUT: todos os campos opcionais (so o que vier e atualizado)."""
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: ProviderCategory | None = None
    description: str | None = Field(default=None, max_length=2000)
    phone: str | None = Field(default=None, max_length=40)
    email: str | None = Field(default=None, max_length=200)
    website: str | None = Field(default=None, max_length=300)
    address: str | None = Field(default=None, max_length=300)
    area: str | None = Field(default=None, max_length=120)
    eircode: str | None = Field(default=None, max_length=20)
    species_supported: list[str] | None = None
    emergency_24h: bool | None = None
    hours: str | None = Field(default=None, max_length=200)
    price_range: str | None = Field(default=None, max_length=10)
    languages: list[str] | None = None
    is_verified: bool | None = None
    is_featured: bool | None = None
    is_active: bool | None = None
    is_taloa_partner: bool | None = None
    partner_discount: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)
    photo_url: str | None = Field(default=None, max_length=500)
    logo_url: str | None = Field(default=None, max_length=500)
    rating: float | None = Field(default=None, ge=0, le=5)
    review_count: int | None = Field(default=None, ge=0)
