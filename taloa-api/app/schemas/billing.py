"""Schemas de planos e assinaturas (Etapa 18)."""
from pydantic import BaseModel, Field


class PlanOut(BaseModel):
    """Plano exposto na pagina /pricing (publico)."""

    name: str
    display_name: str
    description: str | None = None
    price_eur: float
    billing_interval: str
    max_pets: int
    features: list[str] = Field(default_factory=list)
    sort_order: int = 0


class CheckoutRequest(BaseModel):
    """O cliente envia apenas o NOME do plano — o price_id e resolvido no
    backend (nunca confiar em preco/price_id vindo do cliente)."""

    plan: str


class CheckoutResponse(BaseModel):
    url: str


class SubscriptionOut(BaseModel):
    """Assinatura atual do usuario logado."""

    active: bool = False
    plan: str | None = None
    plan_display_name: str | None = None
    status: str | None = None
    current_period_end: str | None = None
    cancel_at_period_end: bool = False
    max_pets: int = 1
