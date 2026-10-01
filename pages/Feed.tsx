import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Radio, Users } from 'lucide-react';
import { SocialPost, User } from '../types';
import { getFeed } from '../lib/social';
import PostCard from '../components/PostCard';
import PostComposer from '../components/PostComposer';

const PAGE_SIZE = 10;

interface FeedProps {
  user: User | null;
}

const Feed: React.FC<FeedProps> = ({ user }) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const meId = user?.id ?? null;

  const fetchPage = useCallback(async (from: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const { posts: page, hasMore: more } = await getFeed(from, PAGE_SIZE, meId);
      setPosts((prev) => (append ? [...prev, ...page] : page));
      setHasMore(more);
      setOffset(from + page.length);
      setError('');
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Não foi possível carregar o feed.');
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  }, [meId]);

  useEffect(() => { fetchPage(0, false); }, [fetchPage]);

  useEffect(() => {
    if (!meId) return;
    const timer = setTimeout(() => {
      fetchPage(0, false);
    }, 15000);
    return () => clearTimeout(timer);
  }, [meId, fetchPage]);

  const removePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setOffset((o) => Math.max(0, o - 1));
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-black text-brand-darkBlue tracking-tight flex items-center">
          <Radio className="w-6 h-6 mr-2 text-brand-orange" /> Início
        </h1>
        <Link to="/busca" className="hidden sm:flex items-center text-xs font-black text-gray-400 hover:text-brand-blue transition-colors uppercase tracking-widest">
          <Users className="w-4 h-4 mr-1.5" /> Descobrir pessoas
        </Link>
      </header>

      {user && (
        <PostComposer
          user={user}
          onPublished={() => fetchPage(0, false)}
        />
      )}

      {error && !loading && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse"></div>
                <div className="space-y-2 flex-1"><div className="h-3 bg-gray-100 rounded-full w-1/3 animate-pulse"></div><div className="h-2 bg-gray-100 rounded-full w-1/4 animate-pulse"></div></div>
              </div>
              <div className="aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse mb-4"></div>
              <div className="h-3 bg-gray-100 rounded-full w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-black text-gray-700 mb-1">Nenhuma publicação ainda</p>
          <p className="text-gray-400 font-bold text-sm mb-5">
            Profissionais e empresas aprovadas podem compartilhar seus trabalhos.
          </p>
          <Link to="/professionals" className="inline-flex bg-white border-2 border-brand-blue text-brand-blue px-6 py-2.5 rounded-full font-black text-sm hover:bg-brand-blue hover:text-white transition-all">
            Conhecer profissionais
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} meId={meId} onDeleted={removePost} />
          ))}

          {hasMore && (
            <div className="text-center pt-1">
              <button
                onClick={() => fetchPage(offset, true)}
                disabled={loadingMore}
                className="bg-white border-2 border-gray-200 text-brand-darkBlue font-black px-8 py-2.5 rounded-full hover:border-brand-blue hover:text-brand-blue transition-all disabled:opacity-50"
              >
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Feed;