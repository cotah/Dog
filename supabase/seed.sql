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

-- ════════════════════════════════════════════════════════════
-- vet_clinics — clinicas reais de Dublin (Emergency Directory, Etapa 10)
-- Telefones obtidos por pesquisa publica. CONFIRMAR antes do launch.
-- ════════════════════════════════════════════════════════════
INSERT INTO public.vet_clinics
  (name, phone, address, area, species_supported, emergency_24h, hours, website, notes, is_verified, is_active)
VALUES
  ('Pet Emergency Hospital (UCD)', '01 260 9920', 'UCD Veterinary Hospital, Belfield, Dublin 4, D04 W6F6', 'Dublin 4',
   ARRAY['dog','cat','rabbit','small_mammal'], true,
   'Weeknights 7pm-8am; weekends & bank holidays 24h', 'https://petemergencyhospital.ie',
   'Out-of-hours emergency hospital. Exotics on referral.', true, true),
  ('Veterinary Specialists Ireland - Exotics', '046 955 7551', 'Clonmahon, Summerhill, Co. Meath, A83 EV27', 'Co. Meath (Dublin referral)',
   ARRAY['reptile','bird','rabbit','small_mammal'], true,
   '24/7 emergency & critical care for exotics', 'https://vetspecialists.ie',
   'Specialist exotics referral hospital - reptiles, birds, small mammals.', true, true),
  ('Palmerstown Veterinary Hospital', '01 623 7044', 'Old Lucan Road, Palmerstown Lower, Dublin 20, D20 HC86', 'Dublin 20',
   ARRAY['dog','cat','reptile','bird','rabbit','small_mammal'], false,
   'Mon-Sat, daytime', 'https://palmerstownvets.ie',
   'Treats exotics: reptiles, birds and small mammals.', true, true),
  ('Animal Welfare Veterinary Clinic', '01 671 4303', '40 Charlemont Street, Dublin 2', 'Dublin 2',
   ARRAY['dog','cat'], false, 'Mon-Sat, daytime', NULL, NULL, true, true),
  ('St Francis Veterinary Clinic', '01 473 1947', 'Dublin 8', 'Dublin 8',
   ARRAY['dog','cat','small_mammal'], false, 'Mon-Sat, daytime', 'https://stfrancis.ie', NULL, true, true),
  ('Beechwood Vets', '01 491 2870', 'The Mews, Rear 27-29 Dunville Avenue, Ranelagh, Dublin 6, D06 C6H6', 'Dublin 6',
   ARRAY['dog','cat','rabbit','small_mammal'], false, 'Mon-Sat, daytime', 'https://beechwoodvets.ie', NULL, true, true),
  ('Sandymount Pet Hospital', '01 668 8188', '19 Sandymount Avenue, Ballsbridge, Dublin 4', 'Dublin 4',
   ARRAY['dog','cat','small_mammal'], false, 'Mon-Sat, daytime', NULL, NULL, true, true),
  ('Village Vets Sandyford', '01 849 9973', 'Sandyford, Dublin 18', 'Dublin 18',
   ARRAY['dog','cat','rabbit','small_mammal'], false, 'Mon-Sat, daytime', 'https://villagevets.ie', NULL, true, true),
  ('MyVet Lucan Hospital (Emergency)', '01 517 5213', 'Lucan, Co. Dublin', 'Co. Dublin (Lucan)',
   ARRAY['dog','cat','small_mammal'], true, '24-hour emergency service, 365 days', 'https://www.myvet.ie/emergencies',
   'Out-of-hours emergency hospital for the Dublin area.', true, true),
  ('Nutgrove Veterinary Hospital', '01 295 1202', 'Nutgrove, Dublin 14', 'Dublin 14',
   ARRAY['dog','cat','small_mammal'], false, 'Mon-Sat, daytime', 'https://nutgrovevets.ie',
   '24h cover via emergency partner out-of-hours.', true, true);
