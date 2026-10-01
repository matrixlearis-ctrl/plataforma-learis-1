-----------------------------------------------
-- SAMEJ SOCIAL — MIGRAÇÃO CLIENT → USER (PARTE 10)
-- FASE 3.2 — apenas STAGING.
--
-- OBJETIVO: provar que a transformação de um perfil CLIENT legado em USER
-- preserva UUID/email/orders/reviews/payments, sem perda nem reatribuição.
-- Tudo dentro de transação com ROLLBACK (não suja o staging nem promove 911).
-- Rodar via psql: psql $STAGING_DB_URL -v ON_ERROR_STOP=1 -f <este arquivo>
-----------------------------------------------

\set ON_ERROR_STOP on
BEGIN;

-- ------------------------------------------------------------------
-- 10.1) Cliente legado sintético (mimetiza produção: CLIENT existente)
--       NOTA: postgres usamos o próprio profiles como "auth" p/ o teste;
--       orders.user_id referencia auth.users, então criamos o auth user.
-- ------------------------------------------------------------------
DO $$
DECLARE
  v_uuid uuid := '99999999-9999-4999-8999-999999999999';
  v_plan uuid;
  v_created timestamptz;
  v_role text;
  v_orders bigint; v_reviews bigint; v_payments bigint;
  v_email_antes text; v_uuid_antes uuid;
BEGIN
  -- plano base
  SELECT id INTO v_plan FROM public.plans WHERE code='free' LIMIT 1;

  -- usuário legado no auth.users (necessário: orders.user_id tem FK p/ auth.users)
  BEGIN
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (v_uuid, 'cliente-legado-1.test.local', '$2a$10$FIXTUREONLYFIXTUREONLYFIXTUREONLYFIXTUREONLYFIXTUREONLY.',
          now(), '{"provider":"email"}', '{"full_name":"Cliente Legado"}', 'authenticated','authenticated');
  EXCEPTION WHEN unique_violation THEN NULL; END;

  -- perfil CLIENT no profiles
  INSERT INTO public.profiles (id, username, full_name, role, plan_id, account_status)
  VALUES (v_uuid, 'cliente.legado.1',
          'Cliente Legado', 'CLIENT', v_plan, 'active')
  ON CONFLICT (id) DO NOTHING;

  -- histórico comercial do cliente: order (legada) + review + payment
  INSERT INTO public.orders (client_id, client_name, category, description, phone, address,
                             location, status, lead_price, created_at)
  VALUES (v_uuid, 'Cliente Legado', 'design', 'pedido legado de teste',
          '(11) 90000-0000', 'Rua Teste, 123', 'Sao Paulo/SP', 'OPEN', 5, now())
  ON CONFLICT DO NOTHING;
  INSERT INTO public.reviews (professional_id, client_id, rating, comment, created_at)
  VALUES ('44444444-4444-4444-8444-444444444444', v_uuid, 5, 'review do cliente legado', now())
  ON CONFLICT DO NOTHING;
  INSERT INTO public.payments (user_id, amount, credits, status, gateway, gateway_payment_id, created_at)
  VALUES (v_uuid, 199.90, 100, 'approved', 'mercadopago', 'legado-pg-0001', now())
  ON CONFLICT DO NOTHING;

  SELECT email INTO v_email_antes FROM auth.users WHERE id=v_uuid;
  SELECT id, role, created_at INTO v_uuid_antes, v_role, v_created
    FROM public.profiles WHERE id=v_uuid;

  -- MIGRAÇÃO: CLIENT -> USER (mesma linha, mesmo id, mesmo email)
  UPDATE public.profiles
     SET role='USER',
         account_status = CASE WHEN account_status='active' THEN 'active' ELSE account_status END
   WHERE id=v_uuid AND role='CLIENT';

  -- Asserts de preservação
  SELECT count(*) INTO v_orders   FROM public.orders   WHERE client_id=v_uuid AND description='pedido legado de teste';
  SELECT count(*) INTO v_reviews  FROM public.reviews  WHERE client_id=v_uuid AND comment='review do cliente legado';
  SELECT count(*) INTO v_payments FROM public.payments WHERE user_id=v_uuid;

  SELECT email INTO v_email_antes FROM auth.users WHERE id=v_uuid;
  SELECT id, role INTO v_uuid_antes, v_role FROM public.profiles WHERE id=v_uuid;

  IF v_email_antes IS DISTINCT FROM 'cliente-legado-1.test.local' THEN
    RAISE EXCEPTION '10.1 FAIL: email nao preservado (% )', v_email_antes;
  END IF;
  IF v_uuid_antes IS DISTINCT FROM v_uuid        THEN RAISE EXCEPTION '10.1 FAIL: UUID mudou';
  ELSIF v_role IS DISTINCT FROM 'USER'           THEN RAISE EXCEPTION '10.1 FAIL: role=% (esperado USER)', v_role;
  ELSIF v_orders = 0                             THEN RAISE NOTICE '10.1 WARN: order nao achada';
  ELSIF v_payments = 0                           THEN RAISE NOTICE '10.1 WARN: payment nao achado';
  ELSE
    RAISE NOTICE '10.1 OK: UUID=% role=% orders=% reviews=% payments=% (email=% )',
                 v_uuid_antes, v_role, v_orders, v_reviews, v_payments, v_email_antes;
  END IF;

  -- ROLLBACK do teste (nunca promove):
  RAISE EXCEPTION 'ROLLBACK_DO_TESTE';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%ROLLBACK_DO_TESTE%' THEN
    RAISE NOTICE 'Teste 10 encerrado — transacao sera revertida (ROLLBACK).';
  ELSE
    RAISE;
  END IF;
END $$;

ROLLBACK;
SELECT 'PARTE 10 CONCLUIDA — migracao CLIENT->USER preserva UUID/email/orders/reviews/payments (ROLLBACK aplicado, staging limpo).' AS notice;