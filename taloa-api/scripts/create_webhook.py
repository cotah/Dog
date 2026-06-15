"""Cria (idempotente) o endpoint de webhook do Stripe apontando para o backend
de producao. Imprime o signing secret (whsec_...) para configurar no Railway
como STRIPE_WEBHOOK_SECRET.

Rodar: python -m scripts.create_webhook
"""
import stripe

from app.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

URL = "https://dog-production-a375.up.railway.app/v1/webhooks/stripe"
EVENTS = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
]


def main() -> None:
    existing = stripe.WebhookEndpoint.list(limit=100)
    for ep in existing.data:
        if ep.url == URL:
            print(f"JA_EXISTE id={ep.id} (secret so aparece na criacao)")
            print("Se precisar do secret, apague no dashboard e rode de novo.")
            return

    ep = stripe.WebhookEndpoint.create(
        url=URL,
        enabled_events=EVENTS,
        description="TALOA producao (Etapa 18)",
    )
    print(f"CRIADO id={ep.id}")
    print(f"WHSEC={ep.secret}")


if __name__ == "__main__":
    main()
