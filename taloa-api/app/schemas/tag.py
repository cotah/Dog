"""Schemas da pagina publica da tag. NUNCA inclui dados privados do dono."""
from pydantic import BaseModel


class PublicPet(BaseModel):
    name: str
    species: str
    breed_or_morph: str | None = None
    sex: str | None = None
    age_years: int | None = None
    colour: str | None = None
    photo_url: str | None = None


class PublicProfile(BaseModel):
    # Apenas campos publicos — private_notes NUNCA entra aqui
    allergies: str | None = None
    medication: str | None = None
    behaviour: str | None = None
    likes: str | None = None
    dislikes: str | None = None
    public_notes: str | None = None
    emergency_notes: str | None = None
    vet_name: str | None = None
    vet_phone: str | None = None


class PublicContact(BaseModel):
    show_phone: bool = False
    show_email: bool = False
    phone: str | None = None       # so preenchido se show_phone = true
    whatsapp: str | None = None    # so digitos, para link wa.me
    email: str | None = None       # so preenchido se show_email = true


class LostInfo(BaseModel):
    last_seen_at: str | None = None
    last_seen_area: str | None = None
    description: str | None = None


class PublicTagResponse(BaseModel):
    tag_code: str
    status: str
    tag_type: str | None = None
    pet: PublicPet | None = None
    profile: PublicProfile | None = None
    contact: PublicContact | None = None
    lost: LostInfo | None = None
