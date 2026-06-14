"""Rotas de geracao de tags em lote + export de QR Codes (admin)."""
from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse

from app.core.security import require_admin
from app.schemas.qr import (
    ExportRequest,
    GenerateRequest,
    GenerateResponse,
    NextNumberResponse,
)
from app.services import qr_service

router = APIRouter(
    prefix="/admin/tags", tags=["admin-tags"], dependencies=[Depends(require_admin)]
)


@router.get("/next-number", response_model=NextNumberResponse)
def next_number() -> NextNumberResponse:
    return NextNumberResponse(next_number=qr_service.next_number())


@router.post("/generate", response_model=GenerateResponse)
def generate(body: GenerateRequest) -> GenerateResponse:
    codes = qr_service.generate_tags(body.quantity, body.start_number)
    return GenerateResponse(tag_codes=codes)


@router.post("/export/png")
def export_png(body: ExportRequest) -> StreamingResponse:
    buf = qr_service.export_png_zip(body.tag_codes)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=taloa-qr-codes.zip"},
    )


@router.post("/export/pdf")
def export_pdf(body: ExportRequest) -> StreamingResponse:
    buf = qr_service.export_pdf(body.tag_codes)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=taloa-labels.pdf"},
    )


@router.post("/export/csv")
def export_csv(body: ExportRequest) -> Response:
    content = qr_service.export_csv(body.tag_codes)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=taloa-tags.csv"},
    )
