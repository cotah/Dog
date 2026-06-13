"""Schemas Pydantic de autenticacao e ativacao de tag."""
from pydantic import BaseModel, Field


class CurrentUser(BaseModel):
    """Usuario autenticado (resolvido a partir do JWT + banco)."""
    id: str
    email: str | None = None
    role: str


# ── Signup generico ──────────────────────────────────────────
class SignupRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    name: str | None = None
    phone: str | None = None
    gdpr_consent: bool


class SignupResponse(BaseModel):
    user_id: str
    email: str
    message: str = "Conta criada com sucesso"


# ── Ativacao de tag (cria dono + pet + ativa a tag) ──────────
class OwnerData(BaseModel):
    email: str
    password: str = Field(min_length=8)
    name: str | None = None
    phone: str | None = None
    emergency_phone: str | None = None
    gdpr_consent: bool


class PetData(BaseModel):
    name: str
    species: str = "dog"
    breed_or_morph: str | None = None
    sex: str | None = None
    age_years: int | None = None
    colour: str | None = None
    microchip: str | None = None
    photo_url: str | None = None


class ActivateRequest(BaseModel):
    owner: OwnerData
    pet: PetData


class ActivateResponse(BaseModel):
    user_id: str
    pet_id: str
    tag_code: str
    status: str = "active"
    message: str = "Tag ativada com sucesso"
