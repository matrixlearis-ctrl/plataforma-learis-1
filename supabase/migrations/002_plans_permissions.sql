-----------------------------------------------
-- SAMEJ SOCIAL — Migration 002: PLANOS E PERMISSÕES
-- Domínio: Monetização (estrutura) / Permissões centralizadas
-- Natureza: CRIAR plans, plan_permissions, system_settings + effective_permission()
-- Rollback: DROP FUNCTION effective_permission; DROP TABLE system_settings,
--           plan_permissions, plans; DROP CONSTRAINT profiles_plan_id_fkey.
-- ATENÇÃO: NÃO executar em produção ainda.
-----------------------------------------------

BEGIN;

-- 1. PLANS ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,          -- free | pro | company
  name          TEXT NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'BRL',
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  active        BOOLEAN NOT NULL DEFAULT true,
  position      INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PLAN_PERMISSIONS ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plan_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  permission  TEXT NOT NULL,
  allowed     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, permission)
);
CREATE INDEX IF NOT EXISTS idx_plan_permissions_plan  ON public.plan_permissions(plan_id);

-- 3. SYSTEM_SETTINGS --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  type        TEXT,                     -- boolean | number | string | json
  description TEXT,
  updated_by  UUID REFERENCES public.profiles(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default de settings (preços NUNCA hardcoded no front).
INSERT INTO public.system_settings (key, value, type, description) VALUES
  ('registration_enabled',        'true',               'boolean', 'Cadastro de novos usuários'),
  ('stories_enabled',             'true',               'boolean', 'Recurso Stories'),
  ('reels_enabled',               'true',               'boolean', 'Recurso Reels'),
  ('messaging_enabled',           'true',               'boolean', 'Mensagens privadas'),
  ('reviews_enabled',             'true',               'boolean', 'Avaliações'),
  ('quotes_enabled',              'true',               'boolean', 'Orçamentos/leads'),
  ('pro_enabled',                 'true',               'boolean', 'Plano PRO'),
  ('company_enabled',             'true',               'boolean', 'Perfis de empresas'),
  ('contact_phone_enabled',       'true',               'boolean', 'Contato telefone habilitado'),
  ('contact_whatsapp_enabled',    'true',               'boolean', 'Contato WhatsApp habilitado'),
  ('contact_email_enabled',       'true',               'boolean', 'Contato email habilitado'),
  ('pro_price',                   '49.90',              'number',  'Preço mensal PRO (R$)'),
  ('company_price',               '149.90',             'number',  'Preço mensal EMPRESA (R$)'),
  ('max_post_images',             '10',                 'number',  'Máx. imagens por post'),
  ('max_video_size_mb',           '100',                'number',  'Máx. tamanho vídeo (MB)'),
  ('max_reel_duration_s',         '90',                 'number',  'Duração máx. Reel (s)')
ON CONFLICT (key) DO NOTHING;

-- 4. PLANS seed --------------------------------------------------------
INSERT INTO public.plans (code, name, description, price, position) VALUES
  ('free',    'FREE',    'Perfil, publicação, stories, seguir e mensagens', 0,     1),
  ('pro',     'PRO',     'Contatos visíveis, reels, leads, impulsionamento', 49.90, 2),
  ('company', 'EMPRESA', 'Perfil empresarial, equipe, destaque, anúncios',   149.90, 3)
ON CONFLICT (code) DO UPDATE SET
  price = EXCLUDED.price, position = EXCLUDED.position;

-- 5. Permissões padrão por plano ----------------------------------------
INSERT INTO public.plan_permissions (plan_id, permission, allowed)
SELECT p.id, pp.permission, pp.allowed::boolean
FROM public.plans p
CROSS JOIN (VALUES
  ('can_publish',                  true),
  ('can_create_reels',             false),
  ('can_create_stories',           true),
  ('can_send_messages',            true),
  ('can_receive_messages',         true),
  ('can_request_quote',            true),
  ('can_receive_leads',            false),
  ('can_create_company_profile',   false),
  ('can_boost_profile',            false),
  ('can_be_featured',              false),
  ('can_show_phone',               false),
  ('can_show_whatsapp',            false),
  ('can_show_email',               false),
  ('can_show_website',             true),
  ('can_show_social',              true)
) AS pp(permission, allowed)
WHERE p.code = 'free'
ON CONFLICT (plan_id, permission) DO NOTHING;

INSERT INTO public.plan_permissions (plan_id, permission, allowed)
SELECT p.id, pp.permission, pp.allowed::boolean
FROM public.plans p
CROSS JOIN (VALUES
  ('can_publish',                  true),
  ('can_create_reels',             true),
  ('can_create_stories',           true),
  ('can_send_messages',            true),
  ('can_receive_messages',         true),
  ('can_request_quote',            true),
  ('can_receive_leads',            true),
  ('can_create_company_profile',   false),
  ('can_boost_profile',            true),
  ('can_be_featured',              false),
  ('can_show_phone',               true),
  ('can_show_whatsapp',            true),
  ('can_show_email',               true),
  ('can_show_website',             true),
  ('can_show_social',              true)
) AS pp(permission, allowed)
WHERE p.code = 'pro'
ON CONFLICT (plan_id, permission) DO NOTHING;

INSERT INTO public.plan_permissions (plan_id, permission, allowed)
SELECT p.id, pp.permission, pp.allowed::boolean
FROM public.plans p
CROSS JOIN (VALUES
  ('can_publish',                  true),
  ('can_create_reels',             true),
  ('can_create_stories',           true),
  ('can_send_messages',            true),
  ('can_receive_messages',         true),
  ('can_request_quote',            true),
  ('can_receive_leads',            true),
  ('can_create_company_profile',   true),
  ('can_boost_profile',            true),
  ('can_be_featured',              true),
  ('can_show_phone',               true),
  ('can_show_whatsapp',            true),
  ('can_show_email',               true),
  ('can_show_website',             true),
  ('can_show_social',              true)
) AS pp(permission, allowed)
WHERE p.code = 'company'
ON CONFLICT (plan_id, permission) DO NOTHING;

-- 6. FKs e plano efetivo (profiles.plan_id = plano efetivo ATUAL) --------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_plan_id_fkey' AND conrelid = 'public.profiles'::regclass) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);
  END IF;
  -- Plano padrão FREE para todos os perfis existentes (só quando nulo).
  UPDATE public.profiles pr SET plan_id = p.id
  FROM public.plans p WHERE p.code = 'free' AND pr.plan_id IS NULL;
END $$;

-- 7. effective_permission(): autoridade única de permissões ---------------
-- Retorna se o perfil (pela role/plano) possui a permissão.
-- ADMIN/SUPER_ADMIN recebem tudo (is_admin() criada na migration 009).
-- OBS(ordem de execução): implementada em plpgsql para a referência a
-- public.is_admin() (009) ser resolvida em runtime e não no CREATE FUNCTION.
CREATE OR REPLACE FUNCTION public.effective_permission(p_profile uuid, p_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed boolean;
BEGIN
  IF p_profile = auth.uid() AND public.is_admin(p_profile) THEN
    RETURN true;
  END IF;
  SELECT pp.allowed INTO v_allowed
    FROM public.plan_permissions pp
    JOIN public.profiles pr ON pr.plan_id = pp.plan_id
   WHERE pr.id = p_profile AND pp.permission = p_permission;
  RETURN COALESCE(v_allowed, false);
END $$;

-- Grants básicos
GRANT SELECT ON public.plans, public.plan_permissions TO anon, authenticated;
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT ALL ON public.plans, public.plan_permissions, public.system_settings TO service_role;

COMMIT;