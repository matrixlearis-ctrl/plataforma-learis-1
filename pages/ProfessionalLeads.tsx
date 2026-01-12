
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProfessionalProfile, OrderRequest, User } from '../types';
import { CATEGORIES } from '../constants';
// Added Loader2 to the imports
import { MapPin, Clock, Lock, Phone, Mail, Coins, User as UserIcon, AlignLeft, PlusCircle, AlertCircle, Loader2 } from 'lucide-react';

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
      alert("Saldo insuficiente! Por favor, recarregue seus créditos via Pix.");
      return;
    }

    if (confirm(`Deseja desbloquear os contatos de ${order.clientName} por ${order.leadPrice} créditos?`)) {
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
      }, 1000);
    }
  };

  const isUnlocked = (order: OrderRequest) => order.unlockedBy.includes(profile?.userId || '');

  const getDeadlineLabel = (deadline: string) => {
    switch (deadline) {
      case 'imediato': return 'Urgente / O quanto antes';
      case '15_dias': return 'Próximas 2 semanas';
      case 'um_mes': return 'Próximo mês';
      case 'mais_3_meses': return 'Apenas planejando';
      default: return deadline || 'Não especificado';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Mercado de Leads</h1>
          <p className="text-gray-500 font-medium">Encontre novos pedidos de orçamento na sua região.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-5 py-3 rounded-2xl border shadow-sm text-right">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Saldo Atual</p>
            <p className="text-2xl font-black text-amber-600 leading-none">{profile?.credits || 0} <span className="text-xs">CR</span></p>
          </div>
          <Link 
            to="/profissional/recarregar"
            className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 flex items-center transition-all text-sm active:scale-95"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            RECARREGAR
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        {orders.length === 0 ? (
          <div className="bg-white p-20 text-center rounded-[2.5rem] border-2 border-dashed text-gray-400 font-bold">
            Estamos buscando novos pedidos para você...
          </div>
        ) : (
          orders.map(order => {
            const unlocked = isUnlocked(order);
            const categoryObj = CATEGORIES.find(c => c.id === order.category);
            
            return (
              <div key={order.id} className={`bg-white rounded-[2.5rem] border-2 shadow-sm transition-all overflow-hidden ${unlocked ? 'border-green-300 ring-8 ring-green-50' : 'hover:border-blue-300 shadow-xl'}`}>
                <div className="p-8 md:p-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mr-5 shadow-inner">
                        {categoryObj?.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Solicitação de Serviço</span>
                        <h3 className="text-xl font-black text-gray-900 uppercase mt-1">{categoryObj?.name || 'Serviço'}</h3>
                      </div>
                    </div>
                    {unlocked && (
                      <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                        Lead Desbloqueado
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Cliente</p>
                      <p className="font-bold text-gray-900 flex items-center"><UserIcon className="w-4 h-4 mr-2 text-gray-400" />{order.clientName}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Local</p>
                      <p className="font-bold text-gray-900 flex items-center"><MapPin className="w-4 h-4 mr-2 text-gray-400" />{order.location}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Bairro</p>
                      <p className="font-bold text-gray-900">{order.neighborhood || 'Não informado'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Prazo</p>
                      <p className="font-bold text-gray-900 flex items-center"><Clock className="w-4 h-4 mr-2 text-gray-400" />{getDeadlineLabel(order.deadline)}</p>
                    </div>
                  </div>

                  <div className="mb-10 p-8 bg-gray-50 rounded-[2rem] border-2 border-gray-100 relative">
                    <div className="flex items-center mb-4 text-gray-400">
                      <AlignLeft className="w-4 h-4 mr-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Detalhes da Necessidade</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium text-lg">
                      {order.description}
                    </p>
                  </div>

                  {unlocked ? (
                    <div className="pt-8 border-t-2 border-gray-50 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="bg-green-50 p-5 rounded-2xl border border-green-100 mb-8 flex items-start">
                        <AlertCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-green-800 font-bold">Sucesso! Agora você tem acesso direto aos contatos do cliente. Ligue ou envie uma mensagem agora mesmo.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a href={`tel:${profile.phone}`} className="flex items-center justify-center bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                          <Phone className="w-6 h-6 mr-3" /> LIGAR AGORA
                        </a>
                        <a href="#" className="flex items-center justify-center bg-white border-4 border-blue-600 text-blue-600 py-5 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all active:scale-95">
                          <Mail className="w-6 h-6 mr-3" /> ENVIAR WHATSAPP
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t-2 border-gray-50">
                      <div className="flex items-center bg-amber-50 px-6 py-4 rounded-2xl border-2 border-amber-100 mb-6 md:mb-0 shadow-sm">
                        <Coins className="w-6 h-6 text-amber-600 mr-3" />
                        <div>
                          <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest leading-none">Custo do Lead</p>
                          <p className="text-2xl font-black text-amber-700 leading-none mt-1">{order.leadPrice} <span className="text-xs">Créditos</span></p>
                        </div>
                      </div>
                      <button 
                        onClick={() => buyLead(order)} 
                        disabled={purchasingId === order.id}
                        className="w-full md:w-auto bg-gray-900 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-black flex items-center justify-center transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                      >
                        {purchasingId === order.id ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            LIBERAR CONTATO
                            <Lock className="ml-4 w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-20 p-12 bg-blue-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between shadow-[0_35px_60px_-15px_rgba(30,58,138,0.3)] overflow-hidden relative border-8 border-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="mb-8 md:mb-0 relative z-10 max-w-lg">
          <h3 className="text-3xl font-black mb-4 tracking-tighter">SUA CARTEIRA SAMEJ</h3>
          <p className="text-blue-200 text-lg font-medium leading-relaxed">
            Mantenha seu saldo positivo para não perder nenhuma oportunidade de negócio que apareça na sua região.
          </p>
        </div>
        <Link 
          to="/profissional/recarregar" 
          className="bg-amber-500 text-blue-900 px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-amber-400 transition-all shadow-2xl hover:-translate-y-2 active:translate-y-0 relative z-10 border-4 border-amber-300"
        >
          RECARREGAR CRÉDITOS
        </Link>
      </div>
    </div>
  );
};

export default ProfessionalLeads;
