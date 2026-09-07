-----------------------------------------------
-- SAMEJ SOCIAL — MATRIZ RLS V2.1 (validação positiva)
-- STAGING APENAS. Substitua os placeholders antes de rodar:
--   :FREE_ID   (usuário comum / plano FREE)
--   :PROF_ID   (profissional)
--   :OTHER_ID  (terceiro)
--   :ADMIN_ID  (admin registrado em admin_users)
-- Provas: acesso PERMITIDO onde a matriz permite e DENIED onde barra.
-----------------------------------------------

CREATE OR REPLACE FUNCTION public.__set_auth_user(p_uuid uuid)
RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims',
          json_build_object('sub', p_uuid::text, 'role', 'authenticated')::text, true);
$$;

-- positivo: usuário lê o próprio perfil completo
DO $$
DECLARE v_n int;
BEGIN
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  SELECT count(*) INTO v_n FROM public.profiles WHERE id = :FREE_ID::uuid;
  IF v_n <> 1 THEN RAISE EXCEPTION 'FALHA: próprio perfil não legível'; END IF;
  RAISE NOTICE 'OK: profiles legível pelo próprio dono';
END $$;

-- negativo: usuário lê perfil completo de terceiro (deve exigir VIEW pública)
DO $$
DECLARE v_n int;
BEGIN
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  SELECT count(*) INTO v_n FROM public.profiles WHERE id = :OTHER_ID::uuid;
  IF v_n <> 0 THEN RAISE EXCEPTION 'FALHA: perfil completo de terceiro vazou'; END IF;
  RAISE NOTICE 'OK: profiles de terceiro barrado (usa public_profiles fora)';
END $$;

-- positivo: vista pública mostra terceiro sem PII
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM public.public_profiles WHERE id = :OTHER_ID::uuid;
  IF v_n <> 1 THEN RAISE EXCEPTION 'FALHA: public_profiles não mostra o perfil'; END IF;
  RAISE NOTICE 'OK: public_profiles visível sem PII';
END $$;

-- positivo: quote_request aberta visível (card) — anon pode
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM public.quote_requests WHERE status='open' AND visibility='public';
  IF v_n < 0 THEN RAISE EXCEPTION 'FALHA no card publicado'; END IF;
  RAISE NOTICE 'OK: cards de quote_requests abertas visíveis';
END $$;

-- positivo: profissional acessa leads próprios
DO $$
DECLARE v_n int;
BEGIN
  PERFORM public.__set_auth_user(:PROF_ID::uuid);
  SELECT count(*) INTO v_n FROM public.leads WHERE professional_id = :PROF_ID::uuid;
  RAISE NOTICE 'OK: leads próprios lidos (% reg), conferido pela política', v_n;
END $$;

-- negativo: usuário comum acessa admin_users
DO $$
DECLARE v_n int;
BEGIN
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  SELECT count(*) INTO v_n FROM public.admin_users WHERE true;
  IF v_n > 0 THEN RAISE EXCEPTION 'FALHA: admin_users vazada a não-admin'; ELSE RAISE NOTICE 'OK: admin_users inacessível a não-admin'; END IF;
END $$;

-- positivo: ADMIN lê admin_logs
DO $$
DECLARE v_n int;
BEGIN
  PERFORM public.__set_auth_user(:ADMIN_ID::uuid);
  SELECT count(*) INTO v_n FROM public.admin_logs WHERE true;
  RAISE NOTICE 'OK: ADMIN leu admin_logs (% regs)', v_n;
  IF public.has_admin_permission(:ADMIN_ID::uuid, 'admin_users') IS NULL
    AND NOT public.is_admin(:ADMIN_ID::uuid)
  THEN RAISE EXCEPTION 'FALHA: admin_id não é admin (confira admin_users)'; END IF;
END $$;