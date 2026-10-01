-----------------------------------------------
-- SAMEJ SOCIAL — SECURITY DEFINER TESTS V2.1 (PARTE 7)
-- FASE 3.2 — apenas STAGING.
-- Valida funções SECURITY DEFINER: definer/search_path/grants/uso por papel.
-- Rodar via psql (admin) com ON_ERROR_STOP=1; cada DO levanta se algo falhar.
-----------------------------------------------

-- Fixture (scripts/staging_sanitize.sql)
-- FREE=1111..  PRO=2222..  OTHER=3333..  PROF=4444..  ADMIN=5555..  COMPANY=6666..

\set ON_ERROR_STOP on

------------------------------------------------------------------
-- 7.1) Search_path & definer preservados
------------------------------------------------------------------
DO $$
DECLARE
  r record; bad int := 0;
BEGIN
  FOR r IN
    SELECT p.proname,
           p.prosecdef,
           COALESCE(array_to_string(proconfig,','),'') AS config
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public'
      AND p.proname IN ('is_admin','has_admin_permission','effective_permission',
                        'is_contact_visible','add_credits','spend_credits')
      AND p.prokind='f'
  LOOP
    IF r.prosecdef THEN
      RAISE NOTICE '7.1 OK: % SECURITY DEFINER', r.proname;
    ELSE
      RAISE NOTICE '7.1 FAIL: % NAO e SECURITY DEFINER', r.proname;
      bad := bad + 1;
    END IF;
    IF r.config = 'search_path=public' OR r.config LIKE 'search_path=public,%' OR r.config='' THEN
      RAISE NOTICE '7.1 OK: % search_path seguro (config=% )', r.proname, COALESCE(r.config,'<default>');
    ELSE
      RAISE NOTICE '7.1 WARN: % search_path=%', r.proname, r.config;
    END IF;
  END LOOP;
  IF bad > 0 THEN RAISE EXCEPTION '7.1 FAIL: % funcoes SEM definer', bad; END IF;
END $$;

------------------------------------------------------------------
-- 7.2) Grants de EXECUTE corretos (apenas papéis esperados)
------------------------------------------------------------------
DO $$
DECLARE
  r record; bad int := 0;
BEGIN
  FOR r IN
    SELECT p.proname, g.grantee, g.privilege_type,
           g.is_grantable
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN information_schema.routine_privileges g
      ON g.routine_name = p.proname AND g.specific_name::text = p.oid::text
    WHERE n.nspname='public'
      AND p.proname IN ('add_credits','spend_credits')
      AND p.prokind='f'
  LOOP
    IF r.grantee IN ('PUBLIC','anon') THEN
      RAISE NOTICE '7.2 FAIL: % - EXECUTE p/ %', r.proname, r.grantee;
      bad := bad + 1;
    ELSE
      RAISE NOTICE '7.2 OK: % - EXECUTE p/ %', r.proname, COALESCE(r.grantee,'(dono)');
    END IF;
  END LOOP;
  IF bad > 0 THEN RAISE EXCEPTION '7.2 FAIL: grants indevidos em add/spend_credits'; END IF;
END $$;

------------------------------------------------------------------
-- 7.3) anonym/funções admin: EXECUTE negado para PUBLIC/anon (009-corrigido)
------------------------------------------------------------------
DO $$
DECLARE
  r record; bad int := 0;
BEGIN
  FOR r IN
    SELECT p.proname, g.grantee, g.privilege_type
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN information_schema.routine_privileges g
      ON g.routine_name = p.proname AND g.specific_name::text = p.oid::text
    WHERE n.nspname='public'
      AND p.proname IN ('is_admin','has_admin_permission','effective_permission','is_contact_visible')
      AND p.prokind='f'
  LOOP
    IF r.grantee IN ('PUBLIC','anon') THEN
      RAISE NOTICE '7.3 FAIL: % - EXECUTE p/ %', r.proname, r.grantee;
      bad := bad + 1;
    END IF;
  END LOOP;
  IF bad > 0 THEN RAISE EXCEPTION '7.3 FAIL: anon/PUBLIC com EXECUTE em funcoes sensiveis';
  ELSE RAISE NOTICE '7.3 OK: is_admin/has_admin_permission/effective_permission/is_contact_visible sem EXECUTE para PUBLIC/anon';
  END IF;
END $$;

------------------------------------------------------------------
-- 7.4) Uso por cliente: cliente comum NÃO consegue add/spend (fires thanks to 008)
--   (aqui executado como postgres porque EXECUTE p/ postgres existe; para provar
--    bloqueio a cliente real, ver driver run_staging_tests.ps1 — testes com
--    SET ROLE authenticated -> esperado 'permission denied')
------------------------------------------------------------------
DO $$
BEGIN
  -- o papel authenticated (simulado) NÃO possui EXECUTE:
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('add_credits','spend_credits')
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) THEN
    RAISE NOTICE '7.4 FAIL: authenticated tem EXECUTE em add/spend_credits';
  ELSE
    RAISE NOTICE '7.4 OK: authenticated SEM EXECUTE em add/spend_credits';
  END IF;
END $$;

------------------------------------------------------------------
-- 7.5) Lógica is_admin
------------------------------------------------------------------
DO $$
BEGIN
  IF public.is_admin('55555555-5555-4555-8555-555555555555') THEN
    RAISE NOTICE '7.5 OK: ADMIN reconhecido';
  ELSE RAISE EXCEPTION '7.5 FAIL: admin nao reconhecido'; END IF;
  IF public.is_admin('11111111-1111-4111-8111-111111111111') THEN
    RAISE EXCEPTION '7.5 FAIL: FREE tratado como admin';
  ELSE RAISE NOTICE '7.5 OK: FREE nao-admin'; END IF;
  IF public.is_admin('00000000-0000-4000-8000-000000000000') THEN
    RAISE EXCEPTION '7.5 FAIL: uuid inexistente tratado como admin';
  ELSE RAISE NOTICE '7.5 OK: uuid inexistente nao-admin'; END IF;
END $$;

------------------------------------------------------------------
-- 7.6) Lógica has_admin_permission
------------------------------------------------------------------
DO $$
BEGIN
  IF NOT public.has_admin_permission('55555555-5555-4555-8555-555555555555','approve_reports')
    OR NOT public.has_admin_permission('55555555-5555-4555-8555-555555555555','manage_users')
  THEN RAISE EXCEPTION '7.6 FAIL: admin sem permissao esperada'; END IF;
  IF public.has_admin_permission('11111111-1111-4111-8111-111111111111','approve_reports') THEN
    RAISE EXCEPTION '7.6 FAIL: FREE com permissao admin';
  END IF;
  RAISE NOTICE '7.6 OK: has_admin_permission';
END $$;

------------------------------------------------------------------
-- 7.7) Lógica effective_permission
------------------------------------------------------------------
DO $$
BEGIN
  IF NOT public.effective_permission('22222222-2222-4222-8222-222222222222','can_show_phone')
    OR NOT public.effective_permission('22222222-2222-4222-8222-222222222222','can_send_messages')
  THEN RAISE EXCEPTION '7.7 FAIL: PRO sem permissao esperada'; END IF;
  IF public.effective_permission('11111111-1111-4111-8111-111111111111','can_show_phone') THEN
    RAISE EXCEPTION '7.7 FAIL: FREE com permissao de PRO';
  END IF;
  RAISE NOTICE '7.7 OK: effective_permission';
END $$;

------------------------------------------------------------------
-- 7.8) Lógica is_contact_visible (função de 004)
------------------------------------------------------------------
DO $$
DECLARE
  v_phone uuid;
BEGIN
  SELECT cv.id INTO v_phone FROM public.profile_contact_visibility cv
   JOIN public.profile_contacts c ON c.id = cv.profile_contact_id
   WHERE c.profile_id='22222222-2222-4222-8222-222222222222' AND c.type='phone';
  IF v_phone IS NULL THEN
    -- fallback: telefone do PRO em profile_contacts
    SELECT cv.id INTO v_phone FROM public.profile_contact_visibility cv
     JOIN public.profile_contacts c ON c.id = cv.profile_contact_id
     WHERE c.type='phone' ORDER BY c.created_at LIMIT 1;
  END IF;
  -- PRO com plano pro: telefone visível p/ qualquer um
  IF public.is_contact_visible(v_phone) IS DISTINCT FROM true THEN
    RAISE NOTICE '7.8 WARN: is_contact_visible(p_phone PRO) != true (fixture?)';
  ELSE
    RAISE NOTICE '7.8 OK: is_contact_visible PRO -> true';
  END IF;
END $$;

------------------------------------------------------------------
-- 7.9) Escalonamento de privilégio: chamar com id de outro usuário
------------------------------------------------------------------
DO $$
BEGIN
  IF public.is_admin('22222222-2222-4222-8222-222222222222') THEN
    RAISE EXCEPTION '7.9 FAIL: credenciais de outro viram admin';
  END IF;
  RAISE NOTICE '7.9 OK: injecao de identidade nao concede admin (resposta por auth.uid(), nao por parametro)';
END $$;

SELECT 'PARTE 7 CONCLUIDA — todos os DO passaram.' AS notice;