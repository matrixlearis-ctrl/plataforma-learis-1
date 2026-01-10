import React, { useState } from 'react';
import { User, UserRole, ProfessionalProfile } from '../types';
import { Camera, Shield, Bell, CreditCard, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileSettingsProps {
  user: User;
  profile: ProfessionalProfile | null;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, profile }) => {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    phone: profile?.phone || '',
    description: profile?.description || '',
    region: profile?.region || ''
  });

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
          region: formData.region
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
          <button className="w-full text-left px-5 py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5 mr-3" />
            Perfil e Segurança
          </button>
          <button className="w-full text-left px-5 py-4 text-gray-500 hover:bg-white font-bold rounded-2xl flex items-center transition-all">
            <Bell className="w-5 h-5 mr-3" />
            Notificações
          </button>
          {user.role === UserRole.PROFESSIONAL && (
            <button className="w-full text-left px-5 py-4 text-gray-500 hover:bg-white font-bold rounded-2xl flex items-center transition-all">
              <CreditCard className="w-5 h-5 mr-3" />
              Pagamentos
            </button>
          )}
        </aside>

        <main className="md:col-span-3 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-10 mb-12 border-b pb-12 border-gray-50">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2rem] bg-gray-100 overflow-hidden border-4 border-white shadow-2xl transition-transform group-hover:scale-105">
                  <img src={user.avatar || `https://picsum.photos/seed/${user.id}/200`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <button className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-2xl shadow-xl hover:bg-blue-700 transition-all border-4 border-white">
                  <Camera className="w-5 h-5" />
                </button>
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
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-50 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Telefone WhatsApp</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
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
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Conte sobre sua experiência, especialidades e garantias..."
                      className="w-full p-4 bg-gray-50 border-2 border-gray-50 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium text-gray-900 resize-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Região Principal (Cidade/UF)</label>
                    <input 
                      type="text" 
                      value={formData.region} 
                      onChange={e => setFormData({...formData, region: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-50 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium text-gray-900" 
                    />
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

          {user.role === UserRole.PROFESSIONAL && (
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-black text-gray-900 mb-1 tracking-tight">Faturação Samej</h3>
                <p className="text-sm text-gray-500 font-medium">Gerencie seus pacotes de créditos e histórico de notas fiscais.</p>
              </div>
              <button className="flex items-center bg-gray-50 px-6 py-4 rounded-2xl font-black text-xs text-blue-600 hover:bg-blue-50 transition-all">
                ABRIR PORTAL STRIPE
                <ExternalLink className="ml-2 w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfileSettings;