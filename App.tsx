import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
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
import { AlertTriangle, Database } from 'lucide-react';

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
      // 1. Checar sessão
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchProfile(session.user.id);
      }

      // 2. Buscar dados globais
      await Promise.all([
        fetchOrders(),
        fetchProfessionals()
      ]);

      setLoading(false);
    };

    initApp();

    // Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setOrders(data.map(o => ({
          id: o.id,
          clientId: o.client_id,
          clientName: o.client_name,
          category: o.category,
          description: o.description,
          location: o.location,
          neighborhood: o.neighborhood,
          deadline: o.deadline,
          status: o.status as OrderStatus,
          createdAt: o.created_at,
          leadPrice: o.lead_price,
          unlockedBy: o.unlocked_by || []
        })));
      }
    } catch (e) {
      console.warn("Tabela 'orders' pode não existir ainda.");
    }
  };

  const fetchProfessionals = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'PROFESSIONAL');
      
      if (data) {
        setProfessionals(data.map(p => ({
          id: p.id,
          userId: p.id,
          name: p.full_name,
          avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`,
          description: p.description || 'Sem descrição.',
          categories: p.categories || [],
          region: p.region || 'Brasil',
          rating: p.rating || 5,
          credits: p.credits || 0,
          completedJobs: p.completed_jobs || 0,
          phone: p.phone || ''
        })));
      }
    } catch (e) {
      console.warn("Tabela 'profiles' pode não existir ainda.");
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setUser({
        id: data.id,
        name: data.full_name,
        email: '', 
        role: data.role as UserRole,
        avatar: data.avatar_url
      });
      if (data.role === UserRole.PROFESSIONAL) {
        setProProfile({
          userId: data.id,
          description: data.description,
          categories: data.categories,
          region: data.region,
          rating: data.rating,
          credits: data.credits,
          completedJobs: data.completed_jobs,
          phone: data.phone
        });
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProProfile(null);
  };

  const addOrder = async (newOrder: OrderRequest) => {
    const { error } = await supabase.from('orders').insert([{
      client_id: user?.id || null,
      client_name: newOrder.clientName,
      category: newOrder.category,
      description: newOrder.description,
      location: newOrder.location,
      neighborhood: newOrder.neighborhood,
      deadline: newOrder.deadline,
      status: newOrder.status,
      lead_price: newOrder.leadPrice
    }]);
    if (!error) fetchOrders();
  };

  const updateOrder = async (updatedOrder: OrderRequest) => {
    await supabase.from('orders').update({ unlocked_by: updatedOrder.unlockedBy }).eq('id', updatedOrder.id);
    fetchOrders();
  };

  const handleUpdateProfile = async (newProfile: ProfessionalProfile) => {
    await supabase.from('profiles').update({ credits: newProfile.credits, completed_jobs: newProfile.completedJobs }).eq('id', newProfile.userId);
    setProProfile(newProfile);
  };

  if (!supabaseIsConfigured && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border shadow-xl text-center">
          <Database className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Conexão Pendente</h2>
          <p className="text-gray-600 mb-6 text-sm">
            As chaves do Supabase não foram encontradas. Se você já conectou no Vercel, aguarde o próximo deploy ou verifique as variáveis de ambiente.
          </p>
          <div className="bg-gray-100 p-4 rounded-xl font-mono text-[10px] text-gray-500 text-left overflow-x-auto">
            SUPABASE_URL=https://your-project.supabase.co<br/>
            SUPABASE_ANON_KEY=your-anon-key
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e3a8a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-white text-2xl font-black tracking-tighter">SAMEJ</h1>
          <p className="text-blue-200 text-sm mt-2">Sincronizando com a nuvem...</p>
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