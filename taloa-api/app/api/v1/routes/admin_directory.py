"""Rotas admin do Partners Directory (Etapa 23) — CRUD de providers."""
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.core.security import require_admin
from app.schemas.directory import AdminProvider, ProviderCreate, ProviderUpdate
from app.schemas.review import Review
from app.services import directory_service, review_service, upload_service

router = APIRouter(
    prefix="/admin/directory",
    tags=["admin-directory"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AdminProvider])
def admin_list(
    category: str | None = None,
    search: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[AdminProvider]:
    return directory_service.admin_list(
        category=category, search=search, limit=limit, offset=offset
    )


@router.post("/upload")
async def admin_upload_image(file: UploadFile = File(...)) -> dict:
    """Upload de logo/foto de provider para o Storage. Retorna a URL publica."""
    url = await upload_service.upload_provider_image(file)
    return {"url": url}


@router.post("", response_model=AdminProvider, status_code=status.HTTP_201_CREATED)
def admin_create(body: ProviderCreate) -> AdminProvider:
    return directory_service.admin_create(body)


@router.put("/{provider_id}", response_model=AdminProvider)
def admin_update(provider_id: str, body: ProviderUpdate) -> AdminProvider:
    updated = directory_service.admin_update(provider_id, body)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found"
        )
    return updated


@router.delete("/{provider_id}")
def admin_delete(provider_id: str) -> dict:
    """Soft delete: desativa o provider (is_active = false)."""
    if not directory_service.admin_soft_delete(provider_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found"
        )
    return {"status": "disabled"}


@router.get("/{provider_id}/reviews", response_model=list[Review])
def admin_list_reviews(provider_id: str) -> list[Review]:
    """Reviews de um provider (para o admin moderar)."""
    return review_service.list_reviews(provider_id, limit=200)


@router.delete("/reviews/{review_id}")
def admin_delete_review(review_id: str) -> dict:
    """Hard delete de uma review. O trigger recalcula o rating do provider."""
    if not review_service.admin_delete(review_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Review not found"
        )
    return {"status": "deleted"}
