import { Mail, MessageCircle, Phone } from "lucide-react";

import type { PublicContact } from "@/types/tag";

// Botoes de contato — grandes (min 48px) e em destaque. "Call Owner" e o
// elemento mais visivel do perfil publico.
export function ContactOwnerButtons({ contact }: { contact: PublicContact | null }) {
  if (!contact) return null;

  const hasPhone = contact.show_phone && contact.phone;
  const hasEmail = contact.show_email && contact.email;

  if (!hasPhone && !hasEmail) return null;

  return (
    <div className="flex flex-col gap-3">
      {hasPhone && (
        <a
          href={`tel:${contact.phone}`}
          className="flex h-14 items-center justify-center gap-2 rounded-input bg-taloa-primary text-lg font-semibold text-white hover:bg-taloa-secondary"
        >
          <Phone className="h-5 w-5" />
          Call Owner
        </a>
      )}

      {hasPhone && contact.whatsapp && (
        <a
          href={`https://wa.me/${contact.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 items-center justify-center gap-2 rounded-input border-2 border-taloa-primary text-lg font-semibold text-taloa-primary hover:bg-taloa-primary/5"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp Owner
        </a>
      )}

      {hasEmail && (
        <a
          href={`mailto:${contact.email}`}
          className="flex h-12 items-center justify-center gap-2 rounded-input border border-slate-300 font-medium text-slate-600 hover:bg-slate-50"
        >
          <Mail className="h-5 w-5" />
          Email Owner
        </a>
      )}
    </div>
  );
}
