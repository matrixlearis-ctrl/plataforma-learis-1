-----------------------------------------------
-- SAMEJ SOCIAL — Migration 008: MONETIZAÇÃO
-- Domínio: Pagamentos V2, Assinaturas, Créditos (ledger)
-- Natureza: EVOLUIR payments (add-only) + CRIAR subscriptions/credits_ledger
-- Rollback: DROP FUNCTION spend_credits, add_credits; DROP TABLE credits_ledger,
--           subscriptions; recompor CHECK de payments.status.
-- REGRA: saldo jamais alterado por frontend; somente add/spend_credits (backend).
-- ATENÇÃO: NÃO executar em produção ainda.
-----------------------------------------------

BEGIN;

-- 1. PAYMENTS V2 (evoluir em lugar) -------------------------------------
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS plan_id           UUID REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS subscription_id   UUID,
  ADD COLUMN IF NOT EXISTS gateway           TEXT DEFAULT 'mercadopago',
  ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method    TEXT DEFAULT 'pix',
  ADD COLUMN IF NOT EXISTS period_start      DATE,
  ADD COLUMN IF NOT EXISTS period_end        DATE,
  ADD COLUMN IF NOT EXISTS metadata          JSONB DEFAULT '{}';

-- Amplia CHECK de status (drop/recreate do default legado).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_status_check' AND conrelid = 'public.payments'::regclass) THEN
    ALTER TABLE public.payments DROP CONSTRAINT payments_status_check;
  END IF;
END $$;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('approved','pending','cancelled','refunded','expired','failed','charged_back'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_gateway_payment
  ON public.payments(gateway, gateway_payment_id) WHERE gateway_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_profile     ON public.payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON public.payments(status, created_at DESC);

-- 2. SUBSCRIPTIONS (histórico/estado comercial; plano efetivo = profiles.plan_id) ----
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id               UUID NOT NULL REFERENCES public.plans(id),
  status                TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','trial','past_due','suspended','cancelled','expired')),
  starts_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at               TIMESTAMPTZ,
  next_billing_at       TIMESTAMPTZ,
  amount                DECIMAL(10,2) NOT NULL DEFAULT 0,
  gateway               TEXT DEFAULT 'mercadopago',
  gateway_subscription_id TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile ON public.subscriptions(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan    ON public.subscriptions(plan_id);

ALTER TABLE public.payments
  ADD CONSTRAINT payments_subscription_fk FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
  ON DELETE SET NULL;

-- 3. CREDITS_LEDGER -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credits_ledger (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL
               CHECK (type IN ('purchase','lead_spend','boost','refund','admin_adjust','expiry')),
  amount       INTEGER NOT NULL,           -- positivo = crédito, negativo = débito
  balance_after INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  reason       TEXT,
  created_by   UUID REFERENCES public.profiles(id),  -- quem executou (null = sistema)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_profile ON public.credits_ledger(profile_id, created_at DESC);

-- 4. Funções seguras de saldo ---------------------------------------------------
-- Só podem ser chamadas por backend autorizado (service_role / Edge). RLS adicionada em 010.
CREATE OR REPLACE FUNCTION public.add_credits(
  p_profile uuid,
  p_amount  integer,
  p_type    text DEFAULT 'purchase',
  p_reason  text DEFAULT NULL,
  p_ref_type text DEFAULT NULL,
  p_ref_id  uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'amount deve ser positivo'; END IF;
  SELECT COALESCE(credits, 0) INTO v_balance FROM public.profiles WHERE id = p_profile;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'perfil não encontrado'; END IF;
  v_balance := v_balance + p_amount;
  UPDATE public.profiles SET credits = v_balance, updated_at = now() WHERE id = p_profile;
  INSERT INTO public.credits_ledger
    (profile_id, type, amount, balance_after, reference_type, reference_id, reason)
  VALUES
    (p_profile, p_type, p_amount, v_balance, p_ref_type, p_ref_id, p_reason);
  RETURN v_balance;
END $$;

CREATE OR REPLACE FUNCTION public.spend_credits(
  p_profile uuid,
  p_amount  integer,
  p_reason  text DEFAULT NULL,
  p_ref_type text DEFAULT NULL,
  p_ref_id  uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'amount deve ser positivo'; END IF;
  SELECT COALESCE(credits, 0) INTO v_balance FROM public.profiles WHERE id = p_profile;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'perfil não encontrado'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'saldo insuficiente'; END IF;
  v_balance := v_balance - p_amount;
  UPDATE public.profiles SET credits = v_balance, updated_at = now() WHERE id = p_profile;
  INSERT INTO public.credits_ledger
    (profile_id, type, amount, balance_after, reference_type, reference_id, reason)
  VALUES
    (p_profile, 'lead_spend', -p_amount, v_balance, p_ref_type, p_ref_id, p_reason);
  RETURN v_balance;
END $$;

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions, public.credits_ledger TO service_role;
-- RLS em payments/subscriptions adicionada em 010.

COMMIT;