"""Rotas admin do Partners Directory (Etapa 23) — CRUD de providers."""
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import require_admin
from app.schemas.directory import AdminProvider, ProviderCreate, ProviderUpdate
from app.services import directory_service

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
