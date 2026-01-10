
import React from 'react';
import { User, UserRole, ProfessionalProfile } from '../types';
import { Camera, Shield, Bell, CreditCard, ExternalLink } from 'lucide-react';

interface ProfileSettingsProps {
  user: User;
  profile: ProfessionalProfile | null;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, profile }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações da Conta</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl flex items-center">
            <Shield className="w-5 h-5 mr-3" />
            Perfil e Segurança
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-100 font-medium rounded-xl flex items-center">
            <Bell className="w-5 h-5 mr-3" />
            Notificações
          </button>
          {user.role === UserRole.PROFESSIONAL && (
            <button className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-100 font-medium rounded-xl flex items-center">
              <CreditCard className="w-5 h-5 mr-3" />
              Pagamentos
            </button>
          )}
        </aside>

        <main className="md:col-span-3 space-y-8">
          {/* Avatar and Basic Info */}
          <div className="bg-white p-8 rounded-2xl border shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg">
                  <img src={`https://picsum.photos/seed/${user.id}/200`} alt="Avatar" />
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-all">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-500">{user.email}</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                   <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase">{user.role}</span>
                   {user.role === UserRole.PROFESSIONAL && (
                     <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Verificado</span>
                   )}
                </div>
              </div>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Nome de Exibição</label>
                <input type="text" defaultValue={user.name} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">E-mail</label>
                <input type="email" defaultValue={user.email} disabled className="w-full p-3 border rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Telefone</label>
                <input type="tel" defaultValue={profile?.phone || ''} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              
              {user.role === UserRole.PROFESSIONAL && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Descrição da Empresa</label>
                    <textarea rows={4} defaultValue={profile?.description || ''} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Região de Atendimento</label>
                    <input type="text" defaultValue={profile?.region || ''} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </>
              )}

              <div className="md:col-span-2 pt-4 border-t mt-4 flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md">
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>

          {/* Connected Billing */}
          {user.role === UserRole.PROFESSIONAL && (
            <div className="bg-white p-8 rounded-2xl border shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Faturação e Pagamentos</h3>
                <p className="text-sm text-gray-500">Gerencie seus cartões e faturas através da nossa integração segura com a Stripe.</p>
              </div>
              <button className="flex items-center text-blue-600 font-bold hover:underline">
                Ir para o Portal Stripe
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
