// Sentry — configuracao do EDGE runtime (middleware e rotas edge do Next.js).
// Carregado via instrumentation.ts quando NEXT_RUNTIME === "edge".
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? "production",
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  debug: false,
});
