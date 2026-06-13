"""Rota de registro de scan (insercao publica, feita pelo servidor do frontend)."""
from fastapi import APIRouter

from app.schemas.scan import ScanCreate, ScanResponse
from app.services import scan_service

router = APIRouter(prefix="/scans", tags=["scans"])


@router.post("", response_model=ScanResponse)
def create_scan(body: ScanCreate) -> ScanResponse:
    scan_service.create_scan(body)
    return ScanResponse(ok=True)
