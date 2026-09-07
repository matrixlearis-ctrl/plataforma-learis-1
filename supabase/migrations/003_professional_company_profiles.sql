-----------------------------------------------
-- SAMEJ SOCIAL — Migration 003: PERFIS PROFISSIONAL E EMPRESA
-- Domínio: Identidade / Perfis especializados
-- Natureza: CRIAR professional_profiles, company_profiles
-- Rollback: DROP TABLE company_profiles, professional_profiles.
-- ATENÇÃO: NÃO executar em produção ainda.
-----------------------------------------------

BEGIN;

-- 1. PROFESSIONAL_PROFILES -------------------------------------------
CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profession         TEXT,
  specialties        TEXT[] DEFAULT '{}',
  experience_years   INT CHECK (experience_years >= 0),
  formation          TEXT,
  description        TEXT,
  cpf                TEXT UNIQUE,
  commercial_address TEXT,
  cep                TEXT,
  address            TEXT,
  number             TEXT,
  complement         TEXT,
  neighborhood       TEXT,
  city               TEXT,
  state              TEXT,
  phone              TEXT,
  whatsapp           TEXT,
  profile_complete   BOOLEAN NOT NULL DEFAULT false, -- libera publicação quando true
  active             BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id)
);
CREATE INDEX IF NOT EXISTS idx_pro_profession       ON public.professional_profiles(profession);
CREATE INDEX IF NOT EXISTS idx_pro_city_state       ON public.professional_profiles(city, state);
CREATE INDEX IF NOT EXISTS idx_pro_profile_complete ON public.professional_profiles(profile_complete);

-- 2. COMPANY_PROFILES -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj         TEXT UNIQUE,
  description  TEXT,
  logo_url     TEXT,
  cover_url    TEXT,
  location     TEXT,
  city         TEXT,
  state        TEXT,
  phone        TEXT,
  whatsapp     TEXT,
  email_public TEXT,
  website      TEXT,
  social_links JSONB NOT NULL DEFAULT '{}',
  team         TEXT[] DEFAULT '{}',
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id)
);
CREATE INDEX IF NOT EXISTS idx_company_cnpj          ON public.company_profiles(cnpj);
CREATE INDEX IF NOT EXISTS idx_company_city_state    ON public.company_profiles(city, state);
CREATE INDEX IF NOT EXISTS idx_company_slug          ON public.company_profiles (LOWER(company_name));

GRANT SELECT ON public.professional_profiles, public.company_profiles TO anon, authenticated;
GRANT ALL ON public.professional_profiles, public.company_profiles TO service_role;

COMMIT;