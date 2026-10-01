import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, MessageCircle, MapPin, Send, Share2, Check, Stars, User,
} from 'lucide-react';
import { SocialPost, SocialComment, User as AppUser, UserRole } from '../types';
import { getPostDetail, toggleLike, getComments, addComment, registerShare } from '../lib/social';
import { formatRelative, formatCount, roleLabel, roleBadgeClass } from '../lib/format';
import Avatar from '../components/Avatar';

interface PostDetailProps {
  user: AppUser | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const PostDetail: React.FC<PostDetailProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meId = user?.id ?? null;

  const [post, setPost] = useState<SocialPost | null>(null);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likeBusy, setLikeBusy] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [shared, setShared] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [p, c] = await Promise.all([getPostDetail(id, meId), getComments(id)]);
      setPost(p);
      setComments(c);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Publicação não encontrada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, meId]);

  const handleLike = async () => {
    if (!meId || !post || likeBusy) return;
    setLikeBusy(true);
    try {
      const nowLiked = await toggleLike(post.id, meId);
      setPost((prev) => prev && ({
        ...prev,
        likedByMe: nowLiked,
        likeCount: Math.max(0, prev.likeCount + (nowLiked ? 1 : -1)),
      }));
    } catch (err) {
      console.error('Erro ao curtir:', err);
    } finally {
      setLikeBusy(false);
    }
  };

  const handleSendComment = async () => {
    if (!meId || !post || sending) return;
    setSending(true);
    setCommentText((txt) => txt.trim());
    try {
      await addComment(post.id, commentText, meId);
      setCommentText('');
      await load();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Não foi possível comentar.');
    } finally {
      setSending(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const url = `${window.location.origin}/post/${post.id}`;
    if (meId) {
      try {
        await registerShare(post.id, meId);
        setPost((prev) => prev && ({ ...prev, shareCount: prev.shareCount + 1 }));
      } catch { /* duplicado não bloqueia */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1600);
    } catch { /* eslint-disable-line */ }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 font-bold">Carregando publicação...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-xl font-black text-gray-700 mb-4">Não foi possível carregar a publicação.</p>
        <button onClick={() => navigate('/feed')} className="bg-brand-orange text-white px-6 py-3 rounded-full font-black">
          Voltar ao Feed
        </button>
      </div>
    );
  }

  const author = post.author;
  const authorName = author?.full_name || author?.username || 'Usuário Samej';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/feed" className="flex items-center text-gray-500 hover:text-brand-blue font-bold mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Voltar ao Feed
      </Link>

      <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <Link to={`/social/${post.authorId}`} className="flex items-center space-x-3 min-w-0">
            <Avatar
              src={author?.avatar_url}
              alt={authorName}
              size={48}
              verified={author?.verified}
              linkTo={`/social/${post.authorId}`}
            />
            <div className="leading-tight min-w-0">
              <p className="font-black text-gray-900 flex items-center">
                <span className="truncate">{authorName}</span>
                {author?.role === UserRole.ADMIN && <Stars className="w-4 h-4 ml-1.5 text-brand-orange flex-shrink-0" />}
              </p>
              <p className="flex items-center text-xs text-gray-400 font-bold">
                <span className={`inline-flex items-center mr-2 px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-widest ${roleBadgeClass(author?.role)}`}>
                  {roleLabel(author?.role)}
                </span>
                <span>{formatRelative(post.createdAt)}</span>
                {post.location && (
                  <span className="inline-flex items-center ml-2 min-w-0">
                    <MapPin className="w-3 h-3 mr-0.5 flex-shrink-0" /> {post.location}
                  </span>
                )}
              </p>
            </div>
          </Link>
        </header>

        {/* Galeria completa */}
        <div className={`grid gap-0.5 bg-gray-50 ${post.media.length === 1 ? 'grid-cols-1' : post.media.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
          {post.media.map((m, i) => (
            <div key={m.id} className={`overflow-hidden ${post.media.length === 1 ? 'aspect-[4/3]' : 'aspect-square'}`}>
              <img src={m.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.4'; }} />
            </div>
          ))}
        </div>

        <div className="px-5 py-4">
          {post.caption && (
            <p className="text-gray-800 leading-relaxed mb-4">
              <span className="font-black mr-2">{authorName}</span>
              <span className="whitespace-pre-wrap">{post.caption}</span>
            </p>
          )}

          <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-gray-500">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                disabled={!meId || likeBusy}
                className={`flex items-center space-x-1.5 font-black text-sm transition-colors ${post.likedByMe ? 'text-red-500' : 'hover:text-red-500'}`}
              >
                <Heart className={`w-5 h-5 ${post.likedByMe ? 'fill-current' : ''}`} />
                <span>{formatCount(post.likeCount)}</span>
              </button>
              <span className="flex items-center space-x-1.5 font-black text-sm">
                <MessageCircle className="w-5 h-5" />
                <span>{formatCount(post.commentCount)}</span>
              </span>
              <button
                onClick={handleShare}
                className={`flex items-center space-x-1.5 font-black text-sm transition-colors ${shared ? 'text-green-600' : 'hover:text-brand-blue'}`}
              >
                {shared ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                <span>{shared ? 'Link copiado!' : formatCount(post.shareCount)}</span>
              </button>
            </div>
            <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">
              {post.hashtags.map((h) => `#${h}`).join(' ')}
            </span>
          </div>
        </div>
      </article>

      {/* Comentários */}
      <section className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-lg font-black text-brand-darkBlue mb-5">Comentários</h2>

        <div className="space-y-5 mb-6">
          {comments.length === 0 ? (
            <p className="text-center py-6 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 text-gray-400 font-bold">
              Seja o primeiro a comentar!
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-blue to-brand-darkBlue flex items-center justify-center overflow-hidden flex-shrink-0">
                  {c.author?.avatar_url ? (
                    <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="bg-gray-50 rounded-[1.5rem] px-4 py-3 flex-1">
                  <p className="flex items-baseline space-x-2">
                    <span className="font-black text-gray-900 text-sm">
                      {c.author?.full_name || c.author?.username || 'Usuário'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">{formatDate(c.createdAt)}</span>
                  </p>
                  <p className="text-gray-700 text-sm font-medium mt-1 whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {meId ? (
          <div className="flex items-center space-x-3">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendComment(); }}
              maxLength={280}
              placeholder="Escreva um comentário (apenas letras e espaços)..."
              className="flex-1 bg-gray-50 border border-gray-100 rounded-full px-5 py-3 text-sm text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            />
            <button
              onClick={handleSendComment}
              disabled={sending || !commentText.trim()}
              className="w-11 h-11 bg-brand-orange text-white rounded-full flex items-center justify-center hover:bg-brand-lightOrange disabled:opacity-40 transition-all active:scale-95"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        ) : (
          <Link to="/" className="block text-center bg-gray-100 text-brand-blue font-black py-3 rounded-full hover:bg-gray-200 transition-colors">
            Entre para comentar
          </Link>
        )}
      </section>
    </div>
  );
};

export default PostDetail;