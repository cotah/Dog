"""Rotas de acoes sobre o pet (autenticadas): lost, found e edicao."""
from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.owner import ActionResponse, PetUpdate
from app.services import owner_service

router = APIRouter(prefix="/pets", tags=["pets"])


@router.post("/{pet_id}/lost", response_model=ActionResponse)
def mark_lost(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> ActionResponse:
    new_status = owner_service.mark_lost(user, pet_id)
    return ActionResponse(status=new_status)


@router.post("/{pet_id}/found", response_model=ActionResponse)
def mark_found(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> ActionResponse:
    new_status = owner_service.mark_found(user, pet_id)
    return ActionResponse(status=new_status)


@router.patch("/{pet_id}", response_model=ActionResponse)
def update_pet(
    pet_id: str,
    body: PetUpdate,
    user: CurrentUser = Depends(get_current_user),
) -> ActionResponse:
    owner_service.update_pet(user, pet_id, body)
    return ActionResponse()
