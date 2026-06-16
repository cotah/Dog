"""Upload de fotos dos pets para o Supabase Storage (bucket publico pet-photos).

Feito pelo backend (service role) para nao expor o Storage ao cliente anonimo
durante a ativacao (quando o usuario ainda nao tem sessao).
"""
import uuid

from fastapi import HTTPException, UploadFile, status

from app.core.supabase import get_service_client

BUCKET = "pet-photos"
MAX_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


async def _store_image(file: UploadFile, folder: str) -> str:
    """Valida (tipo/tamanho) e grava a imagem no bucket publico. Retorna a URL."""
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato invalido. Use JPEG, PNG ou WebP.",
        )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Imagem muito grande (maximo 5MB).",
        )

    ext = ALLOWED_TYPES[content_type]
    path = f"{folder}/{uuid.uuid4()}.{ext}"

    sb = get_service_client()
    try:
        sb.storage.from_(BUCKET).upload(
            path, content, {"content-type": content_type}
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao enviar a imagem.",
        )

    return sb.storage.from_(BUCKET).get_public_url(path)


async def upload_pet_photo(file: UploadFile) -> str:
    return await _store_image(file, "pets")


async def upload_provider_image(file: UploadFile) -> str:
    """Logo/foto de provider do directory (Etapa 23) — pasta providers/."""
    return await _store_image(file, "providers")
