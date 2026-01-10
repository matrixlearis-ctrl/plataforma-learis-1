
import React from 'react';
import { User, OrderStatus } from '../types';
import { CATEGORIES } from '../constants';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, ChevronRight, MessageSquare, Plus } from 'lucide-react';

interface CustomerDashboardProps {
  user: User;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user }) => {
  // Mock Data
  const requests = [
    {
      id: 'r1',
      category: 'eletrica',
      description: 'Instalação de lustre e troca de tomadas na sala.',
      status: OrderStatus.OPEN,
      createdAt: '2024-05-10',
      proResponses: 2
    },
    {
      id: 'r2',
      category: 'obras',
      description: 'Pequeno reparo em infiltração no teto da cozinha.',
      status: OrderStatus.CLOSED,
      createdAt: '2024-04-20',
      proResponses: 4
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
          <p className="text-gray-500">Gerencie suas solicitações de orçamento.</p>
        </div>
        <Link 
          to="/pedir-orcamento" 
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Pedido
        </Link>
      </div>

      <div className="grid gap-6">
        {requests.map(req => {
          const categoryObj = CATEGORIES.find(c => c.id === req.category);
          
          return (
            <div key={req.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6 md:flex items-center justify-between gap-6">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4">
                    {categoryObj?.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">{categoryObj?.name}</span>
                      {req.status === OrderStatus.OPEN ? (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Aberto</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Concluído</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{req.description}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Solicitado em {req.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end flex-grow border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="flex items-center text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="font-bold text-gray-900 mr-1">{req.proResponses}</span> profissionais interessados
                  </div>
                  <button className="p-2 text-gray-400 hover:text-blue-600">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {req.status === OrderStatus.OPEN && (
                <div className="bg-blue-50 px-6 py-3 border-t flex items-center text-xs text-blue-700 font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Estamos a notificar profissionais na sua região agora mesmo!
                </div>
              )}
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
            <p className="text-gray-400 mb-4">Você ainda não tem nenhum pedido de orçamento.</p>
            <Link to="/pedir-orcamento" className="text-blue-600 font-bold hover:underline">
              Fazer meu primeiro pedido agora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
