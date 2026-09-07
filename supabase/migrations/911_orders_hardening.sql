-----------------------------------------------
-- SAMEJ SOCIAL — 911 (OPCIONAL, NÃO EXECUTAR AGORA)
-- ORDERS HARDENING — correção das políticas da auditoria na tabela legada.
-- Quando aplicar: NO MESMO DEPLOY em que o front v2 deixa de usar `orders`
-- (substituído por quote_requests/leads) E a migração de dados foi aprovada.
-- Risco: reverter para esta política quebra o front v1 (NewRequest/Job*).
-- Rollback: recriar as policies originais (INSERT WITH CHECK (true),
--           UPDATE USING (true)).
-----------------------------------------------

BEGIN;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas card sem PII (identificadores/categoria/status/datas).
-- O contato só é exposto via lead pago (fluxo v2). Views/camadas de app cuidam disso.
DROP POLICY IF EXISTS "Leitura pública de ordens" ON public.orders;
DROP POLICY IF EXISTS "Inserção de ordens"        ON public.orders;
DROP POLICY IF EXISTS "Atualização de ordens"     ON public.orders;

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

COMMIT;