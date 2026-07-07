"""Schemas do Travel Checklist (Etapa 28).

REGRA: nada disto e publico. So o dono autenticado (ou admin), com assinatura
ativa (Plus+), validado server-side por ownership + require_active_subscription.
"""
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

TravelType = Literal["car", "plane", "ferry", "train"]
TripScope = Literal["domestic", "international"]
ItemSection = Literal["documents", "transport", "essentials"]


class TripCreate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    travel_type: TravelType
    scope: TripScope
    destination: str | None = Field(default=None, max_length=200)
    travel_date: date


class ChecklistItem(BaseModel):
    id: str
    item_key: str | None = None   # template; None = custom
    label: str | None = None      # so custom
    section: str
    is_checked: bool = False
    due_date: str | None = None
    sort_order: int = 0


class TripSummary(BaseModel):
    id: str
    title: str | None = None
    travel_type: str
    scope: str
    destination: str | None = None
    travel_date: str
    checked_count: int = 0
    total_count: int = 0
    created_at: str | None = None


class TripDetail(TripSummary):
    items: list[ChecklistItem] = []


class CustomItemCreate(BaseModel):
    label: str = Field(min_length=1, max_length=200)


class ItemUpdate(BaseModel):
    is_checked: bool
