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
