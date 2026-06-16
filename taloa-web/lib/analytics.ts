import posthog from "posthog-js";

// ── Eventos criticos da TALOA ────────────────────────────────────────────
// Lista fechada: garante nomes consistentes e evita typo em string solta.
export type AnalyticsEvent =
  | "tag_scanned"
  | "tag_activated"
  | "call_owner_clicked"
  | "whatsapp_owner_clicked"
  | "found_pet_submitted"
  | "emergency_vets_clicked"
  | "service_lead_submitted"
  | "pricing_page_viewed"
  | "plan_subscribe_clicked"
  | "lost_mode_activated"
  | "reunite_flow_completed";

// Dispara um evento no PostHog. No-op seguro quando:
//  - estamos no server (SSR) — PostHog so existe no browser;
//  - nao ha key configurada (dev local sem analytics).
// REGRA: nunca passar PII aqui (email, telefone, endereco, nome de pessoa,
// dados medicos). So identificadores tecnicos e flags (tag_code, plan, etc.).
export function track(
  event: AnalyticsEvent,
  props?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, props);
}
