"""Schema do Pet Identity Card (Etapa 24) — carteira digital do pet.

REGRA: NUNCA endereco nem email do dono. Telefone do dono so quando show_phone.
"""
from pydantic import BaseModel


class PetCard(BaseModel):
    tag_code: str
    name: str
    species: str
    breed_or_morph: str | None = None
    colour: str | None = None
    sex: str | None = None
    age_years: int | None = None
    date_of_birth: str | None = None
    microchip: str | None = None
    vet_name: str | None = None
    vet_phone: str | None = None
    allergies: str | None = None
    behaviour: str | None = None
    photo_url: str | None = None          # so preenchido se o pet tiver foto
    owner_phone: str | None = None        # so preenchido se show_phone = true
    profile_url: str                      # URL publica /t/CODE (para o QR)
