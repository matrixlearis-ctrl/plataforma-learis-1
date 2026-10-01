import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, BadgeCheck, Briefcase, Building2, Users, Clock, Image as ImageIcon,
  MapPin, ShieldCheck, GraduationCap, Fingerprint, Globe, Pencil,
  Camera, Loader2, ImagePlus, SlidersHorizontal, Trash2, X, ChevronDown, Upload, ChevronRight,
} from 'lucide-react';
import { SocialPost, User as AppUser, UserRole, ProfileExtended, SocialProfileSummary } from '../types';
import { supabase } from '../lib/supabase';
import {
  getProfilePosts, getFollowersCount, getFollowingCount, isFollowing, toggleFollow,
  getFollowers, getFollowing,
} from '../lib/social';
import { getProfileExtended } from '../lib/discovery';
import { uploadPostImage, deleteMedia } from '../lib/uploads';
import { compressImage } from '../lib/imageUtils';
import { roleLabel, roleBadgeClass, joinLocation, formatCount, formatRelative } from '../lib/format';
import PostCard from '../components/PostCard';
import PostComposer from '../components/PostComposer';
import Avatar from '../components/Avatar';

interface SocialProfileProps {
  user: AppUser | null;
}

const clampPosition = (n: number): number => Math.min(100, Math.max(0, n));

const parsePosition = (s?: string): { x: number; y: number } => {
  const m = String(s || '50% 50%').match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  return m
    ? { x: clampPosition(parseFloat(m[1])), y: clampPosition(parseFloat(m[2])) }
    : { x: 50, y: 50 };
};

const formatPosition = (p: { x: number; y: number }): string => `${Math.round(p.x)}% ${Math.round(p.y)}%`;

const SocialProfile: React.FC<SocialProfileProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const meId = user?.id ?? null;

  const [ext, setExt] = useState<ProfileExtended | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [amFollowing, setAmFollowing] = useState(false);
  const [myActive, setMyActive] = useState<boolean | null>(null);
  const [myComplete, setMyComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followBusy, setFollowBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [repositionOpen, setRepositionOpen] = useState(false);
  const [draftPos, setDraftPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [savingReposition, setSavingReposition] = useState(false);
  const [confirmDeleteCover, setConfirmDeleteCover] = useState(false);
  const [deletingCover, setDeletingCover] = useState(false);
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);
  const [statsModal, setStatsModal] = useState<'posts' | 'followers' | 'following' | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [followersList, setFollowersList] = useState<SocialProfileSummary[]>([]);
  const [followingList, setFollowingList] = useState<SocialProfileSummary[]>([]);
  const dragRef = useRef<{ startX: number; startY: number; pos: { x: number; y: number } } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const [extData, postsData, f, g, followingMe] = await Promise.all([
          getProfileExtended(id),
          getProfilePosts(id, meId),
          getFollowersCount(id),
          getFollowingCount(id),
          meId ? isFollowing(meId, id) : Promise.resolve(false),
        ]);
        if (!mounted) return;
        if (!extData) throw new Error('Perfil não encontrado.');
        setExt(extData);
        setPosts(postsData);
        setFollowers(f);
        setFollowing(g);
        setAmFollowing(followingMe);

        if (meId && meId === id) {
          const role = extData.profile.role;
          if (role === 'PROFESSIONAL' || role === 'COMPANY') {
            const table = role === 'PROFESSIONAL' ? 'professional_profiles' : 'company_profiles';
            const { data: spec } = await supabase.from(table).select('active, profile_complete').eq('profile_id', meId).maybeSingle();
            if (spec) { setMyActive(spec.active); setMyComplete(spec.profile_complete); }
          } else {
            const { data: spec } = await supabase.from('profiles').select('publishing_approved').eq('id', meId).maybeSingle();
            if (spec) { setMyActive(!!spec.publishing_approved); setMyComplete(null); }
          }
        }
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e?.message || 'Não foi possível carregar o perfil.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [id, meId, reloadTick]);

  const handleFollow = async () => {
    if (!meId || !id || followBusy) return;
    setFollowBusy(true);
    try {
      const nowFollowing = await toggleFollow(meId, id);
      setAmFollowing(nowFollowing);
      setFollowers((c) => Math.max(0, c + (nowFollowing ? 1 : -1)));
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Não foi possível seguir.');
    } finally {
      setFollowBusy(false);
    }
  };

  const refreshExt = async () => {
    if (!id) return;
    const fresh = await getProfileExtended(id);
    if (fresh) setExt(fresh);
  };

  const flashPhotoError = (msg: string) => {
    setPhotoMsg(msg);
    setTimeout(() => setPhotoMsg(''), 6000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !meId) return;
    setUploadingAvatar(true);
    try {
      const compressed = await compressImage(file);
      const uploaded = await uploadPostImage(compressed, `${meId}/avatar-${Date.now()}.jpg`);
      await supabase.from('profiles').update({ avatar_url: uploaded.url }).eq('id', meId);
      await refreshExt();
      void supabase.auth.updateUser({ data: { avatar_ts: Date.now() } }).catch(() => {});
    } catch (e: any) {
      console.error(e);
      flashPhotoError(e?.message || 'Não foi possível atualizar a foto de perfil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !meId) return;
    setUploadingCover(true);
    try {
      const compressed = await compressImage(file);
      const uploaded = await uploadPostImage(compressed, `${meId}/cover-${Date.now()}.jpg`);
      await supabase.from('profiles').update({ cover_url: uploaded.url }).eq('id', meId);
      await refreshExt();
      void supabase.auth.updateUser({ data: { avatar_ts: Date.now() } }).catch(() => {});
    } catch (e: any) {
      console.error(e);
      flashPhotoError(e?.message || 'Não foi possível atualizar a foto de capa.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCoverDelete = async () => {
    if (!meId || !profile?.cover_url) return;
    if (!confirmDeleteCover) {
      setConfirmDeleteCover(true);
      setTimeout(() => setConfirmDeleteCover(false), 6000);
      return;
    }
    setDeletingCover(true);
    try {
      await deleteMedia(profile.cover_url).catch(() => {});
      await supabase.from('profiles').update({ cover_url: null }).eq('id', meId);
      setConfirmDeleteCover(false);
      setCoverMenuOpen(false);
      await refreshExt();
    } catch (e: any) {
      console.error(e);
      flashPhotoError(e?.message || 'Não foi possível excluir a capa.');
    } finally {
      setDeletingCover(false);
    }
  };

  const openReposition = () => {
    setDraftPos(parsePosition(profile?.cover_position));
    setRepositionOpen(true);
  };

  const onCoverPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, pos: { ...draftPos } };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onCoverPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dx = ((e.clientX - d.startX) / rect.width) * 100;
    const dy = ((e.clientY - d.startY) / rect.height) * 100;
    setDraftPos({ x: clampPosition(d.pos.x + dx), y: clampPosition(d.pos.y + dy) });
  };

  const onCoverPointerEnd = () => {
    dragRef.current = null;
  };

  const saveReposition = async () => {
    if (!meId) return;
    setSavingReposition(true);
    try {
      await supabase.from('profiles').update({ cover_position: formatPosition(draftPos) }).eq('id', meId);
      await refreshExt();
      setRepositionOpen(false);
    } catch (e: any) {
      console.error(e);
      flashPhotoError(e?.message || 'Não foi possível salvar a posição da capa.');
    } finally {
      setSavingReposition(false);
    }
  };

  const openStats = async (kind: 'posts' | 'followers' | 'following') => {
    if (!id) return;
    setStatsModal(kind);
    setStatsLoading(true);
    setStatsError('');
    try {
      if (kind === 'followers') {
        setFollowersList(await getFollowers(id));
      } else if (kind === 'following') {
        setFollowingList(await getFollowing(id));
      }
    } catch (e: any) {
      console.error(e);
      setStatsError('Não foi possível carregar.');
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 font-bold">Carregando perfil...</p>
      </div>
    );
  }

  if (error || !ext) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-black text-gray-700 mb-3">Perfil não encontrado.</p>
        <Link to="/feed" className="text-brand-orange font-black">Voltar ao feed</Link>
      </div>
    );
  }

  const profile = ext.profile;
  const name = profile.full_name || profile.username || 'Usuário Samej';
  const isMe = meId === id;
  const isPro = profile.role === UserRole.PROFESSIONAL;
  const isCompany = profile.role === UserRole.COMPANY;
  const bizProfile = ext.professional || ext.company;
  const location = joinLocation(profile.city || bizProfile?.city, profile.state || bizProfile?.state);
  const bio = profile.description || bizProfile?.description;
  const roleEnglish = profile.role as string;
  const coverPos = profile.cover_position || '50% 50%';

  return (
    <div className="space-y-4">
      <Link to="/feed" className="inline-flex items-center text-gray-500 hover:text-brand-blue font-bold text-sm transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar ao feed
      </Link>

      {photoMsg && (
        <div className="p-3 text-xs font-bold text-red-600 bg-red-50 rounded-xl border border-red-100">{photoMsg}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="relative group">
        <div className="h-40 md:h-52 bg-gradient-to-br from-brand-blue to-brand-darkBlue relative overflow-hidden">
          {profile.cover_url ? (
            <img src={profile.cover_url} alt="" className="w-full h-full object-cover" style={{ objectPosition: coverPos }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Briefcase className="w-16 h-16 text-white/20" />
            </div>
          )}
        </div>
        {isMe && (
          <div className="absolute bottom-3 right-3">
            {profile.cover_url ? (
              <div className="relative">
                <button
                  onClick={() => setCoverMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 bg-black/50 hover:bg-black/60 text-white px-4 py-2 rounded-full text-xs font-black cursor-pointer backdrop-blur transition-colors"
                >
                  {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {uploadingCover ? 'Enviando...' : 'Editar foto de capa'}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${coverMenuOpen ? '-rotate-180' : ''}`} />
                </button>

                {coverMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setCoverMenuOpen(false)} />
                    <div className="absolute bottom-full right-0 mb-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-20">
                      <button
                        onClick={() => { setCoverMenuOpen(false); openReposition(); }}
                        className="flex items-center w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <SlidersHorizontal className="w-4 h-4 mr-2 text-brand-blue flex-shrink-0" /> Reposicionar
                      </button>
                      <label className="flex items-center w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4 mr-2 text-brand-blue flex-shrink-0" /> Carregar outra foto
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => { setCoverMenuOpen(false); handleCoverUpload(e); }}
                          disabled={uploadingCover}
                        />
                      </label>
                      {deletingCover ? (
                        <span className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-600">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" /> Excluindo...
                        </span>
                      ) : (
                        <button
                          onClick={handleCoverDelete}
                          className={`flex items-center w-full px-4 py-3 text-left text-sm font-bold transition-colors ${confirmDeleteCover ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" /> {confirmDeleteCover ? 'Tem certeza?' : 'Excluir'}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <label className="flex items-center gap-1.5 bg-black/50 hover:bg-black/60 text-white px-4 py-2 rounded-full text-xs font-black cursor-pointer backdrop-blur transition-colors">
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {uploadingCover ? 'Enviando...' : 'Adicionar foto de capa'}
                <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover} />
              </label>
            )}
          </div>
        )}
        {isMe && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center px-3 py-1.5 bg-black/40 text-white text-[10px] font-black rounded-full backdrop-blur">
            Capa ideal: 820 × 360 px
          </span>
        )}
      </div>

        <div className="px-5 pb-5">
          <div className="flex flex-col md:flex-row md:items-end -mt-14 gap-4">
            <div className="flex-shrink-0 relative">
              <Avatar
                src={profile.avatar_url}
                alt={name}
                size={116}
                verified={profile.verified}
                className="ring-8 ring-white"
              />
              {isMe && (
                <label className="absolute -right-1 bottom-1 z-10 bg-white text-brand-blue rounded-full p-2 shadow-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              )}
            </div>

            <div className="flex-1 md:pb-1 min-w-0">
              <h1 className="text-lg font-black text-gray-900 flex items-start flex-wrap gap-2">
                <span className="break-words">{name}</span>
                {profile.verified && <BadgeCheck className="w-5 h-5 text-brand-blue flex-shrink-0" />}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${roleBadgeClass(roleEnglish)}`}>
                  {isCompany ? <Building2 className="w-3.5 h-3.5 mr-1.5" /> : isPro ? <Briefcase className="w-3.5 h-3.5 mr-1.5" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />}
                  {roleLabel(roleEnglish)}
                </span>
                {bizProfile && (
                  <span className="inline-flex items-center text-xs font-black text-gray-500">
                    <Briefcase className="w-3.5 h-3.5 mr-1" /> {(ext.professional?.profession || profile.profession) || ext.company?.companyName}
                  </span>
                )}
                {(profile.city || profile.state || location) && (
                  <span className="inline-flex items-center text-xs font-black text-gray-500">
                    <MapPin className="w-3.5 h-3.5 mr-1" /> {location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 md:pb-1 flex-wrap">
              {isMe ? (
                <Link
                  to="/configuracoes"
                  className="flex items-center bg-gray-100 text-gray-700 px-5 py-2.5 rounded-full font-black text-sm hover:bg-gray-200 transition-colors"
                >
                  <Pencil className="w-4 h-4 mr-2" /> Editar perfil
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={followBusy}
                    className={`px-6 py-2.5 rounded-full font-black text-sm transition-all active:scale-95 disabled:opacity-60 ${
                      amFollowing
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-brand-blue text-white hover:bg-brand-darkBlue shadow-lg'
                    }`}
                  >
                    {amFollowing ? 'Seguindo' : 'Seguir'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-6 mt-5">
            <button
              onClick={() => void openStats('posts')}
              className="font-black text-sm text-gray-700 text-left hover:text-brand-blue transition-colors"
              title="Ver publicações"
            >
              {formatCount(posts.length)} <span className="text-gray-400 font-bold">publica{posts.length === 1 ? 'ção' : 'ções'}</span>
            </button>
            <button
              onClick={() => void openStats('followers')}
              className="font-black text-sm text-gray-700 text-left hover:text-brand-blue transition-colors"
              title="Ver seguidores"
            >
              <Users className="w-4 h-4 inline mr-1 text-brand-blue" />
              {formatCount(followers)} <span className="text-gray-400 font-bold">seguidores</span>
            </button>
            <button
              onClick={() => void openStats('following')}
              className="font-black text-sm text-gray-700 text-left hover:text-brand-blue transition-colors"
              title="Ver seguindo"
            >
              {formatCount(following)} <span className="text-gray-400 font-bold">seguindo</span>
            </button>
          </div>

          {profile.created_at && (
            <p className="flex items-center text-xs text-gray-400 font-bold mt-3">
              <Clock className="w-3.5 h-3.5 mr-1.5" /> No Samej desde {new Date(profile.created_at).getFullYear()}
            </p>
          )}

          {isMe && (isPro || isCompany || profile.role === 'USER' || profile.role === 'CLIENT') ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/publicar"
                className="flex items-center bg-brand-orange text-white px-5 py-2 rounded-full font-black text-sm hover:bg-brand-lightOrange shadow-lg shadow-orange-200 active:scale-95 transition-all"
              >
                <ImagePlus className="w-4 h-4 mr-2" /> Publicar
              </Link>
              {(myActive !== null) && (
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${myActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                  {myActive ? 'Aprovado para publicar' : 'Aguardando aprovação'}
                </span>
              )}
              {myComplete !== null && (
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${myComplete ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                  {myComplete ? 'Perfil completo' : 'Perfil incompleto'}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {(bio || ext.professional || ext.company || ext.categories.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-black text-brand-darkBlue mb-3">Sobre</h2>

          {bio && <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{bio}</p>}

          {ext.professional && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(ext.professional.experienceYears != null || ext.professional.formation) && (
                <p className="flex items-start text-sm font-bold text-gray-600">
                  <Fingerprint className="w-4 h-4 mr-2 text-brand-orange mt-0.5 flex-shrink-0" />
                  <span>
                    {ext.professional.experienceYears != null && `${ext.professional.experienceYears} ano(s) de experiência`}
                    {ext.professional.experienceYears != null && ext.professional.formation && ' · '}
                    {ext.professional.formation && `Formação: ${ext.professional.formation}`}
                  </span>
                </p>
              )}
              {ext.professional.specialties && ext.professional.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ext.professional.specialties.slice(0, 8).map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-xs font-bold text-gray-600">
                      #{s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {ext.company && (
            <div className="text-sm text-gray-700 leading-relaxed space-y-1.5">
              {ext.company.website && (
                <a href={ext.company.website} target="_blank" rel="noreferrer" className="flex items-center text-brand-blue font-bold hover:underline">
                  <Globe className="w-4 h-4 mr-2" /> {ext.company.website}
                </a>
              )}
              {ext.profile.profession && (
                <p className="flex items-center font-bold text-gray-600">
                  <GraduationCap className="w-4 h-4 mr-2 text-brand-orange" /> {ext.profile.profession}
                </p>
              )}
            </div>
          )}

          {ext.categories.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Categorias</p>
              <div className="flex flex-wrap gap-1.5">
                {ext.categories.map((c) => (
                  <span key={c.id} className="px-3 py-1 bg-brand-blue/5 border border-brand-blue/10 rounded-full text-xs font-bold text-brand-blue">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <section>
        <h2 className="text-base font-black text-brand-darkBlue flex items-center mb-3">
          <ImageIcon className="w-4 h-4 mr-2 text-brand-orange" /> Publicações
          <span className="ml-auto text-xs text-gray-400 font-black">{posts.length}</span>
        </h2>

        {isMe && (
          <div className="mb-4">
            <PostComposer user={user} onPublished={() => setReloadTick((t) => t + 1)} />
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 font-bold">
            {isMe ? 'Você ainda não possui publicações.' : 'Ainda não há publicações deste perfil.'}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} meId={meId} />
            ))}
          </div>
        )}
      </section>

      {statsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setStatsModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-brand-darkBlue">
                {statsModal === 'posts' ? 'Publicações' : statsModal === 'followers' ? 'Seguidores' : 'Seguindo'}
              </h3>
              <button
                onClick={() => setStatsModal(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statsLoading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : statsError ? (
              <p className="py-8 text-center text-sm font-bold text-red-600">{statsError}</p>
            ) : statsModal === 'posts' ? (
              posts.length === 0 ? (
                <p className="py-8 text-center text-sm font-bold text-gray-400">Nenhuma publicação ainda.</p>
              ) : (
                <div className="max-h-[50vh] overflow-y-auto space-y-2">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/post/${post.id}`}
                      onClick={() => setStatsModal(null)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {post.media[0]?.url ? (
                          <img src={post.media[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Camera className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-800 truncate">{post.caption || 'Sem descrição'}</p>
                        <p className="text-xs text-gray-400 font-bold">
                          {formatRelative(post.createdAt)} · {post.media.length} {post.media.length === 1 ? 'mídia' : 'mídias'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )
            ) : (
              (() => {
                const list = statsModal === 'followers' ? followersList : followingList;
                return list.length === 0 ? (
                  <p className="py-8 text-center text-sm font-bold text-gray-400">
                    {statsModal === 'followers' ? 'Ninguém segue este perfil ainda.' : 'Este perfil não segue ninguém ainda.'}
                  </p>
                ) : (
                  <div className="max-h-[50vh] overflow-y-auto space-y-1">
                    {list.map((p) => (
                      <Link
                        key={p.id}
                        to={`/social/${p.id}`}
                        onClick={() => setStatsModal(null)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <Avatar src={p.avatar_url} alt={p.full_name || p.username || ''} size={40} verified={p.verified} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-800 truncate">{p.full_name || p.username || 'Usuário'}</p>
                          <p className="text-xs font-bold text-gray-400">{roleLabel(p.role)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {repositionOpen && profile.cover_url && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRepositionOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-brand-darkBlue">Reposicionar capa</h3>
              <button
                onClick={() => setRepositionOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="relative w-full h-40 md:h-52 overflow-hidden rounded-xl border border-gray-200 touch-none cursor-grab active:cursor-grabbing select-none"
              onPointerDown={onCoverPointerDown}
              onPointerMove={onCoverPointerMove}
              onPointerUp={onCoverPointerEnd}
              onPointerCancel={onCoverPointerEnd}
            >
              <img
                src={profile.cover_url}
                alt=""
                draggable={false}
                className="w-full h-full object-cover pointer-events-none"
                style={{ objectPosition: formatPosition(draftPos) }}
              />
              <div className="absolute inset-x-0 bottom-0 text-center text-[10px] font-black text-white bg-black/40 py-1">
                Arraste a imagem para escolher o enquadramento
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setRepositionOpen(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full font-black text-sm hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveReposition}
                disabled={savingReposition}
                className="flex items-center bg-brand-orange text-white px-5 py-2.5 rounded-full font-black text-sm hover:bg-brand-lightOrange shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-60"
              >
                {savingReposition ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {savingReposition ? 'Salvando...' : 'Salvar posição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialProfile;