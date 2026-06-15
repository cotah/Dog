"""Webhook do Stripe (Etapa 18).

A assinatura do payload e verificada com STRIPE_WEBHOOK_SECRET. Precisa do corpo
RAW da request (por isso lemos request.body() em vez de um schema Pydantic).
"""
from fastapi import APIRouter, Request

from app.services import billing_service

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(request: Request) -> dict:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    return billing_service.handle_event(payload, sig_header)
