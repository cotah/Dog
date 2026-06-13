"""Notificacoes por email — PLACEHOLDER ate a Etapa 14 (Resend).

REGRA de seguranca: nunca logar PII (email, telefone). Os logs aqui so
referenciam tag_code e nome do pet.
"""
import logging

logger = logging.getLogger("taloa.notifications")


def send_found_alert(
    *,
    owner_email: str | None,
    pet_name: str | None,
    tag_code: str,
    found_area: str | None = None,
) -> None:
    """Avisa o dono que alguem encontrou o pet. (Resend entra na Etapa 14.)"""
    if not owner_email:
        return
    # Placeholder: apenas registra que o alerta foi enfileirado (sem PII)
    logger.info(
        "Found alert queued (tag=%s, pet=%s, has_area=%s)",
        tag_code,
        pet_name or "?",
        bool(found_area),
    )
    # TODO Etapa 14: enviar email real via Resend para owner_email


def send_lead_notification(*, service_type: str) -> None:
    """Avisa o admin de um novo lead. (Resend entra na Etapa 14.)"""
    logger.info("Lead queued (service=%s)", service_type)
    # TODO Etapa 14: notificar o admin via Resend
