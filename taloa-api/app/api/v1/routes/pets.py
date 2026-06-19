"""Rotas de acoes sobre o pet (autenticadas): lost, found, edicao e diario."""
from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.diary import (
    Activity,
    ActivityCreate,
    DiarySummary,
    HealthRecord,
    HealthRecordCreate,
    HealthRecordUpdate,
    SheddingCreate,
    SheddingRecord,
    SheddingUpdate,
)
from app.schemas.owner import ActionResponse, PetUpdate
from app.services import diary_service, owner_service

router = APIRouter(prefix="/pets", tags=["pets"])


@router.post("/{pet_id}/lost", response_model=ActionResponse)
def mark_lost(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> ActionResponse:
    new_status = owner_service.mark_lost(user, pet_id)
    return ActionResponse(status=new_status)


@router.post("/{pet_id}/found", response_model=ActionResponse)
def mark_found(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> ActionResponse:
    new_status = owner_service.mark_found(user, pet_id)
    return ActionResponse(status=new_status)


@router.patch("/{pet_id}", response_model=ActionResponse)
def update_pet(
    pet_id: str,
    body: PetUpdate,
    user: CurrentUser = Depends(get_current_user),
) -> ActionResponse:
    owner_service.update_pet(user, pet_id, body)
    return ActionResponse()


# ── Diary: atividades ───────────────────────────────────────
@router.get("/{pet_id}/diary", response_model=list[Activity])
def list_diary(
    pet_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: CurrentUser = Depends(get_current_user),
) -> list[Activity]:
    return diary_service.list_activities(user, pet_id, limit=limit, offset=offset)


@router.get("/{pet_id}/diary/summary", response_model=DiarySummary)
def diary_summary(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> DiarySummary:
    return diary_service.diary_summary(user, pet_id)


@router.post(
    "/{pet_id}/diary", response_model=Activity, status_code=status.HTTP_201_CREATED
)
def add_diary(
    pet_id: str,
    body: ActivityCreate,
    user: CurrentUser = Depends(get_current_user),
) -> Activity:
    return diary_service.create_activity(user, pet_id, body)


@router.delete("/{pet_id}/diary/{activity_id}", response_model=ActionResponse)
def delete_diary(
    pet_id: str,
    activity_id: str,
    user: CurrentUser = Depends(get_current_user),
) -> ActionResponse:
    diary_service.delete_activity(user, pet_id, activity_id)
    return ActionResponse()


# ── Health records ──────────────────────────────────────────
@router.get("/{pet_id}/health", response_model=list[HealthRecord])
def list_health(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> list[HealthRecord]:
    return diary_service.list_health(user, pet_id)


@router.post(
    "/{pet_id}/health",
    response_model=HealthRecord,
    status_code=status.HTTP_201_CREATED,
)
def add_health(
    pet_id: str,
    body: HealthRecordCreate,
    user: CurrentUser = Depends(get_current_user),
) -> HealthRecord:
    return diary_service.create_health(user, pet_id, body)


@router.put("/{pet_id}/health/{record_id}", response_model=HealthRecord)
def edit_health(
    pet_id: str,
    record_id: str,
    body: HealthRecordUpdate,
    user: CurrentUser = Depends(get_current_user),
) -> HealthRecord:
    return diary_service.update_health(user, pet_id, record_id, body)


@router.delete("/{pet_id}/health/{record_id}", response_model=ActionResponse)
def delete_health(
    pet_id: str,
    record_id: str,
    user: CurrentUser = Depends(get_current_user),
) -> ActionResponse:
    diary_service.delete_health(user, pet_id, record_id)
    return ActionResponse()


# ── Shedding / molting ──────────────────────────────────────
@router.get("/{pet_id}/shedding", response_model=list[SheddingRecord])
def list_shedding(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> list[SheddingRecord]:
    return diary_service.list_shedding(user, pet_id)


@router.post(
    "/{pet_id}/shedding",
    response_model=SheddingRecord,
    status_code=status.HTTP_201_CREATED,
)
def add_shedding(
    pet_id: str,
    body: SheddingCreate,
    user: CurrentUser = Depends(get_current_user),
) -> SheddingRecord:
    return diary_service.create_shedding(user, pet_id, body)


@router.put("/{pet_id}/shedding/{shedding_id}", response_model=SheddingRecord)
def close_shedding(
    pet_id: str,
    shedding_id: str,
    body: SheddingUpdate,
    user: CurrentUser = Depends(get_current_user),
) -> SheddingRecord:
    return diary_service.update_shedding(user, pet_id, shedding_id, body)
