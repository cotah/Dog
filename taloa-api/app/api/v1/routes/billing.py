"""Rotas de planos e checkout (Etapa 18)."""
from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.billing import (
    CheckoutRequest,
    CheckoutResponse,
    PlanOut,
    SubscriptionOut,
)
from app.services import billing_service

router = APIRouter(tags=["billing"])


@router.get("/plans", response_model=list[PlanOut])
def get_plans() -> list[PlanOut]:
    """Lista os planos ativos (publico — alimenta a pagina /pricing)."""
    return [PlanOut(**p) for p in billing_service.list_plans()]


@router.post("/billing/checkout", response_model=CheckoutResponse)
def create_checkout(
    body: CheckoutRequest, user: CurrentUser = Depends(get_current_user)
) -> CheckoutResponse:
    """Cria uma Stripe Checkout Session e devolve a URL de redirecionamento."""
    url = billing_service.create_checkout_session(user, body.plan)
    return CheckoutResponse(url=url)


@router.get("/billing/subscription", response_model=SubscriptionOut)
def my_subscription(
    user: CurrentUser = Depends(get_current_user),
) -> SubscriptionOut:
    """Assinatura atual do usuario logado (free se nao houver ativa)."""
    return billing_service.subscription_out(user.id)
