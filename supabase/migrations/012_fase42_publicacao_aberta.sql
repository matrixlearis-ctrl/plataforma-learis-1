-- =========================================================================
-- SAMEJ SOCIAL — FASE 4.2 · PUBLICAÇÃO ABERTA (USUÁRIO COMUM COM APROVAÇÃO)
-- Limites de imagens por papel + conteúdo seguro (emojis ok, sem telefone).
--
-- 1) profiles.publishing_approved: usuário comum publica SÓ com aprovação
--    administrativa (igual Profissional/Empresa). Trigger de proteção veta
--    auto-aprovação (somente admin/service_role alteram).
-- 2) get_post_image_limit(uuid): 90 imagens p/ USER/CLIENT, 140 p/
--    PROFESSIONAL/COMPANY (e ADMIN). Trigger de mídia passa a usá-la.
-- 3) can_publish_profile: USER/CLIENT = conta ativa + aprovado + plano.
--    PROFISSIONAL/EMPRESA = regra atual (active + profile_complete + plano).
-- 4) admin_set_publishing_approved(target, bool): RPC de moderação (admin),
--    registra em admin_logs.
-- 5) Comentários: CHECK "só letras" (011) vira conteúdo seguro — letras,
--    EMOJIS, pontuação e números (máx. 5 dígitos consecutivos); TELEFONE
--    (6+ dígitos), URLs e e-mails bloqueados no banco. Padrão Samej.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. COLUNA publishing_approved + proteção contra auto-aprovação
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS publishing_approved BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_privileged boolean;
BEGIN
  v_privileged := (session_user IN ('postgres','supabase_admin','service_role'))
                  OR public.is_admin(auth.uid());

  IF TG_OP = 'INSERT' THEN
    IF NOT v_privileged AND NEW.role IN ('ADMIN','SUPER_ADMIN') THEN
      NEW.role := 'USER';
    END IF;
    IF NOT v_privileged THEN
      SELECT p.id INTO NEW.plan_id FROM public.plans p WHERE p.code = 'free' LIMIT 1;
      NEW.verified           := false;
      NEW.featured           := false;
      NEW.publishing_approved := false;
      NEW.account_status     := 'active';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NOT v_privileged THEN
      IF NEW.role              IS DISTINCT FROM OLD.role              THEN RAISE EXCEPTION 'alteração de role não permitida'; END IF;
      IF NEW.plan_id           IS DISTINCT FROM OLD.plan_id           THEN RAISE EXCEPTION 'alteração de plano não permitida'; END IF;
      IF NEW.credits           IS DISTINCT FROM OLD.credits           THEN RAISE EXCEPTION 'alteração de créditos não permitida'; END IF;
      IF NEW.verified          IS DISTINCT FROM OLD.verified          THEN RAISE EXCEPTION 'alteração de verificação não permitida'; END IF;
      IF NEW.featured          IS DISTINCT FROM OLD.featured          THEN RAISE EXCEPTION 'alteração de destaque não permitida'; END IF;
      IF NEW.publishing_approved IS DISTINCT FROM OLD.publishing_approved
                                                                      THEN RAISE EXCEPTION 'alteração de aprovação de publicação não permitida'; END IF;
      IF NEW.account_status    IS DISTINCT FROM OLD.account_status AND
         (OLD.account_status IN ('active','pending') AND NEW.account_status NOT IN ('active','pending'))
                                                                      THEN RAISE EXCEPTION 'alteração de status não permitida'; END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_protect ON public.profiles;
CREATE TRIGGER trg_profiles_protect
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- -------------------------------------------------------------------------
-- 2. LIMITE DE IMAGENS POR PAPEL (90 usuário comum / 140 profissional/empresa)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_post_image_limit(p_profile uuid)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF p_profile IS NULL THEN
    RETURN 0;
  END IF;

  SELECT pr.role INTO v_role FROM public.profiles pr WHERE pr.id = p_profile;

  -- Sempre exigido por regra de negócio: retorna o limite da regra.
  RETURN CASE
    WHEN v_role IN ('PROFESSIONAL','COMPANY','ADMIN','SUPER_ADMIN') THEN 140
    ELSE 90
  END;
END $$;

GRANT EXECUTE ON FUNCTION public.get_post_image_limit(uuid) TO anon, authenticated;

-- Trigger de mídia passa a usar o limite por papel (substitui max_images do plano).
CREATE OR REPLACE FUNCTION public.enforce_post_media_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_author uuid;
  v_limit  bigint;
  v_count  bigint;
BEGIN
  IF NEW.kind = 'video' THEN
    RAISE EXCEPTION 'vídeos não são suportados na Fase 4.1 (somente imagens)';
  END IF;

  IF btrim(COALESCE(NEW.url, '')) = '' THEN
    RAISE EXCEPTION 'url da mídia é obrigatória';
  END IF;

  IF NEW.size_bytes IS NOT NULL AND NEW.size_bytes < 0 THEN
    RAISE EXCEPTION 'size_bytes inválido';
  END IF;

  SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
  IF v_author IS NULL THEN
    RAISE EXCEPTION 'post inexistente';
  END IF;

  v_limit := public.get_post_image_limit(v_author);
  IF v_limit > 0 THEN
    SELECT count(*) INTO v_count FROM public.post_media WHERE post_id = NEW.post_id;
    IF v_count + 1 > v_limit THEN
      RAISE EXCEPTION 'limite de %s imagens por publicação excedido', v_limit;
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_post_media_rules ON public.post_media;
CREATE TRIGGER trg_post_media_rules
  BEFORE INSERT OR UPDATE ON public.post_media
  FOR EACH ROW EXECUTE FUNCTION public.enforce_post_media_rules();

-- -------------------------------------------------------------------------
-- 3. CAN_PUBLISH_PROFILE — usuário comum aprovado publica; classe mantida
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_publish_profile(p_profile uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role    text;
  v_status  text;
  v_ok      boolean;
BEGIN
  IF p_profile IS NULL THEN
    RETURN false;
  END IF;

  SELECT pr.role, pr.account_status INTO v_role, v_status
    FROM public.profiles pr WHERE pr.id = p_profile;

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  -- Admin mantém capacidade administrativa (arquitetura V2.1).
  IF public.is_admin(p_profile) THEN
    RETURN true;
  END IF;

  IF COALESCE(v_status, 'active') <> 'active' THEN
    RETURN false;
  END IF;

  IF v_role = 'PROFESSIONAL' THEN
    SELECT (cp.active AND cp.profile_complete) INTO v_ok
      FROM public.professional_profiles cp WHERE cp.profile_id = p_profile;
  ELSIF v_role = 'COMPANY' THEN
    SELECT (cp.active AND cp.profile_complete) INTO v_ok
      FROM public.company_profiles cp WHERE cp.profile_id = p_profile;
  ELSE
    -- USER/CLIENT: publica apenas se aprovado administrativamente.
    SELECT pr.publishing_approved INTO v_ok
      FROM public.profiles pr WHERE pr.id = p_profile;
  END IF;

  IF COALESCE(v_ok, false) IS FALSE THEN
    RETURN false;
  END IF;

  RETURN public.effective_permission(p_profile, 'can_publish');
END $$;

GRANT EXECUTE ON FUNCTION public.can_publish_profile(uuid) TO anon, authenticated;

-- -------------------------------------------------------------------------
-- 4. RPC DE MODERAÇÃO: aprovar publicação de usuário comum (admin only)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_publishing_approved(p_target uuid, p_approved boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_before boolean;
  v_after boolean;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'acesso negado: apenas administradores podem aprovar publicações';
  END IF;

  IF p_target IS NULL THEN
    RAISE EXCEPTION 'perfil de destino obrigatório';
  END IF;

  SELECT pr.role, COALESCE(pr.publishing_approved, false) INTO v_role, v_before
    FROM public.profiles pr WHERE pr.id = p_target;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  IF v_role NOT IN ('USER','CLIENT') THEN
    RAISE EXCEPTION 'perfil %s usa o gate da classe profissional/empresa', v_role;
  END IF;

  UPDATE public.profiles
     SET publishing_approved = COALESCE(p_approved, false), updated_at = now()
   WHERE id = p_target
   RETURNING COALESCE(publishing_approved, false) INTO v_after;

  INSERT INTO public.admin_logs (admin_id, target_profile_id, action, after, metadata)
  VALUES (auth.uid(), p_target, 'set_publishing_approved',
          jsonb_build_object('publishing_approved', v_after),
          jsonb_build_object('before', v_before));

  RETURN v_after;
END $$;

GRANT EXECUTE ON FUNCTION public.admin_set_publishing_approved(uuid, boolean) TO authenticated;

-- -------------------------------------------------------------------------
-- 5. COMENTÁRIOS — conteúdo seguro (letras + EMOJIS + até 5 dígitos seguidos;
--    sem telefone/URL/email/HTML). Padrão Samej para todos os perfis.
-- -------------------------------------------------------------------------
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_content_letters_only;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comments_content_safe' AND conrelid = 'public.comments'::regclass
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT comments_content_safe CHECK (
        btrim(content) <> ''
        AND char_length(content) <= 280
        AND content !~ '[0-9]{6,}'
        AND content !~ '(https?://|www\.)'
        AND content !~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
        AND content !~ '[<>]'
      );
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 6. PLANO PADRÃO NO SIGNUP — signup não envia plan_id; usuário novo nasce
--    com plano FREE (senão nunca teria can_publish). Backfill dos atuais.
-- -------------------------------------------------------------------------
UPDATE public.profiles pr SET plan_id = p.id
  FROM public.plans p
 WHERE p.code = 'free' AND pr.plan_id IS NULL;

COMMIT;