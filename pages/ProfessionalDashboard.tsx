
import React from 'react';
import { Link } from 'react-router-dom';
import { User, ProfessionalProfile } from '../types';
import { 
  Users, 
  CheckCircle, 
  TrendingUp, 
  Coins, 
  ArrowRight,
  Star
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface ProfessionalDashboardProps {
  user: User;
  profile: ProfessionalProfile | null;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ user, profile }) => {
  const chartData = [
    { name: 'Jan', leads: 4 },
    { name: 'Fev', leads: 7 },
    { name: 'Mar', leads: 5 },
    { name: 'Abr', leads: 12 },
    { name: 'Mai', leads: 8 },
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Olá, {user.name}</h1>
          <p className="text-gray-500">Este é o resumo da sua atividade na Samej.</p>
        </div>
        <Link 
          to="/profissional/leads" 
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center"
        >
          Procurar Pedidos
          <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Coins className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">+10%</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Saldo de Créditos</p>
          <p className="text-2xl font-bold text-gray-900">{profile?.credits}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Leads Comprados</p>
          <p className="text-2xl font-bold text-gray-900">{profile?.completedJobs || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Star className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Avaliação Média</p>
          <p className="text-2xl font-bold text-gray-900">{profile?.rating} / 5.0</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Pedidos Disponíveis</p>
          <p className="text-2xl font-bold text-gray-900">124</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Volume de Leads</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Últimos Contactos</h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center font-bold text-gray-500">
                    C{i}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Cliente Exemplo {i}</p>
                    <p className="text-xs text-gray-500">Ontem às 14:20</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Pintura</div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 text-sm font-bold text-gray-500 hover:text-blue-600 py-2">
            Ver todo o histórico
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
