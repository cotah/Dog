"""Captura de leads (interesse em servicos)."""
from app.core.supabase import get_service_client
from app.schemas.auth import CurrentUser
from app.schemas.lead import LeadCreate, PublicLeadCreate
from app.services import email_service


def create_lead(user: CurrentUser, data: LeadCreate) -> None:
    """Lead vindo do dashboard autenticado (dono)."""
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
    # Lead do dashboard: o dono ja esta logado (sem nome de contato avulso).
    email_service.send_lead_notification(service_type=data.service_type)


def create_public_lead(data: PublicLeadCreate) -> None:
    """Lead vindo da pagina publica da tag (sem auth).

    Resolve pet_id e owner_id a partir do tag_code (nunca confia no cliente
    para esses vinculos). Salva os dados de contato e notifica o admin.
    """
    sb = get_service_client()

    pet_id: str | None = None
    owner_id: str | None = None
    tag_res = (
        sb.table("tags")
        .select("pet_id, owner_id")
        .eq("tag_code", data.tag_code)
        .limit(1)
        .execute()
    )
    if tag_res.data:
        pet_id = tag_res.data[0].get("pet_id")
        owner_id = tag_res.data[0].get("owner_id")

    sb.table("leads").insert(
        {
            "owner_id": owner_id,
            "pet_id": pet_id,
            "tag_code": data.tag_code,
            "service_type": data.service_type,
            "status": "new",
            "contact_name": data.contact_name,
            "contact_email": data.contact_email,
            "contact_phone": data.contact_phone,
            "message": data.message,
        }
    ).execute()

    email_service.send_lead_notification(
        service_type=data.service_type,
        contact_name=data.contact_name,
    )
