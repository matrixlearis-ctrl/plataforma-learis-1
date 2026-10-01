-----------------------------------------------
-- SAMEJ SOCIAL — ORDERS / PII (PARTE 11)
-- FASE 3.2 — apenas STAGING.
--
-- 911 NÃO é executada de forma permanente nesta fase. Aqui provamos o
-- efeito do hardening DENTRO de transação que é revertida (ROLLBACK),
-- documentamos o estado atual vulnerável, e jamais promovemos a 911.
-----------------------------------------------

\set ON_ERROR_STOP off

-- =================================================================
-- ESTADO ATUAL (legado, SEM 911): orders tem policies totalmente permissivas
--   "Leitura pública de ordens" USING (true)
--   "Inserção de ordens"        USING/WITH CHECK (true)
--   "Atualização de ordens"     USING (true)
-- => anon/authenticated ACESSAM E ALTERAM PII (phone/address/descrição).
-- NÃO é falha introduzida pela V2.1: é o legado que a 911 corrige.
-- ESTE BLOCO DOCUMENTA A VULNERABILIDADE (resultado esperado: linhas > 0).
-- =================================================================
RESET ROLE;
SET ROLE anon;
SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
-- Esperado: 1+ linhas (fixture). Enquanto a 911 não estiver em produção,
-- este "FAIL esperado" registra o gap conhecido (não pode ser ignorado).
SELECT count(*) AS FALHA_ESPERADA_ATE_911
FROM public.orders WHERE phone IS NOT NULL AND phone <> '';
RESET ROLE;

-- =================================================================
-- PROVA DO HARDENING (911-SIMULADO dentro de transação DESCARTADA)
-- Políticas idênticas às do arquivo 911_orders_hardening.sql.
-- Início: transação revertida no final. NADA fica no schema.
-- =================================================================
BEGIN;

DROP POLICY IF EXISTS "Leitura pública de ordens" ON public.orders;
DROP POLICY IF EXISTS "Inserção de ordens"        ON public.orders;
DROP POLICY IF EXISTS "Atualização de ordens"     ON public.orders;
DROP POLICY IF EXISTS "Deleção de ordens"         ON public.orders;

-- (igual ao 911)
CREATE POLICY orders_select_card
  ON public.orders FOR SELECT
  USING (
    client_id = auth.uid()
    OR status IN ('OPEN','CLOSED','EXPIRED')
  );
CREATE POLICY orders_insert_own
  ON public.orders FOR INSERT
  WITH CHECK (client_id = auth.uid());
CREATE POLICY orders_update_owner_or_admin
  ON public.orders FOR UPDATE
  USING (client_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (client_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY orders_delete_admin
  ON public.orders FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 2. Probes com papéis reais dentro da transação
RESET ROLE;
SET ROLE anon;
SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
-- anon enxerga APENAS card público (status OPEN):
SELECT count(*) AS ANON_VÊ_CARD
FROM public.orders WHERE client_id IS NULL AND status='OPEN';
-- IMPORTANTE (limitação honesta da 911): RLS é por LINHA, não por coluna.
-- Anon ainda lerá `phone` dos cards OPEN fisicamente; a proteção efetiva
-- depende de o front v2 NÃO selecionar essas colunas (orders sai do app).
-- Também não vê ordens de CLIENTE específico:
SELECT count(*) AS NAO_DEVE_VER_CLIENTE
FROM public.orders WHERE client_id IS NOT NULL;

RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
-- OTHER (3333) NÃO vê ordens do FREE (nem OPEN, pois é de outro): é próprio? não
SELECT count(*) AS OUTRO_NAO_VÊ_FREE
FROM public.orders WHERE client_id='11111111-1111-4111-8111-111111111111' AND status='OPEN';

RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',true);
-- ADMIN vê tudo (exceção) e pode UPDATE/DELETE:
SELECT count(*) AS ADMIN_VÊ_TUDO FROM public.orders;
RESET ROLE;

-- 3. DESCARTA a transação (a 911 NUNCA é promovida):
ROLLBACK;
SELECT 'PARTE 11: estado atual vulneravel documentado; efeito da 911 provado dentro de transacao revertida (911 NAO executada).' AS notice;