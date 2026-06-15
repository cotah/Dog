// Next.js instrumentation hook — roda uma vez no boot de cada runtime.
// Carrega a config do Sentry correta para o runtime ativo (Node ou Edge).
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captura erros lancados dentro de Server Components / rotas (App Router).
export const onRequestError = Sentry.captureRequestError;
