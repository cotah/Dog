"""Logica do 'I Found This Pet'. Salva o report e notifica o dono."""
from app.core.supabase import get_service_client
from app.schemas.found import FoundReportCreate
from app.services import email_service


def create_found_report(data: FoundReportCreate) -> None:
    sb = get_service_client()

    sb.table("found_reports").insert(
        {
            "tag_code": data.tag_code,
            "found_area": data.found_area,
            "notes": data.notes,
            "finder_phone": data.finder_phone,
            "photo_url": data.photo_url,
            "location_lat": data.location_lat,
            "location_lng": data.location_lng,
            "location_granted": data.location_granted,
        }
    ).execute()

    # Descobre o dono para notificar (se a tag estiver vinculada)
    owner_email: str | None = None
    pet_name: str | None = None
    tag_res = (
        sb.table("tags")
        .select("pet_id, owner_id")
        .eq("tag_code", data.tag_code)
        .limit(1)
        .execute()
    )
    if tag_res.data:
        tag = tag_res.data[0]
        if tag.get("owner_id"):
            owner = (
                sb.table("users")
                .select("email")
                .eq("id", tag["owner_id"])
                .limit(1)
                .execute()
            )
            if owner.data:
                owner_email = owner.data[0].get("email")
        if tag.get("pet_id"):
            pet = (
                sb.table("pets")
                .select("name")
                .eq("id", tag["pet_id"])
                .limit(1)
                .execute()
            )
            if pet.data:
                pet_name = pet.data[0].get("name")

    email_service.send_found_alert(
        owner_email=owner_email,
        pet_name=pet_name,
        tag_code=data.tag_code,
        found_area=data.found_area,
    )
