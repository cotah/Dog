"use client";

// Error boundary de topo do App Router. Captura erros de renderizacao que
// escapam dos layouts (inclusive do root layout) e os reporta ao Sentry.
// Renderiza seu proprio <html>/<body> porque substitui o layout quando dispara.
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
    <html>
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666" }}>
            An unexpected error occurred. Please try again.
          </p>
        </div>
      </body>
    </html>
  );
}
