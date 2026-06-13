-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0002: Row Level Security (RLS)
-- Secao 4.11 do brief. RLS OBRIGATORIO em TODAS as tabelas.
--
-- Nota de arquitetura: o taloa-api usa a SERVICE ROLE key, que
-- por design IGNORA o RLS. A autorizacao de negocio e feita no
-- FastAPI. O RLS aqui e defesa em profundidade: protege contra
-- qualquer acesso direto com a anon key (web/mobile/futuro).
-- ════════════════════════════════════════════════════════════

-- ── Helper: verifica se o usuario logado e admin ─────────────
-- SECURITY DEFINER -> roda como owner e ignora o RLS de users,
-- evitando recursao infinita nas policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── Habilitar RLS em TODAS as tabelas ────────────────────────
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_clinics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_reports    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.found_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- users: owner ve/edita o proprio. Admin ve todos.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY users_select ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY users_insert ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY users_update ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- pets: owner ve/edita os proprios. Visitante nao acessa.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY pets_select ON public.pets
  FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pets_insert ON public.pets
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pets_update ON public.pets
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pets_delete ON public.pets
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- pet_profiles: owner do pet ve/edita. Visitante nao acessa.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY pet_profiles_select ON public.pet_profiles
  FOR SELECT USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_profiles.pet_id AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY pet_profiles_insert ON public.pet_profiles
  FOR INSERT WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_profiles.pet_id AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY pet_profiles_update ON public.pet_profiles
  FOR UPDATE USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_profiles.pet_id AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY pet_profiles_delete ON public.pet_profiles
  FOR DELETE USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_profiles.pet_id AND p.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- tags: leitura publica por tag_code. Escrita owner/admin.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY tags_select_public ON public.tags
  FOR SELECT USING (true);
CREATE POLICY tags_insert ON public.tags
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY tags_update ON public.tags
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY tags_delete ON public.tags
  FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- scans: insercao SOMENTE pelo backend (service role). Leitura somente admin.
-- (Opcao A: sem policy de INSERT -> anon/authenticated nao inserem direto)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY scans_select_admin ON public.scans
  FOR SELECT USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- vet_clinics: leitura publica. Escrita somente admin.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY vet_clinics_select_public ON public.vet_clinics
  FOR SELECT USING (true);
CREATE POLICY vet_clinics_insert ON public.vet_clinics
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY vet_clinics_update ON public.vet_clinics
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY vet_clinics_delete ON public.vet_clinics
  FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- leads: owner ve os proprios. Admin ve todos.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY leads_select ON public.leads
  FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY leads_insert ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY leads_update ON public.leads
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY leads_delete ON public.leads
  FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- lost_reports: leitura publica por pet. Escrita owner/admin.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY lost_reports_select_public ON public.lost_reports
  FOR SELECT USING (true);
CREATE POLICY lost_reports_insert ON public.lost_reports
  FOR INSERT WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = lost_reports.pet_id AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY lost_reports_update ON public.lost_reports
  FOR UPDATE USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = lost_reports.pet_id AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY lost_reports_delete ON public.lost_reports
  FOR DELETE USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = lost_reports.pet_id AND p.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- found_reports: insercao SOMENTE pelo backend (service role). Leitura owner/admin.
-- (Opcao A: sem policy de INSERT -> anon/authenticated nao inserem direto)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY found_reports_select ON public.found_reports
  FOR SELECT USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.tags t
      JOIN public.pets p ON p.id = t.pet_id
      WHERE t.tag_code = found_reports.tag_code AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY found_reports_update ON public.found_reports
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY found_reports_delete ON public.found_reports
  FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- ai_conversations: owner ve as proprias. Admin ve todas.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY ai_conversations_select ON public.ai_conversations
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY ai_conversations_insert ON public.ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY ai_conversations_update ON public.ai_conversations
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
