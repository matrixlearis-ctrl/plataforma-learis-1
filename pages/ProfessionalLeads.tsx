
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProfessionalProfile, OrderRequest, User } from '../types';
import { CATEGORIES } from '../constants';
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
  Zap,
  Clock,
  ChevronRight
} from 'lucide-react';

interface ProfessionalLeadsProps {
  user: User;
  profile: ProfessionalProfile | null;
  orders: OrderRequest[];
  onUpdateProfile: (profile: ProfessionalProfile) => void;
  onUpdateOrder: (order: OrderRequest) => void;
}

const ProfessionalLeads: React.FC<ProfessionalLeadsProps> = ({ user, profile, orders, onUpdateProfile, onUpdateOrder }) => {
  console.log('ProfessionalLeads - Orders recebidos:', orders); // Debug
  console.log('ProfessionalLeads - Profile:', profile); // Debug
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
      case 'imediato': return 'Urgente / O quanto antes';
      case 'um_mes': return 'Nos próximos 30 dias';
      case 'mais_3_meses': return 'Mais de 3 meses';
      case 'orcamento': return 'Apenas orçamento';
      default: return deadline || 'Não especificado';
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12">
      {/* Header Premium */}
      <div className="bg-brand-darkBlue p-10 md:p-14 rounded-[3.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden shadow-3xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/20 rounded-full blur-[80px]"></div>
        <div className="relative z-10 text-center md:text-left">
          <div className="inline-flex items-center bg-white/10 px-4 py-1.5 rounded-full mb-4 border border-white/10">
            <Zap className="w-3 h-3 text-brand-orange mr-2 fill-current" />
            <span className="text-[9px] font-black uppercase tracking-widest">Oportunidades em tempo real</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2">Pedidos de Clientes</h1>
          <p className="text-blue-200 font-bold text-xs">Encontre novos serviços e expanda seu negócio.</p>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-md px-8 py-5 rounded-[2rem] border border-white/10 text-center shadow-inner">
            <p className="text-[10px] text-blue-200 font-black uppercase tracking-widest mb-1">Seu Saldo</p>
            <p className="text-4xl font-black text-brand-orange leading-none">{profile?.credits || 0} <span className="text-sm">CR</span></p>
          </div>
          <Link 
            to="/profissional/recarregar"
            className="bg-brand-orange text-white w-14 h-14 md:w-auto md:px-8 rounded-full md:rounded-[2rem] font-black hover:bg-brand-lightOrange shadow-2xl flex items-center justify-center transition-all group active:scale-95"
          >
            <PlusCircle className="w-6 h-6 md:mr-3 group-hover:rotate-90 transition-transform" />
            <span className="hidden md:inline uppercase text-sm">Recarregar</span>
          </Link>
        </div>
      </div>

      {/* Grid de Leads */}
      <div className="space-y-10">
        {orders.length === 0 ? (
          <div className="bg-white p-32 text-center rounded-[4rem] border-4 border-dashed border-gray-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Loader2 className="w-10 h-10 text-gray-200 animate-spin" />
            </div>
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Buscando novas solicitações...</p>
          </div>
        ) : (
          orders.map(order => {
            const unlocked = isUnlocked(order);
            const categoryObj = CATEGORIES.find(c => c.id === order.category);
            const timeAgo = new Date(order.createdAt).toLocaleDateString('pt-BR');
            
            return (
              <div key={order.id} className={`bg-white rounded-[4rem] border-4 transition-all overflow-hidden ${unlocked ? 'border-brand-orange shadow-2xl scale-[1.01]' : 'border-transparent shadow-xl hover:border-brand-blue/10'}`}>
                <div className="p-10 md:p-14">
                  {/* Topo do Card */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                    <div className="flex items-start">
                      <div className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center mr-6 shadow-inner flex-shrink-0 transition-colors ${unlocked ? 'bg-brand-orange text-white' : 'bg-brand-bg text-brand-blue'}`}>
                        {categoryObj?.icon && React.cloneElement(categoryObj.icon as React.ReactElement<any>, { className: "w-8 h-8" })}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                           <span className="text-[10px] font-black text-brand-blue bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">{categoryObj?.name || 'Serviço'}</span>
                           <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                             <Clock className="w-3 h-3 mr-1" /> Postado em {timeAgo}
                           </div>
                        </div>
                        <h3 className="text-2xl md:text-4xl font-black text-brand-darkBlue uppercase tracking-tight leading-none">
                          {unlocked ? order.clientName : `Pedido de Orçamento`}
                        </h3>
                        <p className="text-lg text-gray-500 font-bold mt-2 flex items-center">
                          <MapPin className="w-5 h-5 mr-2 text-brand-blue" />
                          {order.location} {order.neighborhood ? `• ${order.neighborhood}` : ''}
                        </p>
                      </div>
                    </div>
                    
                    {unlocked ? (
                      <div className="bg-green-100 text-green-700 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-green-200 flex items-center shadow-sm">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Contatos Liberados
                      </div>
                    ) : (
                      <div className="bg-amber-50 text-amber-600 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-amber-100 flex items-center shadow-sm">
                        <Coins className="w-4 h-4 mr-2" /> {order.leadPrice} CRÉDITOS
                      </div>
                    )}
                  </div>

                  {/* Área Central: Detalhes ou Dados Privados */}
                  {unlocked ? (
                    <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-top-4 duration-500">
                      <div className="space-y-6">
                         <div className="bg-brand-bg p-8 rounded-[3rem] border-2 border-brand-orange/20 shadow-inner">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4">Dados do Cliente</p>
                            <div className="flex items-center gap-6 mb-6">
                               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                                 <Phone className="w-8 h-8 text-brand-orange" />
                               </div>
                               <div>
                                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">WhatsApp</p>
                                 <p className="font-black text-brand-darkBlue text-4xl tracking-tighter leading-none">{order.phone}</p>
                               </div>
                            </div>
                            <div className="space-y-2 border-t border-white/50 pt-6">
                               <p className="text-sm font-bold text-gray-700 uppercase">
                                 <span className="text-gray-400">Endereço:</span> {order.address}, {order.number}
                               </p>
                               {order.complement && (
                                 <p className="text-sm font-bold text-gray-700 uppercase">
                                   <span className="text-gray-400">Complemento:</span> {order.complement}
                                 </p>
                               )}
                            </div>
                         </div>
                         <a 
                           href={`https://wa.me/55${order.phone.replace(/\D/g, '')}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="w-full bg-green-500 text-white py-5 rounded-[2rem] font-black text-center flex items-center justify-center hover:bg-green-600 shadow-xl transition-all"
                         >
                           FALAR NO WHATSAPP
                           <ChevronRight className="ml-2 w-5 h-5" />
                         </a>
                      </div>

                      <div className="flex flex-col">
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4 ml-4">Descrição do Projeto</p>
                         <div className="flex-grow bg-white p-10 rounded-[3rem] border-2 border-gray-50 shadow-inner overflow-auto min-h-[200px]">
                            <p className="text-gray-900 font-bold text-2xl leading-relaxed italic uppercase">
                              "{order.description}"
                            </p>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Urgência</p>
                          <p className="font-black text-brand-orange uppercase text-sm flex items-center">
                            <Zap className="w-4 h-4 mr-2 fill-current" /> {getDeadlineLabel(order.deadline)}
                          </p>
                        </div>
                        <div className="md:col-span-2 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Prévia do Projeto</p>
                          <p className="font-bold text-gray-500 line-clamp-2 italic uppercase text-sm">
                            "{order.description}"
                          </p>
                        </div>
                      </div>
                      
                      {/* Botão de Compra */}
                      <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t-2 border-gray-50 gap-8">
                        <div className="flex items-center text-blue-300 font-bold text-sm">
                          <Lock className="w-5 h-5 mr-3" />
                          <span>O cliente aguarda até 4 orçamentos. Seja um deles!</span>
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
                              Ver Contatos do Cliente
                              <ArrowUpRight className="ml-4 w-7 h-7" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {unlocked && (
                    <div className="text-center pt-6 border-t border-gray-50">
                      <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.4em]">Parceiro Oficial Samej</p>
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
