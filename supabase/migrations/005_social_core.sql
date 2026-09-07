-----------------------------------------------
-- SAMEJ SOCIAL — Migration 005: NÚCLEO SOCIAL
-- Domínio: Rede Social (feed, likes, comentários, follows, stories, reels)
-- Natureza: CRIAR tabelas do núcleo social
-- Rollback: DROP TABLE (ordem inversa). Não há perda de dados legados.
-- ATENÇÃO: NÃO executar em produção ainda.
-----------------------------------------------

BEGIN;

-- 1. POSTS ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption     TEXT,
  location    TEXT,
  hashtags    TEXT[] DEFAULT '{}',
  mentions    JSONB DEFAULT '[]',
  status      TEXT NOT NULL DEFAULT 'published'
              CHECK (status IN ('published','deleted','reported','blocked','draft')),
  view_count  BIGINT NOT NULL DEFAULT 0,
  share_count BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_posts_author    ON public.posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created   ON public.posts(created_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_posts_hashtags  ON public.posts USING GIN (hashtags);

-- 2. POST_MEDIA --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('image','video')),
  url         TEXT NOT NULL,
  thumb_url   TEXT,
  width       INT,
  height      INT,
  size_bytes  BIGINT,
  order_index INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_media_post ON public.post_media(post_id, order_index);

-- 3. COMMENTS ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'published'
              CHECK (status IN ('published','deleted','reported','blocked')),
  like_count  BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id, created_at);

-- 4. LIKES --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
  target_type TEXT NOT NULL CHECK (target_type IN ('post','comment','reel','story')),
  target_id   UUID NOT NULL,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (target_type, target_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_likes_profile ON public.likes(profile_id);

-- 5. SHARES / SAVES -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shares (
  post_id   UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, profile_id)
);
CREATE TABLE IF NOT EXISTS public.saves (
  post_id   UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, profile_id)
);

-- 6. FOLLOWS ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON public.follows(followed_id, created_at DESC);

-- 7. HASHTAGS / POST_HASHTAGS / MENTIONS --------------------------------
CREATE TABLE IF NOT EXISTS public.hashtags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag        TEXT NOT NULL UNIQUE,
  post_count BIGINT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.post_hashtags (
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hashtag_id  UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, hashtag_id)
);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_tag ON public.post_hashtags(hashtag_id);
-- mentions: nuvem JSONB em posts.mentions (simples) + índice GIN
CREATE INDEX IF NOT EXISTS idx_posts_mentions ON public.posts USING GIN (mentions);

-- 8. STORIES -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  status     TEXT NOT NULL DEFAULT 'published'
             CHECK (status IN ('published','expired','deleted','blocked')),
  view_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stories_active
  ON public.stories(author_id, created_at DESC) WHERE status = 'published';

CREATE TABLE IF NOT EXISTS public.story_media (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('image','video','text')),
  content    TEXT,              -- texto OU url
  url        TEXT,
  thumb_url  TEXT,
  duration   INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_story_media_story ON public.story_media(story_id);

CREATE TABLE IF NOT EXISTS public.story_views (
  story_id  UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, profile_id)
);

-- 9. REELS ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption     TEXT,
  cover_url   TEXT,
  video_url   TEXT NOT NULL,
  duration    INT,
  status      TEXT NOT NULL DEFAULT 'published'
              CHECK (status IN ('published','deleted','reported','blocked')),
  view_count  BIGINT NOT NULL DEFAULT 0,
  hashtags    TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reels_active ON public.reels(created_at DESC) WHERE status = 'published';

CREATE TABLE IF NOT EXISTS public.reel_media (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id    UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'video',
  url        TEXT NOT NULL,
  thumb_url  TEXT,
  order_index INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_reel_media_reel ON public.reel_media(reel_id, order_index);

CREATE TABLE IF NOT EXISTS public.reel_views (
  reel_id   UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (reel_id, profile_id)
);

-- 10. NOTIFICATIONS --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- destinatário
  actor_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type       TEXT NOT NULL
             CHECK (type IN ('follow','like','comment','reply','mention','share','quote','lead','system','admin')),
  ref_type   TEXT,
  ref_id     UUID,
  message    TEXT,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_profile
  ON public.notifications(profile_id, read_at, created_at DESC);

-- 11. BLOCKS ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

GRANT SELECT ON public.posts, public.post_media, public.comments, public.likes,
  public.shares, public.saves, public.follows, public.hashtags, public.post_hashtags,
  public.stories, public.story_media, public.story_views, public.reels, public.reel_media,
  public.reel_views, public.notifications, public.blocks
TO anon, authenticated;
GRANT ALL ON public.posts, public.post_media, public.comments, public.likes,
  public.shares, public.saves, public.follows, public.hashtags, public.post_hashtags,
  public.stories, public.story_media, public.story_views, public.reels, public.reel_media,
  public.reel_views, public.notifications, public.blocks
TO service_role;

COMMIT;