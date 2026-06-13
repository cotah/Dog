"""Rotas de tags. A leitura publica e usada pela pagina /t/[tagCode]."""
from fastapi import APIRouter

from app.schemas.tag import PublicTagResponse
from app.services import tag_service

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/{tag_code}/public", response_model=PublicTagResponse)
def get_public_tag(tag_code: str) -> PublicTagResponse:
    """Retorna os dados PUBLICOS da tag (sem dados privados do dono)."""
    return tag_service.get_public_tag(tag_code)
