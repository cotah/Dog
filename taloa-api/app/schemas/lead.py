"""Schemas de captura de lead (interesse em servicos)."""
import re

from pydantic import BaseModel, field_validator

# Servicos oferecidos no formulario publico (mesmos valores do dashboard).
ALLOWED_SERVICE_TYPES = {
    "dog_walking",
    "grooming",
    "training",
    "daycare",
    "pet_sitting",
    "emergency_support",
    "premium_tag",
    "other",
}

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LeadCreate(BaseModel):
    """Lead criado pelo dono autenticado (dashboard)."""

    service_type: str
    # servicos: dog_walking, grooming, training, daycare, pet_sitting, ...
    pet_id: str | None = None
    tag_code: str | None = None


class PublicLeadCreate(BaseModel):
    """Lead criado na pagina publica da tag (sem auth).

    O servidor resolve pet_id e owner_id a partir do tag_code — eles
    nao vem do cliente.
    """

    tag_code: str
    service_type: str
    contact_name: str
    contact_email: str
    contact_phone: str | None = None
    message: str | None = None

    @field_validator("service_type")
    @classmethod
    def validate_service_type(cls, v: str) -> str:
        if v not in ALLOWED_SERVICE_TYPES:
            raise ValueError("Invalid service type.")
        return v

    @field_validator("contact_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Please enter your name.")
        return v

    @field_validator("contact_email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip()
        if not _EMAIL_RE.match(v):
            raise ValueError("Please enter a valid email address.")
        return v


class LeadResponse(BaseModel):
    ok: bool = True
    message: str = "Thanks! We'll be in touch."


class PublicLeadResponse(BaseModel):
    ok: bool = True
    message: str = "Thanks! We'll be in touch soon."
