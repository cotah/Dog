"""Listagem publica de clinicas veterinarias ativas."""
from app.core.supabase import get_service_client
from app.schemas.vet import PublicVet


def get_active_clinics() -> list[PublicVet]:
    sb = get_service_client()
    # 24h primeiro, depois por nome
    res = (
        sb.table("vet_clinics")
        .select("*")
        .eq("is_active", True)
        .order("emergency_24h", desc=True)
        .order("name")
        .execute()
    )
    return [
        PublicVet(
            id=v["id"],
            name=v["name"],
            phone=v["phone"],
            address=v.get("address"),
            area=v.get("area"),
            species_supported=v.get("species_supported"),
            emergency_24h=bool(v.get("emergency_24h", False)),
            hours=v.get("hours"),
            website=v.get("website"),
        )
        for v in (res.data or [])
    ]
