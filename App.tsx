
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<(ProfessionalProfile & { name: string, avatar: string, id: string })[]>([]);

  useEffect(() => {
    const initApp = async () => {
      if (!supabaseIsConfigured) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          await fetchProfile(session.user.id);
        }

        await Promise.all([
          fetchOrders(),
          fetchProfessionals()
        ]);

      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) {
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
        leadPrice: o.lead_price || 5, 
        unlockedBy: o.unlocked_by || []
      })));
    }
  };

  const fetchProfessionals = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'PROFESSIONAL');
    if (!error && data) {
      setProfessionals(data.map(p => ({
        id: p.id, 
        userId: p.id, 
        name: p.full_name || 'Profissional', 
        avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`,
        description: p.description || 'Profissional qualificado.', 
        categories: p.categories || [],
        region: p.region || 'Brasil', 
        rating: p.rating || 5, 
        credits: p.credits || 0,
        completedJobs: p.completed_jobs || 0, 
        phone: p.phone || ''
      })));
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!error && data) {
        setUser({ 
          id: data.id, 
          name: data.full_name || 'Usuário', 
          email: '', 
          role: data.role as UserRole, 
          avatar: data.avatar_url 
        });
        
        if (data.role === UserRole.PROFESSIONAL) {
          setProProfile({
            userId: data.id, 
            description: data.description, 
            categories: data.categories || [],
            region: data.region, 
            rating: data.rating || 5, 
            credits: data.credits || 0,
            completedJobs: data.completed_jobs || 0, 
            phone: data.phone || ''
          });
        }
      }
    } catch (e) {}
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProProfile(null);
    window.location.hash = '/auth';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e3a8a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-white text-2xl font-black uppercase tracking-tighter">Samej</h1>
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
                client_id: user?.id, 
                client_name: o.clientName, 
                category: o.category,
                description: o.description, 
                location: o.location, 
                neighborhood: o.neighborhood,
                deadline: o.deadline, 
                status: o.status, 
                lead_price: o.leadPrice
              }]);
              if (!error) await fetchOrders();
            }} />} />
            <Route path="/profissionais" element={<ProfessionalDirectory professionals={professionals} />} />
            <Route path="/perfil/:id" element={<PublicProfile professionals={professionals} />} />
            <Route path="/cliente/dashboard" element={user?.role === UserRole.CLIENT ? <CustomerDashboard user={user} orders={orders} /> : <Navigate to="/auth" />} />
            <Route path="/profissional/dashboard" element={user?.role === UserRole.PROFESSIONAL ? <ProfessionalDashboard user={user} profile={proProfile} /> : <Navigate to="/auth" />} />
            <Route path="/profissional/leads" element={user?.role === UserRole.PROFESSIONAL ? <ProfessionalLeads user={user} profile={proProfile} orders={orders} onUpdateProfile={async (p) => {
              await supabase.from('profiles').update({ 
                credits: p.credits,
                completed_jobs: p.completedJobs 
              }).eq('id', p.userId);
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
