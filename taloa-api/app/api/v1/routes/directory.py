"""Rotas publicas do Partners Directory (Etapa 23) + reviews (Etapa 26)."""
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.directory import CategoryCount, PublicProvider
from app.schemas.review import Review, ReviewCreate
from app.services import directory_service, review_service

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


@router.get("/{provider_id}/reviews", response_model=list[Review])
def list_reviews(provider_id: str) -> list[Review]:
    """Reviews publicas de um provider (mais recentes primeiro)."""
    return review_service.list_reviews(provider_id)


@router.post(
    "/{provider_id}/reviews",
    response_model=Review,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    provider_id: str,
    body: ReviewCreate,
    user: CurrentUser = Depends(get_current_user),
) -> Review:
    """Cria/atualiza a review do utilizador autenticado (1 por provider)."""
    return review_service.submit_review(user, provider_id, body)
