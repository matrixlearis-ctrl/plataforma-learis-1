
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
import { User, UserRole, ProfessionalProfile, OrderRequest, OrderStatus, Review } from './types';
import { supabase, supabaseIsConfigured } from './lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<(ProfessionalProfile & { name: string, avatar: string, id: string })[]>([]);

  useEffect(() => {
    console.log("🛠️ App: Iniciando verificação...");
    
    // TIMEOUT DE SEGURANÇA: Se em 5 segundos não carregar, libera a tela.
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ App: Timeout de segurança atingido. Forçando encerramento do loading.");
        setLoading(false);
      }
    }, 5000);

    if (!supabaseIsConfigured) {
      console.error("❌ App: Supabase não configurado!");
      setLoading(false);
      clearTimeout(safetyTimeout);
      return;
    }

    const initApp = async () => {
      try {
        console.log("🔍 App: Verificando sessão ativa...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("👤 App: Usuário logado detectado:", session.user.id);
          await fetchProfile(session.user.id);
        } else {
          console.log("ℹ️ App: Nenhum usuário logado.");
        }

        console.log("📦 App: Carregando dados do mercado...");
        await Promise.allSettled([
          fetchOrders(),
          fetchProfessionals(),
          fetchReviews()
        ]);
        
        console.log("✅ App: Dados carregados com sucesso.");
      } catch (err) {
        console.error("❌ App: Erro na inicialização:", err);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
        console.log("🚀 App: Pronto para uso.");
      }

      // Real-time
      const channel = supabase.channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => fetchReviews())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchProfessionals())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔑 App: Evento Auth:", event);
      if (session) {
        await fetchProfile(session.user.id);
        setLoading(false); // Garante que sai do loading ao logar
      } else {
        setUser(null);
        setProProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setOrders(data.map(o => ({
        id: o.id, clientId: o.client_id, clientName: o.client_name, category: o.category,
        description: o.description, location: o.location, neighborhood: o.neighborhood,
        deadline: o.deadline, status: o.status as OrderStatus, createdAt: o.created_at,
        lead_price: o.lead_price, unlockedBy: o.unlocked_by || [], leadPrice: o.lead_price || 5
      })));
    } catch (e) { console.error("Erro fetchOrders:", e); }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase.from('reviews').select('*, profiles!client_id(full_name)').order('created_at', { ascending: false });
      if (error) {
        const { data: fallback } = await supabase.from('reviews').select('*');
        if (fallback) setReviews(fallback.map(r => ({
          id: r.id, professionalId: r.professional_id, clientId: r.client_id,
          clientName: 'Cliente Samej', rating: r.rating, comment: r.comment, createdAt: r.created_at
        })));
        return;
      }
      if (data) setReviews(data.map(r => ({
        id: r.id, professionalId: r.professional_id, clientId: r.client_id,
        clientName: (r as any).profiles?.full_name || 'Cliente Samej',
        rating: r.rating, comment: r.comment, createdAt: r.created_at
      })));
    } catch (e) { console.error("Erro fetchReviews:", e); }
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
    console.log("👤 App: Buscando perfil detalhado...");
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
    } catch (e) { console.error("Erro fetchProfile:", e); }
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

  const handleAddReview = async (reviewData: { professionalId: string, rating: number, comment: string }) => {
    if (!user) return;
    const { error } = await supabase.from('reviews').insert([{
      professional_id: reviewData.professionalId,
      client_id: user.id,
      rating: reviewData.rating,
      comment: reviewData.comment
    }]);
    if (error) throw error;
    await fetchReviews();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e3a8a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-white text-2xl font-black tracking-tighter uppercase mb-2">Samej</h1>
          <p className="text-blue-200 text-xs font-bold animate-pulse">Quase lá...</p>
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
            <Route path="/profissionais" element={<ProfessionalDirectory professionals={professionals} reviews={reviews} />} />
            <Route path="/perfil/:id" element={<PublicProfile professionals={professionals} reviews={reviews} />} />
            <Route path="/cliente/dashboard" element={user?.role === UserRole.CLIENT ? <CustomerDashboard user={user} orders={orders} professionals={professionals} onAddReview={handleAddReview} /> : <Navigate to="/auth" />} />
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
