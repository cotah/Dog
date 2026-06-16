"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";

// Inicializa o PostHog (analytics de produto) no browser.
// Privacidade (GDPR / Irlanda):
//  - person_profiles "identified_only": eventos anonimos NAO criam perfil de pessoa.
//  - Session Replay com maskAllInputs: NUNCA grava o conteudo de inputs
//    (password, telefone, email, etc. ficam mascarados na gravacao).
//  - Nao capturamos PII nas propriedades dos eventos (ver lib/analytics.ts).
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    if (posthog.__loaded) return; // evita re-init no fast refresh / re-render

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false, // capturamos manualmente (App Router, abaixo)
      capture_pageleave: true,
      autocapture: true,
      disable_session_recording: false,
      session_recording: {
        // Mascara o conteudo de TODOS os inputs (passwords, telefones, emails...).
        maskAllInputs: true,
      },
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}

// Captura $pageview a cada navegacao do App Router (o capture automatico do
// posthog-js nao acompanha a navegacao client-side do Next).
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    if (!pathname || !posthog) return;
    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, posthog]);

  return null;
}
