"""Rota de upload de foto do pet (usada na ativacao da tag)."""
from fastapi import APIRouter, File, UploadFile

from app.services import upload_service

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/pet-photo")
async def upload_pet_photo(file: UploadFile = File(...)) -> dict:
    url = await upload_service.upload_pet_photo(file)
    return {"url": url}
