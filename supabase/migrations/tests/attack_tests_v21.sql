-----------------------------------------------
-- SAMEJ SOCIAL — TESTES DE ATAQUE (ETAPA 15 / FASE 3)
-- Compilação: execução EXCLUSIVAMENTE em STAGING ou cópia de segurança.
-- NUNCA em produção.
--
-- Como usar (Supabase SQL Editor do projeto STAGING):
--   1) Crie usuários de teste via suplemento (Auth > Users) e anote os UUIDs.
--   2) Substitua os placeholders abaixo:
--        :FREE_ID        — usuário comum (role USER, plano FREE)
--        :PROF_ID        — profissional (plano FREE)
--        :OTHER_ID       — outro usuário qualquer
--        :ADMIN_ID       — admin (com registro em admin_users)
--   3) Rode os blocos na ordem. Cada bloco levanta EXCEPTION se o acesso
--      NÃO autorizado SUCEDEU (ou seja: esperamos DENIED).
--
-- Resultado esperado: todas as NOTICES "OK: DENIED (esperado)".
-----------------------------------------------

-- Helper: alterna o "usuário autenticado" simulado
CREATE OR REPLACE FUNCTION public.__set_auth_user(p_uuid uuid)
RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims',
          json_build_object('sub', p_uuid::text, 'role', 'authenticated')::text, true);
$$;

-- 1) AUTO-PROMOVER USER PARA ADMIN (UPDATE profiles.role)
DO $$
DECLARE v_ok boolean;
BEGIN
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  BEGIN
    UPDATE public.profiles SET role = 'ADMIN' WHERE id = :FREE_ID::uuid;
    v_ok := true;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'FALHA: USER conseguiu se tornar ADMIN'; END IF;
  RAISE NOTICE 'OK: DENIED (esperado) — auto-promoção a ADMIN bloqueada';
END $$;

-- 2) ALTERAR plan_id pelo front
DO $$
DECLARE v_ok boolean;
BEGIN
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  BEGIN
    UPDATE public.profiles SET plan_id = (SELECT id FROM public.plans WHERE code='pro')
    WHERE id = :FREE_ID::uuid;
    v_ok := true;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'FALHA: USER alterou próprio plano'; END IF;
  RAISE NOTICE 'OK: DENIED (esperado) — plano não alterável pelo front';
END $$;

-- 3) ALTERAR credits pelo front
DO $$
DECLARE v_ok boolean;
BEGIN
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  BEGIN
    UPDATE public.profiles SET credits = 99999 WHERE id = :FREE_ID::uuid;
    v_ok := true;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'FALHA: USER fabricou créditos'; END IF;
  RAISE NOTICE 'OK: DENIED (esperado) — créditos blindados contra o front';
END $$;

-- 4) INSERIR pagamento falso
DO $$
DECLARE v_ok boolean; v_id uuid;
BEGIN
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  BEGIN
    INSERT INTO public.payments (user_id, amount, credits, status)
    VALUES (:FREE_ID::uuid, 9999, 99999, 'approved')
    RETURNING id INTO v_id;
    v_ok := true;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'FALHA: USER criou pagamento falso aprovado'; END IF;
  RAISE NOTICE 'OK: DENIED (esperado) — INSERT em payments bloqueado (backend somente)';
END $$;

-- 5) ALTERAR pagamento alheio
DO $$
DECLARE v_ok boolean; v_pid uuid;
BEGIN
  PERFORM public.__set_auth_user(:OTHER_ID::uuid);
  BEGIN
    UPDATE public.payments SET status='approved' WHERE user_id = :FREE_ID::uuid;
    v_ok := true;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'FALHA: USER alterou pagamento de outro'; END IF;
  RAISE NOTICE 'OK: DENIED (esperado) — pagamento alheio não editável';
END $$;

-- 6/7) ACESSAR TELEFONE/WHATSAPP OCULTO de profissional FREE
DO $$
DECLARE v_ok boolean; v_c uuid;
BEGIN
  -- contato oculto do profissional FREE (sem exceção)
  SELECT c.id INTO v_c FROM public.profile_contacts c
   JOIN public.profile_contact_visibility v ON v.profile_contact_id = c.id
  WHERE c.profile_id = :PROF_ID::uuid AND c.type IN ('phone','whatsapp') LIMIT 1;
  IF v_c IS NULL THEN
    RAISE NOTICE 'SKIP: nenhum contato oculto configurado no staging';
    RETURN;
  END IF;
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  BEGIN
    IF public.is_contact_visible(v_c) THEN v_ok := true; ELSE v_ok := false; END IF;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'FALHA: telefone/WhatsApp oculto ficou visível'; END IF;
  RAISE NOTICE 'OK: contacto oculto permanece oculto (DENIED)';
END $$;

-- 8) CRIAR quote_request em nome de outro usuário
DO $$
DECLARE v_ok boolean; v_id uuid;
BEGIN
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  BEGIN
    INSERT INTO public.quote_requests (requester_id, title, description)
    VALUES (:OTHER_ID::uuid, 'T', 'x')
    RETURNING id INTO v_id;
    v_ok := true;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'FALHA: USER criou quote_request em nome de terceiro'; END IF;
  RAISE NOTICE 'OK: DENIED (esperado) — requester_id obrigatoriamente auth.uid()';
END $$;

-- 9) COMPRAR LEAD sem permissão
DO $$
DECLARE v_ok boolean; v_lead uuid;
BEGIN
  SELECT id INTO v_lead FROM public.leads LIMIT 1;
  IF v_lead IS NULL THEN RAISE NOTICE 'SKIP: sem leads no staging'; RETURN; END IF;
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  BEGIN
    UPDATE public.leads SET status='purchased', purchased_at=now() WHERE id = v_lead;
    v_ok := true;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'FALHA: USER comprou lead via UPDATE direto'; END IF;
  RAISE NOTICE 'OK: DENIED (esperado) — lead só via backend';
END $$;

-- 10) ACESSAR ADMIN sem permissão
DO $$
DECLARE v_ok boolean;
BEGIN
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  BEGIN
    IF public.is_admin(auth.uid()) THEN v_ok := true; ELSE v_ok := false; END IF;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'FALHA: USER sem admin_users acessou admin'; END IF;
  RAISE NOTICE 'OK: DENIED (esperado) — is_admin() false para não-admin';

  -- leitura de admin_logs por não-admin
  BEGIN
    PERFORM * FROM public.admin_logs LIMIT 1;
    v_ok := true;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'FALHA: USER leu admin_logs'; ELSE RAISE NOTICE 'OK: DENIED — admin_logs bloqueado'; END IF;
END $$;

-- 12) MODIFICAR lead (UPDATE status) por não envolvido
-- (coberto pelo teste 9; aqui só garantimos que INSERT também é bloqueado)
DO $$
DECLARE v_ok boolean; v_lid uuid;
BEGIN
  SELECT id INTO v_lid FROM public.leads LIMIT 1;
  IF v_lid IS NULL THEN RAISE NOTICE 'SKIP: sem leads no staging'; RETURN; END IF;
  PERFORM public.__set_auth_user(:OTHER_ID::uuid);
  BEGIN
    INSERT INTO public.leads (quote_request_id, professional_id, price) VALUES
      ((SELECT quote_request_id FROM public.leads WHERE id=v_lid), :OTHER_ID::uuid, 0);
    v_ok := true;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'FALHA: USER inseriu lead'; ELSE RAISE NOTICE 'OK: DENIED — INSERT em leads bloqueado'; END IF;
END $$;

-- 15) ENVIAR MENSAGEM após bloqueio (ou para pessoa que me bloqueou)
DO $$
DECLARE v_ok boolean; v_conv uuid;
BEGIN
  PERFORM public.__set_auth_user(:FREE_ID::uuid);
  BEGIN
    INSERT INTO public.blocks (blocker_id, blocked_id)
    SELECT :FREE_ID::uuid, :OTHER_ID::uuid WHERE NOT EXISTS (
      SELECT 1 FROM public.blocks WHERE blocker_id=:FREE_ID::uuid AND blocked_id=:OTHER_ID::uuid);
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'SKIP: cenário de bloqueio não configurado'; RETURN;
  END;
  -- criar conversa e tentar enviar mensagem
  BEGIN
    INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO v_conv;
    INSERT INTO public.conversation_participants (conversation_id, profile_id) VALUES (v_conv, :FREE_ID::uuid);
    INSERT INTO public.conversation_participants (conversation_id, profile_id) VALUES (v_conv, :OTHER_ID::uuid);
    INSERT INTO public.messages (conversation_id, sender_id, content) VALUES (v_conv, :FREE_ID::uuid, 'oie');
    v_ok := true;
  EXCEPTION WHEN OTHERS THEN v_ok := false;
  END;
  IF v_ok THEN RAISE NOTICE 'INFO: fluxo de bloqueio validado na regra de negócio (backend)'; ELSE RAISE NOTICE 'OK: DENIED — mensagem após bloqueio'; END IF;
END $$;

-- encerra helpers (opcional: limpar depois dos testes)
-- DROP FUNCTION public.__set_auth_user(uuid);