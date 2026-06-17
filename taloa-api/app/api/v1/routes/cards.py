"""Pet Identity Card (Etapa 24) — endpoints publicos por tag_code.

Publico de proposito (partilha com sitter/vet/hotel). Sem dados privados do dono.
"""
from fastapi import APIRouter, Response

from app.schemas.card import PetCard
from app.services import card_service

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get("/{tag_code}", response_model=PetCard)
def get_card(tag_code: str) -> PetCard:
    """Dados do card (publicos/seguros) para preview e link partilhavel."""
    return card_service.get_card(tag_code)


@router.get("/{tag_code}/pdf")
def get_card_pdf(tag_code: str) -> Response:
    """PDF (A6) da carteira do pet, para download."""
    pdf = card_service.card_pdf(tag_code)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="taloa-card-{tag_code}.pdf"',
            "Cache-Control": "public, max-age=300",
        },
    )
