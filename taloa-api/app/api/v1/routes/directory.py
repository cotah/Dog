"""Rotas publicas do Partners Directory (Etapa 23)."""
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.directory import CategoryCount, PublicProvider
from app.services import directory_service

router = APIRouter(prefix="/directory", tags=["directory"])


@router.get("", response_model=list[PublicProvider])
def list_directory(
    category: str | None = None,
    area: str | None = None,
    species: str | None = None,
    emergency_24h: bool | None = None,
    is_featured: bool | None = None,
    search: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[PublicProvider]:
    return directory_service.list_providers(
        category=category,
        area=area,
        species=species,
        emergency_24h=emergency_24h,
        is_featured=is_featured,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get("/categories", response_model=list[CategoryCount])
def list_categories() -> list[CategoryCount]:
    return directory_service.categories_with_counts()


@router.get("/{provider_id}", response_model=PublicProvider)
def get_provider(provider_id: str) -> PublicProvider:
    provider = directory_service.get_provider(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found"
        )
    return provider
