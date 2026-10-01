-- =========================================================================
-- SAMEJ SOCIAL — FASE 4.3 · VÍDEOS EM STAND-BY (plano R2 free)
-- A infraestrutura (r2-upload v9 aceita video/*; lib/uploads uploadMedia)
-- fica PRONTA, mas a publicação de vídeos fica BLOQUEADA até o dono liberar
-- (plano R2 pago). Para reativar: trocar este raise por a regra do 013
-- (1 vídeo por post, <=100 MB, sem misturar com fotos) e liberar o picker
-- no PostComposer (accept="image/*,video/*").
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
  IF NEW.kind = 'video' THEN
    RAISE EXCEPTION 'vídeos ainda não liberados — somente imagens por enquanto';
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

COMMIT;