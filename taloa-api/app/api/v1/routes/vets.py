"""Rota publica do Emergency Vet Directory."""
from fastapi import APIRouter

from app.schemas.vet import PublicVet
from app.services import vet_service

router = APIRouter(prefix="/vets", tags=["vets"])


@router.get("", response_model=list[PublicVet])
def list_vets() -> list[PublicVet]:
    return vet_service.get_active_clinics()
