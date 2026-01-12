
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
  const [showBypass, setShowBypass] = useState(false);
  const [professionals, setProfessionals] = useState<(ProfessionalProfile & { name: string, avatar: string, id: string })[]>([]);

  useEffect(() => {
    console.log("🚀 [Samej] Iniciando App...");
    
    // Timer para mostrar o botão de "Pular" caso o banco demore demais
    const bypassTimer = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ [Samej] O banco de dados está demorando. Ativando bypass.");
        setShowBypass(true);
      }
    }, 3000);

    // Timer fatal para forçar a entrada de qualquer jeito
    const fatalTimer = setTimeout(() => {
      if (loading) {
        console.error("🔥 [Samej] Forçando entrada após 8s de espera.");
        setLoading(false);
      }
    }, 8000);

    const initApp = async () => {
      if (!supabaseIsConfigured) {
        console.error("❌ [Samej] Supabase não configurado corretamente.");
        setLoading(false);
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session) {
          console.log("👤 [Samej] Sessão ativa:", session.user.id);
          await fetchProfile(session.user.id);
        }

        // Carregar dados básicos sem travar o app se um falhar
        console.log("📡 [Samej] Sincronizando dados...");
        await Promise.all([
          fetchOrders().catch(e => console.warn("Erro ordens:", e)),
          fetchProfessionals().catch(e => console.warn("Erro profissionais:", e)),
          fetchReviews().catch(e => console.warn("Erro reviews:", e))
        ]);

      } catch (err) {
        console.error("🚨 [Samej] Falha crítica no carregamento:", err);
      } finally {
        setLoading(false);
        clearTimeout(bypassTimer);
        clearTimeout(fatalTimer);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔑 [Samej] Evento Auth:", event);
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(bypassTimer);
      clearTimeout(fatalTimer);
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (data) setOrders(data.map(o => ({
      id: o.id, clientId: o.client_id, clientName: o.client_name, category: o.category,
      description: o.description, location: o.location, neighborhood: o.neighborhood,
      deadline: o.deadline, status: o.status as OrderStatus, createdAt: o.created_at,
      leadPrice: o.lead_price || 5, unlockedBy: o.unlocked_by || []
    })));
  };

  const fetchReviews = async () => {
    // Busca simples para evitar erros de join se as tabelas não estiverem vinculadas
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (data) setReviews(data.map(r => ({
      id: r.id, professionalId: r.professional_id, clientId: r.client_id,
      clientName: 'Cliente Samej', rating: r.rating, comment: r.comment, createdAt: r.created_at
    })));
  };

  const fetchProfessionals = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'PROFESSIONAL');
    if (error) throw error;
    if (data) setProfessionals(data.map(p => ({
      id: p.id, userId: p.id, name: p.full_name, avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`,
      description: p.description || 'Profissional qualificado.', categories: p.categories || [],
      region: p.region || 'Brasil', rating: p.rating || 5, credits: p.credits || 0,
      completedJobs: p.completed_jobs || 0, phone: p.phone || ''
    })));
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
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
    window.location.hash = '/auth';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e3a8a] p-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-8"></div>
          <h1 className="text-white text-3xl font-black tracking-tighter uppercase mb-4">Samej</h1>
          <p className="text-blue-200 text-sm font-bold animate-pulse mb-8">Iniciando sistemas e conectando ao banco de dados...</p>
          
          {showBypass && (
            <button 
              onClick={() => setLoading(false)}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold text-xs transition-all border border-white/10 animate-in fade-in zoom-in"
            >
              CONEXÃO LENTA? ENTRAR ASSIM MESMO
            </button>
          )}
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
            <Route path="/pedir-orcamento" element={<NewRequest user={user} onAddOrder={async (o) => {
              const { error } = await supabase.from('orders').insert([{
                client_id: user?.id, client_name: o.clientName, category: o.category,
                description: o.description, location: o.location, neighborhood: o.neighborhood,
                deadline: o.deadline, status: o.status, lead_price: o.leadPrice
              }]);
              if (error) throw error;
              await fetchOrders();
            }} />} />
            <Route path="/profissionais" element={<ProfessionalDirectory professionals={professionals} reviews={reviews} />} />
            <Route path="/perfil/:id" element={<PublicProfile professionals={professionals} reviews={reviews} />} />
            <Route path="/cliente/dashboard" element={user?.role === UserRole.CLIENT ? <CustomerDashboard user={user} orders={orders} professionals={professionals} onAddReview={async (r) => {
              await supabase.from('reviews').insert([{ professional_id: r.professionalId, client_id: user.id, rating: r.rating, comment: r.comment }]);
              await fetchReviews();
            }} /> : <Navigate to="/auth" />} />
            <Route path="/profissional/dashboard" element={user?.role === UserRole.PROFESSIONAL ? <ProfessionalDashboard user={user} profile={proProfile} /> : <Navigate to="/auth" />} />
            <Route path="/profissional/leads" element={user?.role === UserRole.PROFESSIONAL ? <ProfessionalLeads user={user} profile={proProfile} orders={orders} onUpdateProfile={async (p) => {
              await supabase.from('profiles').update({ credits: p.credits }).eq('id', p.userId);
              setProProfile(p);
            }} onUpdateOrder={async (o) => {
              await supabase.from('orders').update({ unlocked_by: o.unlockedBy }).eq('id', o.id);
              await fetchOrders();
            }} /> : <Navigate to="/auth" />} />
            <Route path="/profissional/recarregar" element={user?.role === UserRole.PROFESSIONAL ? <RechargeCredits onAddCredits={async (amt) => {
               const newCredits = (proProfile?.credits || 0) + amt;
               await supabase.from('profiles').update({ credits: newCredits }).eq('id', user.id);
               setProProfile(prev => prev ? {...prev, credits: newCredits} : null);
            }} /> : <Navigate to="/auth" />} />
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
