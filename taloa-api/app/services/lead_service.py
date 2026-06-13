"""Captura de leads (interesse em servicos)."""
from app.core.supabase import get_service_client
from app.schemas.auth import CurrentUser
from app.schemas.lead import LeadCreate
from app.services import email_service


def create_lead(user: CurrentUser, data: LeadCreate) -> None:
    sb = get_service_client()
    sb.table("leads").insert(
        {
            "owner_id": user.id,
            "pet_id": data.pet_id,
            "tag_code": data.tag_code,
            "service_type": data.service_type,
            "status": "new",
        }
    ).execute()
    email_service.send_lead_notification(service_type=data.service_type)
