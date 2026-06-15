// Sentry — configuracao do lado do BROWSER (client).
// Carregado automaticamente pelo @sentry/nextjs em todas as paginas.
// Usa NEXT_PUBLIC_SENTRY_DSN (DSN publico — pode ir para o browser).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? "production",

  // Amostra 10% das transacoes de performance (suficiente p/ visao geral, baixo custo).
  tracesSampleRate: 0.1,

  // Privacidade/GDPR: nao captura dados pessoais por padrao (IP, cookies, etc.).
  sendDefaultPii: false,

  // Session Replay desligado — evita capturar tela do usuario (privacidade).
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Em dev, loga no console o que seria enviado; em prod fica quieto.
  debug: false,
});
