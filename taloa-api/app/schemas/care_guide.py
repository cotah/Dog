"""Schemas do Exotic Care Guide (Etapa 29).

REGRA: nada disto e publico. So o dono autenticado (ou admin), com assinatura
ativa (Plus+), validado server-side por ownership + require_active_subscription.
"""
from pydantic import BaseModel


class CareGuideSection(BaseModel):
    key: str              # habitat | feeding | environment | handling | hygiene | enrichment | warning_signs
    tips: list[str]       # tip_keys (traduzidas no frontend por i18n)


class CareGuideResponse(BaseModel):
    species: str
    sections: list[CareGuideSection]
