-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0004: plans + subscriptions (Etapa 18 / brief v2.0 secao 1)
-- plans: catalogo de planos com stripe_price_id (leitura publica).
-- subscriptions: assinatura por usuario, preenchida pelo webhook do Stripe.
-- REGRA: RLS obrigatorio em TODAS as tabelas.
-- ════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- plans
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,            -- free, plus, club, exotic_club, family, premium_tag
  display_name TEXT NOT NULL,           -- "TALOA Plus"
  description TEXT,
  price_eur DECIMAL NOT NULL DEFAULT 0,
  billing_interval TEXT NOT NULL DEFAULT 'month'
    CHECK (billing_interval IN ('month', 'year', 'one_time')),
  max_pets INT NOT NULL DEFAULT 1,
  features JSONB DEFAULT '[]',
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- subscriptions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN (
      'active', 'past_due', 'canceled', 'trialing',
      'incomplete', 'incomplete_expired', 'unpaid'
    )),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- users.stripe_customer_id (mapeia o usuario ao customer do Stripe,
-- evita criar customers duplicados a cada checkout)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- plans: leitura publica (pagina /pricing). Escrita somente admin.
CREATE POLICY plans_select_public ON public.plans
  FOR SELECT USING (true);
CREATE POLICY plans_insert ON public.plans
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY plans_update ON public.plans
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY plans_delete ON public.plans
  FOR DELETE USING (public.is_admin());

-- subscriptions: usuario ve a propria; admin ve todas.
-- Escrita SOMENTE pelo backend (service role) via webhook -> sem policy de
-- INSERT/UPDATE/DELETE para anon/authenticated (mesmo padrao de scans).
CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
