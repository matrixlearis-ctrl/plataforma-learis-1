
import React from 'react';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  AlertCircle,
  MoreVertical,
  ShieldAlert
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-500">Gestão global da plataforma Samej.</p>
        </div>
        <div className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100">
          <ShieldAlert className="w-5 h-5" />
          <span className="font-bold text-sm">Acesso Restrito</span>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Receita Mensal</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">R$ 42.850</span>
            <span className="text-xs font-bold text-green-500">+12%</span>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-400">
            <DollarSign className="w-3 h-3 mr-1" />
            Integrado com Stripe
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Novos Pedidos</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">1.284</span>
            <span className="text-xs font-bold text-green-500">+5%</span>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-400">
            <FileText className="w-3 h-3 mr-1" />
            Hoje: 42 pedidos
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Profissionais Ativos</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">856</span>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-400">
            <Users className="w-3 h-3 mr-1" />
            Taxa conversão: 65%
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Leads Vendidos</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">3.412</span>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-400">
            <TrendingUp className="w-3 h-3 mr-1" />
            Ticket Médio: 15 cr
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Últimos Pagamentos (Stripe)</h3>
            <button className="text-blue-600 text-sm font-bold">Ver Tudo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase font-bold border-b bg-gray-50">
                  <th className="px-6 py-4">Profissional</th>
                  <th className="px-6 py-4">Pacote</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">Empresa ABC {i}</td>
                    <td className="px-6 py-4">Pack Profissional</td>
                    <td className="px-6 py-4 font-bold">R$ 79,90</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">Pago</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">Hoje, 10:15</td>
                    <td className="px-6 py-4">
                      <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Moderation */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Moderação</h3>
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">4 Alertas</span>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avaliações Pendentes</h4>
              {[1, 2].map(i => (
                <div key={i} className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1 text-amber-500">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-bold">Denúncia de conteúdo</span>
                  </div>
                  <p className="text-xs text-gray-600 italic">"O profissional não apareceu no horário combinado..."</p>
                  <div className="flex space-x-2 pt-2">
                    <button className="text-[10px] font-bold bg-white border border-green-200 text-green-600 px-3 py-1 rounded-lg hover:bg-green-50">Aprovar</button>
                    <button className="text-[10px] font-bold bg-white border border-red-200 text-red-600 px-3 py-1 rounded-lg hover:bg-red-50">Remover</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Documentos p/ Validar</h4>
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                 <div className="flex items-center">
                   <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 font-bold text-xs">ID</div>
                   <span className="text-xs font-medium">Marcio Silva LTDA</span>
                 </div>
                 <button className="text-[10px] font-bold text-blue-600 hover:underline">Analisar</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
