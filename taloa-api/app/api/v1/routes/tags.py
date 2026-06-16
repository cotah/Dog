"""Rotas de tags. A leitura publica e usada pela pagina /t/[tagCode]."""
from fastapi import APIRouter, Response

from app.schemas.tag import PublicTagResponse
from app.services import qr_service, tag_service

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/{tag_code}/public", response_model=PublicTagResponse)
def get_public_tag(tag_code: str) -> PublicTagResponse:
    """Retorna os dados PUBLICOS da tag (sem dados privados do dono)."""
    return tag_service.get_public_tag(tag_code)


@router.get("/{tag_code}/qr.png")
def get_tag_qr(tag_code: str) -> Response:
    """PNG do QR Code da tag (publico). Usado no poster de lost mode."""
    png = qr_service.qr_png(tag_code)
    return Response(
        content=png,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )
