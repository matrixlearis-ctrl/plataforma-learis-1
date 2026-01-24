import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  MoreVertical,
  Link as LinkIcon,
  CheckCircle2,
  ExternalLink,
  UserPlus,
  AlertCircle
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'stats' | 'users' | 'payments') || 'stats';
  const [stripeConnected, setStripeConnected] = useState(false);

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const connectStripe = () => {
    alert("Redirecionando para o fluxo de autorização do Stripe...");
    setTimeout(() => {
      setStripeConnected(true);
    }, 1500);
  };

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

      {/* Tabs de Navegação */}
      <div className="flex border-b space-x-8">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-4 text-sm font-bold transition-all ${activeTab === 'stats' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Estatísticas
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 text-sm font-bold transition-all ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Gerenciar Usuários
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-4 text-sm font-bold transition-all ${activeTab === 'payments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Conectar Stripe (Pix)
        </button>
      </div>

      {activeTab === 'stats' && (
        <>
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
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <div className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Gerenciamento de Usuários</h3>
            <p className="text-gray-600 mb-6">Acesse o módulo completo de gerenciamento de usuários</p>
            <Link
              to="/admin/usuarios"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Abrir Gerenciador de Usuários
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border shadow-xl p-10 max-w-3xl">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Configuração do Gateway de Pagamento</h2>
              <p className="text-gray-500">Conecte sua conta Stripe para receber via Pix.</p>
            </div>
          </div>

          {!stripeConnected ? (
            <div className="space-y-8">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start">
                <AlertCircle className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                <div>
                  <h4 className="font-bold text-blue-900">Como funciona a conexão?</h4>
                  <p className="text-blue-800 text-sm leading-relaxed mt-1">
                    A Samej utiliza o <strong>Stripe Connect</strong> para processar pagamentos.
                    Você precisa de uma conta Stripe ativa com o método de pagamento <strong>Pix</strong> habilitado nas configurações do Dashboard da Stripe.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={connectStripe}
                  className="bg-[#635bff] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#5851e0] transition-all shadow-xl flex items-center justify-center"
                >
                  <LinkIcon className="w-5 h-5 mr-3" />
                  Conectar Conta Stripe
                </button>
                <p className="text-center text-xs text-gray-400">Você será redirecionado para o ambiente seguro da Stripe.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center p-6 bg-green-50 border border-green-200 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <h4 className="font-bold text-green-900 text-lg">Conta Stripe Conectada!</h4>
                  <p className="text-green-800 text-sm">Sua plataforma Samej já pode processar pagamentos via Pix.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Credenciais Ativas</h4>
                <div className="p-4 bg-gray-50 rounded-xl border font-mono text-xs flex justify-between items-center text-gray-500">
                  <span>Modo: Produção</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">LIVE</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border font-mono text-xs text-gray-400 break-all">
                  pk_live_************************************
                </div>
              </div>

              <div className="pt-6 border-t flex space-x-4">
                <button className="flex-1 bg-white border-2 border-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Dashboard Stripe
                </button>
                <button
                  onClick={() => setStripeConnected(false)}
                  className="text-red-500 text-sm font-bold hover:underline"
                >
                  Desconectar Conta
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
