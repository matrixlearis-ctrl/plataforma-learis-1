-----------------------------------------------
-- SAMEJ SOCIAL — Migration 004: CONTATOS E VISIBILIDADE
-- Domínio: Contatos (fonte futura de monetização)
-- Natureza: CRIAR profile_contacts, profile_contact_visibility
-- Rollback: DROP FUNCTION is_contact_visible; DROP TABLE profile_contact_visibility, profile_contacts.
-- ATENÇÃO: NÃO executar em produção ainda.
-----------------------------------------------

BEGIN;

-- 1. PROFILE_CONTACTS --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('phone','whatsapp','email','website','instagram','facebook','other')),
  value       TEXT NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, type, value)
);
CREATE INDEX IF NOT EXISTS idx_contacts_profile ON public.profile_contacts(profile_id);

-- 2. PROFILE_CONTACT_VISIBILITY ----------------------------------------
-- Dado pode existir no banco e ficar oculto; exibição = permissão do plano
-- + exceção administrativa (independe do plano).
CREATE TABLE IF NOT EXISTS public.profile_contact_visibility (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_contact_id   UUID NOT NULL UNIQUE REFERENCES public.profile_contacts(id) ON DELETE CASCADE,
  default_hidden       BOOLEAN NOT NULL DEFAULT true,
  admin_exception      BOOLEAN NOT NULL DEFAULT false,
  exception_granted_by UUID REFERENCES public.profiles(id),
  exception_note       TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Função de visibilidade: contato é visível se plano permite OU exceção.
CREATE OR REPLACE FUNCTION public.is_contact_visible(p_contact_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (p.default_hidden = false)
    OR (p.admin_exception = true)
    OR COALESCE(public.effective_permission(c.profile_id, 'can_show_' || c.type), false)
  FROM public.profile_contacts c
  LEFT JOIN public.profile_contact_visibility p ON p.profile_contact_id = c.id
  WHERE c.id = p_contact_id;
$$;

GRANT SELECT ON public.profile_contacts, public.profile_contact_visibility TO anon, authenticated;
GRANT ALL  ON public.profile_contacts, public.profile_contact_visibility TO service_role;

-- is_contact_visible é SECURITY DEFINER: não deve ser chamável por anon.
REVOKE ALL ON FUNCTION public.is_contact_visible(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_contact_visible(uuid) TO authenticated;

COMMIT;