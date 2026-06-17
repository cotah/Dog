"""Pet Identity Card (Etapa 24): dados seguros do card + geracao de PDF (reportlab).

REGRA: nunca endereco/email do dono; telefone do dono so com show_phone; foto so
se existir. O card e publico por tag_code (partilha com sitter/vet/hotel).
"""
import io
from datetime import datetime

import httpx
from fastapi import HTTPException, status
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A6
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfgen import canvas

from app.core.supabase import get_service_client
from app.schemas.card import PetCard
from app.services import qr_service

# Identidade visual TALOA.
BRAND = HexColor("#1A3A5C")
BRAND_LIGHT = HexColor("#E8EEF4")
INK = HexColor("#1F2937")
MUTED = HexColor("#64748B")


def get_card(tag_code: str) -> PetCard:
    """Monta o card (dados publicos/seguros) a partir do tag_code."""
    sb = get_service_client()

    tag_res = sb.table("tags").select("*").eq("tag_code", tag_code).limit(1).execute()
    if not tag_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    tag = tag_res.data[0]

    if tag["status"] not in ("active", "lost") or not tag.get("pet_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No card available for this tag"
        )

    pet_res = sb.table("pets").select("*").eq("id", tag["pet_id"]).limit(1).execute()
    if not pet_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    pet = pet_res.data[0]

    prof_res = (
        sb.table("pet_profiles").select("*").eq("pet_id", tag["pet_id"]).limit(1).execute()
    )
    prof = prof_res.data[0] if prof_res.data else {}

    # Telefone do dono — SO se show_phone (nunca email/endereco).
    owner_phone = None
    if bool(prof.get("show_phone", False)) and tag.get("owner_id"):
        owner_res = (
            sb.table("users").select("phone").eq("id", tag["owner_id"]).limit(1).execute()
        )
        if owner_res.data:
            owner_phone = owner_res.data[0].get("phone")

    return PetCard(
        tag_code=tag["tag_code"],
        name=pet["name"],
        species=pet["species"],
        breed_or_morph=pet.get("breed_or_morph"),
        colour=pet.get("colour"),
        sex=pet.get("sex"),
        age_years=pet.get("age_years"),
        date_of_birth=pet.get("date_of_birth"),
        microchip=pet.get("microchip"),
        vet_name=prof.get("vet_name"),
        vet_phone=prof.get("vet_phone"),
        allergies=prof.get("allergies"),
        behaviour=prof.get("behaviour"),
        photo_url=pet.get("photo_url"),
        owner_phone=owner_phone,
        profile_url=qr_service._tag_url(tag["tag_code"]),
    )


def _age_line(card: PetCard) -> str | None:
    """Data de nascimento se houver; senao cai para a idade em anos."""
    if card.date_of_birth:
        return card.date_of_birth
    if card.age_years is not None:
        return f"{card.age_years} yr" + ("s" if card.age_years != 1 else "")
    return None


def _fetch_image(url: str | None) -> ImageReader | None:
    if not url:
        return None
    try:
        r = httpx.get(url, timeout=10, follow_redirects=True)
        r.raise_for_status()
        return ImageReader(io.BytesIO(r.content))
    except Exception:  # noqa: BLE001 — foto e opcional; sem foto o card segue
        return None


def card_pdf(tag_code: str) -> bytes:
    """Gera o PDF (A6) do card. Embute foto (se houver) e o QR da tag."""
    card = get_card(tag_code)

    buf = io.BytesIO()
    w, h = A6  # 105mm x 148mm (portrait)
    c = canvas.Canvas(buf, pagesize=A6)

    # ── Header ──
    header_h = 16 * mm
    c.setFillColor(BRAND)
    c.rect(0, h - header_h, w, header_h, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 15)
    c.drawString(8 * mm, h - 10 * mm, "TALOA")
    c.setFont("Helvetica", 7.5)
    c.drawRightString(w - 8 * mm, h - 10 * mm, "PET IDENTITY CARD")

    # ── Foto (so se existir) + nome/meta ──
    top = h - header_h - 6 * mm
    photo = _fetch_image(card.photo_url)
    text_x = 8 * mm
    if photo is not None:
        photo_sz = 30 * mm
        c.drawImage(
            photo, 8 * mm, top - photo_sz, photo_sz, photo_sz,
            preserveAspectRatio=True, mask="auto",
        )
        text_x = 8 * mm + photo_sz + 5 * mm

    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(text_x, top - 6 * mm, card.name[:22])
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    meta = " · ".join(
        v for v in (
            card.species.capitalize() if card.species else None,
            card.breed_or_morph, card.colour,
            card.sex.capitalize() if card.sex else None,
        ) if v
    )
    for i, line in enumerate(simpleSplit(meta, "Helvetica", 8, w - text_x - 8 * mm)[:3]):
        c.drawString(text_x, top - 11 * mm - i * 4 * mm, line)

    # ── Linhas de info ──
    y = top - 34 * mm
    rows: list[tuple[str, str | None]] = [
        ("Date of birth", _age_line(card)),
        ("Microchip", card.microchip),
        ("Vet", " · ".join(v for v in (card.vet_name, card.vet_phone) if v) or None),
        ("Allergies", card.allergies),
        ("Behaviour", card.behaviour),
    ]
    if card.owner_phone:
        rows.append(("Owner phone", card.owner_phone))

    line_w = w - 16 * mm
    for label, value in rows:
        if not value:
            continue
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 6.5)
        c.drawString(8 * mm, y, label.upper())
        c.setFillColor(INK)
        c.setFont("Helvetica", 8.5)
        wrapped = simpleSplit(str(value), "Helvetica", 8.5, line_w)[:2]
        for j, ln in enumerate(wrapped):
            c.drawString(8 * mm, y - 4 * mm - j * 4 * mm, ln)
        y -= 4 * mm + len(wrapped) * 4 * mm + 2 * mm

    # ── QR (canto inferior direito) ──
    qr = ImageReader(io.BytesIO(qr_service.qr_png(card.tag_code)))
    qr_sz = 24 * mm
    c.drawImage(qr, w - 8 * mm - qr_sz, 10 * mm, qr_sz, qr_sz, mask="auto")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    c.drawCentredString(w - 8 * mm - qr_sz / 2, 8 * mm, "Scan for full profile")
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(BRAND)
    c.drawCentredString(w - 8 * mm - qr_sz / 2, 5 * mm, card.tag_code)

    # ── Footer ──
    issued = datetime.now().date().isoformat()
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.5)
    c.drawString(8 * mm, 7 * mm, "taloa.ie")
    c.drawString(8 * mm, 4 * mm, f"Issued {issued}")

    c.showPage()
    c.save()
    buf.seek(0)
    return buf.getvalue()
