
import React, { useState } from 'react';
import { ProfessionalProfile, OrderRequest, OrderStatus, User } from '../types';
import { CATEGORIES } from '../constants';
import { Search, MapPin, Calendar, Clock, Lock, Unlock, Phone, Mail, Coins, AlertTriangle } from 'lucide-react';

interface ProfessionalLeadsProps {
  user: User;
  profile: ProfessionalProfile | null;
  onUpdateProfile: (profile: ProfessionalProfile) => void;
}

// Mock Orders Data
const MOCK_ORDERS: OrderRequest[] = [
  {
    id: 'ord1',
    clientId: 'c1',
    clientName: 'Roberto Almeida',
    category: 'eletrica',
    description: 'Preciso trocar toda a fiação de um apartamento de 2 quartos antigo.',
    location: 'São Paulo, SP',
    deadline: 'Próximos 15 dias',
    status: OrderStatus.OPEN,
    createdAt: '2024-05-15 10:30',
    leadPrice: 5,
    unlockedBy: []
  },
  {
    id: 'ord2',
    clientId: 'c2',
    clientName: 'Maria Antônia',
    category: 'obras',
    description: 'Remodelação de banheiro completa, incluindo troca de azulejos e louças.',
    location: 'Rio de Janeiro, RJ',
    deadline: 'Urgente',
    status: OrderStatus.OPEN,
    createdAt: '2024-05-15 08:00',
    leadPrice: 12,
    unlockedBy: []
  },
  {
    id: 'ord3',
    clientId: 'c3',
    clientName: 'Carlos Mendes',
    category: 'pintura',
    description: 'Pintura externa de uma casa de campo de 2 andares.',
    location: 'Atibaia, SP',
    deadline: 'Próximo mês',
    status: OrderStatus.OPEN,
    createdAt: '2024-05-14 15:45',
    leadPrice: 8,
    unlockedBy: ['pro_random']
  }
];

const ProfessionalLeads: React.FC<ProfessionalLeadsProps> = ({ user, profile, onUpdateProfile }) => {
  const [orders, setOrders] = useState<OrderRequest[]>(MOCK_ORDERS);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const buyLead = (order: OrderRequest) => {
    if (!profile) return;
    if (profile.credits < order.leadPrice) {
      alert("Saldo de créditos insuficiente!");
      return;
    }

    if (confirm(`Deseja desbloquear este contacto por ${order.leadPrice} créditos?`)) {
      setPurchasingId(order.id);
      
      // Simulate API call to buy lead
      setTimeout(() => {
        const newProfile = {
          ...profile,
          credits: profile.credits - order.leadPrice
        };
        onUpdateProfile(newProfile);
        
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, unlockedBy: [...o.unlockedBy, profile.userId] } : o));
        setPurchasingId(null);
      }, 1000);
    }
  };

  const isUnlocked = (order: OrderRequest) => order.unlockedBy.includes(profile?.userId || '');

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos Disponíveis</h1>
          <p className="text-gray-500">Encontre oportunidades compatíveis com seu perfil em {profile?.region}.</p>
        </div>
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium uppercase">Seu Saldo</p>
            <p className="text-xl font-bold text-amber-600">{profile?.credits} créditos</p>
          </div>
          <button className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600">
            Comprar Mais
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Filtros
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Todas as categorias</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distância</label>
                <select className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="50">Até 50km</option>
                  <option value="100">Até 100km</option>
                  <option value="all">Todo o país</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
             <div className="flex items-start">
               <AlertTriangle className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
               <p className="text-sm text-blue-800">
                 <strong>Dica:</strong> Pedidos marcados como "Urgente" tendem a fechar negócio 3x mais rápido.
               </p>
             </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2 space-y-4">
          {orders.map(order => {
            const unlocked = isUnlocked(order);
            const categoryObj = CATEGORIES.find(c => c.id === order.category);
            
            return (
              <div key={order.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${unlocked ? 'border-green-300 ring-2 ring-green-50' : 'hover:border-blue-300'}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 text-blue-600">
                        {categoryObj?.icon}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{categoryObj?.name}</span>
                        <h3 className="text-xl font-bold text-gray-900">{unlocked ? order.clientName : `Pedido #${order.id.substr(0, 5)}`}</h3>
                      </div>
                    </div>
                    {order.deadline === 'Urgente' && (
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Urgente
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-6 line-clamp-2">
                    {order.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {order.location}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Postado em: {order.createdAt}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t">
                    {!unlocked ? (
                      <>
                        <div className="flex items-center text-amber-600 font-bold">
                          <Coins className="w-5 h-5 mr-2" />
                          {order.leadPrice} Créditos
                        </div>
                        <button 
                          onClick={() => buyLead(order)}
                          disabled={purchasingId === order.id}
                          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center transition-colors disabled:opacity-50"
                        >
                          {purchasingId === order.id ? 'A processar...' : 'Ver Contactos'}
                          <Lock className="ml-2 w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                          <div className="flex items-center text-green-700 font-bold">
                            <Unlock className="w-5 h-5 mr-2" />
                            Contacto Desbloqueado
                          </div>
                          <div className="flex gap-4">
                            <a href={`tel:+551199999999`} className="flex items-center bg-white px-4 py-2 border rounded-lg text-blue-600 font-bold hover:shadow-sm">
                              <Phone className="w-4 h-4 mr-2" />
                              Ligar
                            </a>
                            <a href={`mailto:cliente@email.com`} className="flex items-center bg-white px-4 py-2 border rounded-lg text-blue-600 font-bold hover:shadow-sm">
                              <Mail className="w-4 h-4 mr-2" />
                              E-mail
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalLeads;
