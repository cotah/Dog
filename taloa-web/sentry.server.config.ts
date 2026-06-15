// Sentry — configuracao do lado do SERVIDOR (Node runtime do Next.js na Vercel).
// Carregado via instrumentation.ts quando NEXT_RUNTIME === "nodejs".
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? "production",
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  debug: false,
});
