-----------------------------------------------
-- SAMEJ SOCIAL — CONTACT VISIBILITY TESTS V2.1 (PARTE 9)
-- FASE 3.2 — apenas STAGING.
-- FREE: phone/whatsapp/email OCULTOS p/ terceiros; PRO: visíveis conforme
-- plan_permissions; ADMIN: exceção via profile_contact_visibility.admin_exception.
-- RLS tests: executar via driver (SET ROLE) ou manualmente no SQL Editor.
-----------------------------------------------

\set ON_ERROR_STOP off

-- =================================================================
-- 9.A) LÓGICA is_contact_visible (runs como postgres)
-- =================================================================
-- FREE (plano free): visibilidade oculta para terceiros
SET ROLE postgres;
DO $$
DECLARE v_phone uuid;
BEGIN
  SELECT cv.id INTO v_phone FROM public.profile_contact_visibility cv
   JOIN public.profile_contacts c ON c.id = cv.profile_contact_id
   WHERE c.profile_id='11111111-1111-4111-8111-111111111111' AND c.type='phone';
  IF public.is_contact_visible(v_phone) THEN
    RAISE EXCEPTION '9.A1 FAIL: contato FREE visivel';
  ELSE
    RAISE NOTICE '9.A1 OK: FREE phone oculto p/ terceiros';
  END IF;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%9.A1%' THEN RAISE; ELSE RAISE NOTICE '9.A1 WARN: %', SQLERRM; END IF;
END $$;

-- PRO: visível (plan_permissions.view_contacts)
DO $$
DECLARE v_phone uuid;
BEGIN
  SELECT cv.id INTO v_phone FROM public.profile_contact_visibility cv
   JOIN public.profile_contacts c ON c.id = cv.profile_contact_id
   WHERE c.profile_id='22222222-2222-4222-8222-222222222222' AND c.type='phone';
  IF NOT public.is_contact_visible(v_phone) THEN
    RAISE EXCEPTION '9.A2 FAIL: contato PRO oculto';
  ELSE
    RAISE NOTICE '9.A2 OK: PRO phone visivel';
  END IF;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%9.A2%' THEN RAISE; ELSE RAISE NOTICE '9.A2 WARN: %', SQLERRM; END IF;
END $$;

-- =================================================================
-- 9.B) RLS — READ de contatos (rodar via driver run_staging_tests.ps1)
--  B1 OTHER lendo phone do FREE                     => DENY   (is_contact_visible=false)
--  B2 FREE lendo phone do PRO                       => ALLOW
--  B3 FREE lendo phone do OTHER (admin_exception)   => ALLOW
--  B4 ADMIN lendo contatos de qualquer um           => ALLOW
-- =================================================================
SET ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
-- B1: deveria retornar 0 linhas
SELECT count(*) AS deve_ser_0 FROM public.profile_contacts
 WHERE profile_id='11111111-1111-4111-8111-111111111111' AND type='phone';

SELECT set_config('request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
-- B2: deveria retornar 1 linha (phone do PRO)
SELECT count(*) AS deve_ser_1 FROM public.profile_contacts
 WHERE profile_id='22222222-2222-4222-8222-222222222222' AND type='phone';
-- B3: deveria retornar 1 linha (exceção administrativa)

-- =================================================================
-- 9.C) RLS — tentativa de BURLAR (rodar via driver)
--  C1 OTHER tenta UPDATE no contact_visibility do FREE      => DENY
--  C2 FREE tenta UPDATE/DELETE contatos de terceiros        => DENY
--  C3 tentativa de INSERT contato em nome de terceiro       => DENY
-- =================================================================
SELECT count(*) AS deve_ser_0 FROM public.profile_contacts
 WHERE profile_id='33333333-3333-4333-8333-333333333333' AND type='phone';

-- =================================================================
-- 9.D) ADMIN — exceção administrativa (rodar via driver)
-- =================================================================
RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
-- D1: admin enxerga todos os contatos do FREE
SELECT count(*) AS deve_ser_>=_1 FROM public.profile_contacts
 WHERE profile_id='11111111-1111-4111-8111-111111111111';
RESET ROLE;
SELECT 'PARTE 9 (blocos RLS) — executar via driver para classificacao PASS/FAIL/NAO TESTAVEL' AS notice;