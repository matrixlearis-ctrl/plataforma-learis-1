import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Payment } from '../types';
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
  AlertCircle,
  Loader2
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'stats' | 'users' | 'orders' | 'payments') || 'stats';
  const [mercadoPagoConnected, setMercadoPagoConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real Data States
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    dailyOrders: 0,
    activeProfessionals: 0,
    leadsSold: 0
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Monthly Revenue (Sum of approved payments last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'approved')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const totalRevenue = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // 2. Today's New Orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // 3. Active Professionals
      const { count: profCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'PROFESSIONAL');

      // 4. Leads Sold (sum of unlocked_by entries)
      const { data: ordersWithLeads } = await supabase
        .from('orders')
        .select('unlocked_by');
      const totalLeadsSold = ordersWithLeads?.reduce((sum, o) => sum + (o.unlocked_by?.length || 0), 0) || 0;

      // 5. Recent Approved Payments
      const { data: latestPayments } = await supabase
        .from('payments')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5);

      const formattedPayments = latestPayments?.map(p => ({
        ...p,
        user_name: (p.profiles as any)?.full_name || 'Usuário Desconhecido'
      })) || [];

      setStats({
        monthlyRevenue: totalRevenue,
        dailyOrders: todayOrders || 0,
        activeProfessionals: profCount || 0,
        leadsSold: totalLeadsSold
      });
      setRecentPayments(formattedPayments);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectMercadoPago = () => {
    alert("Redirecionando para o fluxo de autorização do Mercado Pago...");
    setTimeout(() => {
      setMercadoPagoConnected(true);
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
          onClick={() => setActiveTab('orders')}
          className={`pb-4 text-sm font-bold transition-all ${activeTab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Gerenciar Pedidos
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-4 text-sm font-bold transition-all ${activeTab === 'payments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Conectar Mercado Pago (Pix)
        </button>
      </div>

      {activeTab === 'stats' && (
        <>
          {/* Main KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <p className="text-sm text-gray-500 font-medium mb-1">Receita Mensal</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-400">
                <DollarSign className="w-3 h-3 mr-1" />
                Integrado com Mercado Pago (Pix)
              </div>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="bg-white p-6 rounded-2xl border shadow-sm text-left hover:border-blue-200 transition-colors"
            >
              <p className="text-sm text-gray-500 font-medium mb-1">Novos Pedidos</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.dailyOrders}</span>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-400">
                <FileText className="w-3 h-3 mr-1" />
                Recebidos Hoje
              </div>
            </button>
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <p className="text-sm text-gray-500 font-medium mb-1">Profissionais Ativos</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.activeProfessionals}</span>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-400">
                <Users className="w-3 h-3 mr-1" />
                Total na base
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <p className="text-sm text-gray-500 font-medium mb-1">Leads Vendidos</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.leadsSold}</span>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                Contatos desbloqueados
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Últimos Pagamentos (Mercado Pago)</h3>
                <button
                  onClick={fetchDashboardData}
                  className="text-blue-600 text-sm font-bold flex items-center"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar'}
                </button>
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
                    {recentPayments.length > 0 ? (
                      recentPayments.map(payment => (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{payment.user_name}</td>
                          <td className="px-6 py-4 text-gray-500">{payment.description.split('|')[0]}</td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                              {payment.status === 'approved' ? 'PAGO' : payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 font-medium">
                            {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <button className="text-gray-300 hover:text-gray-600 transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                              <span className="font-bold">Carregando dados reais...</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="font-bold">Nenhum pagamento encontrado.</p>
                              <p className="text-xs">As vendas aparecerão aqui assim que forem aprovadas.</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
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
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <div className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Gerenciamento de Pedidos</h3>
            <p className="text-gray-600 mb-6">Controle todos os orçamentos solicitados pelos clientes</p>
            <Link
              to="/admin/pedidos"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold"
            >
              <FileText className="w-5 h-5 mr-2" />
              Abrir Gerenciador de Pedidos
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border shadow-xl p-10 max-w-3xl">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-[#009EE3] text-white rounded-2xl flex items-center justify-center">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Configuração do Gateway de Pagamento</h2>
              <p className="text-gray-500">Conecte sua conta Mercado Pago para receber via Pix.</p>
            </div>
          </div>

          {!mercadoPagoConnected ? (
            <div className="space-y-8">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start">
                <AlertCircle className="w-6 h-6 text-[#009EE3] mr-4 mt-1" />
                <div>
                  <h4 className="font-bold text-blue-900">Como funciona a conexão?</h4>
                  <p className="text-blue-800 text-sm leading-relaxed mt-1">
                    A Samej utiliza a API do <strong>Mercado Pago</strong> para processar pagamentos.
                    Você precisa de uma conta Mercado Pago ativa com as credenciais de produção configuradas no sistema.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={connectMercadoPago}
                  className="bg-[#009EE3] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#0087c2] transition-all shadow-xl flex items-center justify-center"
                >
                  <LinkIcon className="w-5 h-5 mr-3" />
                  Conectar Conta Mercado Pago
                </button>
                <p className="text-center text-xs text-gray-400">Você será redirecionado para o ambiente seguro do Mercado Pago.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center p-6 bg-green-50 border border-green-200 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <h4 className="font-bold text-green-900 text-lg">Conta Mercado Pago Conectada!</h4>
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
                  APP_USR-************************************
                </div>
              </div>

              <div className="pt-6 border-t flex space-x-4">
                <button className="flex-1 bg-white border-2 border-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Dashboard Mercado Pago
                </button>
                <button
                  onClick={() => setMercadoPagoConnected(false)}
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
