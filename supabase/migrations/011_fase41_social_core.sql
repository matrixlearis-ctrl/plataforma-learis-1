-----------------------------------------------
-- SAMEJ SOCIAL — Migration 011: FASE 4.1 NÚCLEO SOCIAL
-- Domínio: Núcleo social (perfil, publicação, feed, curtida, comentário, seguir)
-- Natureza: ADD-ONLY — reutiliza tabelas 005/010 (posts, post_media, comments,
--           likes, follows já existem). NÃO toca orders. NÃO executa 911.
-- ROLLBACK: DROP views/functions/triggers criadas aqui (não destrutivo).
-----------------------------------------------

BEGIN;

-- =========================================================================
-- 1. PLAN_LIMITS — limites por plano (max_images FREE=20 / PRO=80)
--    O front NÃO deve hardcodar 20/80: sempre via get_plan_limit().
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  limit_key   TEXT NOT NULL,
  limit_value BIGINT NOT NULL DEFAULT 0 CHECK (limit_value >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, limit_key)
);

INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT pl.id, 'max_images',
       CASE pl.code WHEN 'free' THEN 20 WHEN 'pro' THEN 80 WHEN 'company' THEN 80 ELSE 20 END
FROM public.plans pl
ON CONFLICT (plan_id, limit_key) DO UPDATE SET limit_value = EXCLUDED.limit_value;

GRANT SELECT ON public.plan_limits TO anon, authenticated;
GRANT ALL ON public.plan_limits TO service_role;

CREATE OR REPLACE FUNCTION public.get_plan_limit(p_profile uuid, p_key text)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value bigint;
  v_free  bigint;
BEGIN
  SELECT l.limit_value INTO v_value
    FROM public.profiles pr
    JOIN public.plans pl ON pl.id = pr.plan_id
    JOIN public.plan_limits l ON l.plan_id = pl.id AND l.limit_key = p_key
   WHERE pr.id = p_profile;

  IF v_value IS NOT NULL THEN
    RETURN v_value;
  END IF;

  SELECT l.limit_value INTO v_free
    FROM public.plan_limits l
    JOIN public.plans pl ON pl.id = l.plan_id
   WHERE pl.code = 'free' AND l.limit_key = p_key;

  RETURN COALESCE(v_free, 0);
END $$;

GRANT EXECUTE ON FUNCTION public.get_plan_limit(uuid, text) TO anon, authenticated;

-- =========================================================================
-- 2. CAN_PUBLISH_PROFILE — gate de publicação server-side
--    Regra: conta ATIVA + (PROFESSIONAL/COMPANY) + perfil especializado
--    aprovado (active) + dados obrigatórios completos (profile_complete)
--    + permissão do plano. Nenhum frontend consegue burlar.
-- =========================================================================
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

  IF v_status <> 'active' THEN
    RETURN false;
  END IF;

  IF v_role = 'PROFESSIONAL' THEN
    SELECT (cp.active AND cp.profile_complete) INTO v_ok
      FROM public.professional_profiles cp WHERE cp.profile_id = p_profile;
  ELSIF v_role = 'COMPANY' THEN
    SELECT (cp.active AND cp.profile_complete) INTO v_ok
      FROM public.company_profiles cp WHERE cp.profile_id = p_profile;
  ELSE
    -- USER/CLIENT: não pode publicar.
    RETURN false;
  END IF;

  IF COALESCE(v_ok, false) IS FALSE THEN
    RETURN false;
  END IF;

  RETURN public.effective_permission(p_profile, 'can_publish');
END $$;

GRANT EXECUTE ON FUNCTION public.can_publish_profile(uuid) TO anon, authenticated;

-- Policy de INSERT em posts: só conta aprovada/completa/ativa + status published.
DROP POLICY IF EXISTS posts_insert ON public.posts;
CREATE POLICY posts_insert
  ON public.posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND status = 'published'
    AND public.can_publish_profile(auth.uid())
  );

-- =========================================================================
-- 3. GATE DE APROVAÇÃO E COMPLETUDE (perfis especializados)
--    profile_complete é COMPUTADO no servidor (obrigatórios preenchidos).
--    active (aprovação) só pode ser concedido por admin.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.assess_pro_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req  boolean;
  v_admin boolean;
BEGIN
  v_admin := public.is_admin(auth.uid());

  IF TG_TABLE_NAME = 'professional_profiles' THEN
    v_req := btrim(COALESCE(NEW.profession, '')) <> ''
         AND btrim(COALESCE(NEW.cpf, '')) <> ''
         AND btrim(COALESCE(NEW.address, '')) <> ''
         AND btrim(COALESCE(NEW.city, '')) <> ''
         AND btrim(COALESCE(NEW.state, '')) <> ''
         AND (btrim(COALESCE(NEW.phone, '')) <> '' OR btrim(COALESCE(NEW.whatsapp, '')) <> '');
  ELSE
    v_req := btrim(COALESCE(NEW.company_name, '')) <> ''
         AND btrim(COALESCE(NEW.cnpj, '')) <> ''
         AND (btrim(COALESCE(NEW.phone, '')) <> '' OR btrim(COALESCE(NEW.whatsapp, '')) <> '')
         AND btrim(COALESCE(NEW.city, '')) <> ''
         AND btrim(COALESCE(NEW.state, '')) <> '';
  END IF;

  IF NOT v_admin THEN
    IF TG_OP = 'INSERT' OR NEW.active IS DISTINCT FROM OLD.active THEN
      -- Aprovação é privilégio exclusivo do admin.
      NEW.active := false;
    END IF;
  END IF;

  NEW.profile_complete := v_req;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_pro_complete ON public.professional_profiles;
CREATE TRIGGER trg_pro_complete
  BEFORE INSERT OR UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.assess_pro_complete();

DROP TRIGGER IF EXISTS trg_company_complete ON public.company_profiles;
CREATE TRIGGER trg_company_complete
  BEFORE INSERT OR UPDATE ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.assess_pro_complete();

-- =========================================================================
-- 4. COMENTÁRIOS — apenas letras e espaços (frontend + banco)
--    CHECK: conteúdo >=1 letra, <=280, sem números/URLs/@/#/especiais/scripts.
--    Trigger normaliza espaços múltiplos antes da validação.
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comments_content_letters_only' AND conrelid = 'public.comments'::regclass
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT comments_content_letters_only CHECK (
        btrim(content) <> ''
        AND char_length(content) <= 280
        AND content ~ '^[A-Za-zÀ-ÖØ-öø-ÿ ]+$'
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.normalize_comment_content()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.content := regexp_replace(btrim(NEW.content), '[[:space:]]+', ' ', 'g');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_comments_normalize ON public.comments;
CREATE TRIGGER trg_comments_normalize
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.normalize_comment_content();

DROP POLICY IF EXISTS comments_insert ON public.comments;
CREATE POLICY comments_insert
  ON public.comments FOR INSERT
  WITH CHECK (author_id = auth.uid() AND status = 'published');

-- =========================================================================
-- 5. POST_MEDIA — apenas IMAGENS na Fase 4.1 + cota por plano
--    Bloqueia vídeo (v1), url vazia, size inválido e estouro de max_images.
-- =========================================================================
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

  v_limit := public.get_plan_limit(v_author, 'max_images');
  IF v_limit > 0 THEN
    SELECT count(*) INTO v_count FROM public.post_media WHERE post_id = NEW.post_id;
    IF v_count + 1 > v_limit THEN
      RAISE EXCEPTION 'limite de imagens do plano excedido (máximo %s por publicação)', v_limit;
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_post_media_rules ON public.post_media;
CREATE TRIGGER trg_post_media_rules
  BEFORE INSERT OR UPDATE ON public.post_media
  FOR EACH ROW EXECUTE FUNCTION public.enforce_post_media_rules();

COMMIT;