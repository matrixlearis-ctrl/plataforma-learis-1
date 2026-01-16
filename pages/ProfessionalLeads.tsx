
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProfessionalProfile, OrderRequest, User } from '../types';
import { CATEGORIES } from '../constants';
import { MapPin, Clock, Lock, Info, Coins, User as UserIcon, AlignLeft, PlusCircle, Loader2 } from 'lucide-react';

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

                  {/* Cabeçalho de informações básicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Cliente</p>
                      <p className="font-bold text-gray-900 flex items-center uppercase"><UserIcon className="w-4 h-4 mr-2 text-gray-400" />{order.clientName}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Cidade</p>
                      <p className="font-bold text-gray-900 flex items-center uppercase"><MapPin className="w-4 h-4 mr-2 text-gray-400" />{order.location}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Bairro</p>
                      <p className="font-bold text-gray-900 uppercase">{order.neighborhood || 'Não informado'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Prazo</p>
                      <p className="font-bold text-gray-900 flex items-center uppercase"><Clock className="w-4 h-4 mr-2 text-gray-400" />{getDeadlineLabel(order.deadline)}</p>
                    </div>
                  </div>

                  {unlocked ? (
                    <div className="mb-10 p-8 bg-blue-50 rounded-[2.5rem] border-2 border-blue-200 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center mb-6">
                        <div className="bg-blue-600 text-white p-2 rounded-lg mr-3 shadow-lg">
                           <Info className="w-5 h-5" />
                        </div>
                        <h4 className="text-xl font-black text-blue-900 uppercase tracking-tighter">Dados Completos do Lead</h4>
                      </div>

                      <div className="space-y-8">
                        {/* Seção de Contato e Endereço Textual */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-blue-200">
                          <div className="space-y-4">
                             <div>
                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Nome do Cliente</p>
                                <p className="font-black text-gray-900 text-xl uppercase leading-none">{order.clientName}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Telefone de Contato</p>
                                <p className="font-black text-blue-700 text-3xl leading-none">{order.phone || 'Não informado'}</p>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div>
                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Endereço de Execução</p>
                                <p className="font-black text-gray-900 text-lg uppercase leading-tight">
                                  {order.address || 'Rua não informada'}, Nº {order.number || 'S/N'}
                                  {order.complement && <span className="block text-sm text-blue-600 font-bold mt-1 uppercase italic">Complemento: {order.complement}</span>}
                                </p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Bairro</p>
                                  <p className="font-black text-gray-800 uppercase text-sm">{order.neighborhood || 'Não informado'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Cidade/UF</p>
                                  <p className="font-black text-gray-800 uppercase text-sm">{order.location}</p>
                                </div>
                             </div>
                          </div>
                        </div>

                        {/* Descrição Completa do Orçamento */}
                        <div className="pt-2">
                           <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-3">O que o cliente precisa (Descrição Completa):</p>
                           <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-inner">
                              <p className="text-gray-900 font-bold text-lg leading-relaxed whitespace-pre-wrap uppercase">
                                {order.description}
                              </p>
                           </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-blue-200 text-center">
                        <p className="text-xs text-blue-600 font-black uppercase tracking-widest">
                          * Copie os dados acima para entrar em contato diretamente com o cliente.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Prévia da descrição antes do profissional comprar */
                    <div className="mb-10 p-8 bg-gray-50 rounded-[2rem] border-2 border-gray-100 relative">
                      <div className="flex items-center mb-4 text-gray-400">
                        <AlignLeft className="w-4 h-4 mr-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Resumo do Pedido</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed line-clamp-3 font-medium text-lg italic uppercase">
                        "{order.description}"
                      </p>
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-50 to-transparent"></div>
                    </div>
                  )}

                  {!unlocked && (
                    <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t-2 border-gray-50">
                      <div className="flex items-center bg-amber-50 px-6 py-4 rounded-2xl border-2 border-amber-100 mb-6 md:mb-0 shadow-sm">
                        <Coins className="w-6 h-6 text-amber-600 mr-3" />
                        <div>
                          <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest leading-none">Custo para Desbloquear</p>
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
                            LIBERAR DADOS DO CLIENTE
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
    </div>
  );
};

export default ProfessionalLeads;
