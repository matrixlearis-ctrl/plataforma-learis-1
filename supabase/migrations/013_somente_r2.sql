-- =========================================================================
-- SAMEJ SOCIAL — FASE 4.3 · SOMENTE R2 (mídias todas no Cloudflare R2/CDN)
-- Regra de mídia passa a aceitar VÍDEOS: no máximo 1 vídeo por publicação,
-- não pode misturar com fotos e limite de 100 MB por arquivo. O upload em si
-- é feito pela edge function r2-upload (imagens E vídeos); aqui a autoridade
-- de publicação garante consistência em post_media.
-- =========================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_post_media_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_author uuid;
  v_limit  bigint;
  v_count  bigint;
BEGIN
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

  IF NEW.kind = 'video' THEN
    IF NEW.size_bytes IS NULL OR NEW.size_bytes > 104857600 THEN
      RAISE EXCEPTION 'vídeo deve ter até 100 MB';
    END IF;

    -- No máximo 1 vídeo por publicação e sem misturar com fotos.
    IF EXISTS (
      SELECT 1 FROM public.post_media
       WHERE post_id = NEW.post_id
    ) THEN
      RAISE EXCEPTION 'uma publicação aceita no máximo 1 vídeo (sem combinar com fotos)';
    END IF;

    RETURN NEW;
  END IF;

  -- Fotos: publicação com vídeo não aceita fotos; senão vale o limite por papel.
  IF EXISTS (
    SELECT 1 FROM public.post_media
     WHERE post_id = NEW.post_id AND kind = 'video'
  ) THEN
    RAISE EXCEPTION 'publicação com vídeo não aceita fotos';
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

COMMIT;