"""Rotas do painel admin (todas exigem role admin)."""
from fastapi import APIRouter, Depends

from app.core.security import require_admin
from app.schemas.admin import (
    AdminOverview,
    LeadStatusUpdate,
    OkResponse,
    UserRoleUpdate,
    VetCreate,
    VetUpdate,
)
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/overview", response_model=AdminOverview)
def overview() -> AdminOverview:
    return admin_service.get_overview()


@router.patch("/leads/{lead_id}", response_model=OkResponse)
def update_lead(lead_id: str, body: LeadStatusUpdate) -> OkResponse:
    admin_service.update_lead_status(lead_id, body)
    return OkResponse()


@router.post("/vets", response_model=OkResponse)
def create_vet(body: VetCreate) -> OkResponse:
    admin_service.create_vet(body)
    return OkResponse()


@router.patch("/vets/{vet_id}", response_model=OkResponse)
def update_vet(vet_id: str, body: VetUpdate) -> OkResponse:
    admin_service.update_vet(vet_id, body)
    return OkResponse()


@router.patch("/users/{user_id}", response_model=OkResponse)
def update_user_role(user_id: str, body: UserRoleUpdate) -> OkResponse:
    admin_service.update_user_role(user_id, body.role)
    return OkResponse()
