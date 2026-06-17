-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0013: Reviews e estrelas nos providers (directory)
-- Nova tabela provider_reviews (1 review por user por provider). Um trigger
-- recalcula automaticamente service_providers.rating (media) e review_count
-- em qualquer escrita (insert/update/delete). Admin faz hard delete.
-- ════════════════════════════════════════════════════════════

CREATE TABLE public.provider_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider_id, user_id)
);

CREATE INDEX idx_provider_reviews_provider ON public.provider_reviews(provider_id);

-- ── Recalculo automatico de rating/review_count ──
CREATE OR REPLACE FUNCTION public.recompute_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
  pid UUID;
BEGIN
  pid := COALESCE(NEW.provider_id, OLD.provider_id);
  UPDATE public.service_providers sp SET
    rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.provider_reviews WHERE provider_id = pid),
    review_count = (SELECT COUNT(*) FROM public.provider_reviews WHERE provider_id = pid)
  WHERE sp.id = pid;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_provider_reviews_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.provider_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_provider_rating();

-- ── RLS: leitura publica; criar/editar so do proprio; apagar so admin ──
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY provider_reviews_select ON public.provider_reviews
  FOR SELECT USING (true);
CREATE POLICY provider_reviews_insert ON public.provider_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY provider_reviews_update ON public.provider_reviews
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY provider_reviews_delete ON public.provider_reviews
  FOR DELETE USING (public.is_admin());
