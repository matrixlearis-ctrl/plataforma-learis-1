import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Share2, MapPin, MoreHorizontal, Stars,
  Link2, Check, X, Trash2, Send, AtSign, Briefcase, Megaphone,
} from 'lucide-react';
import { SocialPost, UserRole } from '../types';
import { toggleLike, deletePost, registerShare } from '../lib/social';
import { formatRelative, formatCount, roleLabel, roleBadgeClass, formatFullDate } from '../lib/format';
import Avatar from './Avatar';
import PostViewerModal from './PostViewerModal';

interface PostCardProps {
  post: SocialPost;
  meId: string | null;
  onDeleted?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, meId, onDeleted }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const author = post.author;
  const authorName = author?.full_name || author?.username || 'Usuário Samej';
  const isOwner = meId === post.authorId;

  const postUrl = `${window.location.origin}/post/${post.id}`;
  const postText = `${authorName} compartilhou no Samej`;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!meId || busy) return;
    setBusy(true);
    try {
      const isNowLiked = await toggleLike(post.id, meId);
      setLiked(isNowLiked);
      setLikeCount((c) => Math.max(0, c + (isNowLiked ? 1 : -1)));
    } catch (err) {
      console.error('Erro ao curtir:', err);
    } finally {
      setBusy(false);
    }
  };

  const doShare = async (channel: string) => {
    if (meId) {
      try {
        await registerShare(post.id, meId);
        setShareCount((c) => c + 1);
      } catch {
        // compartilhamento duplicado não é bloqueante para abrir o link
      }
    }
    setShareOpen(false);

    const wa = `https://wa.me/?text=${encodeURIComponent(`${postText} — ${postUrl}`)}`;
    const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    const x = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postText)}`;
    const tg = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postText)}`;
    const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;

    switch (channel) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(postUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch { /* fallback abaixo */ }
        return;
      case 'native':
        if (navigator.share) {
          navigator.share({ title: postText, url: postUrl }).catch(() => {});
          return;
        }
        window.open(wa, '_blank');
        return;
      case 'whatsapp': window.open(wa, '_blank'); return;
      case 'facebook': window.open(fb, '_blank'); return;
      case 'x': window.open(x, '_blank'); return;
      case 'telegram': window.open(tg, '_blank'); return;
      case 'linkedin': window.open(li, '_blank'); return;
    }
  };

  const handleDelete = async () => {
    if (!isOwner || deleting) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      setMenuOpen(false);
      onDeleted?.(post.id);
    } catch (e) {
      console.error('Erro ao excluir:', e);
    } finally {
      setDeleting(false);
    }
  };

  const shareChannels = [
    ...((navigator as any).share ? [{ key: 'native', name: 'Mais opções', icon: Share2 }] : []),
    { key: 'whatsapp', name: 'WhatsApp', icon: Send },
    { key: 'facebook', name: 'Facebook', icon: MessageCircle },
    { key: 'x', name: 'X (Twitter)', icon: AtSign },
    { key: 'telegram', name: 'Telegram', icon: Send },
    { key: 'linkedin', name: 'LinkedIn', icon: Briefcase },
    { key: 'copy', name: 'Copiar link', icon: Link2 },
  ];

  const openDetail = () => navigate(`/post/${post.id}`);

  const openViewer = () => setViewerOpen(true);

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <header className="flex items-center justify-between px-4 pt-4">
        <Link to={`/social/${post.authorId}`} onClick={(e) => e.stopPropagation()} className="flex items-center space-x-3 min-w-0">
          <Avatar
            src={author?.avatar_url}
            alt={authorName}
            size={42}
            verified={author?.verified}
            linkTo={`/social/${post.authorId}`}
          />
          <div className="leading-tight min-w-0">
            <p className="font-black text-gray-900 truncate flex items-center">
              <span className="truncate hover:underline">{authorName}</span>
              {author?.role === UserRole.ADMIN && <Stars className="w-4 h-4 ml-1.5 text-brand-orange flex-shrink-0" />}
            </p>
            <p className="flex items-center text-xs text-gray-400 font-bold">
              <span
                className={`inline-flex items-center mr-2 px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-widest ${roleBadgeClass(author?.role)}`}
              >
                {roleLabel(author?.role)}
              </span>
              <span>{formatRelative(post.createdAt)}</span>
              {post.location && (
                <span className="inline-flex items-center ml-2 min-w-0">
                  <MapPin className="w-3 h-3 mr-0.5 flex-shrink-0" />
                  <span className="truncate max-w-[140px]">{post.location}</span>
                </span>
              )}
            </p>
          </div>
        </Link>

        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
            aria-label="Menu da publicação"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); }} />
              <div className="absolute right-0 top-10 z-40 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden">
                {isOwner && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(true); setMenuOpen(false); }}
                    className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-3" /> Excluir publicação
                  </button>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareOpen(true); setMenuOpen(false); }}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-3 text-gray-400" /> Compartilhar
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); openViewer(); }}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Stars className="w-4 h-4 mr-3 text-gray-400" /> Ver publicação
                </button>
              </div>
            </>
          )}

          {confirmDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(false)} />
              <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center">
                <Trash2 className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <p className="font-black text-gray-900 mb-1">Excluir publicação?</p>
                <p className="text-sm text-gray-400 font-bold mb-5">Esta ação não pode ser desfeita.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-full font-black text-sm hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 text-white py-2.5 rounded-full font-black text-sm hover:bg-red-600 disabled:opacity-50 transition-colors">
                    {deleting ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Galeria — mídia primeiro */}
      {post.media.length > 0 && post.media.length === 1 && (
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openViewer(); }}
          className="mt-3 w-full block bg-gray-50"
          role="button"
          aria-label="Ver publicação"
        >
          {post.media[0].kind === 'video' ? (
            <video
              src={post.media[0].url}
              controls
              muted
              playsInline
              preload="metadata"
              className="w-full block max-h-[72vh] bg-black"
            />
          ) : (
            <img
              src={post.media[0].url}
              alt=""
              loading="lazy"
              className="w-full block max-h-[72vh] object-contain cursor-zoom-in"
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
            />
          )}
        </div>
      )}

      {post.media.length > 1 && (
        <div onClick={openViewer} className={`mt-3 grid gap-0.5 bg-gray-50 ${post.media.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} cursor-pointer`}>
          {post.media.slice(0, 3).map((m) => (
            <div key={m.id} className="relative overflow-hidden aspect-square">
              <img
                src={m.url}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
              />
              {post.media.length > 3 && m === post.media[2] && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-3xl font-black">
                  +{post.media.length - 3}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="px-4 pt-3">
        {post.caption && (
          <p className="text-gray-800 leading-relaxed text-sm mb-3">
            <span className="font-black mr-2 hover:underline cursor-pointer" onClick={() => navigate(`/social/${post.authorId}`)}>
              {authorName}
            </span>
            <span className="whitespace-pre-wrap">{post.caption}</span>
          </p>
        )}

        <div className="flex items-center text-xs text-gray-400 font-black pb-3">
          <span className="flex items-center mr-3">
            <Heart className={`w-3 h-3 mr-1 ${likeCount > 0 ? 'text-red-400 fill-red-400' : ''}`} />
            {formatCount(likeCount)}
            {likeCount === 1 ? ' curtida' : ' curtidas'}
          </span>
          <span className="mr-3">{formatCount(post.commentCount)} {post.commentCount === 1 ? 'comentário' : 'comentários'}</span>
          <span className="flex items-center">
            <Megaphone className="w-3 h-3 mr-1" />
            {formatCount(shareCount)} {shareCount === 1 ? 'compartilhamento' : 'compartilhamentos'}
          </span>
        </div>

        <div className="flex items-center border-t border-gray-50 pt-1 text-gray-500">
          <button
            onClick={handleLike}
            disabled={!meId || busy}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-black transition-colors ${liked ? 'text-red-500' : 'hover:bg-gray-50 hover:text-red-500'}`}
          >
            <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} /> Curtir
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetail(); }}
            className="flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-black transition-colors hover:bg-gray-50 hover:text-brand-blue"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Comentar
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareOpen(true); }}
            className="flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-black transition-colors hover:bg-gray-50 hover:text-brand-blue"
          >
            <Share2 className="w-4 h-4 mr-2" /> Compartilhar
          </button>
        </div>
      </div>

      {/* Modal de compartilhamento */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShareOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-black text-gray-900">Compartilhar publicação</h3>
              <button onClick={() => setShareOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            {copied ? (
              <div className="p-8 text-center">
                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-black text-gray-900">Link copiado!</p>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-2 gap-2">
                {shareChannels.map((ch) => (
                  <button
                    key={ch.key}
                    onClick={() => doShare(ch.key)}
                    className="flex items-center px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <ch.icon className="w-4 h-4 mr-2 text-brand-blue" />
                    <span className="text-sm font-black text-gray-700">{ch.name}</span>
                  </button>
                ))}
              </div>
            )}

            {!copied && (
              <div className="px-4 pb-4">
                <p className="text-[11px] text-gray-400 font-bold text-center mb-2">{formatFullDate(post.createdAt)} · via Samej</p>
                <p className="text-[11px] text-gray-400 font-bold text-center">
                  {meId ? 'Sua ação será registrada como compartilhamento.' : 'Entre para registrar seus compartilhamentos.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewerOpen && (
        <PostViewerModal post={post} meId={meId} onClose={() => setViewerOpen(false)} />
      )}
    </article>
  );
};

export default PostCard;