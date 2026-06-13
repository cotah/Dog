"""Rota de captura de lead (interesse em servicos) — autenticada."""
from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.lead import LeadCreate, LeadResponse
from app.services import lead_service

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("", response_model=LeadResponse)
def create_lead(
    body: LeadCreate, user: CurrentUser = Depends(get_current_user)
) -> LeadResponse:
    lead_service.create_lead(user, body)
    return LeadResponse()
