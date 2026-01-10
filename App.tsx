
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import CustomerDashboard from './pages/CustomerDashboard';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewRequest from './pages/NewRequest';
import ProfessionalLeads from './pages/ProfessionalLeads';
import ProfileSettings from './pages/ProfileSettings';
import RechargeCredits from './pages/RechargeCredits';
import ProfessionalDirectory from './pages/ProfessionalDirectory';
import PublicProfile from './pages/PublicProfile';
import { User, UserRole, ProfessionalProfile, OrderRequest, OrderStatus } from './types';
import { supabase, supabaseIsConfigured } from './lib/supabase';
import { Database, Key, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<(ProfessionalProfile & { name: string, avatar: string, id: string })[]>([]);

  useEffect(() => {
    if (!supabaseIsConfigured) {
      setLoading(false);
      return;
    }

    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchProfile(session.user.id);
      }
      await Promise.all([fetchOrders(), fetchProfessionals()]);
      setLoading(false);

      // Inscrição em tempo real para novos pedidos
      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setOrders(data.map(o => ({
        id: o.id, clientId: o.client_id, clientName: o.client_name, category: o.category,
        description: o.description, location: o.location, neighborhood: o.neighborhood,
        deadline: o.deadline, status: o.status as OrderStatus, createdAt: o.created_at,
        leadPrice: o.lead_price, unlockedBy: o.unlocked_by || []
      })));
    } catch (e) { console.error("Erro ao buscar pedidos:", e); }
  };

  const fetchProfessionals = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'PROFESSIONAL');
      if (data) setProfessionals(data.map(p => ({
        id: p.id, userId: p.id, name: p.full_name, avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`,
        description: p.description || 'Sem descrição.', categories: p.categories || [],
        region: p.region || 'Brasil', rating: p.rating || 5, credits: p.credits || 0,
        completedJobs: p.completed_jobs || 0, phone: p.phone || ''
      })));
    } catch (e) {}
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      if (data) {
        setUser({ id: data.id, name: data.full_name, email: '', role: data.role as UserRole, avatar: data.avatar_url });
        if (data.role === UserRole.PROFESSIONAL) {
          setProProfile({
            userId: data.id, description: data.description, categories: data.categories,
            region: data.region, rating: data.rating, credits: data.credits,
            completedJobs: data.completed_jobs, phone: data.phone
          });
        }
      }
    } catch (e) { console.error("Erro ao carregar perfil:", e); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProProfile(null);
    window.location.href = '/';
  };

  const addOrder = async (newOrder: OrderRequest) => {
    const { error } = await supabase.from('orders').insert([{
      client_id: user?.id || null, client_name: newOrder.clientName, category: newOrder.category,
      description: newOrder.description, location: newOrder.location, neighborhood: newOrder.neighborhood,
      deadline: newOrder.deadline, status: newOrder.status, lead_price: newOrder.leadPrice
    }]);
    if (error) throw error;
    fetchOrders();
  };

  const updateOrder = async (updatedOrder: OrderRequest) => {
    await supabase.from('orders').update({ unlocked_by: updatedOrder.unlockedBy }).eq('id', updatedOrder.id);
    fetchOrders();
  };

  const handleUpdateProfile = async (newProfile: ProfessionalProfile) => {
    const { error } = await supabase.from('profiles').update({ credits: newProfile.credits, completed_jobs: newProfile.completedJobs }).eq('id', newProfile.userId);
    if (!error) setProProfile(newProfile);
  };

  if (!supabaseIsConfigured && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-lg w-full bg-white p-10 rounded-[3rem] border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center rotate-3 shadow-inner">
              <Database className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 text-center mb-4 tracking-tighter">CONEXÃO QUASE PRONTA</h2>
          <p className="text-gray-500 text-center mb-10 font-medium leading-relaxed">
            Seu banco de dados já tem as tabelas e políticas. Agora, você só precisa colar a sua <span className="text-blue-600 font-bold">Anon Key</span> no arquivo <code className="bg-gray-100 px-2 py-1 rounded text-pink-600">lib/supabase.ts</code>.
          </p>
          
          <div className="space-y-4 mb-10">
            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black flex-shrink-0">1</div>
              <p className="text-sm text-gray-600 font-medium pt-1">No Supabase, vá em <b>Project Settings</b> &gt; <b>API</b>.</p>
            </div>
            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black flex-shrink-0">2</div>
              <p className="text-sm text-gray-600 font-medium pt-1">Copie o código em <b>Project API keys</b> (o que diz <span className="bg-amber-100 text-amber-700 px-1 rounded">anon public</span>).</p>
            </div>
            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black flex-shrink-0">3</div>
              <p className="text-sm text-gray-600 font-medium pt-1">Cole no arquivo <code className="text-blue-600">lib/supabase.ts</code> na variável <code className="text-pink-600">SUPABASE_ANON_KEY</code>.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
              <RefreshCw className="mr-3 w-5 h-5" /> REVERIFICAR CONEXÃO
            </button>
            <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer" className="w-full bg-white border-2 border-gray-100 text-gray-600 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-gray-50 transition-all">
              ABRIR PAINEL DO SUPABASE <ExternalLink className="ml-2 w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e3a8a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-white text-xl font-black tracking-tighter uppercase">Samej</h1>
          <p className="text-blue-200 text-xs font-bold mt-2 uppercase tracking-widest">Carregando marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar user={user} onLogout={handleLogout} credits={proProfile?.credits} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pedir-orcamento" element={<NewRequest user={user} onAddOrder={addOrder} />} />
            <Route path="/profissionais" element={<ProfessionalDirectory professionals={professionals} />} />
            <Route path="/perfil/:id" element={<PublicProfile professionals={professionals} />} />
            <Route path="/cliente/dashboard" element={user?.role === UserRole.CLIENT ? <CustomerDashboard user={user} orders={orders} /> : <Navigate to="/auth" />} />
            <Route path="/profissional/dashboard" element={user?.role === UserRole.PROFESSIONAL ? <ProfessionalDashboard user={user} profile={proProfile} /> : <Navigate to="/auth" />} />
            <Route path="/profissional/leads" element={user?.role === UserRole.PROFESSIONAL ? <ProfessionalLeads user={user} profile={proProfile} orders={orders} onUpdateProfile={handleUpdateProfile} onUpdateOrder={updateOrder} /> : <Navigate to="/auth" />} />
            <Route path="/profissional/recarregar" element={user?.role === UserRole.PROFESSIONAL ? <RechargeCredits onAddCredits={(amt) => handleUpdateProfile({ ...proProfile!, credits: proProfile!.credits + amt })} /> : <Navigate to="/auth" />} />
            <Route path="/configuracoes" element={<ProfileSettings user={user} profile={proProfile} />} />
            <Route path="/admin" element={user?.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
