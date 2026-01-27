import React, { useState } from 'react';
import { User, UserRole, ProfessionalProfile } from '../types';
import { supabase } from '../lib/supabase';
import { compressImage, getStoragePath } from '../lib/imageUtils';
import { Camera, Shield, Bell, CreditCard, ExternalLink, Loader2, CheckCircle2, FileText, X, PlusCircle } from 'lucide-react';

interface ProfileSettingsProps {
  user: User;
  profile: ProfessionalProfile | null;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, profile }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [portfolio, setPortfolio] = useState<string[]>(profile?.portfolioUrls || []);

  const [formData, setFormData] = useState({
    name: user.name,
    phone: profile?.phone || '',
    description: profile?.description || '',
    region: profile?.region || '',
    document: user.document || '',
    avatar: user.avatar || ''
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const compressed = await compressImage(file);
      const path = getStoragePath('avatars', user.id, file.name);

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, compressed);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Atualiza banco e estado
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setFormData(prev => ({ ...prev, avatar: publicUrl }));
      alert("Foto de perfil atualizada!");
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

      const { data, error } = await supabase.storage
        .from('portfolio')
        .upload(path, compressed);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(path);

      const newPortfolio = [...portfolio];
      newPortfolio[index] = publicUrl;

      // Atualiza banco
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ portfolio_urls: newPortfolio })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setPortfolio(newPortfolio);
    } catch (err) {
      console.error(err);
      alert("Erro ao subir imagem de portfólio.");
    } finally {
      setPortfolioUploading(null);
    }
  };

  const removePortfolioImage = async (index: number) => {
    const newPortfolio = portfolio.filter((_, i) => i !== index);
    try {
      await supabase.from('profiles').update({ portfolio_urls: newPortfolio }).eq('id', user.id);
      setPortfolio(newPortfolio);
    } catch (err) {
      alert("Erro ao remover imagem.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          phone: formData.phone,
          description: formData.description,
          region: formData.region,
          document: formData.document.replace(/\D/g, '')
        })
        .eq('id', user.id);

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tighter uppercase">Configurações</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-5 py-4 font-bold rounded-2xl flex items-center transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:bg-white'}`}
          >
            <Shield className="w-5 h-5 mr-3" />
            Perfil e Segurança
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-5 py-4 font-bold rounded-2xl flex items-center transition-all ${activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:bg-white'}`}
          >
            <Bell className="w-5 h-5 mr-3" />
            Notificações
          </button>
        </aside>

        <main className="md:col-span-3 space-y-8">
          {activeTab === 'profile' ? (
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-10 mb-12 border-b pb-12 border-gray-50">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2rem] bg-gray-100 overflow-hidden border-4 border-white shadow-2xl transition-transform group-hover:scale-105">
                    <img src={formData.avatar || `https://picsum.photos/seed/${user.id}/200`} alt="Avatar" className="w-full h-full object-cover" />
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-2xl shadow-xl hover:bg-blue-700 transition-all border-4 border-white cursor-pointer">
                    <Camera className="w-5 h-5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{user.name}</h2>
                  <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                    <span className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                    {user.role === UserRole.PROFESSIONAL && (
                      <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Conta Verificada</span>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Nome Comercial / Completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-50 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Telefone WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-50 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium text-gray-900"
                  />
                </div>

                {user.role === UserRole.PROFESSIONAL && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Descrição dos Serviços</label>
                      <textarea
                        rows={5}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Conte sobre sua experiência, especialidades e garantias..."
                        className="w-full p-4 bg-gray-50 border-2 border-gray-50 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium text-gray-900 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Região Principal (Cidade/UF)</label>
                      <input
                        type="text"
                        value={formData.region}
                        onChange={e => setFormData({ ...formData, region: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-2 border-gray-50 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">CPF ou CNPJ</label>
                      <input
                        type="text"
                        value={formData.document}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 11) {
                            setFormData({ ...formData, document: val.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14) });
                          } else {
                            setFormData({ ...formData, document: val.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18) });
                          }
                        }}
                        className="w-full p-4 bg-gray-100 border-2 border-transparent rounded-2xl outline-none font-medium text-gray-500 italic"
                        readOnly
                      />
                      <p className="text-[10px] text-gray-400 mt-2 flex items-center"><FileText className="w-3 h-3 mr-1" /> Documento não pode ser alterado pelo painel.</p>
                    </div>

                    <div className="md:col-span-2 pt-8 border-t border-gray-50">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-black text-gray-900 tracking-tight">Portfólio de Serviços</h3>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Até 6 fotos. Expira em 120 dias.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="relative aspect-square rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden group/img">
                            {portfolio[i] ? (
                              <>
                                <img src={portfolio[i]} className="w-full h-full object-cover transition-transform group-hover/img:scale-105" />
                                <button
                                  onClick={() => removePortfolioImage(i)}
                                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                                {portfolioUploading === i ? (
                                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                ) : (
                                  <>
                                    <PlusCircle className="w-6 h-6 text-gray-300 mb-2" />
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
                  </>
                )}

                <div className="md:col-span-2 pt-8 border-t border-gray-50 mt-4 flex items-center justify-between">
                  <div className="flex items-center text-sm font-bold text-green-600 transition-opacity">
                    {saved && (
                      <span className="flex items-center animate-in fade-in slide-in-from-left-2">
                        <CheckCircle2 className="w-5 h-5 mr-2" /> Dados salvos!
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-black shadow-xl transition-all active:scale-95 flex items-center disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'GUARDAR ALTERAÇÕES'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Configurações de Notificação</h3>
                <p className="text-gray-500 font-medium">Veja como você será avisado sobre novas oportunidades.</p>
              </div>

              <div className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-start gap-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-black text-brand-darkBlue uppercase text-sm tracking-wider mb-2">Avisos em Tempo Real</h4>
                  <p className="text-gray-600 text-sm leading-relaxed font-bold">
                    Como padrão da plataforma, você receberá notificações automáticas sempre que um novo pedido de orçamento for feito na sua cidade: <span className="text-blue-600">{formData.region || 'Sua Região'}</span>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-black">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-gray-900 font-bold">Notificações por E-mail</p>
                  </div>
                </div>
                <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-black">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-gray-900 font-bold">Alertas no Painel</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center">
                  <Shield className="w-4 h-4 mr-2" /> Sua segurança e agilidade são nossa prioridade.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfileSettings;