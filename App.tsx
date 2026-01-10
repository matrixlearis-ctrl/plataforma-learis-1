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
import { Database, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';

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
    };

    initApp();

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
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setOrders(data.map(o => ({
        id: o.id, clientId: o.client_id, clientName: o.client_name, category: o.category,
        description: o.description, location: o.location, neighborhood: o.neighborhood,
        deadline: o.deadline, status: o.status as OrderStatus, createdAt: o.created_at,
        leadPrice: o.lead_price, unlockedBy: o.unlocked_by || []
      })));
    } catch (e) {}
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
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
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
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProProfile(null);
  };

  const addOrder = async (newOrder: OrderRequest) => {
    const { error } = await supabase.from('orders').insert([{
      client_id: user?.id || null, client_name: newOrder.clientName, category: newOrder.category,
      description: newOrder.description, location: newOrder.location, neighborhood: newOrder.neighborhood,
      deadline: newOrder.deadline, status: newOrder.status, lead_price: newOrder.leadPrice
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] border shadow-2xl text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <Database className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Conexão Pendente</h2>
          <p className="text-gray-500 mb-8 font-medium leading-relaxed">
            As chaves do Supabase não foram encontradas no ambiente de execução. Adicione as variáveis abaixo no seu painel de deploy (Vercel/Settings):
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="bg-gray-50 p-4 rounded-2xl border text-left font-mono text-xs flex justify-between items-center group cursor-pointer hover:bg-white transition-colors">
              <span className="text-blue-600 font-bold">VITE_SUPABASE_URL</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border text-left font-mono text-xs flex justify-between items-center group cursor-pointer hover:bg-white transition-colors">
              <span className="text-blue-600 font-bold">VITE_SUPABASE_ANON_KEY</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          <a 
            href="https://supabase.com/dashboard/project/_/settings/api" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            BUSCAR NO SUPABASE
            <ExternalLink className="ml-2 w-5 h-5" />
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e3a8a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-white text-xl font-black tracking-tighter">SAMEJ</h1>
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