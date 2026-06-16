"use client";

// Error boundary de topo do App Router. Captura erros de renderizacao que
// escapam dos layouts (inclusive do root layout) e os reporta ao Sentry.
// Renderiza seu proprio <html>/<body> e usa INLINE STYLES porque fica fora do
// CSS do app (Tailwind nao esta carregado aqui). Identidade TALOA (Etapa #3).
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#1A3A5C",
            padding: "4rem 1.5rem",
            textAlign: "center",
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            color: "#ffffff",
          }}
        >
          <span style={{ fontSize: "2.75rem", fontWeight: 800, letterSpacing: "0.04em" }}>
            TALOA
          </span>
          <span
            style={{
              marginTop: "0.25rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Smart safety for pets
          </span>

          <p style={{ marginTop: "2.5rem", fontSize: "4.5rem", fontWeight: 700, color: "rgba(255,255,255,0.2)" }}>
            500
          </p>
          <p
            style={{
              marginTop: "1rem",
              maxWidth: "24rem",
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Something went wrong on our end. We have been notified and are fixing it.
          </p>

          <a
            href="/"
            style={{
              marginTop: "2rem",
              display: "inline-flex",
              height: "3rem",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "0.5rem",
              background: "#E67E22",
              padding: "0 2rem",
              fontWeight: 600,
              color: "#ffffff",
              textDecoration: "none",
            }}
          >
            Go home
          </a>
        </main>
      </body>
    </html>
  );
}
