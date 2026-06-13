"""Registro de scans. Sempre grava o HASH do IP, nunca o IP cru."""
from app.core.supabase import get_service_client
from app.schemas.scan import ScanCreate
from app.utils.ip_hash import hash_ip


def create_scan(data: ScanCreate) -> None:
    sb = get_service_client()
    sb.table("scans").insert(
        {
            "tag_code": data.tag_code,
            "action_taken": data.action_taken,
            "user_agent": data.user_agent,
            "ip_hash": hash_ip(data.ip),
            "location_lat": data.location_lat,
            "location_lng": data.location_lng,
            "location_granted": data.location_granted,
        }
    ).execute()
