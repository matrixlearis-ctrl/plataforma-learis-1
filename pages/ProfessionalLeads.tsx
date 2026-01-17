
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProfessionalProfile, OrderRequest, User } from '../types';
import { CATEGORIES } from '../constants';
// Add missing Zap icon to the imports from lucide-react
import { 
  MapPin, 
  Lock, 
  Info, 
  Coins, 
  AlignLeft, 
  PlusCircle, 
  Loader2,
  Calendar,
  CheckCircle2,
  Phone,
  ArrowUpRight,
  Zap
} from 'lucide-react';

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
      alert("Saldo insuficiente! Por favor, recarregue seus créditos.");
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
      }, 1200);
    }
  };

  const isUnlocked = (order: OrderRequest) => order.unlockedBy.includes(profile?.userId || '');

  const getDeadlineLabel = (deadline: string) => {
    switch (deadline) {
      case 'imediato': return 'O quanto antes';
      case 'um_mes': return 'No próximo mês';
      case 'mais_3_meses': return 'Mais de 3 meses';
      case 'orcamento': return 'Apenas orçamento';
      default: return deadline || 'Não especificado';
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12">
      {/* Header Estilizado */}
      <div className="bg-brand-darkBlue p-10 md:p-14 rounded-[3.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden shadow-3xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/20 rounded-full blur-[80px]"></div>
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2">Mercado de Leads</h1>
          <p className="text-blue-200 font-bold uppercase text-[10px] tracking-[0.3em]">Encontre novos clientes agora</p>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10 text-center">
            <p className="text-[10px] text-blue-200 font-black uppercase tracking-widest mb-1">Seu Saldo</p>
            <p className="text-3xl font-black text-brand-orange leading-none">{profile?.credits || 0} <span className="text-sm">CR</span></p>
          </div>
          <Link 
            to="/profissional/recarregar"
            className="bg-brand-orange text-white px-8 py-5 rounded-[2rem] font-black hover:bg-brand-lightOrange shadow-2xl flex items-center transition-all text-sm uppercase tracking-tighter active:scale-95"
          >
            <PlusCircle className="w-5 h-5 mr-3" />
            Recarregar
          </Link>
        </div>
      </div>

      {/* Grid de Leads */}
      <div className="space-y-10">
        {orders.length === 0 ? (
          <div className="bg-white p-32 text-center rounded-[4rem] border-4 border-dashed border-gray-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 text-gray-200 animate-spin" />
            </div>
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Buscando novas oportunidades...</p>
          </div>
        ) : (
          orders.map(order => {
            const unlocked = isUnlocked(order);
            const categoryObj = CATEGORIES.find(c => c.id === order.category);
            
            return (
              <div key={order.id} className={`bg-white rounded-[4rem] border-4 transition-all overflow-hidden ${unlocked ? 'border-brand-orange shadow-2xl scale-[1.01]' : 'border-transparent shadow-xl hover:border-brand-blue/20'}`}>
                <div className="p-10 md:p-14">
                  {/* Status do Lead */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="flex items-center">
                      <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mr-6 shadow-inner transition-colors ${unlocked ? 'bg-brand-orange text-white' : 'bg-brand-bg text-brand-blue'}`}>
                        {categoryObj?.icon && React.cloneElement(categoryObj.icon as React.ReactElement<any>, { className: "w-8 h-8" })}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em]">{categoryObj?.name || 'Serviço'}</span>
                           <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">HÁ 2 HORAS</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-gray-900 uppercase mt-1 tracking-tight">Pedido em {order.location.split(',')[0]}</h3>
                      </div>
                    </div>
                    {unlocked ? (
                      <div className="bg-brand-orange/10 text-brand-orange px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-brand-orange/20 animate-pulse">
                        Dados Liberados
                      </div>
                    ) : (
                      <div className="bg-blue-50 text-brand-blue px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100 flex items-center">
                        <Lock className="w-3 h-3 mr-2" /> Privado
                      </div>
                    )}
                  </div>

                  {/* Resumo ou Dados Completos */}
                  {unlocked ? (
                    <div className="mb-12 p-10 bg-brand-bg rounded-[3rem] border-2 border-brand-orange/30 animate-in slide-in-from-top-4 duration-500 shadow-inner">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-10">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                <Phone className="w-8 h-8 text-brand-orange" />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">WhatsApp / Telefone</p>
                                <p className="font-black text-brand-darkBlue text-4xl tracking-tighter leading-none">{order.phone}</p>
                              </div>
                           </div>

                           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                              <div className="flex items-start gap-4">
                                <MapPin className="w-5 h-5 text-brand-orange mt-1" />
                                <div>
                                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Endereço de Execução</p>
                                  <p className="font-black text-gray-800 uppercase text-lg leading-tight mt-1">{order.address}, {order.number}</p>
                                  <p className="text-sm font-bold text-gray-500 uppercase">{order.neighborhood} • {order.location}</p>
                                </div>
                              </div>
                              {order.complement && (
                                <div className="pt-4 border-t border-gray-50">
                                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Complemento</p>
                                  <p className="font-bold text-gray-700 uppercase">{order.complement}</p>
                                </div>
                              )}
                           </div>
                        </div>

                        <div className="flex flex-col">
                           <div className="flex items-center gap-3 mb-4">
                             <AlignLeft className="w-5 h-5 text-brand-blue" />
                             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Descrição do Projeto</p>
                           </div>
                           <div className="flex-grow bg-white p-10 rounded-[3rem] border border-gray-100 shadow-inner max-h-[350px] overflow-auto">
                              <p className="text-gray-900 font-bold text-2xl leading-relaxed whitespace-pre-wrap uppercase italic">
                                "{order.description}"
                              </p>
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                      <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Bairro</p>
                        <p className="font-black text-gray-900 uppercase text-xs">{order.neighborhood || 'Privado'}</p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Urgência</p>
                        <p className="font-black text-brand-orange uppercase text-xs flex items-center">
                          <Zap className="w-3 h-3 mr-2" /> {getDeadlineLabel(order.deadline)}
                        </p>
                      </div>
                      <div className="lg:col-span-2 bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Resumo do Pedido</p>
                          <p className="font-bold text-gray-600 line-clamp-1 uppercase text-[10px] italic">"{order.description}"</p>
                        </div>
                        <Info className="w-5 h-5 text-blue-200" />
                      </div>
                    </div>
                  )}

                  {/* Rodapé do Card */}
                  {!unlocked && (
                    <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t-4 border-gray-50">
                      <div className="flex items-center bg-amber-50 px-8 py-5 rounded-[2rem] border-2 border-amber-100 mb-8 md:mb-0 shadow-sm">
                        <Coins className="w-8 h-8 text-amber-600 mr-4" />
                        <div>
                          <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest leading-none">Custo Único</p>
                          <p className="text-3xl font-black text-amber-700 leading-none mt-1">{order.leadPrice} <span className="text-sm">CR</span></p>
                        </div>
                      </div>
                      <button 
                        onClick={() => buyLead(order)} 
                        disabled={purchasingId === order.id}
                        className="w-full md:w-auto bg-brand-darkBlue text-white px-16 py-7 rounded-[2.5rem] font-black text-xl hover:bg-black flex items-center justify-center transition-all shadow-3xl active:scale-95 disabled:opacity-50 uppercase tracking-tighter"
                      >
                        {purchasingId === order.id ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                          <>
                            Liberar Contatos
                            <ArrowUpRight className="ml-4 w-6 h-6" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {unlocked && (
                    <div className="text-center pt-8 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Obrigado por utilizar a Samej para prospectar clientes!</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProfessionalLeads;
