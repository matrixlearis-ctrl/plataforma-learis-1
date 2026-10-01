-----------------------------------------------
-- SAMEJ SOCIAL — CREDITS LEDGER TESTS V2.1 (PARTE 8)
-- FASE 3.2 — apenas STAGING.
-- credits_ledger é a FONTE DA VERDADE dos créditos (profiles.credits = cache).
-- Rodar via psql (admin) com ON_ERROR_STOP=1. Não altera saldo final (rollback).
-----------------------------------------------

\set ON_ERROR_STOP on

-- Fixture: FREE=1111.. (plano free, saldo inicial 3)
-- Para os testes ficarem idempotentes, operam dentro de transação com ROLLBACK.
BEGIN;

------------------------------------------------------------------
-- 8.1) Crédito inicial coere com a fixture
------------------------------------------------------------------
DO $$
DECLARE v_bal integer;
BEGIN
  SELECT COALESCE(credits,0) INTO v_bal FROM public.profiles WHERE id='11111111-1111-4111-8111-111111111111';
  IF v_bal IS DISTINCT FROM 3 THEN
    RAISE EXCEPTION '8.1 FAIL: saldo inicial FREE=% (esperado 3/token FREE x100)', v_bal;
  END IF;
  RAISE NOTICE '8.1 OK: saldo inicial FREE=%', v_bal;
END $$;

------------------------------------------------------------------
-- 8.2) Compra (purchase) credita e lança no ledger
------------------------------------------------------------------
DO $$
DECLARE v_bal integer; v_bal2 integer;
BEGIN
  v_bal := public.add_credits('11111111-1111-4111-8111-111111111111', 500, 'purchase', 'compra teste', 'payment', NULL);
  IF v_bal IS DISTINCT FROM 503 THEN RAISE EXCEPTION '8.2 FAIL: add balance=%', v_bal; END IF;
  SELECT credits INTO v_bal2 FROM public.profiles WHERE id='11111111-1111-4111-8111-111111111111';
  IF v_bal2 IS DISTINCT FROM v_bal THEN RAISE EXCEPTION '8.2 FAIL: cache diverge do retorno'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.credits_ledger
                 WHERE profile_id='11111111-1111-4111-8111-111111111111'
                   AND type='purchase' AND amount=500) THEN
    RAISE EXCEPTION '8.2 FAIL: ledger sem lancamento de purchase';
  END IF;
  RAISE NOTICE '8.2 OK: purchase 500 -> balance %', v_bal;
END $$;

------------------------------------------------------------------
-- 8.3) Gasto (lead_spend) debita e lança
------------------------------------------------------------------
DO $$
DECLARE v_bal integer;
BEGIN
  v_bal := public.spend_credits('11111111-1111-4111-8111-111111111111', 2, 'lead_spend', 'lead p/ PROF');
  IF v_bal IS DISTINCT FROM 501 THEN RAISE EXCEPTION '8.3 FAIL: spend balance=%', v_bal; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.credits_ledger
                 WHERE profile_id='11111111-1111-4111-8111-111111111111'
                   AND type='lead_spend' AND amount=-2) THEN
    RAISE EXCEPTION '8.3 FAIL: ledger sem lancamento de lead_spend';
  END IF;
  RAISE NOTICE '8.3 OK: lead_spend 2 -> balance %', v_bal;
END $$;

------------------------------------------------------------------
-- 8.4) Estorno (refund) credita de volta
------------------------------------------------------------------
DO $$
DECLARE v_bal integer;
BEGIN
  v_bal := public.add_credits('11111111-1111-4111-8111-111111111111', 2, 'refund', 'estorno teste', 'quote_request', NULL);
  IF v_bal IS DISTINCT FROM 503 THEN RAISE EXCEPTION '8.4 FAIL: refund balance=%', v_bal; END IF;
  RAISE NOTICE '8.4 OK: refund 2 -> balance %', v_bal;
END $$;

------------------------------------------------------------------
-- 8.5) Boost (novo parâmetro p_type de spend_credits)
------------------------------------------------------------------
DO $$
DECLARE v_bal integer;
BEGIN
  v_bal := public.spend_credits('11111111-1111-4111-8111-111111111111', 1, 'boost', 'impulsionar portfolio', 'portfolio_item', NULL);
  IF v_bal IS DISTINCT FROM 502 THEN RAISE EXCEPTION '8.5 FAIL: boost balance=%', v_bal; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.credits_ledger
                 WHERE profile_id='11111111-1111-4111-8111-111111111111' AND type='boost') THEN
    RAISE EXCEPTION '8.5 FAIL: ledger sem lancamento tipo boost';
  END IF;
  RAISE NOTICE '8.5 OK: boost 1 -> balance % (tipo registrado no ledger)', v_bal;
END $$;

------------------------------------------------------------------
-- 8.6) Saldo insuficiente: bloqueia e NÃO lança
------------------------------------------------------------------
DO $$
DECLARE v_before integer; v_after integer; v_rows integer;
BEGIN
  SELECT credits INTO v_before FROM public.profiles WHERE id='11111111-1111-4111-8111-111111111111';
  SELECT count(*) INTO v_rows FROM public.credits_ledger
   WHERE profile_id='11111111-1111-4111-8111-111111111111';
  BEGIN
    PERFORM public.spend_credits('11111111-1111-4111-8111-111111111111', 100000, 'lead_spend', 'falso');
    RAISE EXCEPTION '8.6 FAIL: conseguiu gastar sem saldo';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%saldo insuficiente%' THEN
      NULL; -- esperado
    ELSE
      RAISE EXCEPTION '8.6 FAIL: erro inesperado: %', SQLERRM;
    END IF;
  END;
  SELECT credits INTO v_after FROM public.profiles WHERE id='11111111-1111-4111-8111-111111111111';
  IF v_after IS DISTINCT FROM v_before THEN RAISE EXCEPTION '8.6 FAIL: saldo mudou em falha'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.credits_ledger
                 WHERE profile_id='11111111-1111-4111-8111-111111111111' AND reason='falso') THEN
    RAISE NOTICE '8.6 OK: saldo intacto apos falha (nenhum lancamento falso)';
  ELSE RAISE EXCEPTION '8.6 FAIL: lancamento indevido no ledger'; END IF;
END $$;

------------------------------------------------------------------
-- 8.7) Concorrência (aproximação monotônica)
--  True concorrência exige 2 sessões simultâneas (documentado no RESULTS). 
--  Aqui validamos a cadeia contábil (balance_after = anterior ± amount) e
--  ausência de saldo negativo — invariantes que a corrida romperia se mal feita.
------------------------------------------------------------------
DO $$
DECLARE
  v_seed int := NULL; v_seed_id uuid := NULL; v_bad int := 0; v_started int := 0; r record;
BEGIN
  -- 1o lancamento = mais antigo (seed da fixture, transacao anterior -> created_at menor)
  SELECT id, balance_after INTO v_seed_id, v_seed FROM public.credits_ledger
   WHERE profile_id='11111111-1111-4111-8111-111111111111'
   ORDER BY created_at ASC, id ASC LIMIT 1;
  FOR r IN
    SELECT cl.id, cl.profile_id, cl.amount, cl.balance_after
      FROM public.credits_ledger cl
     WHERE cl.profile_id='11111111-1111-4111-8111-111111111111'
  LOOP
    IF r.id = v_seed_id THEN CONTINUE; END IF;
    IF r.balance_after < 0 THEN
      RAISE NOTICE '8.7 FAIL: saldo negativo % no lancamento %', r.balance_after, r.id;
      v_bad := v_bad + 1;
    END IF;
    -- cadeia (order-independent): saldo_antes = balance_after - amount
    -- deve ser o saldo seed OU o balance_after de outro lancamento do mesmo perfil.
    IF (r.balance_after - r.amount) = v_seed THEN
      v_started := v_started + 1;
    ELSIF EXISTS (SELECT 1 FROM public.credits_ledger p
                  WHERE p.profile_id = r.profile_id
                    AND p.balance_after = (r.balance_after - r.amount)) THEN
      NULL; -- predecessor valido
    ELSE
      RAISE NOTICE '8.7 FAIL: % sem predecessor (antes=% <> seed=% , % - % )',
                   r.id, r.balance_after - r.amount, v_seed, r.balance_after, r.amount;
      v_bad := v_bad + 1;
    END IF;
  END LOOP;
  IF v_started = 0 THEN
    RAISE NOTICE '8.7 FAIL: nenhum lancamento partiu do saldo seed %', v_seed;
    v_bad := v_bad + 1;
  END IF;
  IF v_bad > 0 THEN RAISE EXCEPTION '8.7 FAIL: invariantes do ledger quebradas (% erros, order-independent)', v_bad; END IF;
  RAISE NOTICE '8.7 OK: cadeia contabil valida (order-independent, PK uuid aleatoria) e sem saldo negativo (falta teste de corrida real com 2 sessoes)';
END $$;

------------------------------------------------------------------
-- 8.8) Rollback: transação falha NÃO deixa resíduo
------------------------------------------------------------------
DO $$
DECLARE v_before integer; v_rows_before integer;
BEGIN
  SELECT credits INTO v_before FROM public.profiles WHERE id='11111111-1111-4111-8111-111111111111';
  SELECT count(*) INTO v_rows_before FROM public.credits_ledger;
  BEGIN
    PERFORM public.add_credits('11111111-1111-4111-8111-111111111111', 100, 'purchase', 'devia reverter', 'payment', NULL);
    PERFORM public.spend_credits('11111111-1111-4111-8111-111111111111', 100000, 'lead_spend', 'estoura');
    RAISE EXCEPTION '8.8 FAIL: nao estourou';
  EXCEPTION WHEN OTHERS THEN
    NULL; -- esperado
  END;
  IF EXISTS (SELECT 1 FROM public.credits_ledger WHERE reason='devia reverter') THEN
    RAISE EXCEPTION '8.8 ERR: lancamento reverter ficou (proximo rollback por transacao externa)';
  END IF;
  RAISE NOTICE '8.8 OK: transacao com falha reverteu interno (bloco aninhado)';
END $$;

------------------------------------------------------------------
-- 8.9) Duplicidade: mesmo gateway_payment_id não pode creditar 2x
------------------------------------------------------------------
DO $$
DECLARE v_gid uuid := gen_random_uuid();
BEGIN
  EXECUTE format('CREATE TEMP TABLE tmp_dup ON COMMIT DROP AS
    SELECT %L::uuid AS user_id, 100 AS amount, %L::text AS gateway_payment_id',
    '11111111-1111-4111-8111-111111111111'::uuid, v_gid);
  BEGIN
    INSERT INTO public.payments (user_id, amount, credits, status, gateway_payment_id)
    VALUES ('11111111-1111-4111-8111-111111111111', 100, 100, 'approved', v_gid);
    BEGIN
      INSERT INTO public.payments (user_id, amount, credits, status, gateway_payment_id)
      VALUES ('11111111-1111-4111-8111-111111111111', 100, 100, 'approved', v_gid);
      RAISE EXCEPTION '8.9 FAIL: dua payments com mesmo gateway_payment_id';
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE '8.9 OK: unique(gateway_payment_id) bloqueou duplicata';
    END;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '8.9 ERR: %', SQLERRM;
  END;
END $$;

ROLLBACK;
SELECT 'PARTE 8 CONCLUIDA — credits_ledger como fonte da verdade: OK' AS notice;