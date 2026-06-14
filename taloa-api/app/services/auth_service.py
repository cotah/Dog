"""Logica de negocio de autenticacao: criar conta e ativar tag.

Toda criacao de usuario passa por aqui (backend), usando a service role
do Supabase. O frontend nunca cria usuario/pet direto no banco.
"""
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.core.supabase import get_service_client
from app.schemas.auth import (
    ActivateRequest,
    ActivateResponse,
    OwnerData,
    SignupRequest,
    SignupResponse,
)
from app.services import email_service


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _create_auth_user(sb, email: str, password: str, name: str | None) -> str:
    """Cria o usuario no Supabase Auth (email ja confirmado). Retorna o id."""
    try:
        res = sb.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"name": name} if name else {},
            }
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao foi possivel criar a conta (o email pode ja estar em uso)",
        )

    user = getattr(res, "user", None)
    if user is None or not getattr(user, "id", None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Falha ao criar a conta de autenticacao",
        )
    return user.id


def _create_owner_profile(sb, user_id: str, owner: OwnerData | SignupRequest) -> None:
    """Insere a linha em public.users. Em caso de erro, desfaz o auth user."""
    try:
        sb.table("users").insert(
            {
                "id": user_id,
                "email": owner.email,
                "name": owner.name,
                "phone": owner.phone,
                "emergency_phone": getattr(owner, "emergency_phone", None),
                "role": "owner",
                "gdpr_consent": owner.gdpr_consent,
                "gdpr_consent_at": _now_iso(),
            }
        ).execute()
    except Exception:
        # rollback: remove o auth user para nao deixar conta orfa
        try:
            sb.auth.admin.delete_user(user_id)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Nao foi possivel criar o perfil do usuario",
        )


def signup(data: SignupRequest) -> SignupResponse:
    if not data.gdpr_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O consentimento GDPR e obrigatorio",
        )
    sb = get_service_client()
    user_id = _create_auth_user(sb, data.email, data.password, data.name)
    _create_owner_profile(sb, user_id, data)
    return SignupResponse(user_id=user_id, email=data.email)


def activate_tag(tag_code: str, data: ActivateRequest) -> ActivateResponse:
    if not data.owner.gdpr_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O consentimento GDPR e obrigatorio",
        )
    sb = get_service_client()

    # 1. Tag precisa existir e estar 'inactive'
    tag_res = sb.table("tags").select("*").eq("tag_code", tag_code).limit(1).execute()
    if not tag_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tag nao encontrada"
        )
    tag = tag_res.data[0]
    if tag["status"] != "inactive":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta tag nao esta disponivel para ativacao",
        )

    # 2. Cria dono (auth + users)
    user_id = _create_auth_user(
        sb, data.owner.email, data.owner.password, data.owner.name
    )
    _create_owner_profile(sb, user_id, data.owner)

    # 3. Cria o pet
    pet_res = (
        sb.table("pets")
        .insert(
            {
                "owner_id": user_id,
                "name": data.pet.name,
                "species": data.pet.species,
                "breed_or_morph": data.pet.breed_or_morph,
                "sex": data.pet.sex,
                "age_years": data.pet.age_years,
                "colour": data.pet.colour,
                "microchip": data.pet.microchip,
                "photo_url": data.pet.photo_url,
            }
        )
        .execute()
    )
    pet = pet_res.data[0]

    # 4. Cria o perfil (vazio por enquanto — completado no dashboard)
    sb.table("pet_profiles").insert({"pet_id": pet["id"]}).execute()

    # 5. Ativa a tag
    sb.table("tags").update(
        {
            "status": "active",
            "pet_id": pet["id"],
            "owner_id": user_id,
            "activated_at": _now_iso(),
        }
    ).eq("tag_code", tag_code).execute()

    # 6. Boas-vindas (best-effort; nunca quebra a ativacao)
    email_service.send_welcome(
        owner_email=data.owner.email,
        pet_name=data.pet.name,
        tag_code=tag_code,
    )

    return ActivateResponse(user_id=user_id, pet_id=pet["id"], tag_code=tag_code)
