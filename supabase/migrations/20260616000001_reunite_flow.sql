-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0007: Reunite Flow (Etapa 22)
-- O chat de IA vira assistente de reencontro: ao reunir as 3 respostas
-- do finder (pet ok? / onde esta? / por quanto tempo pode ficar?), o
-- backend cria um found_report e envia o email-resumo ao dono — UMA vez.
-- `reunite_done` garante a idempotencia (1 email por conversa/sessao).
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS reunite_done BOOLEAN NOT NULL DEFAULT FALSE;
