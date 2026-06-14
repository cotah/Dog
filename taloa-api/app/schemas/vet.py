"""Schema publico de clinica veterinaria (Emergency Directory)."""
from pydantic import BaseModel


class PublicVet(BaseModel):
    id: str
    name: str
    phone: str
    address: str | None = None
    area: str | None = None
    species_supported: list[str] | None = None
    emergency_24h: bool = False
    hours: str | None = None
    website: str | None = None
