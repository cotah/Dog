"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/Spinner";

// Botao "Assinar"/"Comprar": exige login (senao manda pro /login com retorno),
// cria a Checkout Session no backend e redireciona pro Stripe.
export function PricingButton({
  plan,
  label,
  highlight = false,
}: {
  plan: string;
  label: string;
  highlight?: boolean;
}) {
  const tc = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push({ pathname: "/login", query: { redirect: "/pricing" } });
        return;
      }

      const { url } = await apiFetch<{ url: string }>("/v1/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("somethingWentWrong"));
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`flex h-12 items-center justify-center gap-2 rounded-input font-semibold disabled:opacity-60 ${
          highlight
            ? "bg-taloa-primary text-white hover:bg-taloa-secondary"
            : "border border-taloa-primary text-taloa-primary hover:bg-taloa-primary/5"
        }`}
      >
        {loading ? <Spinner className="h-4 w-4" /> : null}
        {label}
      </button>
      {error && <p className="text-center text-xs text-taloa-alert">{error}</p>}
    </div>
  );
}
