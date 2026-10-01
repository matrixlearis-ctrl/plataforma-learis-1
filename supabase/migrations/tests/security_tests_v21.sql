-----------------------------------------------
-- SAMEJ SOCIAL — SECURITY TESTS V2.1 (18 cenários)
-- FASE 3.2 — apenas STAGING.
--
-- COMO USAR:
--   Opção A (automatizada, recomendada):
--     .\scripts\run_staging_tests.ps1 -DbUrl $env:STAGING_DB_URL
--     (o driver executa cada cenário numa sessão psql separada, com
--      SET ROLE anon/authenticated, e classifica PASS/FAIL/NOT TESTABLE).
--   Opção B (manual, SQL Editor do staging — executado como postgres/superuser):
--     Rodar os blocos um a um. O `SET ROLE` + `set_config('request.jwt.claims',...)`
--     simulam anon/authenticated. Observar o resultado no editor (0 rows/erro).
--
-- CONSTANTES DE FIXTURE (definidas em scripts/staging_sanitize.sql):
--   FREE=11111111-1111-4111-8111-111111111111  PRO=22222222-2222-4222-8222-222222222222
--   OTHER=33333333-3333-4333-8333-333333333333  PROF=44444444-4444-4444-8444-444444444444
--   ADMIN=55555555-5555-4555-8555-555555555555 COMPANY=66666666-6666-4666-8666-666666666666
-----------------------------------------------

-- Helper para simular um usuário autenticado/anon
CREATE OR REPLACE FUNCTION public.__sim_auth(p_sub text, p_role text DEFAULT 'authenticated')
RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims',
          json_build_object('sub', p_sub, 'role', p_role)::text, true)
$$;

------------------------------------------------------------------
-- 01) ANONYMOUS SELECT em tabelas PÚBLICAS (deve PERMITIR)
------------------------------------------------------------------
SET ROLE anon;
SELECT public.__sim_auth(NULL, 'anon');     -- sem sub (uid NULL)
SELECT count(*) AS devem_ser_visiveis FROM public.plans;         -- RLS: active OR admin
SELECT count(*) AS devem_ser_visiveis FROM public.public_profiles; -- view sem PII
SELECT count(*) AS devem_ser_visiveis FROM public.hashtags;      -- USING (true)
RESET ROLE;

------------------------------------------------------------------
-- 02) ANONYMOUS SELECT em tabelas PRIVADAS (deve BARRAR)
------------------------------------------------------------------
SET ROLE anon;
SELECT public.__sim_auth(NULL, 'anon');
-- profiles completa (PII) => policy own/admin => sem row p/ anon
SELECT count(*) AS deve_ser_0 FROM public.profiles;
-- payments / credits_ledger / admin_logs => sem policy p/ anon => 0
SELECT count(*) AS deve_ser_0 FROM public.payments;
SELECT count(*) AS deve_ser_0 FROM public.credits_ledger;
SELECT count(*) AS deve_ser_0 FROM public.admin_logs;
RESET ROLE;

------------------------------------------------------------------
-- 03) TENTATIVA DE ALTERAR ROLE (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
UPDATE public.profiles SET role='ADMIN' WHERE id='11111111-1111-4111-8111-111111111111';
RESET ROLE;
-- (erro 'alteração de role não permitida' = PASS; com ON_ERROR_STOP o driver captura)

------------------------------------------------------------------
-- 04) TENTATIVA DE ALTERAR plan_id (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
UPDATE public.profiles
   SET plan_id = (SELECT id FROM public.plans WHERE code='pro')
 WHERE id='11111111-1111-4111-8111-111111111111';
RESET ROLE;

------------------------------------------------------------------
-- 05) TENTATIVA DE ALTERAR CREDITS (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
UPDATE public.profiles SET credits=99999 WHERE id='11111111-1111-4111-8111-111111111111';
RESET ROLE;

------------------------------------------------------------------
-- 06) TENTATIVA DE ALTERAR VERIFIED (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
UPDATE public.profiles SET verified=true WHERE id='11111111-1111-4111-8111-111111111111';
RESET ROLE;

------------------------------------------------------------------
-- 07) TENTATIVA DE ALTERAR FEATURED (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
UPDATE public.profiles SET featured=true WHERE id='11111111-1111-4111-8111-111111111111';
RESET ROLE;

------------------------------------------------------------------
-- 08) TENTATIVA DE ALTERAR STATUS (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
UPDATE public.profiles SET account_status='blocked' WHERE id='11111111-1111-4111-8111-111111111111';
RESET ROLE;

------------------------------------------------------------------
-- 09) TENTATIVA DE ACESSAR DADOS DE OUTRO USUÁRIO (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('33333333-3333-4333-8333-333333333333');
-- perfil completo do FREE não aparece
SELECT count(*) AS deve_ser_0 FROM public.profiles WHERE id='11111111-1111-4111-8111-111111111111';
-- contato oculto do FREE não aparece (is_contact_visible=false)
SELECT count(*) AS deve_ser_0 FROM public.profile_contacts
 WHERE profile_id='11111111-1111-4111-8111-111111111111' AND type='phone';
RESET ROLE;

------------------------------------------------------------------
-- 10) TENTATIVA DE FABRICAR CRÉDITOS (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
SELECT public.add_credits('11111111-1111-4111-8111-111111111111', 999); -- EXECUTE negado
RESET ROLE;
-- (add_credits só tem EXECUTE p/ service_role após 008-corrigido)

------------------------------------------------------------------
-- 11) TENTATIVA DE GASTAR CRÉDITOS SEM SALDO (deve BARRAR / saldo insuficiente)
------------------------------------------------------------------
-- Como postgres (função é backend-only), validar a REGRA:
DO $$
BEGIN
  BEGIN
    PERFORM public.spend_credits('11111111-1111-4111-8111-111111111111', 100000, 'lead_spend', 'sem saldo');
    RAISE EXCEPTION 'TEST 11: FAIL — gastou sem saldo';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%saldo insuficiente%' THEN
      RAISE NOTICE 'TEST 11: PASS (saldo insuficiente)';
    ELSE
      RAISE NOTICE 'TEST 11: FAIL - %', SQLERRM;
    END IF;
  END;
END $$;

------------------------------------------------------------------
-- 12) TENTATIVA DE ACESSAR CONTATOS DO FREE (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('33333333-3333-4333-8333-333333333333'); -- OTHER lendo FREE
SELECT count(*) AS deve_ser_0 FROM public.profile_contacts
 WHERE profile_id='11111111-1111-4111-8111-111111111111';
RESET ROLE;

------------------------------------------------------------------
-- 13) ACESSO PERMITIDO AOS CONTATOS DO PRO (deve PERMITIR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111'); -- FREE lendo PRO
SELECT count(*) AS deve_ser_1 FROM public.profile_contacts
 WHERE profile_id='22222222-2222-4222-8222-222222222222' AND type='phone';
RESET ROLE;

------------------------------------------------------------------
-- 14) EXCEÇÃO ADMINISTRATIVA (deve PERMITIR o contato com exceção)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
-- contato phone do OTHER tem admin_exception=true (fixture)
SELECT count(*) AS deve_ser_1 FROM public.profile_contacts
 WHERE profile_id='33333333-3333-4333-8333-333333333333' AND type='phone';
RESET ROLE;

------------------------------------------------------------------
-- 15) MENSAGEM EM CONVERSA SEM AUTORIZAÇÃO (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
-- conversa sem o FREE como participante:
INSERT INTO public.messages (conversation_id, sender_id, content)
SELECT id, '11111111-1111-4111-8111-111111111111', 'intruso'
FROM public.conversations
WHERE NOT EXISTS (SELECT 1 FROM public.conversation_participants cpp
                  WHERE cpp.conversation_id = conversations.id
                    AND cpp.profile_id='11111111-1111-4111-8111-111111111111')
LIMIT 1;
RESET ROLE;

------------------------------------------------------------------
-- 16) TENTATIVA DE ACESSAR PII (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
-- phone/whatsapp/cpf/endereço de terceiros fora de RLS
SELECT count(*) AS deve_ser_0 FROM public.professional_profiles
 WHERE profile_id='44444444-4444-4444-8444-444444444444';
SELECT count(*) AS deve_ser_0 FROM public.company_profiles;
RESET ROLE;
-- orders PII (legada) => EXPECTED FAIL nesta fase (ver 911/orders_pii):
SET ROLE anon;
SELECT public.__sim_auth(NULL,'anon');
SELECT count(*) AS PII_LENDA_VULNERAVEL FROM public.orders WHERE phone IS NOT NULL;
RESET ROLE;

------------------------------------------------------------------
-- 17) TENTATIVA DE MANIPULAR PAYMENTS (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
INSERT INTO public.payments (user_id, amount, credits, status) VALUES
  ('11111111-1111-4111-8111-111111111111', 999, 999, 'approved');
RESET ROLE;
-- atualizar pagamento de outro:
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
UPDATE public.payments SET status='approved' WHERE user_id='33333333-3333-4333-8333-333333333333';
RESET ROLE;

------------------------------------------------------------------
-- 18) TENTATIVA DE MANIPULAR SUBSCRIPTIONS (deve BARRAR)
------------------------------------------------------------------
SET ROLE authenticated;
SELECT public.__sim_auth('11111111-1111-4111-8111-111111111111');
INSERT INTO public.subscriptions (profile_id, plan_id, status, amount) VALUES
  ('11111111-1111-4111-8111-111111111111',
   (SELECT id FROM public.plans WHERE code='pro'), 'active', 0);
RESET ROLE;

-- Limpa helper se quiser após executar:
-- DROP FUNCTION public.__sim_auth(text, text);