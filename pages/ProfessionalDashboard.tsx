
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ProfessionalProfile } from '../types';
import { supabase } from '../lib/supabase';
import { compressImage, getStoragePath } from '../lib/imageUtils';
import {
  Users,
  CheckCircle,
  TrendingUp,
  Coins,
  ArrowRight,
  Star,
  Camera,
  User as UserIcon,
  MapPin,
  Briefcase,
  Clock,
  Save,
  Info,
  Loader2,
  PlusCircle,
  X,
  Phone,
  FileText,
  Layout,
  CheckCircle2
} from 'lucide-react';

interface ProfessionalDashboardProps {
  user: User;
  profile: ProfessionalProfile | null;
  onUpdateProfile: (p: ProfessionalProfile) => Promise<void>;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ user, profile, onUpdateProfile }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: profile?.name || user.name || '',
    phone: profile?.phone || '',
    description: profile?.description || '',
    region: profile?.region || '',
    document: profile?.document || '',
    avatar: profile?.avatar || user.avatar || '',
    cep: profile?.cep || '',
    address: profile?.address || '',
    number: profile?.number || '',
    complement: profile?.complement || '',
    neighborhood: profile?.neighborhood || '',
    city: profile?.city || '',
    state: profile?.state || '',
    profession: profile?.profession || '',
    experience: profile?.experience || ''
  });

  const [portfolio, setPortfolio] = useState<string[]>(profile?.portfolioUrls || []);

  // Sincroniza estado quando o profile carregar no App.tsx
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || user.name || '',
        phone: profile.phone || '',
        description: profile.description || '',
        region: profile.region || '',
        document: profile.document || '',
        avatar: profile.avatar || user.avatar || '',
        cep: profile.cep || '',
        address: profile.address || '',
        number: profile.number || '',
        complement: profile.complement || '',
        neighborhood: profile.neighborhood || '',
        city: profile.city || '',
        state: profile.state || '',
        profession: profile.profession || '',
        experience: profile.experience || ''
      });
      setPortfolio(profile.portfolioUrls || []);
    }
  }, [profile, user]);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
    const formatted = val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val;
    setFormData(prev => ({ ...prev, cep: formatted }));

    if (val.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${val}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const compressed = await compressImage(file);
      const path = getStoragePath('avatars', user.id, file.name);

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, compressed);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      setFormData(prev => ({ ...prev, avatar: publicUrl }));
    } catch (err) {
      console.error(err);
      alert("Erro ao subir imagem.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePortfolioUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPortfolioUploading(index);
    try {
      const compressed = await compressImage(file);
      const path = getStoragePath('portfolio', user.id, file.name);

      const { error } = await supabase.storage
        .from('portfolio')
        .upload(path, compressed);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(path);

      const newPortfolio = [...portfolio];
      newPortfolio[index] = publicUrl;
      setPortfolio(newPortfolio);
    } catch (err) {
      console.error(err);
      alert("Erro ao subir imagem de portfólio.");
    } finally {
      setPortfolioUploading(null);
    }
  };

  const removePortfolioImage = (index: number) => {
    const newPortfolio = portfolio.filter((_, i) => i !== index);
    setPortfolio(newPortfolio);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const updatedProfile: ProfessionalProfile = {
        ...profile!,
        userId: user.id,
        name: formData.name,
        phone: formData.phone,
        description: formData.description,
        region: formData.region,
        avatar: formData.avatar,
        portfolioUrls: portfolio,
        cep: formData.cep,
        address: formData.address,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        profession: formData.profession,
        experience: formData.experience
      };

      await onUpdateProfile(updatedProfile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err);
      alert(`Erro: ${err.message || 'Houve um problema ao salvar seu perfil.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Olá, {user.name}</h1>
          <p className="text-lg text-gray-500 font-bold">Este é o resumo da sua atividade na Samej.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/profissional/leads"
            className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 flex items-center transition-all active:scale-95"
          >
            Procurar Pedidos
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border-2 border-gray-50 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Coins className="w-8 h-8" />
            </div>
            <span className="text-xs font-black text-green-500 bg-green-50 px-3 py-1 rounded-full uppercase tracking-tighter">+10%</span>
          </div>
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Saldo de Créditos</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{profile?.credits || 0}</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border-2 border-gray-50 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Leads Comprados</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{profile?.completedJobs || 0}</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border-2 border-gray-50 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Star className="w-8 h-8" />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Avaliação Média</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{profile?.rating || '5.0'} <span className="text-lg text-gray-300">/ 5.0</span></p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border-2 border-gray-50 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Pedidos Disponíveis</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">124</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Profile Form */}
          <div className="bg-white p-10 rounded-[2.5rem] border-2 border-gray-50 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Concluir meu Perfil</h3>
              <div
                className="flex items-center text-blue-700 bg-blue-50 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-blue-400 animate-pulse shadow-md"
                style={{ textShadow: '1px 1px 0px rgba(59, 130, 246, 0.2)' }}
              >
                <Info className="w-5 h-5 mr-3 text-blue-500" />
                complete o seu perfil para você receber orçamentos especificos
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-10">
              {/* Photo Upload Section */}
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-white overflow-hidden border-4 border-white shadow-xl transition-transform group-hover:scale-105">
                    <img
                      src={formData.avatar || `https://picsum.photos/seed/${user.id}/200`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-brand-blue text-white p-3 rounded-2xl shadow-xl hover:bg-blue-700 transition-all border-4 border-white cursor-pointer">
                    <Camera className="w-5 h-5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </div>
                <div>
                  <h4 className="font-black text-gray-900 uppercase text-sm tracking-tight mb-1">Foto de Perfil</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sua imagem comercial é o seu primeiro contato.</p>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Comercial / Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-bold text-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Telefone WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-bold text-gray-700"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">CPF ou CNPJ</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.document}
                      readOnly
                      className="w-full pl-12 pr-4 py-4 bg-gray-100 border-2 border-transparent rounded-2xl outline-none font-bold text-gray-400 italic cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 flex items-center"><FileText className="w-3 h-3 mr-1" /> Documento não pode ser alterado pelo painel para sua segurança.</p>
                </div>
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Descrição dos Serviços (Bio)</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Conte sobre sua experiência, especialidades e garantias..."
                  className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-brand-blue focus:bg-white transition-all font-bold text-gray-700 resize-none"
                />
              </div>

              {/* Address Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">CEP</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-bold text-gray-700"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Profissão</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.profession}
                      onChange={e => setFormData({ ...formData, profession: e.target.value })}
                      placeholder="Ex: Pintor, Eletricista..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-bold text-gray-700"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Endereço</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Nome da rua / Avenida"
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-bold text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Número</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                    placeholder="Nº"
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-bold text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tempo de Experiência</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.experience}
                      onChange={e => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="Ex: 5 anos"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-bold text-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Bairro</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Nome do bairro"
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-bold text-gray-700"
                  />
                </div>
              </div>

              {/* Portfolio Section */}
              <div className="pt-10 border-t border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center">
                      <Layout className="w-5 h-5 mr-3 text-brand-blue" />
                      Portfólio de Serviços
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Até 6 fotos. Mostre o seu melhor trabalho.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="relative aspect-square rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden group/img">
                      {portfolio[i] ? (
                        <>
                          <img src={portfolio[i]} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                          <button
                            type="button"
                            onClick={() => removePortfolioImage(i)}
                            className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                          {portfolioUploading === i ? (
                            <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
                          ) : (
                            <>
                              <PlusCircle className="w-8 h-8 text-gray-300 mb-2 group-hover/img:text-brand-blue transition-colors" />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adicionar</span>
                            </>
                          )}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handlePortfolioUpload(i, e)}
                            disabled={portfolioUploading !== null}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-10 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center text-sm font-black text-green-600">
                  {saved && (
                    <span className="flex items-center animate-in fade-in slide-in-from-left-4">
                      <CheckCircle2 className="w-6 h-6 mr-2" /> Alterações salvas com sucesso!
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gray-900 text-white px-16 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-black shadow-2xl transition-all active:scale-95 flex items-center disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                  ) : (
                    <Save className="w-5 h-5 mr-4" />
                  )}
                  GUARDAR ALTERAÇÕES NO PERFIL
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Side Column */}
        <div className="bg-white p-10 rounded-[2.5rem] border-2 border-gray-50 shadow-sm h-fit">
          <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-8">Últimos Contactos</h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 cursor-pointer group/item">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl mr-4 flex items-center justify-center font-black text-gray-400 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all shadow-inner">
                    C{i}
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">Cliente Exemplo {i}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ontem às 14:20</p>
                  </div>
                </div>
                <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-blue-100">Pintura</div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 text-xs font-black text-gray-400 hover:text-blue-600 py-6 uppercase tracking-[0.2em] border-2 border-dashed border-gray-100 rounded-[2rem] hover:border-blue-200 hover:bg-blue-50/30 transition-all font-black">
            Ver todo o histórico
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
