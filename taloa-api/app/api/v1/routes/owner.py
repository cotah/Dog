"""Rotas da area do dono (autenticadas)."""
from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.owner import DashboardResponse
from app.services import owner_service

router = APIRouter(prefix="/owner", tags=["owner"])


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(user: CurrentUser = Depends(get_current_user)) -> DashboardResponse:
    return owner_service.get_dashboard(user)
