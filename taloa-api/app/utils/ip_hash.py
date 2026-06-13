"""Hash de IP para os scans. NUNCA armazenar IP cru — somente o hash SHA-256."""
import hashlib
import re


def hash_ip(ip: str | None) -> str | None:
    if not ip:
        return None
    # Se vier "client, proxy1, proxy2" (X-Forwarded-For), usa o primeiro
    first = ip.split(",")[0].strip()
    if not first:
        return None
    return hashlib.sha256(first.encode("utf-8")).hexdigest()


def digits_only(phone: str | None) -> str | None:
    """So digitos — usado para montar link wa.me (WhatsApp)."""
    if not phone:
        return None
    cleaned = re.sub(r"\D", "", phone)
    return cleaned or None
