-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0003: campos de contato em leads (Etapa 11)
-- O formulario publico de leads coleta nome/email/telefone/mensagem
-- de quem demonstra interesse num servico. Colunas nullable e aditivas:
-- nao afeta linhas existentes nem o fluxo autenticado do dashboard.
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS contact_name  TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS message       TEXT;

COMMENT ON COLUMN public.leads.contact_name  IS 'Nome informado no formulario publico de leads.';
COMMENT ON COLUMN public.leads.contact_email IS 'Email de contato do lead (formulario publico).';
COMMENT ON COLUMN public.leads.contact_phone IS 'Telefone de contato do lead (opcional).';
COMMENT ON COLUMN public.leads.message       IS 'Mensagem opcional escrita pelo lead.';
