-----------------------------------------------
-- SAMEJ SOCIAL — STAGING SANITIZE (FASE 3.2)
-- Carrega dataset MÍNIMO E SINÉTICO para testes no ambiente staging.
--
-- REGRAS:
--   * EXECUTAR APÓS as migrations 001–010 (precisa de plans/contacts/profile cols).
--   * NUNCA rodar em produção. NUNCA copiar dados reais aqui.
--   * PII é 100% mascarada (telefone/endereço/CPF/CNPJ fictícios).
--   * Usuários são sintéticos: existem SOMENTE no staging.
--   * Sem credenciais reais; senha fake genéricA (sem valor real).
--
-- Fixtures geradas (UUIDs FIXOS → usados pelos testes):
--   FREE     = 11111111-1111-4111-8111-111111111111  (role USER, plano free)
--   PRO      = 22222222-2222-4222-8222-222222222222  (role PROFESSIONAL, plano pro)
--   OTHER    = 33333333-3333-4333-8333-333333333333  (role USER,  contatos ocultos)
--   PROF     = 44444444-4444-4444-8444-444444444444  (role PROFESSIONAL, plano free, recebe lead)
--   ADMIN    = 55555555-5555-4555-8555-555555555555  (role ADMIN + admin_users ativo)
--   COMPANY  = 66666666-6666-4666-8666-666666666666  (role COMPANY, plano company)
-- Idempotente: pode rodar mais de uma vez sem duplicar.
-- Aplicar em staging vazio (após 001–010) ou pré-existente com os mesmos emails.
-----------------------------------------------

BEGIN;

-- ========================================================================
-- 1. AUTH.USERS (sintético, sem credencial real)
-- ========================================================================
CREATE OR REPLACE FUNCTION public.__seed_auth_user(p_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_id) THEN
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (p_id, 'authenticated', 'authenticated', p_email,
            '$2a$10$FIXTUREONLYFIXTUREONLYFIXTUREONLYFIXTUREONLYFIXTUREONLY.',
            now(), now(), now());
  END IF;
END $$;

SELECT public.__seed_auth_user('11111111-1111-4111-8111-111111111111', 'free@test.local');
SELECT public.__seed_auth_user('22222222-2222-4222-8222-222222222222', 'pro@test.local');
SELECT public.__seed_auth_user('33333333-3333-4333-8333-333333333333', 'user@test.local');
SELECT public.__seed_auth_user('44444444-4444-4444-8444-444444444444', 'prof@test.local');
SELECT public.__seed_auth_user('55555555-5555-4555-8555-555555555555', 'admin@test.local');
SELECT public.__seed_auth_user('66666666-6666-4666-8666-666666666666', 'company@test.local');

-- ========================================================================
-- 2. PROFILES (role dentro do CHECK v2; plan vinculado se plans existir)
-- ========================================================================
INSERT INTO public.profiles (id, full_name, role, username, description, city, state,
                             account_status, credits, plan_id)
SELECT v.id::uuid, v.full_name, v.role, v.username, v.description, v.city, v.state, 'active', v.credits,
       (SELECT id FROM public.plans p WHERE p.code = v.plan AND p.active)
FROM (VALUES
  ('11111111-1111-4111-8111-111111111111', 'Fixture Free',     'USER',         'fixture.free',     'Usuaria comum de teste', 'Sao Paulo',     'SP', 'free', 3),
  ('22222222-2222-4222-8222-222222222222', 'Fixture Pro',      'PROFESSIONAL', 'fixture.pro',      'Profissional PRO',      'Rio de Janeiro','RJ', 'pro', 3),
  ('33333333-3333-4333-8333-333333333333', 'Fixture User',     'USER',         'fixture.user',     'Usuaria de testes',     'Belo Horizonte','MG', 'free', 0),
  ('44444444-4444-4444-8444-444444444444', 'Fixture Prof',     'PROFESSIONAL', 'fixture.prof',     'Profissional FREE',     'Curitiba',      'PR', 'free', 5),
  ('55555555-5555-4555-8555-555555555555', 'Fixture Admin',    'ADMIN',        'fixture.admin',    'Admin sintetico',       'Brasilia',      'DF', 'free', 0),
  ('66666666-6666-4666-8666-666666666666', 'Fixture Company',  'COMPANY',      'fixture.company',  'Empresa de teste',      'Salvador',      'BA', 'company', 10)
) AS v(id, full_name, role, username, description, city, state, plan, credits)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role      = CASE WHEN public.is_admin(EXCLUDED.id) THEN profiles.role ELSE EXCLUDED.role END,
  username  = EXCLUDED.username,
  credits   = EXCLUDED.credits,
  plan_id   = COALESCE(EXCLUDED.plan_id, profiles.plan_id);

-- email/cel no profiles (apenas se a coluna existir — divergência real do schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN
    EXECUTE 'UPDATE public.profiles SET email = lower(split_part(full_name,'' '',2)) || ''@test.local''
             WHERE id IN (''11111111-1111-4111-8111-111111111111'',''22222222-2222-4222-8222-222222222222'',
                          ''33333333-3333-4333-8333-333333333333'',''44444444-4444-4444-8444-444444444444'',
                          ''55555555-5555-4555-8555-555555555555'',''66666666-6666-4666-8666-666666666666'')';
  END IF;
END $$;

-- saldo inicial FREE (fonte da verdade = credits_ledger) — 3 créditos p/ PARTE 8
INSERT INTO public.credits_ledger (profile_id, type, amount, balance_after, reason)
SELECT '11111111-1111-4111-8111-111111111111'::uuid, 'admin_adjust', 3, 3, 'saldo inicial fixture'
WHERE NOT EXISTS (SELECT 1 FROM public.credits_ledger WHERE profile_id='11111111-1111-4111-8111-111111111111');

-- ========================================================================
-- 3. ADMIN_USERS (SOMENTE o fixture ADMIN; nunca copiar admin real)
-- ========================================================================
INSERT INTO public.admin_users (profile_id, role, permissions, active)
VALUES ('55555555-5555-4555-8555-555555555555', 'SUPER_ADMIN', '{"admin_users":true,"admin_payments":true}', true)
ON CONFLICT (profile_id) DO NOTHING;

-- ========================================================================
-- 4. PERFIS ESPECIALIZADOS (PII MASCARADA)
-- ========================================================================
INSERT INTO public.professional_profiles (profile_id, profession, specialties, experience_years,
  description, cpf, cep, address, number, neighborhood, city, state, phone, whatsapp, profile_complete)
VALUES
 ('44444444-4444-4444-8444-444444444444', 'Pedreiro', ARRAY['Alvenaria'], 5,
  'Profissional fixture', '000.000.000-00', '00000-000', 'Rua de Teste', '000',
  'Bairro Teste', 'Curitiba', 'PR', '(00) 00000-0000', '(00) 00000-0000', true),
 ('22222222-2222-4222-8222-222222222222', 'Eletricista', ARRAY['Instalacoes'], 3,
  'Profissional PRO fixture', '111.111.111-11', '11111-111', 'Rua PRO', '01',
  'Centro', 'Rio de Janeiro', 'RJ', '(11) 11111-1111', '(11) 11111-1111', true)
ON CONFLICT (profile_id) DO NOTHING;

INSERT INTO public.company_profiles (profile_id, company_name, cnpj, description, city, state,
  phone, whatsapp, email_public, website, team, profile_complete)
VALUES ('66666666-6666-4666-8666-666666666666', 'Empresa Fixture LTDA', '00.000.000/0000-00',
  'Empresa de teste', 'Salvador', 'BA', '(00) 00000-0000', '(00) 00000-0000',
  'contato@fixture.test.local', 'https://fixture.test.local', ARRAY['Equipe A'], true)
ON CONFLICT (profile_id) DO NOTHING;

-- ========================================================================
-- 5. CONTATOS (FREE=oculto, PRO=plano libera, ADMIN=exceção p/ teste)
-- ========================================================================
INSERT INTO public.profile_contacts (profile_id, type, value, is_primary)
SELECT v.profile_id::uuid, v.type, v.value, v.is_primary
FROM (VALUES
  ('11111111-1111-4111-8111-111111111111', 'phone',    '(00) 00000-0000', true),   -- FREE oculto
  ('11111111-1111-4111-8111-111111111111', 'whatsapp', '(00) 00000-0000', false),
  ('11111111-1111-4111-8111-111111111111', 'email',    'free@test.local',  false),
  ('33333333-3333-4333-8333-333333333333', 'phone',    '(00) 00000-0000', true),   -- OTHER oculto
  ('22222222-2222-4222-8222-222222222222', 'phone',    '(11) 11111-1111', true),   -- PRO visível p/ plano
  ('22222222-2222-4222-8222-222222222222', 'whatsapp', '(11) 11111-1111', false),
  ('22222222-2222-4222-8222-222222222222', 'email',    'pro@test.local',  false)
) AS v(profile_id, type, value, is_primary)
ON CONFLICT (profile_id, type, value) DO NOTHING;

-- visibilidade padrão: tudo oculto por default (default_hidden=true)
INSERT INTO public.profile_contact_visibility (profile_contact_id, default_hidden)
SELECT c.id, true FROM public.profile_contacts c
WHERE NOT EXISTS (SELECT 1 FROM public.profile_contact_visibility v WHERE v.profile_contact_id = c.id);

-- EXCEÇÃO administrativa de contato do OTHER (para TESTE ADMIN exception):
DO $$
DECLARE v_cid uuid;
BEGIN
  SELECT c.id INTO v_cid FROM public.profile_contacts c
   WHERE c.profile_id = '33333333-3333-4333-8333-333333333333' AND c.type='phone' LIMIT 1;
  IF v_cid IS NOT NULL THEN
    UPDATE public.profile_contact_visibility
       SET admin_exception = true, exception_note = 'TESTE 3.2'
     WHERE profile_contact_id = v_cid;
  END IF;
END $$;

-- ========================================================================
-- 6. ORDERS (legadas, mascaradas — p/ teste de PII em orders)
-- ========================================================================
INSERT INTO public.orders (id, client_id, client_name, category, description, phone, address,
  number, location, neighborhood, status, lead_price, created_at)
VALUES
 ('a1111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'F cliente',
  'Reforma', 'Pedido fixture A', '(00) 00000-0000', 'Rua Ficticia 100', '100',
  'Sao Paulo/SP', 'Bairro X', 'OPEN', 5, now() - interval '2 days'),
 ('a2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'F cliente B',
  'Pintura', 'Pedido fixture B', '(00) 00000-0000', 'Rua Ficticia 200', '200',
  'Sao Paulo/SP', 'Bairro Y', 'CLOSED', 5, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- ========================================================================
-- 7. QUOTE_REQUEST + LEAD (p/ testes de credits_spend e leads)
-- ========================================================================
INSERT INTO public.quote_requests (id, requester_id, title, description, city, state, status, visibility)
VALUES ('b1111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333',
        'Reforma de banheiro', 'Fixture quote', 'Sao Paulo', 'SP', 'open', 'public')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.leads (quote_request_id, professional_id, price, status)
SELECT 'b1111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', 3, 'available'
WHERE NOT EXISTS (SELECT 1 FROM public.leads
                  WHERE quote_request_id='b1111111-1111-4111-8111-111111111111'
                    AND professional_id='44444444-4444-4444-8444-444444444444');

-- ========================================================================
-- 8. REVIEW aprovável (de OTHER para PROF)
-- ========================================================================
INSERT INTO public.reviews (professional_id, client_id, rating, comment, status, created_at)
SELECT '44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333', 5,
       'Review fixture', 'approved', now()
WHERE NOT EXISTS (SELECT 1 FROM public.reviews
                  WHERE professional_id='44444444-4444-4444-8444-444444444444'
                    AND client_id='33333333-3333-4333-8333-333333333333');

-- Limpa helper (não deixa função no schema)
DROP FUNCTION IF EXISTS public.__seed_auth_user(uuid, text);

COMMIT;