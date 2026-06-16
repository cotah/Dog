"""Geracao de tags em lote + QR Codes (PNG zip, PDF A4, CSV).

Specs do QR: URL https://taloa.ie/t/TAL-XXXXXX, preto no branco,
margem (border) de 4 modulos, correcao de erro nivel H, >= 300x300px.
"""
import csv
import io
import zipfile

import qrcode
from fastapi import HTTPException, status
from qrcode.constants import ERROR_CORRECT_H
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from app.config import settings
from app.core.supabase import get_service_client
from app.utils.constants import TAG_PREFIX


def _tag_url(code: str) -> str:
    return f"{settings.FRONTEND_URL}/t/{code}"


def _make_qr_image(url: str):
    # box_size=10 + border=4 -> imagem bem acima de 300x300px
    qr = qrcode.QRCode(
        error_correction=ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white")


def qr_png(code: str) -> bytes:
    """PNG do QR de uma tag (codifica a URL publica /t/CODE).

    Usado no poster de lost mode e em qualquer lugar que precise exibir o QR.
    """
    img = _make_qr_image(_tag_url(code))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


def next_number() -> int:
    sb = get_service_client()
    res = (
        sb.table("tags")
        .select("tag_code")
        .order("tag_code", desc=True)
        .limit(1)
        .execute()
    )
    if not res.data:
        return 1
    try:
        return int(res.data[0]["tag_code"].split("-")[-1]) + 1
    except (ValueError, IndexError):
        return 1


def generate_tags(quantity: int, start_number: int) -> list[str]:
    if not 1 <= quantity <= 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A quantidade deve estar entre 1 e 100",
        )
    codes = [
        f"{TAG_PREFIX}-{n:06d}"
        for n in range(start_number, start_number + quantity)
    ]

    sb = get_service_client()
    existing = (
        sb.table("tags").select("tag_code").in_("tag_code", codes).execute().data or []
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{len(existing)} codigo(s) ja existem nesse intervalo",
        )

    rows = [
        {"tag_code": c, "tag_url": _tag_url(c), "status": "inactive"} for c in codes
    ]
    sb.table("tags").insert(rows).execute()
    return codes


def _resolve_urls(codes: list[str]) -> list[tuple[str, str]]:
    """Usa o tag_url salvo no banco; cai no padrao se nao existir."""
    sb = get_service_client()
    res = (
        sb.table("tags").select("tag_code, tag_url").in_("tag_code", codes).execute().data
        or []
    )
    url_by_code = {r["tag_code"]: r["tag_url"] for r in res}
    return [(c, url_by_code.get(c) or _tag_url(c)) for c in codes]


def export_png_zip(codes: list[str]) -> io.BytesIO:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for code, url in _resolve_urls(codes):
            png = io.BytesIO()
            _make_qr_image(url).save(png, "PNG")
            zf.writestr(f"{code}.png", png.getvalue())
    buf.seek(0)
    return buf


def export_csv(codes: list[str]) -> str:
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["tag_code", "tag_url"])
    for code, url in _resolve_urls(codes):
        writer.writerow([code, url])
    return out.getvalue()


def export_pdf(codes: list[str]) -> io.BytesIO:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    cols, rows = 3, 5
    per_page = cols * rows
    cell_w = width / cols
    cell_h = height / rows
    qr_size = 45 * mm  # cabe os 15/folha junto com codigo + URL

    for i, (code, url) in enumerate(_resolve_urls(codes)):
        idx = i % per_page
        if i > 0 and idx == 0:
            c.showPage()
        col = idx % cols
        row = idx // cols
        x = col * cell_w
        y = height - (row + 1) * cell_h  # origem bottom-left

        # linha tracejada de corte ao redor da etiqueta
        c.saveState()
        c.setDash(3, 3)
        c.setLineWidth(0.4)
        c.setStrokeColorRGB(0.7, 0.7, 0.7)
        c.rect(x + 1.5 * mm, y + 1.5 * mm, cell_w - 3 * mm, cell_h - 3 * mm, stroke=1, fill=0)
        c.restoreState()

        png = io.BytesIO()
        _make_qr_image(url).save(png, "PNG")
        png.seek(0)
        qx = x + (cell_w - qr_size) / 2
        qy = y + cell_h - qr_size - 7 * mm
        c.drawImage(ImageReader(png), qx, qy, qr_size, qr_size)

        c.setFont("Courier-Bold", 9)
        c.drawCentredString(x + cell_w / 2, qy - 4 * mm, code)
        c.setFont("Helvetica", 7)
        c.drawCentredString(x + cell_w / 2, qy - 8.5 * mm, f"taloa.ie/t/{code}")

    c.showPage()
    c.save()
    buf.seek(0)
    return buf
