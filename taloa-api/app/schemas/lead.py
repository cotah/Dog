"""Schema de captura de lead (interesse em servicos)."""
from pydantic import BaseModel


class LeadCreate(BaseModel):
    service_type: str
    # servicos: dog_walking, grooming, training, daycare, pet_sitting, ...
    pet_id: str | None = None
    tag_code: str | None = None


class LeadResponse(BaseModel):
    ok: bool = True
    message: str = "Thanks! We'll be in touch."
