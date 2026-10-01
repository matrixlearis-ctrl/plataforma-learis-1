import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ChevronLeft, ChevronRight, MapPin, Heart, MessageCircle, Megaphone,
} from 'lucide-react';
import { SocialPost, UserRole } from '../types';
import { getProfilePosts } from '../lib/social';
import { formatRelative, formatCount, roleLabel, roleBadgeClass } from '../lib/format';
import Avatar from './Avatar';

interface ViewerItem {
  post: SocialPost;
  mediaIndex: number;
  postOrdinal: number;
}

interface PostViewerModalProps {
  post: SocialPost;
  meId: string | null;
  onClose: () => void;
}

const PostViewerModal: React.FC<PostViewerModalProps> = ({ post, meId, onClose }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ViewerItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await getProfilePosts(post.authorId, meId);
        if (!mounted) return;
        const ordered = all.length > 0 && all.some((p) => p.id === post.id) ? all : [post];
        const list: ViewerItem[] = [];
        ordered.forEach((p, pi) => {
          const mediaList = p.media.length > 0 ? p.media : [null];
          mediaList.forEach((_, mi) => list.push({ post: p, mediaIndex: mi, postOrdinal: pi + 1 }));
        });
        const start = list.findIndex((it) => it.post.id === post.id);
        setItems(list);
        setIdx(start >= 0 ? start : 0);
      } catch (e) {
        console.error('Erro ao carregar visualizador:', e);
        if (!mounted) return;
        setItems([{ post, mediaIndex: 0, postOrdinal: 1 }]);
        setIdx(0);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [post, meId]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const go = useCallback((dir: 1 | -1) => {
    setIdx((i) => Math.min(items.length - 1, Math.max(0, i + dir)));
  }, [items.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
    touchX.current = null;
  };

  const item = items[idx] || items[0];
  const current = item?.post || post;
  const media = current.media[item?.mediaIndex ?? 0];
  const author = current.author;
  const authorName = author?.full_name || author?.username || 'Usuário Samej';
  const totalPosts = items[items.length - 1]?.postOrdinal || 1;

  const goProfile = () => {
    onClose();
    navigate(`/social/${current.authorId}`);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        aria-label="Fechar"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full h-full sm:h-[88vh] sm:max-w-5xl bg-neutral-950 overflow-hidden flex flex-col sm:flex-row">
        {/* Mídia — sem corte */}
        <div
          className="relative flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {loading ? (
            <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
          ) : media ? (
            media.kind === 'video' ? (
              <video
                key={`${current.id}-${item?.mediaIndex}`}
                src={media.url}
                controls
                playsInline
                preload="metadata"
                className="max-h-full max-w-full select-none animate-[viewerFade_.2s_ease]"
              />
            ) : (
              <img
                key={`${current.id}-${item?.mediaIndex}`}
                src={media.url}
                alt=""
                draggable={false}
                className="max-h-full max-w-full object-contain select-none animate-[viewerFade_.2s_ease]"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
              />
            )
          ) : (
            <p className="text-neutral-500 font-black px-6 text-center">Publicação sem mídia</p>
          )}

          <style>{`@keyframes viewerFade{from{opacity:0}to{opacity:1}}`}</style>

          {items.length > 1 && !loading && (
            <>
              <button
                onClick={() => go(-1)}
                disabled={idx === 0}
                className="absolute top-1/2 left-2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-30 flex items-center justify-center transition-colors z-10"
                aria-label="Postagem anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => go(1)}
                disabled={idx === items.length - 1}
                className="absolute top-1/2 right-2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-30 flex items-center justify-center transition-colors z-10"
                aria-label="Próxima postagem"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-white/60 bg-black/40 rounded-full px-3 py-1">
                Postagem {item?.postOrdinal} de {totalPosts}
                {current.media.length > 1 && ` · Mídia ${(item?.mediaIndex ?? 0) + 1} de ${current.media.length}`}
              </span>
            </>
          )}
        </div>

        {/* Infos + descrição */}
        <aside className="w-full sm:w-[360px] sm:flex-shrink-0 bg-white text-gray-900 flex flex-col max-h-[40vh] sm:max-h-none overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center space-x-3 min-w-0">
            <Avatar src={author?.avatar_url} alt={authorName} size={40} />
            <div className="leading-tight min-w-0 flex-1">
              <p className="font-black text-sm flex items-center">
                <span className="truncate">{authorName}</span>
                {author?.role === UserRole.ADMIN && <Megaphone className="w-3.5 h-3.5 ml-1.5 text-brand-orange flex-shrink-0" />}
              </p>
              <p className="flex items-center text-[11px] text-gray-400 font-bold">
                <span className={`inline-flex items-center mr-2 px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-widest ${roleBadgeClass(author?.role)}`}>
                  {roleLabel(author?.role)}
                </span>
                <span>{formatRelative(current.createdAt)}</span>
              </p>
            </div>
            <button
              onClick={goProfile}
              className="flex-shrink-0 text-xs font-black text-brand-blue hover:underline"
            >
              Ver perfil
            </button>
          </div>

          <div className="px-4 py-3 flex-1">
            {current.location && (
              <p className="flex items-center text-xs text-gray-500 font-bold mb-2">
                <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {current.location}
              </p>
            )}

            {current.caption ? (
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                <span className="font-black mr-2">{authorName}</span>
                {current.caption}
              </p>
            ) : (
              <p className="text-xs text-gray-400 font-bold italic">Sem descrição</p>
            )}

            <div className="flex items-center gap-4 my-4 text-xs text-gray-500 font-black">
              <span className="flex items-center">
                <Heart className="w-3.5 h-3.5 mr-1 text-red-400" /> {formatCount(current.likeCount)}
              </span>
              <span className="flex items-center">
                <MessageCircle className="w-3.5 h-3.5 mr-1" /> {formatCount(current.commentCount)}
              </span>
              <span className="flex items-center">
                <Megaphone className="w-3.5 h-3.5 mr-1" /> {formatCount(current.shareCount)}
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                navigate(`/post/${current.id}`);
              }}
              className="w-full text-center bg-gray-100 text-gray-700 font-black text-sm py-2.5 rounded-full hover:bg-gray-200 transition-colors"
            >
              Ver publicação completa (comentários)
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PostViewerModal;