"""Notificacoes por email via Resend (Etapa 14).

REGRAS:
- Email NUNCA pode quebrar o fluxo de negocio: todo envio passa por `_send`,
  que captura qualquer excecao e apenas registra falha (sem PII).
- NUNCA logar PII (email, telefone, nome do dono). Os logs so referenciam
  tag_code, service_type e nome do PET (nao e dado pessoal de humano).
- Branding TALOA: azul petroleo #1A3A5C, laranja #E67E22, footer taloa.ie.
"""
import logging

import resend

from app.config import settings

logger = logging.getLogger("taloa.notifications")

# ── Branding ──
BLUE = "#1A3A5C"
ORANGE = "#E67E22"
DARK = "#0D1F2D"
INK = "#1f2933"
MUTED = "#64748b"
BG = "#f6f8fb"


def _layout(
    *,
    heading: str,
    body_html: str,
    cta_label: str | None = None,
    cta_url: str | None = None,
) -> str:
    """Wrapper HTML branded (table-based, email-safe)."""
    cta = ""
    if cta_label and cta_url:
        cta = f"""
        <tr><td style="padding:8px 32px 4px;">
          <a href="{cta_url}" style="display:inline-block;background:{ORANGE};color:#ffffff;
             text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;
             border-radius:8px;">{cta_label}</a>
        </td></tr>"""

    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:{BG};
  font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:{INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{BG};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
        style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;
        box-shadow:0 1px 3px rgba(13,31,45,.08);">
        <!-- Header -->
        <tr><td style="background:{BLUE};padding:22px 32px;">
          <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:.5px;">TALOA</span>
          <span style="color:#9fb3c8;font-size:12px;margin-left:10px;">Smart safety for pets</span>
        </td></tr>
        <!-- Heading -->
        <tr><td style="padding:30px 32px 8px;">
          <h1 style="margin:0;font-size:21px;line-height:1.3;color:{DARK};">{heading}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:6px 32px 8px;font-size:15px;line-height:1.6;color:{INK};">
          {body_html}
        </td></tr>
        {cta}
        <!-- Footer -->
        <tr><td style="padding:28px 32px 26px;">
          <hr style="border:none;border-top:1px solid #eef2f6;margin:0 0 16px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:{MUTED};">
            <a href="{settings.FRONTEND_URL}" style="color:{BLUE};text-decoration:none;font-weight:600;">taloa.ie</a>
            &nbsp;·&nbsp; Smart safety for pets, starting in Dublin.<br>
            You're receiving this because you use TALOA.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


def _send(*, to: str, subject: str, html: str, log_ctx: str) -> None:
    """Envia 1 email via Resend. Nunca propaga excecao; nunca loga PII."""
    if not settings.RESEND_API_KEY:
        logger.info("Email skipped, Resend not configured (%s)", log_ctx)
        return
    try:
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send(
            {
                "from": f"TALOA <{settings.RESEND_FROM_EMAIL}>",
                "to": [to],
                "subject": subject,
                "html": html,
            }
        )
        logger.info("Email sent (%s)", log_ctx)
    except Exception as exc:  # noqa: BLE001 — email nunca pode quebrar o fluxo
        # Sem PII: so o tipo do erro e o contexto (tag/servico).
        logger.warning("Email failed (%s): %s", log_ctx, type(exc).__name__)


# ──────────────────────────────────────────────────────────────────────────
# Emails transacionais
# ──────────────────────────────────────────────────────────────────────────
def send_welcome(*, owner_email: str | None, pet_name: str, tag_code: str) -> None:
    """Boas-vindas na ativacao da tag."""
    if not owner_email:
        return
    profile_url = f"{settings.FRONTEND_URL}/t/{tag_code}"
    body = f"""
      <p style="margin:0 0 14px;">Great news — <strong>{pet_name}</strong>'s TALOA tag is
      now active and protecting them. 🛡️</p>
      <p style="margin:0 0 14px;">If anyone ever finds {pet_name}, they can scan the tag
      and reach you straight away through {pet_name}'s public profile.</p>
      <p style="margin:0 0 6px;color:{MUTED};font-size:13px;">Tag code: <strong>{tag_code}</strong></p>
    """
    html = _layout(
        heading="Your pet is now protected",
        body_html=body,
        cta_label=f"View {pet_name}'s profile",
        cta_url=profile_url,
    )
    _send(
        to=owner_email,
        subject="Welcome to TALOA — Your pet is now protected",
        html=html,
        log_ctx=f"welcome tag={tag_code}",
    )


def send_found_alert(
    *,
    owner_email: str | None,
    pet_name: str | None,
    tag_code: str,
    found_area: str | None = None,
    photo_url: str | None = None,
) -> None:
    """Avisa o dono que alguem encontrou o pet."""
    if not owner_email:
        return
    name = pet_name or "your pet"
    dashboard_url = f"{settings.FRONTEND_URL}/owner/dashboard"
    photo_html = ""
    if photo_url:
        photo_html = f"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 16px;">
          <tr><td>
            <img src="{photo_url}" alt="{name}" width="100%"
              style="display:block;width:100%;max-height:320px;object-fit:cover;border-radius:10px;" />
          </td></tr>
        </table>"""
    area_html = ""
    if found_area:
        area_html = f"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="margin:6px 0 16px;background:#fff5ec;border-left:4px solid {ORANGE};border-radius:8px;">
          <tr><td style="padding:12px 16px;">
            <span style="font-size:12px;font-weight:700;text-transform:uppercase;
              letter-spacing:.4px;color:{ORANGE};">Reported area</span><br>
            <span style="font-size:15px;color:{INK};">{found_area}</span>
          </td></tr>
        </table>"""
    body = f"""
      <p style="margin:0 0 14px;">Someone just reported finding <strong>{name}</strong>
      through their TALOA tag.</p>
      {photo_html}
      {area_html}
      <p style="margin:0 0 6px;">Open your dashboard to see the full report and the
      finder's contact details.</p>
    """
    html = _layout(
        heading=f"Someone found {name}!",
        body_html=body,
        cta_label="See the report in your dashboard",
        cta_url=dashboard_url,
    )
    _send(
        to=owner_email,
        subject=f"Someone found {name}",
        html=html,
        log_ctx=f"found_alert tag={tag_code}",
    )


def send_reunite_summary(
    *,
    owner_email: str | None,
    pet_name: str | None,
    tag_code: str,
    pet_is_ok: str | None = None,
    location: str | None = None,
    duration: str | None = None,
    finder_phone: str | None = None,
    summary: str | None = None,
) -> None:
    """Reunite Flow (Etapa 22): avisa o dono que alguem esta com o pet, com o
    resumo que o TALOA AI coletou do finder (pet ok? / onde? / por quanto tempo?)
    e, se houver, o telefone do finder para contato direto."""
    if not owner_email:
        return
    name = pet_name or "your pet"
    dashboard_url = f"{settings.FRONTEND_URL}/owner/dashboard"

    def _row(label: str, value: str | None) -> str:
        if not value:
            return ""
        return (
            f'<tr><td style="padding:10px 16px;border-bottom:1px solid #eef2f6;">'
            f'<span style="font-size:12px;font-weight:700;text-transform:uppercase;'
            f'letter-spacing:.4px;color:{ORANGE};">{label}</span><br>'
            f'<span style="font-size:15px;color:{INK};">{value}</span></td></tr>'
        )

    rows = "".join(
        [
            _row("Is " + name + " OK?", pet_is_ok),
            _row("Where", location),
            _row("Finder can stay", duration),
            _row("Finder's phone", finder_phone),
        ]
    )
    details = ""
    if rows:
        details = (
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
            f'style="margin:6px 0 16px;background:{BG};border-radius:8px;">{rows}</table>'
        )
    recap_html = ""
    if summary:
        recap_html = f'<p style="margin:0 0 14px;">{summary}</p>'

    body = f"""
      <p style="margin:0 0 14px;">Good news — someone scanned <strong>{name}</strong>'s
      TALOA tag and our assistant is helping reunite you. Here's what they shared:</p>
      {recap_html}
      {details}
      <p style="margin:0 0 6px;">Open your dashboard to see the full report
      {"and call the finder" if finder_phone else ""}, and to coordinate the reunion.</p>
    """
    html = _layout(
        heading=f"Someone has {name} — let's reunite them",
        body_html=body,
        cta_label="Coordinate the reunion",
        cta_url=dashboard_url,
    )
    _send(
        to=owner_email,
        subject=f"Good news — someone has {name}",
        html=html,
        log_ctx=f"reunite tag={tag_code}",
    )


def send_lead_notification(*, service_type: str, contact_name: str | None = None) -> None:
    """Notifica o admin (hello@taloa.ie) de um novo lead."""
    name = contact_name or "An existing owner"
    body = f"""
      <p style="margin:0 0 14px;">A new service lead just came in through TALOA.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="margin:4px 0 8px;background:{BG};border-radius:8px;">
        <tr><td style="padding:14px 16px;font-size:14px;line-height:1.7;color:{INK};">
          <strong>Service:</strong> {service_type}<br>
          <strong>From:</strong> {name}
        </td></tr>
      </table>
    """
    html = _layout(heading=f"New lead — {service_type}", body_html=body)
    # Lead vai para o proprio endereco do admin (hello@taloa.ie).
    _send(
        to=settings.RESEND_FROM_EMAIL,
        subject=f"New TALOA lead — {service_type}",
        html=html,
        log_ctx=f"lead service={service_type}",
    )
