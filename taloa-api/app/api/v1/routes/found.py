"""Rota do 'I Found This Pet' (insercao publica via servidor do frontend)."""
from fastapi import APIRouter

from app.schemas.found import FoundReportCreate, FoundReportResponse
from app.services import found_service

router = APIRouter(prefix="/found-reports", tags=["found"])


@router.post("", response_model=FoundReportResponse)
def create_found_report(body: FoundReportCreate) -> FoundReportResponse:
    found_service.create_found_report(body)
    return FoundReportResponse()
