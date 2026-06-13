"""Logica da pagina publica da tag — monta o perfil publico com seguranca.

REGRA: nunca retornar dados privados do dono (endereco, eircode, email
sem permissao, private_notes). O perfil so aparece para tags active/lost.
"""
from fastapi import HTTPException, status

from app.core.supabase import get_service_client
from app.schemas.tag import (
    LostInfo,
    PublicContact,
    PublicPet,
    PublicProfile,
    PublicTagResponse,
)
from app.utils.ip_hash import digits_only


def get_public_tag(tag_code: str) -> PublicTagResponse:
    sb = get_service_client()

    tag_res = sb.table("tags").select("*").eq("tag_code", tag_code).limit(1).execute()
    if not tag_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tag nao encontrada"
        )
    tag = tag_res.data[0]

    resp = PublicTagResponse(
        tag_code=tag["tag_code"],
        status=tag["status"],
        tag_type=tag.get("tag_type"),
    )

    # Perfil publico so existe quando a tag esta active ou lost e tem pet
    if tag["status"] not in ("active", "lost") or not tag.get("pet_id"):
        return resp

    pet_id = tag["pet_id"]
    pet_res = sb.table("pets").select("*").eq("id", pet_id).limit(1).execute()
    if not pet_res.data:
        return resp
    pet = pet_res.data[0]

    resp.pet = PublicPet(
        name=pet["name"],
        species=pet["species"],
        breed_or_morph=pet.get("breed_or_morph"),
        sex=pet.get("sex"),
        age_years=pet.get("age_years"),
        colour=pet.get("colour"),
        photo_url=pet.get("photo_url"),
    )

    # Perfil (apenas campos publicos)
    prof_res = (
        sb.table("pet_profiles").select("*").eq("pet_id", pet_id).limit(1).execute()
    )
    profile = prof_res.data[0] if prof_res.data else {}
    resp.profile = PublicProfile(
        allergies=profile.get("allergies"),
        medication=profile.get("medication"),
        behaviour=profile.get("behaviour"),
        likes=profile.get("likes"),
        dislikes=profile.get("dislikes"),
        public_notes=profile.get("public_notes"),
        emergency_notes=profile.get("emergency_notes"),
        vet_name=profile.get("vet_name"),
        vet_phone=profile.get("vet_phone"),
    )

    # Contato do dono — respeita show_phone / show_email
    show_phone = bool(profile.get("show_phone", False))
    show_email = bool(profile.get("show_email", False))
    owner_phone = None
    owner_email = None
    if tag.get("owner_id"):
        owner_res = (
            sb.table("users")
            .select("phone, email")
            .eq("id", tag["owner_id"])
            .limit(1)
            .execute()
        )
        if owner_res.data:
            owner_phone = owner_res.data[0].get("phone")
            owner_email = owner_res.data[0].get("email")

    resp.contact = PublicContact(
        show_phone=show_phone,
        show_email=show_email,
        phone=owner_phone if show_phone else None,
        whatsapp=digits_only(owner_phone) if show_phone else None,
        email=owner_email if show_email else None,
    )

    # Info de "perdido"
    if tag["status"] == "lost":
        lost_res = (
            sb.table("lost_reports")
            .select("last_seen_at, last_seen_area, description")
            .eq("pet_id", pet_id)
            .eq("status", "active")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if lost_res.data:
            lr = lost_res.data[0]
            resp.lost = LostInfo(
                last_seen_at=lr.get("last_seen_at"),
                last_seen_area=lr.get("last_seen_area"),
                description=lr.get("description"),
            )

    return resp
