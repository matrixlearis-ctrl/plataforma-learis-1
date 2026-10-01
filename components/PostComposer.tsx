import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ImagePlus, X, MapPin, Send, ArrowLeft, BarChart3, Megaphone } from 'lucide-react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { canPublishProfile, getPostImageLimit, isSafeCaption } from '../lib/social';
import { uploadPostImages, UploadedImage } from '../lib/uploads';
import Avatar from './Avatar';

interface PostComposerProps {
  user: User | null;
  onPublished?: (postId: string) => void;
  standalone?: boolean;
}

type Stage = 'checking' | 'blocked' | 'done' | 'ok';

const PostComposer: React.FC<PostComposerProps> = ({ user, onPublished, standalone }) => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('checking');
  const [open, setOpen] = useState(false);
  const [maxImages, setMaxImages] = useState(20);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [isProfBusiness, setIsProfBusiness] = useState(false);

  const meId = user?.id ?? null;

  useEffect(() => {
    if (!meId) { setStage('ok'); return; }
    setStage('checking');
    (async () => {
      try {
        const [pub, limit] = await Promise.all([
          canPublishProfile(meId),
          getPostImageLimit(meId),
        ]);
        setMaxImages(Math.max(1, limit));
        setIsProfBusiness(user?.role === UserRole.PROFESSIONAL || user?.role === UserRole.COMPANY);
        setStage(pub ? 'ok' : 'blocked');
      } catch {
        setStage('blocked');
      }
    })();
  }, [meId, user?.role]);

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (next.length === 0) {
      setError('Somente imagens são permitidas (vídeos serão liberados em breve).');
      return;
    }
    setError('');

    const allowed = maxImages - files.length;
    if (allowed <= 0) {
      setError(`Limite de ${maxImages} imagem(ns) por publicação atingido.`);
      return;
    }
    const selected = next.slice(0, allowed);
    setFiles((prev) => [...prev, ...selected]);
    setPreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const reset = () => {
    setFiles([]);
    setPreviews((prev) => { prev.forEach((p) => URL.revokeObjectURL(p)); return []; });
    setCaption('');
    setLocation('');
    setError('');
    setOpen(false);
    setStage('ok');
  };

  const handlePublish = async () => {
    if (!meId || files.length === 0) {
      setError('Selecione pelo menos uma imagem.');
      return;
    }
    if (caption.trim() && !isSafeCaption(caption)) {
      setError('Descrição não permitida: nada de telefones, links ou e-mails.');
      return;
    }
    setError('');
    setUploading(true);
    let uploaded: UploadedImage[] = [];
    try {
      uploaded = await uploadPostImages(files);
      setUploading(false);
      setPublishing(true);

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: meId,
          caption: caption.trim() || null,
          location: location.trim() || null,
          status: 'published',
        })
        .select('id')
        .single();
      if (postError || !post) throw postError || new Error('Não foi possível publicar.');

      const mediaRows = uploaded.map((u, i) => ({
        post_id: post.id,
        kind: 'image',
        url: u.url,
        width: u.width,
        height: u.height,
        size_bytes: u.size_bytes,
        order_index: i,
      }));
      const { error: mediaError } = await supabase.from('post_media').insert(mediaRows);
      if (mediaError) {
        await supabase.from('posts').delete().eq('id', post.id);
        throw mediaError;
      }

      const postId = post.id;
      setStage('done');
      if (onPublished) onPublished(postId);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Falha ao publicar. Tente novamente.');
    } finally {
      setUploading(false);
      setPublishing(false);
    }
  };

  if (stage === 'checking') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-100"></div>
          <div className="flex-1 h-10 rounded-full bg-gray-100"></div>
        </div>
      </div>
    );
  }

  if (!meId) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-gray-700 font-black text-sm mb-3">O que você quer publicar?</p>
        <div className="flex items-center space-x-3 mb-4 pointer-events-none">
          <Avatar size={40} />
          <div className="flex-1 h-10 bg-gray-50 rounded-full border border-gray-100 flex items-center px-4 text-sm text-gray-400 font-bold">
            Toque para publicar...
          </div>
        </div>
        <Link to="/" className="block text-center bg-brand-orange text-white py-2.5 rounded-full font-black text-sm hover:bg-brand-lightOrange shadow active:scale-95 transition-all">
          Entre para publicar no feed
        </Link>
      </div>
    );
  }

  if (stage === 'blocked') {
    if (standalone) {
      return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 md:p-10 text-center">
          <BarChart3 className="w-12 h-12 text-brand-orange mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-black text-brand-darkBlue mb-2">
            {isProfBusiness ? 'Publicação indisponível' : 'Publicação em análise'}
          </h2>
          <p className="text-gray-500 font-bold text-sm leading-relaxed mb-6 max-w-md mx-auto">
            {isProfBusiness
              ? 'Seu perfil profissional/empresa ainda não está aprovado ou completo. Complete os dados obrigatórios e aguarde a aprovação administrativa.'
              : 'Seu perfil ainda não foi aprovado para publicar. Assim que a aprovação administrativa for concluída, você poderá compartilhar imagens dos seus trabalhos.'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            {isProfBusiness && (
              <Link to="/negocios" className="flex items-center justify-center gap-2 bg-brand-orange text-white px-6 py-3 rounded-full font-black hover:bg-brand-lightOrange shadow-lg active:scale-95 transition-all">
                <Megaphone className="w-4 h-4" /> Criar perfil profissional/empresa
              </Link>
            )}
            <Link to="/feed" className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-black hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar ao feed
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-gray-700 font-black text-sm mb-2">O que você quer publicar?</p>
        {isProfBusiness ? (
          <Link
            to="/negocios"
            className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl p-3 hover:bg-orange-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-brand-orange text-white flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-brand-orange">Publicar é para perfis profissionais/empresas</p>
              <p className="text-xs text-gray-500 font-bold">Aguardando aprovação ou dados obrigatórios.</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-amber-600">Aguarde a aprovação administrativa</p>
              <p className="text-xs text-gray-500 font-bold">Assim que aprovado, você publica as imagens dos seus trabalhos aqui.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (stage === 'done') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
        <Send className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="font-black text-gray-900">Publicação criada!</p>
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={reset} className="bg-brand-orange text-white px-5 py-2 rounded-full font-black text-sm hover:bg-brand-lightOrange active:scale-95 transition-all">
            Publicar outra
          </button>
          <Link to="/feed" className="bg-gray-100 text-gray-700 px-5 py-2 rounded-full font-black text-sm hover:bg-gray-200 transition-colors">
            Ir para o feed
          </Link>
        </div>
      </div>
    );
  }

  if (!user || !meId) return null;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center space-x-3">
          <Avatar src={user.avatar} alt={user.name} size={40} verified />
          <button
            onClick={() => setOpen(true)}
            className="flex-1 h-10 bg-gray-50 rounded-full border border-gray-100 text-left px-4 text-sm text-gray-400 font-bold hover:bg-gray-100 transition-colors"
          >
            O que você quer publicar?
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center text-gray-500 hover:text-brand-blue font-black text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ImagePlus className="w-4 h-4 mr-2 text-brand-blue" /> Foto
          </button>
          <span className="text-[11px] text-gray-300 font-black uppercase tracking-widest hidden sm:block">
            Somente imagens · máx. {maxImages}
          </span>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { if (!uploading && !publishing) setOpen(false); }} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-black text-gray-900">Criar publicação</h3>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{files.length}/{maxImages}</span>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-xs">
                  {error}
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Avatar src={user.avatar} alt={user.name} size={36} verified />
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-gray-400 font-bold flex items-center"><MapPin className="w-3 h-3 mr-1" /> {location || 'Sem localização'}</p>
                </div>
              </div>

              {previews.length === 0 ? (
                <label className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-brand-blue hover:bg-brand-blue/5 transition-all">
                  <ImagePlus className="w-10 h-10 text-brand-blue mb-3" />
                  <p className="font-black text-gray-600">Selecione imagens para publicar</p>
                  <p className="text-xs text-gray-400 font-bold mt-1">Comprimidas automaticamente · máx. {maxImages}</p>
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => onPickFiles(e.target.files)} />
                </label>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {previews.length < maxImages && (
                    <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-brand-blue text-gray-400">
                      <ImagePlus className="w-5 h-5 mb-1" />
                      <span className="text-[9px] font-black uppercase">Adicionar</span>
                      <input type="file" accept="image/*" multiple hidden onChange={(e) => onPickFiles(e.target.files)} />
                    </label>
                  )}
                </div>
              )}

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Conte o que você está compartilhando..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 resize-none"
              />

              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-full px-4">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={120}
                  placeholder="Localização (opcional)"
                  className="flex-1 bg-transparent py-2.5 text-sm font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-50">
              <button
                onClick={handlePublish}
                disabled={uploading || publishing || files.length === 0}
                className="w-full bg-brand-orange text-white py-3 rounded-2xl font-black hover:bg-brand-lightOrange shadow-lg shadow-orange-200 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Comprimindo e enviando imagens...
                  </>
                ) : publishing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Publicando...
                  </>
                ) : (
                  <>Publicar agora</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostComposer;