-----------------------------------------------
-- SAMEJ SOCIAL — FASE 4.1 NÚCLEO SOCIAL (testes)
-- STAGING APENAS. Transação única com ROLLBACK final: nada persiste.
-- Fixtures (sanitize):
--   22222222-2222-4222-8222-222222222222 = PROFESSIONAL plano PRO (aprovado)
--   44444444-4444-4444-8444-444444444444 = PROFESSIONAL plano FREE (aprovado)
--   11111111-1111-4111-8111-111111111111 = USER (comum)
--   33333333-3333-4333-8333-333333333333 = USER (comum)
--   66666666-6666-4666-8666-666666666666 = COMPANY
--   55555555-5555-4555-8555-555555555555 = ADMIN
-- Convenção: DO imprime "OK" (esperado) ou lança "FAIL".
-- Executar: psql -f fase41_social_core_tests.sql
-----------------------------------------------

BEGIN;

CREATE OR REPLACE FUNCTION public.__f41_auth(p_sub uuid)
RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims',
          json_build_object('sub', p_sub::text, 'role', 'authenticated')::text, true);
$$;

-- ============================================================
-- T1: can_publish_profile — PRO/COMPANY (aprovados) + USER comum
--     DEPENDE de aprovação (publishing_approved); ADMIN mantém.
-- ============================================================
DO $$
BEGIN
  IF NOT public.can_publish_profile('22222222-2222-4222-8222-222222222222'::uuid) THEN
    RAISE EXCEPTION 'FAIL: PROFESSIONAL aprovado plano PRO deveria publicar';
  END IF;
  IF NOT public.can_publish_profile('44444444-4444-4444-8444-444444444444'::uuid) THEN
    RAISE EXCEPTION 'FAIL: PROFESSIONAL aprovado plano FREE deveria publicar';
  END IF;
  IF NOT public.can_publish_profile('66666666-6666-4666-8666-666666666666'::uuid) THEN
    RAISE EXCEPTION 'FAIL: COMPANY aprovada deveria publicar';
  END IF;
  IF public.can_publish_profile('11111111-1111-4111-8111-111111111111'::uuid) THEN
    RAISE EXCEPTION 'FAIL: USER nao aprovado nao deveria publicar';
  END IF;
  IF public.can_publish_profile('33333333-3333-4333-8333-333333333333'::uuid) THEN
    RAISE EXCEPTION 'FAIL: USER nao aprovado nao deveria publicar';
  END IF;
  IF NOT public.can_publish_profile('55555555-5555-4555-8555-555555555555'::uuid) THEN
    RAISE EXCEPTION 'FAIL: ADMIN mantem capacidade de publicacao';
  END IF;
  RAISE NOTICE 'OK: can_publish_profile respeita classe/aprovacao/conta ativa';
END $$;

DO $$
BEGIN
  -- Aprovação administrativa do USER libera publicação (e revoga de volta).
  UPDATE public.profiles SET publishing_approved = true
    WHERE id = '11111111-1111-4111-8111-111111111111'::uuid;
  IF NOT public.can_publish_profile('11111111-1111-4111-8111-111111111111'::uuid) THEN
    RAISE EXCEPTION 'FAIL: USER aprovado deveria publicar';
  END IF;
  UPDATE public.profiles SET publishing_approved = false
    WHERE id = '11111111-1111-4111-8111-111111111111'::uuid;
  IF public.can_publish_profile('11111111-1111-4111-8111-111111111111'::uuid) THEN
    RAISE EXCEPTION 'FAIL: revogar aprovacao deveria bloquear USER';
  END IF;
  RAISE NOTICE 'OK: aprovacao administrativa de USER liga/desliga publicacao';
END $$;

-- ============================================================
-- T2: limites por plano vêm de plan_limits (não hardcoded)
-- ============================================================
DO $$
BEGIN
  IF public.get_plan_limit('22222222-2222-4222-8222-222222222222'::uuid, 'max_images') <> 80 THEN
    RAISE EXCEPTION 'FAIL: PRO deveria ter 80 imagens (plan_limits)';
  END IF;
  IF public.get_plan_limit('44444444-4444-4444-8444-444444444444'::uuid, 'max_images') <> 20 THEN
    RAISE EXCEPTION 'FAIL: FREE deveria ter 20 imagens (plan_limits)';
  END IF;
  IF public.get_plan_limit('11111111-1111-4111-8111-111111111111'::uuid, 'max_images') <> 20 THEN
    RAISE EXCEPTION 'FAIL: FREE padrao deveria ter 20 imagens (plan_limits)';
  END IF;
  RAISE NOTICE 'OK: get_plan_limit le plan_limits (FREE 20 / PRO 80)';

  -- Fase 4.2: limite de imagens do post agora é POR PAPEL (90/140).
  IF public.get_post_image_limit('11111111-1111-4111-8111-111111111111'::uuid) <> 90 THEN
    RAISE EXCEPTION 'FAIL: USER deveria ter 90 imagens por publicação';
  END IF;
  IF public.get_post_image_limit('33333333-3333-4333-8333-333333333333'::uuid) <> 90 THEN
    RAISE EXCEPTION 'FAIL: USER deveria ter 90 imagens por publicação';
  END IF;
  IF public.get_post_image_limit('22222222-2222-4222-8222-222222222222'::uuid) <> 140 THEN
    RAISE EXCEPTION 'FAIL: PROFISSIONAL deveria ter 140 imagens por publicação';
  END IF;
  IF public.get_post_image_limit('66666666-6666-4666-8666-666666666666'::uuid) <> 140 THEN
    RAISE EXCEPTION 'FAIL: COMPANY deveria ter 140 imagens por publicação';
  END IF;
  RAISE NOTICE 'OK: get_post_image_limit por papel (USER 90 / PRO-COMPANY 140)';
END $$;

-- ============================================================
-- T3: gate de publicação via RLS (frontend não burla)
-- ============================================================
SET ROLE authenticated;

DO $$
BEGIN
  PERFORM public.__f41_auth('11111111-1111-4111-8111-111111111111'::uuid);
  BEGIN
    INSERT INTO public.posts (author_id, caption, status)
      VALUES ('11111111-1111-4111-8111-111111111111'::uuid, 'tentativa de USER', 'published');
    RAISE EXCEPTION 'FAIL: USER conseguiu criar publicacao via RLS';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    RAISE NOTICE 'OK: USER bloqueado na criacao de publicacao (RLS)';
  END;
END $$;

DO $$
DECLARE v_post uuid;
BEGIN
  PERFORM public.__f41_auth('22222222-2222-4222-8222-222222222222'::uuid);
  INSERT INTO public.posts (author_id, caption, status)
    VALUES ('22222222-2222-4222-8222-222222222222'::uuid, 'Post de teste PRO', 'published')
    RETURNING id INTO v_post;
  PERFORM set_config('test.f41_post', v_post::text, false);
  RAISE NOTICE 'OK: PROFESSIONAL aprovado cria publicacao';
END $$;

DO $$
DECLARE v_post uuid;
BEGIN
  PERFORM public.__f41_auth('22222222-2222-4222-8222-222222222222'::uuid);
  SELECT current_setting('test.f41_post', true)::uuid INTO v_post;
  BEGIN
    INSERT INTO public.posts (author_id, caption, status)
      VALUES ('11111111-1111-4111-8111-111111111111'::uuid, 'post alheio', 'published');
    RAISE EXCEPTION 'FAIL: criou publicacao em nome de outro usuario';
  EXCEPTION WHEN insufficient_privilege OR foreign_key_violation THEN
    RAISE NOTICE 'OK: publicacao em nome de outro usuario bloqueada';
  END;
END $$;

DO $$
BEGIN
  PERFORM public.__f41_auth('22222222-2222-4222-8222-222222222222'::uuid);
  BEGIN
    INSERT INTO public.posts (author_id, caption, status)
      VALUES ('22222222-2222-4222-8222-222222222222'::uuid, 'draft para anon', 'draft');
    RAISE EXCEPTION 'FAIL: publicacao draft criada na v1 (deveria exigir published)';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    RAISE NOTICE 'OK: publicacao forcada a status published';
  END;
END $$;

-- ============================================================
-- T4: post_media — só imagem, url/size válidos, sem estouro de cota
-- ============================================================
DO $$
DECLARE v_post uuid;
BEGIN
  PERFORM public.__f41_auth('22222222-2222-4222-8222-222222222222'::uuid);
  SELECT current_setting('test.f41_post', true)::uuid INTO v_post;

  BEGIN
    INSERT INTO public.post_media (post_id, kind, url) VALUES (v_post, 'video', 'https://cdn/x.mp4');
    RAISE EXCEPTION 'FAIL: video foi aceito na Fase 4.1';
  EXCEPTION WHEN raise_exception THEN
    RAISE NOTICE 'OK: video bloqueado (v1 somente imagens)';
  END;

  BEGIN
    INSERT INTO public.post_media (post_id, kind, url) VALUES (v_post, 'image', '   ');
    RAISE EXCEPTION 'FAIL: url vazia foi aceita';
  EXCEPTION WHEN raise_exception THEN
    RAISE NOTICE 'OK: url vazia bloqueada';
  END;

  BEGIN
    INSERT INTO public.post_media (post_id, kind, url, size_bytes) VALUES (v_post, 'image', 'https://cdn/a.jpg', -5);
    RAISE EXCEPTION 'FAIL: size_bytes negativo foi aceito';
  EXCEPTION WHEN raise_exception THEN
    RAISE NOTICE 'OK: size_bytes negativo bloqueado';
  END;

  INSERT INTO public.post_media (post_id, kind, url, size_bytes) VALUES (v_post, 'image', 'https://cdn/a.jpg', 100);
  RAISE NOTICE 'OK: imagem valida aceita no post';
END $$;

DO $$
DECLARE v_post uuid; v_i int;
BEGIN
  PERFORM public.__f41_auth('44444444-4444-4444-8444-444444444444'::uuid);
  INSERT INTO public.posts (author_id, caption, status)
    VALUES ('44444444-4444-4444-8444-444444444444'::uuid, 'Post quota FREE', 'published')
    RETURNING id INTO v_post;
  PERFORM set_config('test.f41_post_free', v_post::text, false);

  FOR v_i IN 1..20 LOOP
    INSERT INTO public.post_media (post_id, kind, url, order_index) VALUES (v_post, 'image', 'https://cdn/q.jpg', v_i);
  END LOOP;

  BEGIN
    INSERT INTO public.post_media (post_id, kind, url, order_index) VALUES (v_post, 'image', 'https://cdn/q21.jpg', 21);
    RAISE EXCEPTION 'FAIL: cota FREE (20 imagens) nao barrou a 21a';
  EXCEPTION WHEN raise_exception THEN
    RAISE NOTICE 'OK: cota FREE (20 imagens) barra a 21a';
  END;
END $$;

-- ============================================================
-- T5: curtidas — curtir/desfazer, contador, duplicidade bloqueada
-- ============================================================
DO $$
DECLARE v_post uuid;
BEGIN
  PERFORM public.__f41_auth('22222222-2222-4222-8222-222222222222'::uuid);
  SELECT current_setting('test.f41_post', true)::uuid INTO v_post;

  INSERT INTO public.likes (target_type, target_id, profile_id)
    VALUES ('post', v_post, '22222222-2222-4222-8222-222222222222'::uuid);
  BEGIN
    INSERT INTO public.likes (target_type, target_id, profile_id)
      VALUES ('post', v_post, '22222222-2222-4222-8222-222222222222'::uuid);
    RAISE EXCEPTION 'FAIL: curtida duplicada aceita';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'OK: curtida duplicada bloqueada (constraint unica)';
  END;
END $$;

DO $$
DECLARE v_post uuid;
BEGIN
  PERFORM public.__f41_auth('11111111-1111-4111-8111-111111111111'::uuid);
  SELECT current_setting('test.f41_post', true)::uuid INTO v_post;
  BEGIN
    INSERT INTO public.likes (target_type, target_id, profile_id)
      VALUES ('post', v_post, '33333333-3333-4333-8333-333333333333'::uuid);
    RAISE EXCEPTION 'FAIL: curtida em nome de outro usuario aceita';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'OK: curtida em nome de outro usuario bloqueada';
  END;
END $$;

DO $$
DECLARE v_post uuid; v_n bigint;
BEGIN
  PERFORM public.__f41_auth('22222222-2222-4222-8222-222222222222'::uuid);
  SELECT current_setting('test.f41_post', true)::uuid INTO v_post;
  SELECT count(*) INTO v_n FROM public.likes WHERE target_type='post' AND target_id=v_post;
  IF v_n <> 1 THEN RAISE EXCEPTION 'FAIL: contagem de curtidas errada (%)', v_n; END IF;

  DELETE FROM public.likes
    WHERE target_type='post' AND target_id=v_post
      AND profile_id = '22222222-2222-4222-8222-222222222222'::uuid;
  SELECT count(*) INTO v_n FROM public.likes WHERE target_type='post' AND target_id=v_post;
  IF v_n <> 0 THEN RAISE EXCEPTION 'FAIL: desfazer curtida nao funcionou'; END IF;
  RAISE NOTICE 'OK: curtir/desfazer + contador corretos';
END $$;

-- ============================================================
-- T6: comentários — letras + EMOJIS + pontuação + números (máx. 5
--     dígitos seguidos); TELEFONE/URL/e-mail bloqueados; normalização
-- ============================================================
DO $$
DECLARE
  v_post uuid;
  v_c int;
  v_pub text := 'Que   publica' || chr(231) || 'ao   incr' || chr(237) || 'vel   ';
  v_norm text := 'Que publica' || chr(231) || 'ao incr' || chr(237) || 'vel';
  v_emoji text := 'Top demais ' || chr(128512) || ' 2026 + nota 9.5/10';
BEGIN
  PERFORM public.__f41_auth('33333333-3333-4333-8333-333333333333'::uuid);
  SELECT current_setting('test.f41_post', true)::uuid INTO v_post;

  INSERT INTO public.comments (post_id, author_id, content, status)
    VALUES (v_post, '33333333-3333-4333-8333-333333333333'::uuid, v_pub, 'published');

  INSERT INTO public.comments (post_id, author_id, content, status)
    VALUES (v_post, '33333333-3333-4333-8333-333333333333'::uuid, v_emoji, 'published');

  SELECT count(*) INTO v_c FROM public.comments
    WHERE post_id=v_post AND content=v_norm;
  IF v_c <> 1 THEN RAISE EXCEPTION 'FAIL: normalizacao (colapsa espacos) do comentario'; END IF;

  SELECT count(*) INTO v_c FROM public.comments
    WHERE post_id=v_post AND content=v_emoji;
  IF v_c <> 1 THEN RAISE EXCEPTION 'FAIL: comentario com emoji deve ser aceito'; END IF;
  RAISE NOTICE 'OK: comentarios normalizados + emoji/numeros curtos aceitos';
END $$;

DO $$
DECLARE
  v_post uuid;
  v_invalidos text[];
  v_t text;
BEGIN
  v_invalidos := ARRAY['11999998888','123456','99999 77777','www.empresa.com.br','http://b.com','veja https://x.com/12','mail fulano@empresa.com','eu <b>oi</b>',' '];
  PERFORM public.__f41_auth('11111111-1111-4111-8111-111111111111'::uuid);
  SELECT current_setting('test.f41_post', true)::uuid INTO v_post;
  FOREACH v_t IN ARRAY v_invalidos LOOP
    BEGIN
      INSERT INTO public.comments (post_id, author_id, content, status)
        VALUES (v_post, '11111111-1111-4111-8111-111111111111'::uuid, v_t, 'published');
      RAISE EXCEPTION 'FAIL: comentario invalido aceito: %', v_t;
    EXCEPTION WHEN check_violation THEN
      NULL;
    END;
  END LOOP;
  RAISE NOTICE 'OK: comentarios com TELEFONE/URL/email/HTML rejeitados no banco';
END $$;

DO $$
DECLARE v_post uuid; v_c int;
BEGIN
  PERFORM public.__f41_auth('11111111-1111-4111-8111-111111111111'::uuid);
  SELECT current_setting('test.f41_post', true)::uuid INTO v_post;
  BEGIN
    INSERT INTO public.comments (post_id, author_id, content, status)
      VALUES (v_post, '22222222-2222-4222-8222-222222222222'::uuid, 'comentario alheio', 'published');
    RAISE EXCEPTION 'FAIL: comentario em nome de outro usuario aceito';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'OK: comentario em nome de outro usuario bloqueado';
  END;
END $$;

DO $$
DECLARE v_post uuid; v_n bigint;
BEGIN
  SELECT current_setting('test.f41_post', true)::uuid INTO v_post;
  SELECT count(*) INTO v_n FROM public.comments WHERE post_id=v_post AND status='published';
  IF v_n < 1 THEN RAISE EXCEPTION 'FAIL: contador de comentarios vazio'; END IF;
  RAISE NOTICE 'OK: contador de comentarios consistente (deriva de comments)';
END $$;

-- ============================================================
-- T7: seguir — duplicidade/self-follow bloqueados, RLS em nome alheio
-- ============================================================
DO $$
DECLARE v_n bigint;
BEGIN
  PERFORM public.__f41_auth('11111111-1111-4111-8111-111111111111'::uuid);
  INSERT INTO public.follows (follower_id, followed_id)
    VALUES ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid);

  BEGIN
    INSERT INTO public.follows (follower_id, followed_id)
      VALUES ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid);
    RAISE EXCEPTION 'FAIL: follow duplicado aceito';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'OK: follow duplicado bloqueado';
  END;

  BEGIN
    INSERT INTO public.follows (follower_id, followed_id)
      VALUES ('11111111-1111-4111-8111-111111111111'::uuid, '11111111-1111-4111-8111-111111111111'::uuid);
    RAISE EXCEPTION 'FAIL: self-follow aceito';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK: self-follow bloqueado';
  END;

  BEGIN
    INSERT INTO public.follows (follower_id, followed_id)
      VALUES ('33333333-3333-4333-8333-333333333333'::uuid, '22222222-2222-4222-8222-222222222222'::uuid);
    RAISE EXCEPTION 'FAIL: follow em nome de outro usuario aceito';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'OK: follow em nome de outro usuario bloqueado';
  END;

  SELECT count(*) INTO v_n FROM public.follows
    WHERE follower_id='11111111-1111-4111-8111-111111111111'::uuid
      AND followed_id='22222222-2222-4222-8222-222222222222'::uuid;
  IF v_n <> 1 THEN RAISE EXCEPTION 'FAIL: contador/estado de seguir inconsistente'; END IF;

  DELETE FROM public.follows
    WHERE follower_id='11111111-1111-4111-8111-111111111111'::uuid
      AND followed_id='22222222-2222-4222-8222-222222222222'::uuid;

  SELECT count(*) INTO v_n FROM public.follows
    WHERE follower_id='11111111-1111-4111-8111-111111111111'::uuid
      AND followed_id='22222222-2222-4222-8222-222222222222'::uuid;
  IF v_n <> 0 THEN RAISE EXCEPTION 'FAIL: deixar de seguir nao funcionou'; END IF;
  RAISE NOTICE 'OK: seguir/deixar de seguir + contador corretos';
END $$;

-- ============================================================
-- T8: aprovação profissional (active) e completude computada no servidor
-- ============================================================
DO $$
BEGIN
  PERFORM public.__f41_auth('44444444-4444-4444-8444-444444444444'::uuid);
  UPDATE public.professional_profiles SET active = false WHERE profile_id='44444444-4444-4444-8444-444444444444'::uuid;
  IF public.can_publish_profile('44444444-4444-4444-8444-444444444444'::uuid) THEN
    RAISE EXCEPTION 'FAIL: perfil desativado ainda publica';
  END IF;

  UPDATE public.professional_profiles SET active = true WHERE profile_id='44444444-4444-4444-8444-444444444444'::uuid;
  IF EXISTS (SELECT 1 FROM public.professional_profiles WHERE profile_id='44444444-4444-4444-8444-444444444444'::uuid AND active) THEN
    RAISE EXCEPTION 'FAIL: usuario conseguiu auto-aprovar o proprio perfil';
  END IF;
  RAISE NOTICE 'OK: desativacao bloqueia publicacao e auto-aprovacao nao e possivel';
END $$;

DO $$
DECLARE v_complete boolean;
BEGIN
  PERFORM public.__f41_auth('55555555-5555-4555-8555-555555555555'::uuid);
  UPDATE public.professional_profiles SET active = true WHERE profile_id='44444444-4444-4444-8444-444444444444'::uuid;
  IF NOT public.can_publish_profile('44444444-4444-4444-8444-444444444444'::uuid) THEN
    RAISE EXCEPTION 'FAIL: admin nao conseguiu reativar/aprovar perfil';
  END IF;

  UPDATE public.professional_profiles SET profession = '' WHERE profile_id='44444444-4444-4444-8444-444444444444'::uuid;
  SELECT profile_complete INTO v_complete FROM public.professional_profiles WHERE profile_id='44444444-4444-4444-8444-444444444444'::uuid;
  IF v_complete THEN
    RAISE EXCEPTION 'FAIL: profile_complete deveria ser false sem dados obrigatorios';
  END IF;
  RAISE NOTICE 'OK: admin reativa/aprova e profile_complete e calculado no servidor';
END $$;

-- ============================================================
-- T9: feed — anon lê posts publicados; comentários só published
-- ============================================================
RESET ROLE;

INSERT INTO public.comments (post_id, author_id, content, status)
SELECT current_setting('test.f41_post', true)::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'bloqueado', 'blocked';

SET ROLE anon;
SELECT set_config('request.jwt.claims', '', true);

DO $$
DECLARE v_post uuid; v_c int;
BEGIN
  SELECT current_setting('test.f41_post', true)::uuid INTO v_post;
  SELECT count(*) INTO v_c FROM public.comments WHERE post_id=v_post;
  IF v_c <> 1 THEN RAISE EXCEPTION 'FAIL: anon viu comentario bloqueado (%)', v_c; END IF;
  RAISE NOTICE 'OK: anon enxerga somente comentarios published';
END $$;

DO $$
DECLARE v_c int;
BEGIN
  SELECT count(*) INTO v_c FROM public.posts WHERE status='published';
  IF v_c < 2 THEN RAISE EXCEPTION 'FAIL: feed anon nao mostra publicacoes publicadas'; END IF;
  SELECT count(*) INTO v_c FROM public.public_profiles;
  IF v_c < 1 THEN RAISE EXCEPTION 'FAIL: public_profiles invisivel para anon'; END IF;
  RAISE NOTICE 'OK: feed anon mostra publicacoes publicadas + autores via public_profiles (sem PII)';
END $$;

RESET ROLE;

ROLLBACK;