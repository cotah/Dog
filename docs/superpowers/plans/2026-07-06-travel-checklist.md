# Travel Checklist (Etapa 28) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Checklist interativa de viagem por pet (especie + tipo + escopo + data), com itens gerados por template, prazos, itens custom e PDF — Plus e acima.

**Architecture:** Templates em dict Python no `travel_service.py`; instancias em 2 tabelas novas (`pet_trips`, `trip_checklist_items`) com RLS padrao Diary (owner_id em cada linha). 8 endpoints em `routes/trips.py` com `require_active_subscription` (402 Free). Frontend = aba "Travel" dentro do `DiaryView` existente. Spec aprovada: `docs/superpowers/specs/2026-07-06-travel-checklist-design.md`.

**Tech Stack:** FastAPI + Pydantic + supabase-py + reportlab (backend) · Next.js 15 + next-intl + RHF/Zod (frontend) · pytest com FakeSupabase (tests).

**Desvio da spec (aprovado em self-review):** as 2 tabelas ganham coluna `owner_id` (igual as tabelas do Diary) para RLS simples `auth.uid() = owner_id` — a spec original validava ownership so via join com pets.

---

### Task 1: Migration 0015 (tabelas + RLS)

**Files:**
- Create: `supabase/migrations/20260706000001_travel_checklist.sql`

- [ ] **Step 1: Escrever a migration**

```sql
-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0015: Travel Checklist (Etapa 28)
-- Checklist de preparacao de viagem por pet. Duas tabelas:
--   pet_trips            — uma viagem (tipo, escopo, data, destino)
--   trip_checklist_items — itens da checklist (template ou custom)
-- Itens de template guardam item_key (i18n no frontend); custom guardam label.
-- RLS: dono ve/edita SO os seus; admin ve tudo. Nunca publico.
-- Feature Plus+ — o gating por plano e feito na API (require_active_subscription).
-- ════════════════════════════════════════════════════════════

-- ── pet_trips ───────────────────────────────────────────────
CREATE TABLE public.pet_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  travel_type TEXT NOT NULL CHECK (travel_type IN ('car', 'plane', 'ferry', 'train')),
  scope TEXT NOT NULL CHECK (scope IN ('domestic', 'international')),
  destination TEXT,
  travel_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pet_trips_pet ON public.pet_trips(pet_id, travel_date DESC);

-- ── trip_checklist_items ────────────────────────────────────
CREATE TABLE public.trip_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.pet_trips(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_key TEXT,
  label TEXT,
  section TEXT NOT NULL CHECK (section IN ('documents', 'transport', 'essentials')),
  is_checked BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- template XOR custom: exatamente um dos dois preenchido
  CONSTRAINT trip_item_key_xor_label CHECK (
    (item_key IS NOT NULL AND label IS NULL) OR (item_key IS NULL AND label IS NOT NULL)
  )
);

CREATE INDEX idx_trip_items_trip ON public.trip_checklist_items(trip_id, sort_order);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.pet_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY pet_trips_select ON public.pet_trips
  FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_trips_insert ON public.pet_trips
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_trips_update ON public.pet_trips
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_trips_delete ON public.pet_trips
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY trip_items_select ON public.trip_checklist_items
  FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY trip_items_insert ON public.trip_checklist_items
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY trip_items_update ON public.trip_checklist_items
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY trip_items_delete ON public.trip_checklist_items
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());
```

- [ ] **Step 2: Aplicar a migration no Supabase**

ATENCAO: aplicar SOMENTE no projeto `loopcoxvtboytwwjwoeg` (banco "Dog" da TALOA).
Confirmar o project_id contra a `SUPABASE_URL` do `taloa-api/.env` antes.
Usar a tool MCP `mcp__claude_ai_Supabase__apply_migration` com
`project_id: loopcoxvtboytwwjwoeg`, `name: travel_checklist` e o SQL acima.
Verificar com `mcp__claude_ai_Supabase__list_tables` que `pet_trips` e
`trip_checklist_items` existem e tem `rls_enabled: true`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260706000001_travel_checklist.sql
git commit -m "db: tabelas pet_trips e trip_checklist_items com RLS (Etapa 28)"
```

---

### Task 2: Suporte a `.in_()` no FakeSupabase dos testes

O `require_active_subscription` usa `.in_("status", [...])` (billing_service.py:118) e o fake atual (`tests/conftest.py`) nao tem esse metodo — os testes de gating precisariam dele.

**Files:**
- Modify: `taloa-api/tests/conftest.py` (classe `_FakeQuery`, apos o metodo `eq`, ~linha 74)

- [ ] **Step 1: Adicionar o metodo `in_` ao `_FakeQuery`**

```python
    def in_(self, column, values):
        vals = list(values)
        self._filters.append(lambda r: r.get(column) in vals)
        return self
```

- [ ] **Step 2: Rodar a suite existente para garantir que nada quebrou**

Run: `cd taloa-api; .venv\Scripts\python.exe -m pytest tests/ -q`
Expected: 26 passed (suite atual intacta)

- [ ] **Step 3: Commit**

```bash
git add taloa-api/tests/conftest.py
git commit -m "chore: FakeSupabase suporta .in_() para testes de assinatura"
```

---

### Task 3: Schemas Pydantic (`schemas/travel.py`)

**Files:**
- Create: `taloa-api/app/schemas/travel.py`

- [ ] **Step 1: Escrever os schemas**

```python
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
```

- [ ] **Step 2: Commit**

```bash
git add taloa-api/app/schemas/travel.py
git commit -m "feat: schemas do Travel Checklist (Etapa 28)"
```

---

### Task 4: Testes que definem o comportamento (TDD — escrever ANTES do service)

**Files:**
- Create: `taloa-api/tests/test_travel.py`

- [ ] **Step 1: Escrever os testes (vao falhar — rotas nao existem)**

```python
"""Travel Checklist (Etapa 28) — geracao por template, gating Plus+, CRUD.

Padrao da suite: fake do Supabase em memoria + dependency override do auth.
O gating usa billing_service.get_active_subscription, entao o monkeypatch
cobre os DOIS modulos (travel_service e billing_service).
"""
import pytest

from tests.conftest import FakeSupabase


def _seed(fake_sb, monkeypatch, species="dog", with_sub=True):
    from app.services import billing_service, travel_service

    monkeypatch.setattr(travel_service, "get_service_client", lambda: fake_sb)
    monkeypatch.setattr(billing_service, "get_service_client", lambda: fake_sb)
    fake_sb.store["pets"] = [
        {"id": "pet-1", "owner_id": "owner-1", "species": species, "name": "Rex"},
    ]
    if with_sub:
        fake_sb.store["subscriptions"] = [{
            "id": "sub-1", "user_id": "owner-1", "status": "active",
            "plan": {"name": "plus", "display_name": "Plus", "max_pets": 2},
            "created_at": "2026-01-01T00:00:00+00:00",
        }]


def _create_trip(client, **overrides):
    body = {
        "travel_type": "plane", "scope": "international",
        "travel_date": "2026-09-01", "destination": "Lisbon",
    }
    body.update(overrides)
    return client.post("/v1/pets/pet-1/trips", json=body)


# ── Gating e ownership ───────────────────────────────────────
def test_free_user_gets_402(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, with_sub=False)
    assert _create_trip(as_owner).status_code == 402
    assert as_owner.get("/v1/pets/pet-1/trips").status_code == 402


def test_other_owner_gets_403(as_other, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    fake_sb.store["subscriptions"].append({
        "id": "sub-2", "user_id": "owner-2", "status": "active",
        "plan": {"name": "plus"}, "created_at": "2026-01-01T00:00:00+00:00",
    })
    assert _create_trip(as_other).status_code == 403


# ── Geracao por template ─────────────────────────────────────
def test_plane_international_dog_has_passport_and_crate(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, species="dog")
    r = _create_trip(as_owner)
    assert r.status_code == 201
    keys = {i["item_key"] for i in r.json()["items"]}
    assert "eu_pet_passport" in keys
    assert "rabies_vaccine" in keys
    assert "iata_crate" in keys
    assert "car_harness" not in keys  # item de carro nao entra em aviao


def test_car_domestic_dog_has_no_passport(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, species="dog")
    r = _create_trip(as_owner, travel_type="car", scope="domestic")
    keys = {i["item_key"] for i in r.json()["items"]}
    assert "eu_pet_passport" not in keys
    assert "iata_crate" not in keys
    assert "car_harness" in keys
    assert "food_supply" in keys  # base entra sempre


def test_species_specific_items(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, species="reptile")
    r = _create_trip(as_owner, travel_type="car", scope="domestic")
    keys = {i["item_key"] for i in r.json()["items"]}
    assert "heat_pack" in keys          # so repteis
    assert "rabies_vaccine" not in keys  # so dog/cat internacional
    assert "waste_bags" not in keys      # so caes


def test_due_date_from_travel_date(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    r = _create_trip(as_owner, travel_date="2026-09-01")
    items = {i["item_key"]: i for i in r.json()["items"]}
    # rabies_vaccine tem days_before=21 -> 2026-08-11
    assert items["rabies_vaccine"]["due_date"] == "2026-08-11"
    # itens sem days_before nao tem due_date
    assert items["food_supply"]["due_date"] is None


# ── CRUD ─────────────────────────────────────────────────────
def test_list_trips_with_progress(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip = _create_trip(as_owner).json()
    item_id = trip["items"][0]["id"]
    as_owner.patch(f"/v1/trips/{trip['id']}/items/{item_id}", json={"is_checked": True})
    lst = as_owner.get("/v1/pets/pet-1/trips").json()
    assert len(lst) == 1
    assert lst[0]["checked_count"] == 1
    assert lst[0]["total_count"] == len(trip["items"])


def test_toggle_item(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip = _create_trip(as_owner).json()
    item_id = trip["items"][0]["id"]
    r = as_owner.patch(f"/v1/trips/{trip['id']}/items/{item_id}", json={"is_checked": True})
    assert r.status_code == 200 and r.json()["is_checked"] is True
    r = as_owner.patch(f"/v1/trips/{trip['id']}/items/{item_id}", json={"is_checked": False})
    assert r.json()["is_checked"] is False


def test_custom_item_create_and_delete(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip = _create_trip(as_owner).json()
    r = as_owner.post(f"/v1/trips/{trip['id']}/items", json={"label": "Brinquedo favorito"})
    assert r.status_code == 201
    item = r.json()
    assert item["item_key"] is None and item["label"] == "Brinquedo favorito"
    assert item["section"] == "essentials"
    r = as_owner.delete(f"/v1/trips/{trip['id']}/items/{item['id']}")
    assert r.status_code == 200
    detail = as_owner.get(f"/v1/trips/{trip['id']}").json()
    assert item["id"] not in {i["id"] for i in detail["items"]}


def test_delete_trip_cascades_items(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip = _create_trip(as_owner).json()
    r = as_owner.delete(f"/v1/trips/{trip['id']}")
    assert r.status_code == 200
    # fake nao tem FK cascade — o service apaga os itens explicitamente
    assert fake_sb.store.get("trip_checklist_items", []) == []
    assert as_owner.get(f"/v1/trips/{trip['id']}").status_code == 404


def test_trip_of_other_owner_404_or_403(as_other, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    fake_sb.store["pet_trips"] = [{
        "id": "trip-1", "pet_id": "pet-1", "owner_id": "owner-1",
        "travel_type": "car", "scope": "domestic", "travel_date": "2026-09-01",
    }]
    fake_sb.store["subscriptions"].append({
        "id": "sub-2", "user_id": "owner-2", "status": "active",
        "plan": {"name": "plus"}, "created_at": "2026-01-01T00:00:00+00:00",
    })
    assert as_other.get("/v1/trips/trip-1").status_code == 403


def test_pdf_endpoint(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip = _create_trip(as_owner).json()
    r = as_owner.get(f"/v1/trips/{trip['id']}/pdf")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:4] == b"%PDF"
```

- [ ] **Step 2: Rodar e confirmar que falham por rota inexistente**

Run: `cd taloa-api; .venv\Scripts\python.exe -m pytest tests/test_travel.py -q`
Expected: ERRORS/FAILURES com `ModuleNotFoundError: app.services.travel_service`
(no import do `_seed`) — e as chamadas HTTP dariam 404. E o vermelho esperado do TDD.

- [ ] **Step 3: Commit**

```bash
git add taloa-api/tests/test_travel.py
git commit -m "test: casos do Travel Checklist antes da implementacao (TDD)"
```

---

### Task 5: Service com templates e PDF (`services/travel_service.py`)

**Files:**
- Create: `taloa-api/app/services/travel_service.py`

- [ ] **Step 1: Escrever o service completo**

```python
"""Travel Checklist (Etapa 28): templates por especie/tipo/escopo + CRUD + PDF.

Templates vivem AQUI (backend) — o frontend so consome a API (regra 7 do
CLAUDE.md). Itens de template guardam item_key (traduzido no frontend);
itens custom guardam label (texto livre do dono). PDF em ingles na v1.
Conteudo orientativo de preparacao de viagem — sem diagnostico/prescricao.
"""
import io
from datetime import date, timedelta

from fastapi import HTTPException, status
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from app.core.supabase import get_service_client
from app.schemas.auth import CurrentUser
from app.schemas.travel import (
    ChecklistItem,
    CustomItemCreate,
    ItemUpdate,
    TripCreate,
    TripDetail,
    TripSummary,
)

# Identidade visual TALOA (mesmos tons do card_service).
BRAND = HexColor("#1A3A5C")
MUTED = HexColor("#64748B")
INK = HexColor("#1F2937")

# ── Templates ────────────────────────────────────────────────
# Regras opcionais por item: "types", "scopes", "species" (listas).
# Ausente = aplica a todos. "days_before" gera due_date = travel_date - N dias.
TEMPLATE_ITEMS: list[dict] = [
    # ── documents ──
    {"key": "taloa_tag_check", "section": "documents"},
    {"key": "vaccination_record", "section": "documents", "days_before": 7},
    {"key": "eu_pet_passport", "section": "documents",
     "scopes": ["international"], "days_before": 30},
    {"key": "microchip_check", "section": "documents",
     "scopes": ["international"], "days_before": 30},
    {"key": "rabies_vaccine", "section": "documents",
     "scopes": ["international"], "days_before": 21, "species": ["dog", "cat"]},
    {"key": "tapeworm_treatment", "section": "documents",
     "scopes": ["international"], "days_before": 3, "species": ["dog"]},
    {"key": "health_certificate", "section": "documents",
     "scopes": ["international"], "days_before": 10},
    {"key": "destination_vet_contact", "section": "documents",
     "scopes": ["international"], "days_before": 7},
    {"key": "insurance_docs", "section": "documents",
     "scopes": ["international"], "days_before": 14},
    # ── transport ──
    {"key": "airline_pet_policy", "section": "transport",
     "types": ["plane"], "days_before": 30},
    {"key": "iata_crate", "section": "transport",
     "types": ["plane"], "days_before": 14},
    {"key": "crate_label", "section": "transport", "types": ["plane"]},
    {"key": "car_harness", "section": "transport", "types": ["car"]},
    {"key": "travel_breaks_plan", "section": "transport",
     "types": ["car"], "species": ["dog"]},
    {"key": "window_shade", "section": "transport", "types": ["car"]},
    {"key": "ferry_pet_policy", "section": "transport",
     "types": ["ferry"], "days_before": 21},
    {"key": "ferry_kennel_booking", "section": "transport",
     "types": ["ferry"], "days_before": 14},
    {"key": "train_pet_policy", "section": "transport",
     "types": ["train"], "days_before": 14},
    {"key": "carrier_bag", "section": "transport",
     "types": ["train", "car", "ferry"],
     "species": ["cat", "rabbit", "small_mammal", "bird", "other"]},
    # ── essentials (base) ──
    {"key": "food_supply", "section": "essentials"},
    {"key": "water_bottle", "section": "essentials"},
    {"key": "travel_bowls", "section": "essentials"},
    {"key": "medication", "section": "essentials"},
    {"key": "favorite_toy", "section": "essentials"},
    {"key": "blanket", "section": "essentials"},
    {"key": "first_aid_kit", "section": "essentials"},
    {"key": "treats", "section": "essentials"},
    # ── essentials por especie ──
    {"key": "waste_bags", "section": "essentials", "species": ["dog"]},
    {"key": "travel_litter", "section": "essentials", "species": ["cat"]},
    {"key": "hay_supply", "section": "essentials",
     "species": ["rabbit", "small_mammal"]},
    {"key": "heat_pack", "section": "essentials", "species": ["reptile"]},
    {"key": "thermal_box", "section": "essentials", "species": ["reptile"]},
    {"key": "misting_bottle", "section": "essentials", "species": ["reptile"]},
    {"key": "cage_cover", "section": "essentials", "species": ["bird"]},
    {"key": "travel_cage", "section": "essentials", "species": ["bird"]},
    {"key": "transport_bag_fish", "section": "essentials", "species": ["fish"]},
    {"key": "battery_air_pump", "section": "essentials", "species": ["fish"]},
    {"key": "water_conditioner", "section": "essentials", "species": ["fish"]},
]

# Labels em ingles para o PDF (o frontend traduz por i18n; o PDF v1 e ingles).
PDF_LABELS: dict[str, str] = {
    "taloa_tag_check": "TALOA tag active and readable",
    "vaccination_record": "Vaccination record up to date",
    "eu_pet_passport": "EU Pet Passport",
    "microchip_check": "Microchip checked and registered",
    "rabies_vaccine": "Rabies vaccine (at least 21 days before)",
    "tapeworm_treatment": "Tapeworm treatment (1-5 days before)",
    "health_certificate": "Veterinary health certificate",
    "destination_vet_contact": "Vet contact at destination",
    "insurance_docs": "Pet insurance documents",
    "airline_pet_policy": "Check airline pet policy and book pet spot",
    "iata_crate": "IATA-approved travel crate",
    "crate_label": "Crate labelled with pet and owner details",
    "car_harness": "Car harness / seatbelt attachment",
    "travel_breaks_plan": "Plan toilet and water breaks",
    "window_shade": "Window shade for sunny days",
    "ferry_pet_policy": "Check ferry pet policy and book",
    "ferry_kennel_booking": "Reserve onboard kennel if required",
    "train_pet_policy": "Check train operator pet rules",
    "carrier_bag": "Secure pet carrier",
    "food_supply": "Enough food for the whole trip",
    "water_bottle": "Portable water bottle",
    "travel_bowls": "Travel bowls",
    "medication": "Medication and dosage notes",
    "favorite_toy": "Favourite toy",
    "blanket": "Blanket with familiar scent",
    "first_aid_kit": "Pet first aid kit",
    "treats": "Treats",
    "waste_bags": "Waste bags",
    "travel_litter": "Travel litter tray and litter",
    "hay_supply": "Hay supply",
    "heat_pack": "Heat pack for stable temperature",
    "thermal_box": "Insulated thermal transport box",
    "misting_bottle": "Misting bottle for humidity",
    "cage_cover": "Cage cover to reduce stress",
    "travel_cage": "Secure travel cage",
    "transport_bag_fish": "Fish transport bag",
    "battery_air_pump": "Battery-powered air pump",
    "water_conditioner": "Water conditioner",
}

SECTION_ORDER = {"documents": 0, "transport": 1, "essentials": 2}
SECTION_TITLES = {
    "documents": "Documents", "transport": "Transport", "essentials": "Essentials",
}


def items_for(species: str, travel_type: str, scope: str) -> list[dict]:
    """Filtra os templates pelas regras (ausencia de regra = aplica)."""
    out = []
    for it in TEMPLATE_ITEMS:
        if "types" in it and travel_type not in it["types"]:
            continue
        if "scopes" in it and scope not in it["scopes"]:
            continue
        if "species" in it and species not in it["species"]:
            continue
        out.append(it)
    return out


# ── Ownership helpers (padrao diary_service) ─────────────────
def _own_pet_or_403(sb, user: CurrentUser, pet_id: str) -> dict:
    res = (
        sb.table("pets").select("owner_id, species").eq("id", pet_id).limit(1).execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    if res.data[0]["owner_id"] != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return res.data[0]


def _own_trip_or_403(sb, user: CurrentUser, trip_id: str) -> dict:
    res = sb.table("pet_trips").select("*").eq("id", trip_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    trip = res.data[0]
    if trip["owner_id"] != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return trip


# ── Serializers ──────────────────────────────────────────────
def _to_item(r: dict) -> ChecklistItem:
    return ChecklistItem(
        id=r["id"],
        item_key=r.get("item_key"),
        label=r.get("label"),
        section=r["section"],
        is_checked=r.get("is_checked", False),
        due_date=r.get("due_date"),
        sort_order=r.get("sort_order", 0),
    )


def _to_summary(trip: dict, checked: int, total: int) -> TripSummary:
    return TripSummary(
        id=trip["id"],
        title=trip.get("title"),
        travel_type=trip["travel_type"],
        scope=trip["scope"],
        destination=trip.get("destination"),
        travel_date=trip["travel_date"],
        checked_count=checked,
        total_count=total,
        created_at=trip.get("created_at"),
    )


def _trip_items(sb, trip_id: str) -> list[dict]:
    res = (
        sb.table("trip_checklist_items")
        .select("*")
        .eq("trip_id", trip_id)
        .order("sort_order", desc=False)
        .execute()
    )
    return res.data or []


def _detail(sb, trip: dict) -> TripDetail:
    rows = _trip_items(sb, trip["id"])
    checked = sum(1 for r in rows if r.get("is_checked"))
    base = _to_summary(trip, checked, len(rows))
    return TripDetail(**base.model_dump(), items=[_to_item(r) for r in rows])


# ── CRUD ─────────────────────────────────────────────────────
def list_trips(user: CurrentUser, pet_id: str) -> list[TripSummary]:
    sb = get_service_client()
    _own_pet_or_403(sb, user, pet_id)
    res = (
        sb.table("pet_trips")
        .select("*")
        .eq("pet_id", pet_id)
        .order("travel_date", desc=True)
        .execute()
    )
    out = []
    for trip in res.data or []:
        rows = _trip_items(sb, trip["id"])
        checked = sum(1 for r in rows if r.get("is_checked"))
        out.append(_to_summary(trip, checked, len(rows)))
    return out


def create_trip(user: CurrentUser, pet_id: str, body: TripCreate) -> TripDetail:
    sb = get_service_client()
    pet = _own_pet_or_403(sb, user, pet_id)
    trip_res = sb.table("pet_trips").insert({
        "pet_id": pet_id,
        "owner_id": user.id,
        "title": body.title,
        "travel_type": body.travel_type,
        "scope": body.scope,
        "destination": body.destination,
        "travel_date": body.travel_date.isoformat(),
    }).execute()
    trip = trip_res.data[0]

    templates = items_for(pet.get("species") or "other", body.travel_type, body.scope)
    templates.sort(key=lambda t: SECTION_ORDER[t["section"]])
    rows = []
    for i, tpl in enumerate(templates):
        due = None
        if tpl.get("days_before") is not None:
            due = (body.travel_date - timedelta(days=tpl["days_before"])).isoformat()
        rows.append({
            "trip_id": trip["id"],
            "owner_id": user.id,
            "item_key": tpl["key"],
            "label": None,
            "section": tpl["section"],
            "is_checked": False,
            "due_date": due,
            "sort_order": i,
        })
    if rows:
        sb.table("trip_checklist_items").insert(rows).execute()
    return _detail(sb, trip)


def get_trip(user: CurrentUser, trip_id: str) -> TripDetail:
    sb = get_service_client()
    trip = _own_trip_or_403(sb, user, trip_id)
    return _detail(sb, trip)


def delete_trip(user: CurrentUser, trip_id: str) -> None:
    sb = get_service_client()
    _own_trip_or_403(sb, user, trip_id)
    # No Postgres o FK cascade apaga os itens; apagamos explicitamente para
    # manter o fake dos testes (sem FK) fiel ao estado real.
    sb.table("trip_checklist_items").delete().eq("trip_id", trip_id).execute()
    sb.table("pet_trips").delete().eq("id", trip_id).execute()


def add_custom_item(user: CurrentUser, trip_id: str, body: CustomItemCreate) -> ChecklistItem:
    sb = get_service_client()
    _own_trip_or_403(sb, user, trip_id)
    existing = _trip_items(sb, trip_id)
    res = sb.table("trip_checklist_items").insert({
        "trip_id": trip_id,
        "owner_id": user.id,
        "item_key": None,
        "label": body.label,
        "section": "essentials",
        "is_checked": False,
        "due_date": None,
        "sort_order": len(existing),
    }).execute()
    return _to_item(res.data[0])


def _own_item_or_404(sb, user: CurrentUser, trip_id: str, item_id: str) -> dict:
    res = (
        sb.table("trip_checklist_items").select("*").eq("id", item_id).limit(1).execute()
    )
    if not res.data or res.data[0]["trip_id"] != trip_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    if res.data[0]["owner_id"] != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return res.data[0]


def update_item(user: CurrentUser, trip_id: str, item_id: str, body: ItemUpdate) -> ChecklistItem:
    sb = get_service_client()
    _own_trip_or_403(sb, user, trip_id)
    _own_item_or_404(sb, user, trip_id, item_id)
    res = (
        sb.table("trip_checklist_items")
        .update({"is_checked": body.is_checked})
        .eq("id", item_id)
        .execute()
    )
    return _to_item(res.data[0])


def delete_item(user: CurrentUser, trip_id: str, item_id: str) -> None:
    sb = get_service_client()
    _own_trip_or_403(sb, user, trip_id)
    _own_item_or_404(sb, user, trip_id, item_id)
    sb.table("trip_checklist_items").delete().eq("id", item_id).execute()


# ── PDF (A4, ingles na v1 — padrao visual do card_service) ──
def trip_pdf(user: CurrentUser, trip_id: str) -> bytes:
    sb = get_service_client()
    trip = _own_trip_or_403(sb, user, trip_id)
    pet_res = (
        sb.table("pets").select("name, species").eq("id", trip["pet_id"]).limit(1).execute()
    )
    pet = pet_res.data[0] if pet_res.data else {"name": "Pet", "species": ""}
    rows = _trip_items(sb, trip["id"])

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    y = h - 20 * mm

    c.setFillColor(BRAND)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(20 * mm, y, "TALOA Travel Checklist")
    y -= 9 * mm
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 13)
    title = trip.get("title") or f"{pet['name']} — {trip['travel_type']}"
    c.drawString(20 * mm, y, title)
    y -= 6 * mm
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 10)
    meta = f"{pet['name']} · {trip['travel_type']} · {trip['scope']} · {trip['travel_date']}"
    if trip.get("destination"):
        meta += f" · {trip['destination']}"
    c.drawString(20 * mm, y, meta)
    y -= 10 * mm

    current_section = None
    for r in sorted(rows, key=lambda x: (SECTION_ORDER.get(x["section"], 9), x.get("sort_order", 0))):
        if y < 25 * mm:  # nova pagina
            c.showPage()
            y = h - 20 * mm
        if r["section"] != current_section:
            current_section = r["section"]
            y -= 3 * mm
            c.setFillColor(BRAND)
            c.setFont("Helvetica-Bold", 12)
            c.drawString(20 * mm, y, SECTION_TITLES.get(current_section, current_section))
            y -= 7 * mm
        box = "[x]" if r.get("is_checked") else "[  ]"
        text = r.get("label") or PDF_LABELS.get(r.get("item_key") or "", r.get("item_key") or "")
        if r.get("due_date"):
            text += f"  (by {r['due_date']})"
        c.setFillColor(INK)
        c.setFont("Helvetica", 10)
        c.drawString(20 * mm, y, f"{box}  {text}")
        y -= 6 * mm

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(20 * mm, 12 * mm, "Generated by TALOA · taloa.ie · General travel preparation guidance, not veterinary advice.")
    c.save()
    return buf.getvalue()
```

- [ ] **Step 2: Commit**

```bash
git add taloa-api/app/services/travel_service.py
git commit -m "feat: travel_service com templates por especie/tipo/escopo + PDF (Etapa 28)"
```

---

### Task 6: Rotas (`routes/trips.py`) + registro no router

**Files:**
- Create: `taloa-api/app/api/v1/routes/trips.py`
- Modify: `taloa-api/app/api/v1/router.py` (import + include)

- [ ] **Step 1: Escrever as rotas**

```python
"""Travel Checklist (Etapa 28) — rotas autenticadas, Plus e acima.

Gating: require_active_subscription (402 sem assinatura paga ativa).
Ownership: validado no service em CADA request (pet e trip).
"""
from fastapi import APIRouter, Depends, Response, status

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.owner import ActionResponse
from app.schemas.travel import (
    ChecklistItem,
    CustomItemCreate,
    ItemUpdate,
    TripCreate,
    TripDetail,
    TripSummary,
)
from app.services import travel_service
from app.services.billing_service import require_active_subscription

router = APIRouter(tags=["travel"], dependencies=[Depends(require_active_subscription)])


@router.get("/pets/{pet_id}/trips", response_model=list[TripSummary])
def list_trips(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> list[TripSummary]:
    return travel_service.list_trips(user, pet_id)


@router.post(
    "/pets/{pet_id}/trips", response_model=TripDetail,
    status_code=status.HTTP_201_CREATED,
)
def create_trip(
    pet_id: str, body: TripCreate, user: CurrentUser = Depends(get_current_user)
) -> TripDetail:
    return travel_service.create_trip(user, pet_id, body)


@router.get("/trips/{trip_id}", response_model=TripDetail)
def get_trip(trip_id: str, user: CurrentUser = Depends(get_current_user)) -> TripDetail:
    return travel_service.get_trip(user, trip_id)


@router.delete("/trips/{trip_id}", response_model=ActionResponse)
def delete_trip(
    trip_id: str, user: CurrentUser = Depends(get_current_user)
) -> ActionResponse:
    travel_service.delete_trip(user, trip_id)
    return ActionResponse()


@router.post(
    "/trips/{trip_id}/items", response_model=ChecklistItem,
    status_code=status.HTTP_201_CREATED,
)
def add_item(
    trip_id: str, body: CustomItemCreate, user: CurrentUser = Depends(get_current_user)
) -> ChecklistItem:
    return travel_service.add_custom_item(user, trip_id, body)


@router.patch("/trips/{trip_id}/items/{item_id}", response_model=ChecklistItem)
def update_item(
    trip_id: str, item_id: str, body: ItemUpdate,
    user: CurrentUser = Depends(get_current_user),
) -> ChecklistItem:
    return travel_service.update_item(user, trip_id, item_id, body)


@router.delete("/trips/{trip_id}/items/{item_id}", response_model=ActionResponse)
def delete_item(
    trip_id: str, item_id: str, user: CurrentUser = Depends(get_current_user)
) -> ActionResponse:
    travel_service.delete_item(user, trip_id, item_id)
    return ActionResponse()


@router.get("/trips/{trip_id}/pdf")
def trip_pdf(trip_id: str, user: CurrentUser = Depends(get_current_user)) -> Response:
    pdf = travel_service.trip_pdf(user, trip_id)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="taloa-travel-checklist.pdf"'},
    )
```

- [ ] **Step 2: Registrar no router v1**

Em `taloa-api/app/api/v1/router.py`: adicionar `trips,` na lista de imports
(ordem alfabetica, depois de `tags,`) e `api_router.include_router(trips.router)`
depois da linha do `pets.router`.

- [ ] **Step 3: Rodar TODA a suite (os testes da Task 4 devem passar agora)**

Run: `cd taloa-api; .venv\Scripts\python.exe -m pytest tests/ -q`
Expected: 38 passed (26 antigos + 12 novos). Se `test_free_user_gets_402`
falhar com 401/403, confirmar que o override `as_owner` esta aplicado e que o
`billing_service.get_service_client` foi monkeypatchado no `_seed`.

- [ ] **Step 4: Commit**

```bash
git add taloa-api/app/api/v1/routes/trips.py taloa-api/app/api/v1/router.py
git commit -m "feat: rotas do Travel Checklist com gating Plus+ (Etapa 28)"
```

---

### Task 7: Frontend — tipos e cliente da API

**Files:**
- Create: `taloa-web/types/travel.ts`
- Create: `taloa-web/lib/api/travel.ts`

- [ ] **Step 1: Escrever `types/travel.ts`**

```typescript
// Tipos do Travel Checklist (Etapa 28). Espelham schemas/travel.py da API.
export type TravelType = "car" | "plane" | "ferry" | "train";
export type TripScope = "domestic" | "international";
export type ItemSection = "documents" | "transport" | "essentials";

export interface ChecklistItem {
  id: string;
  item_key: string | null; // template (i18n); null = custom
  label: string | null;    // so custom
  section: ItemSection;
  is_checked: boolean;
  due_date: string | null; // ISO date
  sort_order: number;
}

export interface TripSummary {
  id: string;
  title: string | null;
  travel_type: TravelType;
  scope: TripScope;
  destination: string | null;
  travel_date: string;
  checked_count: number;
  total_count: number;
  created_at: string | null;
}

export interface TripDetail extends TripSummary {
  items: ChecklistItem[];
}

export interface TripPayload {
  title?: string;
  travel_type: TravelType;
  scope: TripScope;
  destination?: string;
  travel_date: string;
}
```

- [ ] **Step 2: Escrever `lib/api/travel.ts`**

```typescript
// Cliente da API do Travel Checklist (Etapa 28). Tudo autenticado.
import { apiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem, TripDetail, TripPayload, TripSummary } from "@/types/travel";

// client.ts nao exporta a base URL; duplicado de proposito (mesmo default).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function getTrips(petId: string): Promise<TripSummary[]> {
  return apiFetch<TripSummary[]>(`/v1/pets/${petId}/trips`);
}

export function createTrip(petId: string, body: TripPayload): Promise<TripDetail> {
  return apiFetch<TripDetail>(`/v1/pets/${petId}/trips`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getTrip(tripId: string): Promise<TripDetail> {
  return apiFetch<TripDetail>(`/v1/trips/${tripId}`);
}

export function deleteTrip(tripId: string): Promise<unknown> {
  return apiFetch(`/v1/trips/${tripId}`, { method: "DELETE" });
}

export function addCustomItem(tripId: string, label: string): Promise<ChecklistItem> {
  return apiFetch<ChecklistItem>(`/v1/trips/${tripId}/items`, {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}

export function toggleItem(
  tripId: string,
  itemId: string,
  isChecked: boolean,
): Promise<ChecklistItem> {
  return apiFetch<ChecklistItem>(`/v1/trips/${tripId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_checked: isChecked }),
  });
}

export function deleteItem(tripId: string, itemId: string): Promise<unknown> {
  return apiFetch(`/v1/trips/${tripId}/items/${itemId}`, { method: "DELETE" });
}

// PDF autenticado: apiFetch so faz JSON, entao aqui e fetch manual com blob.
export async function downloadTripPdf(tripId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: HeadersInit = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
  const res = await fetch(`${API_URL}/v1/trips/${tripId}/pdf`, { headers });
  if (!res.ok) throw new Error("PDF download failed");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "taloa-travel-checklist.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 3: Commit**

```bash
git add taloa-web/types/travel.ts taloa-web/lib/api/travel.ts
git commit -m "feat: tipos e cliente da API do Travel Checklist (web)"
```

---

### Task 8: Frontend — componentes + aba Travel no DiaryView

**Files:**
- Create: `taloa-web/components/owner/travel/NewTripModal.tsx`
- Create: `taloa-web/components/owner/travel/TripChecklist.tsx`
- Create: `taloa-web/components/owner/travel/TravelView.tsx`
- Modify: `taloa-web/components/owner/diary/DiaryView.tsx` (tipo `Tab`, array `tabs`, render)

- [ ] **Step 1: Escrever `NewTripModal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { createTrip } from "@/lib/api/travel";
import type { TravelType, TripDetail, TripScope } from "@/types/travel";

const TYPES: TravelType[] = ["car", "plane", "ferry", "train"];
const SCOPES: TripScope[] = ["domestic", "international"];

export function NewTripModal({
  petId,
  onClose,
  onCreated,
}: {
  petId: string;
  onClose: () => void;
  onCreated: (trip: TripDetail) => void;
}) {
  const t = useTranslations("travelChecklist");
  const [title, setTitle] = useState("");
  const [travelType, setTravelType] = useState<TravelType>("car");
  const [scope, setScope] = useState<TripScope>("domestic");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!travelDate) return;
    setSaving(true);
    setError(null);
    try {
      const trip = await createTrip(petId, {
        title: title.trim() || undefined,
        travel_type: travelType,
        scope,
        destination: destination.trim() || undefined,
        travel_date: travelDate,
      });
      onCreated(trip);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-card bg-white p-5 shadow-xl"
      >
        <h3 className="mb-4 text-lg font-bold text-slate-800">{t("newTrip")}</h3>

        <label className="mb-1 block text-sm font-medium text-slate-600">
          {t("tripTitle")}
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder={t("titlePlaceholder")}
          className="mb-3 w-full rounded-input border border-slate-200 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm font-medium text-slate-600">
          {t("travelType")}
        </label>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {TYPES.map((ty) => (
            <button
              key={ty}
              type="button"
              onClick={() => setTravelType(ty)}
              className={`rounded-input border px-2 py-2 text-sm ${
                travelType === ty
                  ? "border-taloa-primary bg-taloa-primary/5 font-semibold text-taloa-primary"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {t(`types.${ty}`)}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-600">
          {t("scope")}
        </label>
        <div className="mb-3 grid grid-cols-2 gap-2">
          {SCOPES.map((sc) => (
            <button
              key={sc}
              type="button"
              onClick={() => setScope(sc)}
              className={`rounded-input border px-2 py-2 text-sm ${
                scope === sc
                  ? "border-taloa-primary bg-taloa-primary/5 font-semibold text-taloa-primary"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {t(`scopes.${sc}`)}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-600">
          {t("destination")}
        </label>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          maxLength={200}
          placeholder={t("destinationPlaceholder")}
          className="mb-3 w-full rounded-input border border-slate-200 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm font-medium text-slate-600">
          {t("travelDate")}
        </label>
        <input
          type="date"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
          required
          className="mb-4 w-full rounded-input border border-slate-200 px-3 py-2 text-sm"
        />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-input px-4 py-2 text-sm text-slate-500"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={saving || !travelDate}
            className="rounded-input bg-taloa-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? t("creating") : t("create")}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Escrever `TripChecklist.tsx`**

```tsx
"use client";

import { ArrowLeft, FileDown, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  addCustomItem,
  deleteItem,
  deleteTrip,
  downloadTripPdf,
  toggleItem,
} from "@/lib/api/travel";
import type { ChecklistItem, ItemSection, TripDetail } from "@/types/travel";

const SECTIONS: ItemSection[] = ["documents", "transport", "essentials"];

function dueTone(dueDate: string | null): "red" | "amber" | null {
  if (!dueDate) return null;
  const days = Math.ceil(
    (new Date(dueDate + "T00:00:00").getTime() - Date.now()) / 86400000,
  );
  if (days < 0) return "red";
  if (days <= 7) return "amber";
  return null;
}

export function TripChecklist({
  trip,
  onBack,
  onDeleted,
}: {
  trip: TripDetail;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("travelChecklist");
  const [items, setItems] = useState<ChecklistItem[]>(trip.items);
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const checked = items.filter((i) => i.is_checked).length;

  function itemText(item: ChecklistItem): string {
    return item.item_key ? t(`items.${item.item_key}`) : (item.label ?? "");
  }

  async function onToggle(item: ChecklistItem) {
    const updated = await toggleItem(trip.id, item.id, !item.is_checked);
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setBusy(true);
    try {
      const item = await addCustomItem(trip.id, label);
      setItems((prev) => [...prev, item]);
      setNewLabel("");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(item: ChecklistItem) {
    await deleteItem(trip.id, item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  async function onDeleteTrip() {
    if (!window.confirm(t("confirmDelete"))) return;
    await deleteTrip(trip.id);
    onDeleted();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-taloa-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => downloadTripPdf(trip.id)}
            className="flex items-center gap-1 rounded-input border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
          >
            <FileDown className="h-4 w-4" /> {t("downloadPdf")}
          </button>
          <button
            onClick={onDeleteTrip}
            className="flex items-center gap-1 rounded-input border border-red-200 px-3 py-1.5 text-sm text-red-600"
          >
            <Trash2 className="h-4 w-4" /> {t("deleteTrip")}
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        {t("progress", { checked, total: items.length })}
      </p>

      {SECTIONS.map((section) => {
        const sectionItems = items.filter((i) => i.section === section);
        if (!sectionItems.length) return null;
        return (
          <section key={section} className="mb-5">
            <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-taloa-primary">
              {t(`sections.${section}`)}
            </h4>
            <ul className="space-y-1">
              {sectionItems.map((item) => {
                const tone = item.is_checked ? null : dueTone(item.due_date);
                return (
                  <li
                    key={item.id}
                    className="group flex items-center gap-2 rounded-input px-2 py-1.5 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={item.is_checked}
                      onChange={() => onToggle(item)}
                      className="h-4 w-4 accent-taloa-primary"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        item.is_checked ? "text-slate-400 line-through" : "text-slate-700"
                      }`}
                    >
                      {itemText(item)}
                    </span>
                    {item.due_date && !item.is_checked && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          tone === "red"
                            ? "bg-red-50 text-red-600"
                            : tone === "amber"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {tone === "red"
                          ? t("overdue")
                          : t("dueBy", { date: item.due_date })}
                      </span>
                    )}
                    <button
                      onClick={() => onRemove(item)}
                      className="invisible text-slate-300 hover:text-red-500 group-hover:visible"
                      aria-label="remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <form onSubmit={onAdd} className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          maxLength={200}
          placeholder={t("addItemPlaceholder")}
          className="flex-1 rounded-input border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !newLabel.trim()}
          className="flex items-center gap-1 rounded-input bg-taloa-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {t("add")}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Escrever `TravelView.tsx`**

```tsx
"use client";

import { Car, Plane, Plus, Ship, TrainFront } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/client";
import { getTrip, getTrips } from "@/lib/api/travel";
import type { TripDetail, TripSummary } from "@/types/travel";

import { NewTripModal } from "./NewTripModal";
import { TripChecklist } from "./TripChecklist";

const TYPE_ICONS = {
  car: Car,
  plane: Plane,
  ferry: Ship,
  train: TrainFront,
} as const;

export function TravelView({ petId }: { petId: string }) {
  const t = useTranslations("travelChecklist");
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [selected, setSelected] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTrips(await getTrips(petId));
      setLocked(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) setLocked(true);
      else setTrips([]);
    }
    setLoading(false);
  }, [petId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;

  // Free plan: API devolve 402 -> CTA de upgrade
  if (locked) {
    return (
      <div className="rounded-card border border-dashed border-taloa-primary/30 bg-taloa-primary/5 px-6 py-10 text-center">
        <h3 className="mb-1 font-bold text-slate-800">{t("upgradeTitle")}</h3>
        <p className="mb-4 text-sm text-slate-500">{t("upgradeBody")}</p>
        <Link
          href="/pricing"
          className="inline-block rounded-input bg-taloa-primary px-4 py-2 text-sm font-semibold text-white"
        >
          {t("upgradeCta")}
        </Link>
      </div>
    );
  }

  if (selected) {
    return (
      <TripChecklist
        trip={selected}
        onBack={() => {
          setSelected(null);
          load();
        }}
        onDeleted={() => {
          setSelected(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">{t("title")}</h3>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-input bg-taloa-primary px-3 py-1.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> {t("newTrip")}
        </button>
      </div>

      {trips.length === 0 ? (
        <p className="rounded-card border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {trips.map((trip) => {
            const Icon = TYPE_ICONS[trip.travel_type];
            const pct = trip.total_count
              ? Math.round((trip.checked_count / trip.total_count) * 100)
              : 0;
            return (
              <li key={trip.id}>
                <button
                  onClick={async () => setSelected(await getTrip(trip.id))}
                  className="w-full rounded-card border border-slate-200 px-4 py-3 text-left hover:border-taloa-primary/40"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-taloa-primary" />
                    <span className="font-semibold text-slate-800">
                      {trip.title || trip.destination || t(`types.${trip.travel_type}`)}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                      {trip.travel_date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded bg-slate-100">
                      <div
                        className="h-1.5 rounded bg-taloa-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {t("progress", {
                        checked: trip.checked_count,
                        total: trip.total_count,
                      })}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adding && (
        <NewTripModal
          petId={petId}
          onClose={() => setAdding(false)}
          onCreated={(trip) => {
            setAdding(false);
            setSelected(trip);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Adicionar a aba Travel no `DiaryView.tsx`**

Tres edicoes pontuais em `taloa-web/components/owner/diary/DiaryView.tsx`:

1. Linha 36 — incluir `travel` no tipo:
```typescript
type Tab = "diary" | "health" | "shedding" | "travel" | "timeline";
```

2. Linha 81 — incluir `travel` antes de `timeline` no array:
```typescript
const tabs: Tab[] = ["diary", "health", ...(sheddingCfg ? (["shedding"] as Tab[]) : []), "travel", "timeline"];
```

3. Import no topo + render junto dos outros paineis (procurar onde os paineis
`{tab === "health" && ...}` sao renderizados e adicionar ao lado):
```tsx
import { TravelView } from "@/components/owner/travel/TravelView";
// ...
{tab === "travel" && <TravelView petId={petId} />}
```

O label da aba vem de `t("tabTravel")` automaticamente (o codigo existente monta
a chave `tab${Capitalized}` — linha 97) — a chave `diary.tabTravel` e adicionada
na Task 9.

- [ ] **Step 5: Build de verificacao**

Run: `cd taloa-web; npm run build`
Expected: build passa. ERRO ESPERADO se a Task 9 (i18n) ainda nao rodou:
`tabTravel` missing — nesse caso rodar a Task 9 antes de validar o build.

- [ ] **Step 6: Commit**

```bash
git add taloa-web/components/owner/travel/ taloa-web/components/owner/diary/DiaryView.tsx
git commit -m "feat: aba Travel com checklist interativa no dashboard (Etapa 28)"
```

---

### Task 9: i18n (6 idiomas) + beneficio na /pricing

**Files:**
- Modify: `taloa-web/messages/en.json`, `pt.json`, `es.json`, `fr.json`, `de.json`, `it.json`

- [ ] **Step 1: Adicionar `diary.tabTravel` e o namespace `travelChecklist` no `en.json`**

Em `diary`, junto das outras chaves `tab*`:
```json
"tabTravel": "Travel"
```

Namespace novo no nivel raiz (as 39 chaves de `items` usam os MESMOS textos do
`PDF_LABELS` do `travel_service.py` — fonte unica do ingles):
```json
"travelChecklist": {
  "title": "Travel Checklist",
  "newTrip": "New trip",
  "empty": "No trips yet. Create one to get a checklist tailored to your pet.",
  "upgradeTitle": "Travel Checklist is a Plus feature",
  "upgradeBody": "Upgrade to Plus for species-specific travel checklists with deadline alerts.",
  "upgradeCta": "See plans",
  "tripTitle": "Trip name (optional)",
  "titlePlaceholder": "e.g. Holidays in Portugal",
  "travelType": "How are you travelling?",
  "types": { "car": "Car", "plane": "Plane", "ferry": "Ferry", "train": "Train" },
  "scope": "Where to?",
  "scopes": { "domestic": "Within Ireland", "international": "International" },
  "destination": "Destination (optional)",
  "destinationPlaceholder": "e.g. Lisbon",
  "travelDate": "Travel date",
  "create": "Create checklist",
  "creating": "Creating...",
  "cancel": "Cancel",
  "progress": "{checked} of {total} done",
  "addItemPlaceholder": "Add your own item...",
  "add": "Add",
  "downloadPdf": "Download PDF",
  "deleteTrip": "Delete trip",
  "confirmDelete": "Delete this trip and its checklist?",
  "dueBy": "by {date}",
  "overdue": "Overdue",
  "back": "All trips",
  "sections": { "documents": "Documents", "transport": "Transport", "essentials": "Essentials" },
  "items": {
    "taloa_tag_check": "TALOA tag active and readable",
    "vaccination_record": "Vaccination record up to date",
    "eu_pet_passport": "EU Pet Passport",
    "microchip_check": "Microchip checked and registered",
    "rabies_vaccine": "Rabies vaccine (at least 21 days before)",
    "tapeworm_treatment": "Tapeworm treatment (1-5 days before)",
    "health_certificate": "Veterinary health certificate",
    "destination_vet_contact": "Vet contact at destination",
    "insurance_docs": "Pet insurance documents",
    "airline_pet_policy": "Check airline pet policy and book pet spot",
    "iata_crate": "IATA-approved travel crate",
    "crate_label": "Crate labelled with pet and owner details",
    "car_harness": "Car harness / seatbelt attachment",
    "travel_breaks_plan": "Plan toilet and water breaks",
    "window_shade": "Window shade for sunny days",
    "ferry_pet_policy": "Check ferry pet policy and book",
    "ferry_kennel_booking": "Reserve onboard kennel if required",
    "train_pet_policy": "Check train operator pet rules",
    "carrier_bag": "Secure pet carrier",
    "food_supply": "Enough food for the whole trip",
    "water_bottle": "Portable water bottle",
    "travel_bowls": "Travel bowls",
    "medication": "Medication and dosage notes",
    "favorite_toy": "Favourite toy",
    "blanket": "Blanket with familiar scent",
    "first_aid_kit": "Pet first aid kit",
    "treats": "Treats",
    "waste_bags": "Waste bags",
    "travel_litter": "Travel litter tray and litter",
    "hay_supply": "Hay supply",
    "heat_pack": "Heat pack for stable temperature",
    "thermal_box": "Insulated thermal transport box",
    "misting_bottle": "Misting bottle for humidity",
    "cage_cover": "Cage cover to reduce stress",
    "travel_cage": "Secure travel cage",
    "transport_bag_fish": "Fish transport bag",
    "battery_air_pump": "Battery-powered air pump",
    "water_conditioner": "Water conditioner"
  }
}
```

- [ ] **Step 2: Traduzir o namespace para os outros 5 idiomas**

Traduzir TODO o bloco `travelChecklist` + `diary.tabTravel` para pt, es, fr, de
e it com **traducao real de qualidade** (padrao dos commits 814e8a2/44355e3 —
sem placeholder em ingles). Regras ja estabelecidas: nomes de marca (TALOA,
Paw Points) e "EU Pet Passport" (nome oficial do documento) ficam; "IATA" fica;
`scopes.domestic` adapta ("Within Ireland" -> pt "Dentro da Irlanda", etc.).
`diary.tabTravel`: pt "Viagem", es "Viaje", fr "Voyage", de "Reise", it "Viaggio".

- [ ] **Step 3: Beneficio novo na /pricing (lista `pricing.features.plus`)**

Acrescentar ao FINAL do array `pricing.features.plus` em cada idioma:
- en: `"Travel Checklist with deadline alerts"`
- pt: `"Checklist de viagem com alertas de prazo"`
- es: `"Checklist de viaje con alertas de plazos"`
- fr: `"Checklist de voyage avec alertes d'echeance"` (com acentos corretos: échéance)
- de: `"Reise-Checkliste mit Fristen-Erinnerungen"`
- it: `"Checklist di viaggio con avvisi di scadenza"`

- [ ] **Step 4: Validar paridade de chaves entre os 6 JSONs**

Rodar o mesmo check usado na traducao fr (flatten + comparacao): todos os
idiomas devem ter exatamente as mesmas chaves do en.json e os mesmos
placeholders ICU (`{checked}`, `{total}`, `{date}`).

- [ ] **Step 5: Build final**

Run: `cd taloa-web; npm run build`
Expected: build verde, sem missing keys.

- [ ] **Step 6: Commit**

```bash
git add taloa-web/messages/
git commit -m "feat: i18n do Travel Checklist nos 6 idiomas + beneficio na pricing"
```

---

### Task 10: Verificacao final + deploy

- [ ] **Step 1: Suite completa do backend**

Run: `cd taloa-api; .venv\Scripts\python.exe -m pytest tests/ -q`
Expected: 38 passed

- [ ] **Step 2: Build do frontend**

Run: `cd taloa-web; npm run build`
Expected: verde

- [ ] **Step 3: Checklist de revisao (manual)**

- Migration aplicada SO no `loopcoxvtboytwwjwoeg`, RLS ativo nas 2 tabelas
- Nenhuma rota do Travel exposta sem JWT + assinatura (testar 402 sem sub)
- Nenhum dado privado do dono no PDF (so nome do pet/especie/viagem)
- `pricing.features.plus` com o beneficio novo nos 6 idiomas
- Zero uso de "dog/dogs" em nomes de tabelas/campos/funcoes novas

- [ ] **Step 4: Push (deploya Railway + Vercel) — CONFIRMAR com o Henrique antes**

```bash
git push origin main
```

- [ ] **Step 5: Smoke test em producao**

Logar com conta Plus, criar uma viagem de teste, marcar itens, baixar o PDF,
apagar a viagem. Confirmar que conta Free ve o CTA de upgrade.

---

## Self-review do plano (feito na escrita)

- **Cobertura da spec:** migration+RLS (T1), templates+service (T5), 8 rotas+gating (T6), aba+3 componentes (T8), PDF (T5/T6), i18n+pricing (T9), 12 testes (T4), fora-de-escopo respeitado (sem edit de trip, sem admin CRUD, PDF ingles).
- **Consistencia de tipos:** `item_key`/`label`/`section`/`is_checked`/`due_date` identicos em SQL (T1), Pydantic (T3), service (T5) e TS (T7). `ItemUpdate.is_checked` casa com `toggleItem`. Chaves de template do `TEMPLATE_ITEMS` = chaves de `PDF_LABELS` = chaves de `travelChecklist.items` (39 em cada).
- **Placeholders:** nenhum TBD; a unica delegacao e a traducao es/fr/de/it, definida por transformacao clara do bloco EN completo.


