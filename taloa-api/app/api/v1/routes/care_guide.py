"""Exotic Care Guide (Etapa 29) — rotas autenticadas, Plus e acima.

Gating: require_active_subscription (402 sem assinatura paga ativa).
Ownership: validado no service em CADA request; 404 para especie nao-exotica.
"""
from fastapi import APIRouter, Depends, Response

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.care_guide import CareGuideResponse
from app.services import care_guide_service
from app.services.billing_service import require_active_subscription

router = APIRouter(tags=["care-guide"], dependencies=[Depends(require_active_subscription)])


@router.get("/pets/{pet_id}/care-guide", response_model=CareGuideResponse)
def get_care_guide(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> CareGuideResponse:
    return care_guide_service.get_care_guide(user, pet_id)


@router.get("/pets/{pet_id}/care-guide/pdf")
def care_guide_pdf(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> Response:
    pdf = care_guide_service.care_guide_pdf(user, pet_id)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="taloa-care-guide.pdf"'},
    )
