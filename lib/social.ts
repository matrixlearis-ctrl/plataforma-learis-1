import { supabase } from './supabase';
import { SocialPost, SocialPostMedia, SocialProfileSummary, SocialComment, NotificationItem } from '../types';

// Conteúdo seguro (padrão Samej para todos os perfis — banco migration 012):
// permite letras, espaços, EMOJIS, pontuação e números (máx. 5 dígitos
// seguidos); bloqueia TELEFONE (6+ dígitos consecutivos), URLs, e-mails e "<>".
const PHONE_RE = /\d{6,}/;
const URL_RE = /(https?:\/\/|www\.)/i;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

interface SafeTextOptions {
  max?: number;
  allowEmpty?: boolean;
}

export const isSafeText = (content: string, opts: SafeTextOptions = {}): boolean => {
  const normalized = content.trim().replace(/\s+/g, ' ');
  if (normalized === '') return !!opts.allowEmpty;
  if (normalized.length > (opts.max ?? 280)) return false;
  if (PHONE_RE.test(normalized)) return false;
  if (URL_RE.test(normalized)) return false;
  if (EMAIL_RE.test(normalized)) return false;
  if (/[<>]/.test(normalized)) return false;
  return true;
};

// Comentário: mesmas regras do banco (isSafeText) — máx. 280.
export const isValidComment = (content: string): boolean => isSafeText(content, { max: 280 });

// Descrição (legenda) do post: opcional, mesmo padrão de conteúdo seguro.
export const isSafeCaption = (content: string): boolean =>
  isSafeText(content, { max: 2000, allowEmpty: true });

export const normalizeComment = (content: string): string =>
  content.trim().replace(/\s+/g, ' ');

const mapMedia = (m: any): SocialPostMedia => ({
  id: m.id,
  kind: m.kind === 'video' ? 'video' : 'image',
  url: m.url,
  thumb_url: m.thumb_url,
  width: m.width,
  height: m.height,
  size_bytes: m.size_bytes,
  order_index: m.order_index ?? 0,
});

const mapAuthor = (a: any): SocialProfileSummary => ({
  id: a.id,
  username: a.username,
  full_name: a.full_name,
  avatar_url: a.avatar_url,
  description: a.description,
  role: a.role,
  profession: a.profession,
  verified: a.verified,
  created_at: a.created_at,
});

const buildAuthors = async (ids: string[]): Promise<Record<string, SocialProfileSummary>> => {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return {};
  const { data, error } = await supabase
    .from('public_profiles')
    .select('id, username, full_name, avatar_url, description, role, profession, verified, created_at')
    .in('id', unique);
  if (error) return {};
  const map: Record<string, SocialProfileSummary> = {};
  (data || []).forEach((a: any) => { map[a.id] = mapAuthor(a); });
  return map;
};

export const getFeed = async (
  offset: number,
  limit: number,
  meId: string | null,
): Promise<{ posts: SocialPost[]; hasMore: boolean }> => {
  const from = offset;
  const to = offset + limit - 1;
  const { data: rows, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  if (!rows || rows.length === 0) return { posts: [], hasMore: false };

  const postIds = rows.map((r: any) => r.id);
  const authors = await buildAuthors(rows.map((r: any) => r.author_id));

  const { data: mediaRows } = await supabase
    .from('post_media')
    .select('*')
    .in('post_id', postIds)
    .order('order_index', { ascending: true });

  const mediaByPost: Record<string, SocialPostMedia[]> = {};
  (mediaRows || []).forEach((m: any) => {
    (mediaByPost[m.post_id] = mediaByPost[m.post_id] || []).push(mapMedia(m));
  });

  const { data: likesRows, count: _lc } = await supabase
    .from('likes')
    .select('target_id, profile_id', { count: 'exact', head: false })
    .eq('target_type', 'post')
    .in('target_id', postIds);

  const likesByPost: Record<string, { count: number; likedByMe: boolean }> = {};
  (likesRows || []).forEach((l: any) => {
    const entry = (likesByPost[l.target_id] = likesByPost[l.target_id] || { count: 0, likedByMe: false });
    entry.count += 1;
    if (meId && l.profile_id === meId) entry.likedByMe = true;
  });

  const { data: commentRows } = await supabase
    .from('comments')
    .select('post_id')
    .eq('status', 'published')
    .in('post_id', postIds);

  const commentCounts: Record<string, number> = {};
  (commentRows || []).forEach((c: any) => {
    commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
  });

  const { data: shareRows } = await supabase
    .from('shares')
    .select('post_id')
    .in('post_id', postIds);

  const shareCounts: Record<string, number> = {};
  (shareRows || []).forEach((s: any) => {
    shareCounts[s.post_id] = (shareCounts[s.post_id] || 0) + 1;
  });

  const posts: SocialPost[] = rows.map((r: any) => ({
    id: r.id,
    authorId: r.author_id,
    author: authors[r.author_id],
    caption: r.caption,
    location: r.location,
    hashtags: r.hashtags || [],
    status: r.status,
    createdAt: r.created_at,
    media: mediaByPost[r.id] || [],
    likeCount: likesByPost[r.id]?.count || 0,
    commentCount: commentCounts[r.id] || 0,
    shareCount: shareCounts[r.id] || 0,
    likedByMe: likesByPost[r.id]?.likedByMe || false,
  }));

  return { posts, hasMore: rows.length === limit };
};

export const getPostDetail = async (postId: string, meId: string | null): Promise<SocialPost> => {
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .maybeSingle();

  if (error || !post) throw error || new Error('Post não encontrado.');

  const { data: mediaRows } = await supabase
    .from('post_media')
    .select('*')
    .eq('post_id', postId)
    .order('order_index', { ascending: true });

  const { data: likesRows } = await supabase
    .from('likes')
    .select('profile_id')
    .eq('target_type', 'post')
    .eq('target_id', postId);

  const authors = await buildAuthors([post.author_id]);

  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('status', 'published');

  const { count: shareTotal } = await supabase
    .from('shares')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  return {
    id: post.id,
    authorId: post.author_id,
    author: authors[post.author_id],
    caption: post.caption,
    location: post.location,
    hashtags: post.hashtags || [],
    status: post.status,
    createdAt: post.created_at,
    media: (mediaRows || []).map(mapMedia),
    likeCount: likesRows?.length || 0,
    commentCount: count || 0,
    shareCount: shareTotal || 0,
    likedByMe: meId ? (likesRows || []).some((l: any) => l.profile_id === meId) : false,
  };
};

export const toggleLike = async (postId: string, meId: string) => {
  const { data: existing } = await supabase
    .from('likes')
    .select('profile_id')
    .eq('target_type', 'post')
    .eq('target_id', postId)
    .eq('profile_id', meId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('target_type', 'post')
      .eq('target_id', postId)
      .eq('profile_id', meId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from('likes')
    .insert({ target_type: 'post', target_id: postId, profile_id: meId });
  if (error) throw error;
  return true;
};

export const getComments = async (postId: string): Promise<SocialComment[]> => {
  const { data: rows, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .eq('status', 'published')
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const authors = await buildAuthors(rows.map((r: any) => r.author_id));
  return rows.map((r: any) => ({
    id: r.id,
    postId: r.post_id,
    authorId: r.author_id,
    author: authors[r.author_id],
    content: r.content,
    createdAt: r.created_at,
  }));
};

export const addComment = async (postId: string, content: string, meId: string) => {
  const normalized = normalizeComment(content);
  if (!isValidComment(normalized)) {
    throw new Error('Comentário não permitido: nada de telefones, links ou e-mails (máx. 280 caracteres).');
  }
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, author_id: meId, content: normalized, status: 'published' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const isFollowing = async (meId: string, targetId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', meId)
    .eq('followed_id', targetId)
    .maybeSingle();
  return !!data;
};

export const toggleFollow = async (meId: string, targetId: string): Promise<boolean> => {
  if (meId === targetId) throw new Error('Você não pode seguir a si mesmo.');

  const already = await isFollowing(meId, targetId);
  if (already) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', meId)
      .eq('followed_id', targetId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: meId, followed_id: targetId });
  if (error) throw error;
  return true;
};

export const getFollowersCount = async (profileId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('followed_id', profileId);
  if (error) return 0;
  return count || 0;
};

export const getFollowingCount = async (profileId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profileId);
  if (error) return 0;
  return count || 0;
};

const fetchProfilesByIds = async (ids: string[]): Promise<SocialProfileSummary[]> => {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  const chunks: SocialProfileSummary[] = [];
  for (let i = 0; i < unique.length; i += 100) {
    const { data } = await supabase
      .from('public_profiles')
      .select('id, username, full_name, avatar_url, description, role, profession, verified, created_at')
      .in('id', unique.slice(i, i + 100));
    (data || []).forEach((a: any) => chunks.push(mapAuthor(a)));
  }
  return chunks;
};

export const getFollowers = async (profileId: string): Promise<SocialProfileSummary[]> => {
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('followed_id', profileId)
    .order('created_at', { ascending: false })
    .limit(500);
  return fetchProfilesByIds((data || []).map((r: any) => r.follower_id));
};

export const getFollowing = async (profileId: string): Promise<SocialProfileSummary[]> => {
  const { data } = await supabase
    .from('follows')
    .select('followed_id')
    .eq('follower_id', profileId)
    .order('created_at', { ascending: false })
    .limit(500);
  return fetchProfilesByIds((data || []).map((r: any) => r.followed_id));
};

export const getProfilePosts = async (
  profileId: string,
  meId: string | null,
): Promise<SocialPost[]> => {
  const { data: rows, error } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', profileId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const postIds = rows.map((r: any) => r.id);
  const authors = await buildAuthors([profileId]);

  const { data: mediaRows } = await supabase
    .from('post_media')
    .select('*')
    .in('post_id', postIds)
    .order('order_index', { ascending: true });

  const mediaByPost: Record<string, SocialPostMedia[]> = {};
  (mediaRows || []).forEach((m: any) => {
    (mediaByPost[m.post_id] = mediaByPost[m.post_id] || []).push(mapMedia(m));
  });

  const { data: likesRows } = await supabase
    .from('likes')
    .select('target_id, profile_id')
    .eq('target_type', 'post')
    .in('target_id', postIds);

  const likesByPost: Record<string, { count: number; likedByMe: boolean }> = {};
  (likesRows || []).forEach((l: any) => {
    const entry = (likesByPost[l.target_id] = likesByPost[l.target_id] || { count: 0, likedByMe: false });
    entry.count += 1;
    if (meId && l.profile_id === meId) entry.likedByMe = true;
  });

  const [{ data: commentRows2 }, { data: shareRows2 }] = await Promise.all([
    supabase.from('comments').select('post_id').eq('status', 'published').in('post_id', postIds),
    supabase.from('shares').select('post_id').in('post_id', postIds),
  ]);

  const commentCounts: Record<string, number> = {};
  (commentRows2 || []).forEach((c: any) => {
    commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
  });

  const shareCounts: Record<string, number> = {};
  (shareRows2 || []).forEach((s: any) => {
    shareCounts[s.post_id] = (shareCounts[s.post_id] || 0) + 1;
  });

  return rows.map((r: any) => ({
    id: r.id,
    authorId: r.author_id,
    author: authors[r.author_id],
    caption: r.caption,
    location: r.location,
    hashtags: r.hashtags || [],
    status: r.status,
    createdAt: r.created_at,
    media: mediaByPost[r.id] || [],
    likeCount: likesByPost[r.id]?.count || 0,
    commentCount: commentCounts[r.id] || 0,
    shareCount: shareCounts[r.id] || 0,
    likedByMe: likesByPost[r.id]?.likedByMe || false,
  }));
};

export const canPublishProfile = async (meId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('can_publish_profile', { p_profile: meId });
  if (error) return false;
  return !!data;
};

export const getPlanLimitValue = async (meId: string, key = 'max_images'): Promise<number> => {
  const { data, error } = await supabase.rpc('get_plan_limit', { p_profile: meId, p_key: key });
  if (error) return 0;
  return Number(data || 0);
};

// Limite de imagens por publicação: 90 (usuário comum) / 140 (profissional/empresa).
export const getPostImageLimit = async (meId: string): Promise<number> => {
  const { data, error } = await supabase.rpc('get_post_image_limit', { p_profile: meId });
  if (error) return 90;
  return Math.max(1, Number(data || 90));
};

export const deletePost = async (postId: string): Promise<void> => {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
};

export const registerShare = async (postId: string, meId: string): Promise<void> => {
  const { error } = await supabase.from('shares').upsert(
    { post_id: postId, profile_id: meId },
    { onConflict: 'post_id,profile_id' },
  );
  if (error && !String(error.message).includes('duplicate')) throw error;
};

export const getShareCount = async (postId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('shares')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  if (error) return 0;
  return count || 0;
};

export const getMyNotifications = async (meId: string, limit = 12): Promise<NotificationItem[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', meId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((n: any) => ({
    id: n.id,
    profileId: n.profile_id,
    actorId: n.actor_id,
    type: n.type,
    refType: n.ref_type,
    refId: n.ref_id,
    message: n.message,
    readAt: n.read_at,
    createdAt: n.created_at,
  }));
};

export const getUnreadNotificationsCount = async (meId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', meId)
    .is('read_at', null);
  if (error) return 0;
  return count || 0;
};

export const markNotificationsRead = async (meId: string): Promise<void> => {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('profile_id', meId)
    .is('read_at', null);
};