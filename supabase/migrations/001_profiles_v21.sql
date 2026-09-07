-----------------------------------------------
-- SAMEJ SOCIAL — Migration 001: PROFILES V2.1
-- Domínio: Identidade / Perfil
-- Natureza: EVOLUIR profiles (add-only, não destrutivo)
-- Rollback: DROP COLUMN (username, cover_url, verified, featured, account_status,
--           deleted_at, plan_id, updated_at) + voltar CHECK de role original.
-- ATENÇÃO: NÃO executar em produção ainda. Executar em staging/cópia.
-----------------------------------------------

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS cover_url        TEXT,
  ADD COLUMN IF NOT EXISTS verified         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_status   TEXT NOT NULL DEFAULT 'active'
        CHECK (account_status IN ('active','pending','suspended','blocked','deleted')),
  ADD COLUMN IF NOT EXISTS deleted_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_id          UUID,          -- FK real adicionada em 002
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ;

-- Expande o CHECK de role para os novos papéis.
-- Mantém valores legados (CLIENT/PROFESSIONAL/ADMIN) durante a transição.
-- A transformação de dados (CLIENT -> USER) ocorre em migration de dados validada.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check' AND conrelid = 'public.profiles'::regclass) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('USER','PROFESSIONAL','COMPANY','ADMIN','SUPER_ADMIN','CLIENT'));

CREATE INDEX IF NOT EXISTS idx_profiles_role          ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at     ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_id        ON public.profiles(plan_id);

-- Índice para busca por nome/username (LOWER) em escala futura.
CREATE INDEX IF NOT EXISTS idx_profiles_lower_full_name ON public.profiles (LOWER(full_name));
CREATE INDEX IF NOT EXISTS idx_profiles_lower_username  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;

COMMIT;