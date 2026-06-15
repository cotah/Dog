"""Simula um evento assinado do Stripe (customer.subscription.created) e o envia
ao webhook local, como o Stripe (ou o `stripe` CLI) faria. Valida a cadeia
webhook -> verificacao de assinatura -> gravacao em subscriptions.

Rodar (com o backend no ar): python -m scripts.sim_webhook
"""
import hashlib
import hmac
import json
import time

import httpx

from app.config import settings
from app.core.supabase import get_service_client

USER_ID = "b0db8841-8a46-4e97-b5ac-0b6ef47eb82f"  # usuario de teste
PRICE_PLUS = "price_1TiRZZEicwuXi9uGEcBYELXp"       # plano Plus (€6,99)
WEBHOOK_URL = "http://localhost:8000/v1/webhooks/stripe"


def main() -> None:
    now = int(time.time())
    period_end = now + 30 * 24 * 3600
    sub = {
        "id": "sub_localtest_etapa18",
        "object": "subscription",
        "customer": "cus_localtest_etapa18",
        "status": "active",
        "metadata": {"user_id": USER_ID, "plan": "plus"},
        "cancel_at_period_end": False,
        "current_period_start": now,
        "current_period_end": period_end,
        "items": {
            "object": "list",
            "data": [
                {
                    "id": "si_localtest",
                    "price": {"id": PRICE_PLUS},
                    "current_period_start": now,
                    "current_period_end": period_end,
                }
            ],
        },
    }
    event = {
        "id": "evt_localtest_etapa18",
        "object": "event",
        "type": "customer.subscription.created",
        "data": {"object": sub},
    }
    payload = json.dumps(event)

    # Assina como o Stripe: header "t=<ts>,v1=<hmac_sha256(t.payload)>".
    secret = settings.STRIPE_WEBHOOK_SECRET
    signed_payload = f"{now}.{payload}".encode()
    sig = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    header = f"t={now},v1={sig}"

    resp = httpx.post(
        WEBHOOK_URL,
        content=payload,
        headers={"Stripe-Signature": header, "Content-Type": "application/json"},
        timeout=20,
    )
    print(f"Webhook HTTP {resp.status_code}: {resp.text}")

    # Confirma a gravacao no banco.
    sb = get_service_client()
    rows = (
        sb.table("subscriptions")
        .select("stripe_subscription_id, status, plan_id, current_period_end, user_id")
        .eq("user_id", USER_ID)
        .execute()
    )
    print("DB subscriptions:", json.dumps(rows.data, indent=2, default=str))


if __name__ == "__main__":
    main()
