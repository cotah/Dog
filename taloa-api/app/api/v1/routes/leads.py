"""Rotas de captura de lead (interesse em servicos)."""
from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.lead import (
    LeadCreate,
    LeadResponse,
    PublicLeadCreate,
    PublicLeadResponse,
)
from app.services import lead_service

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("", response_model=LeadResponse)
def create_lead(
    body: LeadCreate, user: CurrentUser = Depends(get_current_user)
) -> LeadResponse:
    """Lead do dashboard autenticado (dono)."""
    lead_service.create_lead(user, body)
    return LeadResponse()


@router.post("/public", response_model=PublicLeadResponse)
def create_public_lead(body: PublicLeadCreate) -> PublicLeadResponse:
    """Lead da pagina publica da tag (sem auth)."""
    lead_service.create_public_lead(body)
    return PublicLeadResponse()
