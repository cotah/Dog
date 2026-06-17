"""Pet Sitter Share (Etapa 25) — rotas de care links.

CRUD do dono (auth) + leitura publica por token (expira/revoga server-side).
"""
from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.care import CareProfile, CareShare, CareShareCreate
from app.services import care_service

router = APIRouter(tags=["care"])


@router.post("/care-shares", response_model=CareShare, status_code=status.HTTP_201_CREATED)
def create_care_share(
    body: CareShareCreate, user: CurrentUser = Depends(get_current_user)
) -> CareShare:
    return care_service.create_share(user, body)


@router.get("/care-shares/pet/{pet_id}", response_model=list[CareShare])
def list_care_shares(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> list[CareShare]:
    return care_service.list_shares(user, pet_id)


@router.delete("/care-shares/{share_id}")
def revoke_care_share(
    share_id: str, user: CurrentUser = Depends(get_current_user)
) -> dict:
    care_service.revoke_share(user, share_id)
    return {"status": "revoked"}


@router.get("/care/{token}", response_model=CareProfile)
def get_care(token: str) -> CareProfile:
    """Publico: perfil completo do pet se o token for valido e nao expirado."""
    return care_service.get_care(token)
