"""Rotas de autenticacao: signup, ativacao de tag e /me (teste de JWT)."""
from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.auth import (
    ActivateRequest,
    ActivateResponse,
    CurrentUser,
    SignupRequest,
    SignupResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse)
def signup(body: SignupRequest) -> SignupResponse:
    """Cria a conta do dono (auth + perfil). Depois o frontend faz login no Supabase."""
    return auth_service.signup(body)


@router.post("/activate/{tag_code}", response_model=ActivateResponse)
def activate(tag_code: str, body: ActivateRequest) -> ActivateResponse:
    """Ativa uma tag 'inactive': cria dono + pet e marca a tag como 'active'."""
    return auth_service.activate_tag(tag_code, body)


@router.get("/me", response_model=CurrentUser)
def me(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Retorna o usuario autenticado. Serve para validar o JWT ponta a ponta."""
    return user
