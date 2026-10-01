-- =============================================================================
-- SAMEJ SOCIAL — Fase 4.3 · Capa reposicionável (excluir/reposicionar)
-- =============================================================================
-- Adiciona profiles.cover_position ("<x>% <y>%", default centro) para persistir
-- o reposicionamento da foto de capa de forma que TODOS os visitantes do perfil
-- vejam o mesmo enquadramento (não só o dono). Coluna livre (não é protegida
-- pelo protect_profile_privileges): o próprio usuário pode editar.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_position text NOT NULL DEFAULT '50% 50%';

-- Expõe a posição via public_profiles (view usada pelo app social).
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id, username, full_name, avatar_url, cover_url, description,
  city, state, profession, role, verified, featured, created_at,
  cover_position
FROM public.profiles
WHERE deleted_at IS NULL;

GRANT SELECT ON public.public_profiles TO anon, authenticated;