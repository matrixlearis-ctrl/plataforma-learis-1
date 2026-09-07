-----------------------------------------------
-- SAMEJ SOCIAL — Migration 009: ADMINISTRAÇÃO E MODERAÇÃO
-- Domínio: Admin (is_admin, admin_users, admin_logs), Denúncias
-- Natureza: CRIAR admin_users, admin_logs, reports + is_admin()
-- Rollback: DROP FUNCTION is_admin, has_admin_permission;
--           DROP TABLE reports, admin_logs, admin_users.
-- ATENÇÃO: NÃO executar em produção ainda.
-----------------------------------------------

BEGIN;

-- 1. ADMIN_USERS (papel do dono/operadores) ---------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN','SUPER_ADMIN')),
  permissions JSONB NOT NULL DEFAULT '{}',   -- ex: {"admin_users":true,"admin_payments":true}
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ADMIN_LOGS (auditoria de ações sensíveis) --------------------------------
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action           TEXT NOT NULL,
  before           JSONB,
  after            JSONB,
  ip               TEXT,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target  ON public.admin_logs(target_profile_id);

-- 3. REPORTS (denúncias) --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type  TEXT NOT NULL CHECK (target_type IN ('post','comment','reel','story','user','company','message','profile')),
  target_id    UUID NOT NULL,
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  resolved_by  UUID REFERENCES public.profiles(id),
  resolution_note TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);

-- 4. is_admin(): autoridade única de administração --------------------------------
-- Substitui a checagem por e-mail hardcoded. NÃO depende apenas de role na tabela:
-- exige registro em admin_users ATIVO. SUPER_ADMIN (roles admin_users) = controle total.
CREATE OR REPLACE FUNCTION public.is_admin(p_profile uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users a WHERE a.profile_id = p_profile AND a.active
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = p_profile AND p.role IN ('ADMIN','SUPER_ADMIN')
      AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.profile_id = p_profile AND au.active)
  );
$$;

-- Helper: permissão administrativa (por permissão granular em admin_users.permissions)
CREATE OR REPLACE FUNCTION public.has_admin_permission(p_profile uuid, p_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (a.role = 'SUPER_ADMIN')
    OR COALESCE((a.permissions->>p_permission)::boolean, false)
  FROM public.admin_users a
  WHERE a.profile_id = p_profile AND a.active;
$$;

-- EXECUTE controlado: definer-functions só devem ser invocáveis por quem precisa.
-- is_admin/has_admin_permission: públicos para clientes autenticados (só retornam boolean).
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.has_admin_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.effective_permission(uuid, text) TO anon, authenticated;
GRANT ALL ON public.admin_users, public.admin_logs, public.reports TO service_role;

COMMIT;