"""Pagamentos e assinaturas via Stripe (Etapa 18).

Toda a logica vive aqui (regra TALOA: negocio no FastAPI). O frontend so:
1) le os planos (GET /v1/plans),
2) pede um checkout (POST /v1/billing/checkout) e e redirecionado ao Stripe,
3) o Stripe avisa o resultado via webhook (POST /v1/webhooks/stripe).
"""
from datetime import datetime, timezone

import stripe
from fastapi import Depends, HTTPException, status

from app.config import settings
from app.core.security import get_current_user
from app.core.supabase import get_service_client
from app.schemas.auth import CurrentUser
from app.schemas.billing import SubscriptionOut

stripe.api_key = settings.STRIPE_SECRET_KEY

# Status do Stripe que liberam acesso premium.
ACTIVE_STATUSES = ("active", "trialing", "past_due")


def _ts(value: int | None) -> str | None:
    """Unix timestamp (Stripe) -> ISO 8601 UTC."""
    if not value:
        return None
    return datetime.fromtimestamp(value, tz=timezone.utc).isoformat()


# ── Planos ───────────────────────────────────────────────────
def list_plans() -> list[dict]:
    sb = get_service_client()
    res = (
        sb.table("plans")
        .select("*")
        .eq("is_active", True)
        .order("sort_order")
        .execute()
    )
    return res.data or []


def _get_plan_by_name(name: str) -> dict | None:
    sb = get_service_client()
    res = sb.table("plans").select("*").eq("name", name).limit(1).execute()
    return res.data[0] if res.data else None


# ── Checkout ─────────────────────────────────────────────────
def _ensure_customer(user: CurrentUser) -> str:
    """Retorna o stripe_customer_id do usuario, criando o customer se preciso."""
    sb = get_service_client()
    res = (
        sb.table("users")
        .select("stripe_customer_id, email, name")
        .eq("id", user.id)
        .limit(1)
        .execute()
    )
    row = res.data[0] if res.data else {}
    if row.get("stripe_customer_id"):
        return row["stripe_customer_id"]

    customer = stripe.Customer.create(
        email=row.get("email") or user.email,
        name=row.get("name"),
        metadata={"user_id": user.id},
    )
    sb.table("users").update({"stripe_customer_id": customer.id}).eq(
        "id", user.id
    ).execute()
    return customer.id


def create_checkout_session(user: CurrentUser, plan_name: str) -> str:
    plan = _get_plan_by_name(plan_name)
    if not plan or not plan.get("stripe_price_id"):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Plano nao encontrado")
    if plan["name"] == "free":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "O plano Free nao requer checkout"
        )

    customer_id = _ensure_customer(user)
    mode = "payment" if plan["billing_interval"] == "one_time" else "subscription"
    base = settings.FRONTEND_URL.rstrip("/")

    kwargs: dict = {
        "mode": mode,
        "customer": customer_id,
        "line_items": [{"price": plan["stripe_price_id"], "quantity": 1}],
        "client_reference_id": user.id,
        "success_url": f"{base}/owner/dashboard?checkout=success",
        "cancel_url": f"{base}/pricing?checkout=cancel",
        "metadata": {"user_id": user.id, "plan": plan["name"]},
    }
    # Propaga o user_id para a subscription, para o webhook saber de quem e.
    if mode == "subscription":
        kwargs["subscription_data"] = {
            "metadata": {"user_id": user.id, "plan": plan["name"]}
        }

    session = stripe.checkout.Session.create(**kwargs)
    return session.url


# ── Assinatura atual / acesso por plano ──────────────────────
def get_active_subscription(user_id: str) -> dict | None:
    """Assinatura ativa do usuario (com o plano embutido), ou None."""
    sb = get_service_client()
    res = (
        sb.table("subscriptions")
        .select("*, plan:plans(name, display_name, max_pets)")
        .eq("user_id", user_id)
        .in_("status", list(ACTIVE_STATUSES))
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def subscription_out(user_id: str) -> SubscriptionOut:
    sub = get_active_subscription(user_id)
    if not sub:
        return SubscriptionOut(active=False, plan="free", max_pets=1)
    plan = sub.get("plan") or {}
    return SubscriptionOut(
        active=True,
        plan=plan.get("name"),
        plan_display_name=plan.get("display_name"),
        status=sub.get("status"),
        current_period_end=sub.get("current_period_end"),
        cancel_at_period_end=sub.get("cancel_at_period_end", False),
        max_pets=plan.get("max_pets", 1),
    )


def require_active_subscription(
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    """Dependency FastAPI: 402 se o usuario nao tiver assinatura ativa.

    Uso: `sub = Depends(require_active_subscription)` numa rota premium.
    """
    sub = get_active_subscription(user.id)
    if not sub:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            "Esta funcionalidade requer uma assinatura ativa.",
        )
    return sub


# ── Webhook ──────────────────────────────────────────────────
def _upsert_subscription(sub: dict) -> None:
    """Cria/atualiza a linha em subscriptions a partir do objeto do Stripe."""
    sb = get_service_client()

    user_id = (sub.get("metadata") or {}).get("user_id")
    customer_id = sub.get("customer")
    if not user_id and customer_id:
        u = (
            sb.table("users")
            .select("id")
            .eq("stripe_customer_id", customer_id)
            .limit(1)
            .execute()
        )
        user_id = u.data[0]["id"] if u.data else None
    if not user_id:
        return  # nao da pra vincular — ignora com seguranca

    items = (sub.get("items") or {}).get("data") or [{}]
    item = items[0]
    price_id = (item.get("price") or {}).get("id")

    plan_id = None
    if price_id:
        pl = (
            sb.table("plans")
            .select("id")
            .eq("stripe_price_id", price_id)
            .limit(1)
            .execute()
        )
        plan_id = pl.data[0]["id"] if pl.data else None

    # current_period_* pode estar no topo (API antiga) ou no item (API nova).
    cps = sub.get("current_period_start") or item.get("current_period_start")
    cpe = sub.get("current_period_end") or item.get("current_period_end")

    sb.table("subscriptions").upsert(
        {
            "user_id": user_id,
            "plan_id": plan_id,
            "stripe_subscription_id": sub["id"],
            "stripe_customer_id": customer_id,
            "status": sub.get("status", "active"),
            "current_period_start": _ts(cps),
            "current_period_end": _ts(cpe),
            "cancel_at_period_end": sub.get("cancel_at_period_end", False),
        },
        on_conflict="stripe_subscription_id",
    ).execute()


def _mark_canceled(sub: dict) -> None:
    sb = get_service_client()
    sb.table("subscriptions").update({"status": "canceled"}).eq(
        "stripe_subscription_id", sub["id"]
    ).execute()


def handle_event(payload: bytes, sig_header: str) -> dict:
    """Verifica a assinatura e processa o evento do Stripe."""
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Assinatura invalida")

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type in (
        "customer.subscription.created",
        "customer.subscription.updated",
    ):
        _upsert_subscription(obj)
    elif event_type == "customer.subscription.deleted":
        _mark_canceled(obj)
    # checkout.session.completed (subscription) ja vem coberto pelo
    # customer.subscription.created. Pagamento unico (premium_tag) nao gera
    # subscription — apenas confirma o pagamento, sem registro recorrente.

    return {"received": True}
