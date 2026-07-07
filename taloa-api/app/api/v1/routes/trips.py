"""Travel Checklist (Etapa 28) — rotas autenticadas, Plus e acima.

Gating: require_active_subscription (402 sem assinatura paga ativa).
Ownership: validado no service em CADA request (pet e trip).
"""
from fastapi import APIRouter, Depends, Response, status

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.owner import ActionResponse
from app.schemas.travel import (
    ChecklistItem,
    CustomItemCreate,
    ItemUpdate,
    TripCreate,
    TripDetail,
    TripSummary,
)
from app.services import travel_service
from app.services.billing_service import require_active_subscription

router = APIRouter(tags=["travel"], dependencies=[Depends(require_active_subscription)])


@router.get("/pets/{pet_id}/trips", response_model=list[TripSummary])
def list_trips(
    pet_id: str, user: CurrentUser = Depends(get_current_user)
) -> list[TripSummary]:
    return travel_service.list_trips(user, pet_id)


@router.post(
    "/pets/{pet_id}/trips", response_model=TripDetail,
    status_code=status.HTTP_201_CREATED,
)
def create_trip(
    pet_id: str, body: TripCreate, user: CurrentUser = Depends(get_current_user)
) -> TripDetail:
    return travel_service.create_trip(user, pet_id, body)


@router.get("/trips/{trip_id}", response_model=TripDetail)
def get_trip(trip_id: str, user: CurrentUser = Depends(get_current_user)) -> TripDetail:
    return travel_service.get_trip(user, trip_id)


@router.delete("/trips/{trip_id}", response_model=ActionResponse)
def delete_trip(
    trip_id: str, user: CurrentUser = Depends(get_current_user)
) -> ActionResponse:
    travel_service.delete_trip(user, trip_id)
    return ActionResponse()


@router.post(
    "/trips/{trip_id}/items", response_model=ChecklistItem,
    status_code=status.HTTP_201_CREATED,
)
def add_item(
    trip_id: str, body: CustomItemCreate, user: CurrentUser = Depends(get_current_user)
) -> ChecklistItem:
    return travel_service.add_custom_item(user, trip_id, body)


@router.patch("/trips/{trip_id}/items/{item_id}", response_model=ChecklistItem)
def update_item(
    trip_id: str, item_id: str, body: ItemUpdate,
    user: CurrentUser = Depends(get_current_user),
) -> ChecklistItem:
    return travel_service.update_item(user, trip_id, item_id, body)


@router.delete("/trips/{trip_id}/items/{item_id}", response_model=ActionResponse)
def delete_item(
    trip_id: str, item_id: str, user: CurrentUser = Depends(get_current_user)
) -> ActionResponse:
    travel_service.delete_item(user, trip_id, item_id)
    return ActionResponse()


@router.get("/trips/{trip_id}/pdf")
def trip_pdf(trip_id: str, user: CurrentUser = Depends(get_current_user)) -> Response:
    pdf = travel_service.trip_pdf(user, trip_id)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="taloa-travel-checklist.pdf"'},
    )
