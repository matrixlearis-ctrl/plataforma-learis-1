-- =========================================================================
-- SAMEJ SOCIAL — FASE 4.3 · coluna portfolio_urls em profiles
-- O front (ProfileSettings, ProfessionalDashboard, UserManagement, App)
-- sempre usou profiles.portfolio_urls, mas a coluna nunca existiu nas
-- migracoes 001-013 -> o portfolio nunca salvava. Aqui criamos a coluna;
-- os uploads ja saem por R2 (uploadPostImage) e as URLs sao gravadas aqui.
-- =========================================================================

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS portfolio_urls text[] NOT NULL DEFAULT '{}';

-- public_profiles (view usada pelo app social) nao precisa expor portfolio.
COMMIT;