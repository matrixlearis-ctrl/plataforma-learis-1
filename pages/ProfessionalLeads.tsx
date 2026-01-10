
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProfessionalProfile, OrderRequest, User } from '../types';
import { CATEGORIES } from '../constants';
import { MapPin, Clock, Lock, Unlock, Phone, Mail, Coins, User as UserIcon, AlignLeft, PlusCircle, AlertCircle } from 'lucide-react';

interface ProfessionalLeadsProps {
  user: User;
  profile: ProfessionalProfile | null;
  orders: OrderRequest[];
  onUpdateProfile: (profile: ProfessionalProfile) => void;
  onUpdateOrder: (order: OrderRequest) => void;
}

const ProfessionalLeads: React.FC<ProfessionalLeadsProps> = ({ user, profile, orders, onUpdateProfile, onUpdateOrder }) => {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const buyLead = (order: OrderRequest) => {
    if (!profile) return;
    if (profile.credits < order.leadPrice) {
      alert("Saldo de créditos insuficiente! Por favor, recarregue sua conta.");
      return;
    }

    if (confirm(`Deseja desbloquear este contacto por ${order.leadPrice} créditos?`)) {
      setPurchasingId(order.id);
      
      setTimeout(() => {
        const newProfile = {
          ...profile,
          credits: profile.credits - order.leadPrice,
          completedJobs: (profile.completedJobs || 0) + 1
        };
        onUpdateProfile(newProfile);
        
        const updatedOrder = {
          ...order,
          unlockedBy: [...order.unlockedBy, profile.userId]
        };
        onUpdateOrder(updatedOrder);
        setPurchasingId(null);
      }, 800);
    }
  };

  const isUnlocked = (order: OrderRequest) => order.unlockedBy.includes(profile?.userId || '');

  const getDeadlineLabel = (deadline: string) => {
    switch (deadline) {
      case 'imediato': 
      case 'urgente': return 'Imediato';
      case '15_dias':
      case 'proximos_15_dias': return 'em 15 dias';
      case 'um_mes':
      case 'proximo_mes': return 'em um mês';
      case 'mais_3_meses':
      case 'planejando': return 'mais de 3 meses';
      default: return deadline || 'Não especificado';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mercado de Leads</h1>
          <p className="text-gray-500">Pedidos disponíveis na sua região</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border shadow-sm text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase">Meus Créditos</p>
            <p className="text-xl font-bold text-amber-600 leading-none">{profile?.credits || 0}</p>
          </div>
          <Link 
            to="/profissional/recarregar"
            className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center transition-all text-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Recarregar
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed text-gray-400">Nenhum pedido disponível no momento.</div>
        ) : (
          orders.map(order => {
            const unlocked = isUnlocked(order);
            const categoryObj = CATEGORIES.find(c => c.id === order.category);
            
            return (
              <div key={order.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${unlocked ? 'border-green-300 ring-4 ring-green-50' : 'hover:border-blue-300 shadow-md'}`}>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4">
                        {categoryObj?.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">Tipo de Serviço</span>
                        <h3 className="text-lg font-bold text-gray-900 uppercase leading-none mt-1">{categoryObj?.name || 'Serviço'}</h3>
                      </div>
                    </div>
                    {unlocked && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Desbloqueado</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Cliente</p>
                        <p className="font-bold text-gray-900">{order.clientName}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Cidade</p>
                        <p className="font-bold text-gray-900">{order.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                        <MapPin className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Bairro</p>
                        <p className="font-bold text-gray-900">{order.neighborhood || 'Não informado'}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Tempo para Execução</p>
                        <p className="font-bold text-gray-900">{getDeadlineLabel(order.deadline)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center mb-3 text-gray-400">
                      <AlignLeft className="w-4 h-4 mr-2" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Descrição do Serviço</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {order.description}
                    </p>
                  </div>

                  {unlocked ? (
                    <div className="pt-6 border-t animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-6 flex items-start">
                        <AlertCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-green-800 font-medium">Este lead estará disponível para consulta nesta conta por 6 meses.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a href="tel:+55119999999" className="flex-1 flex items-center justify-center bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all">
                          <Phone className="w-5 h-5 mr-2" /> Ligar para Cliente
                        </a>
                        <a href="mailto:contato@exemplo.com" className="flex-1 flex items-center justify-center bg-white border-2 border-blue-600 text-blue-600 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all">
                          <Mail className="w-5 h-5 mr-2" /> Enviar E-mail
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-6 border-t mt-2">
                      <div className="flex items-center bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                        <Coins className="w-5 h-5 text-amber-600 mr-2" />
                        <span className="text-xl font-extrabold text-amber-600 leading-none">{order.leadPrice}</span>
                        <span className="text-[10px] ml-2 text-amber-500 uppercase font-bold">Créditos</span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button 
                          onClick={() => buyLead(order)} 
                          disabled={purchasingId === order.id}
                          className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 flex items-center transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                          {purchasingId === order.id ? 'A processar...' : 'Ver Contactos'}
                          <Lock className="ml-3 w-5 h-5" />
                        </button>
                        <p className="text-[10px] text-gray-400 italic">Desbloqueio válido por 6 meses</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-12 p-8 bg-blue-900 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="mb-6 md:mb-0 relative z-10">
          <h3 className="text-2xl font-bold mb-2">Seus créditos estão acabando?</h3>
          <p className="text-blue-200">Garanta que você não perca nenhum cliente em potencial.</p>
        </div>
        <Link 
          to="/profissional/recarregar" 
          className="bg-amber-500 text-blue-900 px-8 py-4 rounded-2xl font-black text-lg hover:bg-amber-400 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 relative z-10"
        >
          RECARREGAR AGORA
        </Link>
      </div>
    </div>
  );
};

export default ProfessionalLeads;
