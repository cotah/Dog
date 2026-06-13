-- ════════════════════════════════════════════════════════════
-- TALOA — seed.sql
-- Dados de teste/demo para desenvolvimento local.
-- (vet_clinics reais de Dublin serao adicionadas na Etapa 10)
--
-- Cria: 1 owner demo + 2 pets (Buddy active, Luna lost) + 4 tags
-- (uma por status) + 1 lost_report. UUIDs fixos para facilitar testes.
-- ════════════════════════════════════════════════════════════

-- ── Owner demo (auth + perfil) ──
INSERT INTO auth.users (instance_id, id, aud, role, email, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'owner.demo@taloa.ie', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, name, phone, emergency_phone, role, gdpr_consent, gdpr_consent_at)
VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'owner.demo@taloa.ie', 'Demo Owner', '+353871234567', '+353879999999', 'owner', true, now())
ON CONFLICT (id) DO NOTHING;

-- ── Pets ──
INSERT INTO public.pets (id, owner_id, name, species, breed_or_morph, sex, age_years, colour, microchip, is_active) VALUES
('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Buddy', 'dog', 'Labrador Retriever', 'male', 3, 'Golden', '985112000000001', true),
('cccccccc-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'Luna', 'cat', 'Domestic Shorthair', 'female', 2, 'Black & white', '985112000000002', true)
ON CONFLICT (id) DO NOTHING;

-- ── Perfis publicos ──
INSERT INTO public.pet_profiles (pet_id, allergies, medication, behaviour, public_notes, emergency_notes, vet_name, vet_phone, show_phone, show_email) VALUES
('bbbbbbbb-0000-4000-8000-000000000002', 'None known', 'None', 'Friendly and calm. Loves people.', 'Microchipped. Please call my owner if you find me.', 'If found, keep him safe and call the number below.', 'Dublin Vet Clinic', '+35315551234', true, false),
('cccccccc-0000-4000-8000-000000000003', 'Pollen', 'None', 'Shy with strangers, may hide.', 'Indoor cat, recently moved area.', 'Do not chase. Please call the owner immediately.', 'Dublin Vet Clinic', '+35315551234', true, false)
ON CONFLICT (pet_id) DO NOTHING;

-- ── Tags (4 status) ──
INSERT INTO public.tags (tag_code, tag_url, status) VALUES
('TAL-000001', 'https://taloa.ie/t/TAL-000001', 'inactive'),
('TAL-000002', 'https://taloa.ie/t/TAL-000002', 'active'),
('TAL-000003', 'https://taloa.ie/t/TAL-000003', 'lost'),
('TAL-000004', 'https://taloa.ie/t/TAL-000004', 'disabled')
ON CONFLICT (tag_code) DO NOTHING;

UPDATE public.tags SET pet_id='bbbbbbbb-0000-4000-8000-000000000002', owner_id='aaaaaaaa-0000-4000-8000-000000000001', activated_at=now() WHERE tag_code='TAL-000002';
UPDATE public.tags SET pet_id='cccccccc-0000-4000-8000-000000000003', owner_id='aaaaaaaa-0000-4000-8000-000000000001', activated_at=now() WHERE tag_code='TAL-000003';

-- ── Lost report para TAL-000003 ──
INSERT INTO public.lost_reports (pet_id, tag_code, last_seen_at, last_seen_area, description, status)
VALUES ('cccccccc-0000-4000-8000-000000000003', 'TAL-000003', now() - interval '1 day', 'Phoenix Park, Dublin 8', 'Last seen near the main gate, wearing a TALOA tag.', 'active');
