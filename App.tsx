
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
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [professionals, setProfessionals] = useState<(ProfessionalProfile & { name: string, avatar: string, id: string })[]>([]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setOrders(data.map(o => ({
          id: o.id, 
          clientId: o.client_id, 
          clientName: o.client_name, 
          category: o.category,
          description: o.description, 
          phone: o.phone || '',
          address: o.address || '', 
          number: o.number || '', 
          complement: o.complement || '',
          location: o.location, 
          neighborhood: o.neighborhood || '',
          deadline: o.deadline, 
          status: o.status as OrderStatus, 
          createdAt: o.created_at,
          leadPrice: o.lead_price || 5, 
          unlockedBy: o.unlocked_by || []
        })));
      }
    } catch (e) { console.error("Erro ao buscar pedidos:", e); }
  };

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'PROFESSIONAL');
      if (!error && data) {
        setProfessionals(data.map(p => ({
          id: p.id, userId: p.id, name: p.full_name || 'Profissional', 
          avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`,
          description: p.description || 'Profissional qualificado.', 
          categories: p.categories || [], region: p.region || 'Brasil', 
          rating: p.rating || 5, credits: p.credits || 0,
          completedJobs: p.completed_jobs || 0, phone: p.phone || ''
        })));
      }
    } catch (e) { console.error("Erro ao buscar profissionais:", e); }
  };

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        const newUser = { 
          id: data.id, 
          name: data.full_name || 'Usuário', 
          email: email || '', 
          role: data.role as UserRole, 
          avatar: data.avatar_url 
        };
        setUser(newUser);
        if (data.role === UserRole.PROFESSIONAL) {
          setProProfile({ 
            userId: data.id, 
            description: data.description || '', 
            categories: data.categories || [], 
            region: data.region || '', 
            rating: data.rating || 5, 
            credits: data.credits || 0, 
            completedJobs: data.completed_jobs || 0, 
            phone: data.phone || '' 
          });
        }
        return newUser;
      }
      return null;
    } catch (e) { 
      console.error("Falha ao carregar perfil:", e); 
      return null;
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchProfile(session.user.id, session.user.email);
        }
        await Promise.all([fetchOrders(), fetchProfessionals()]);
      } catch (err) { 
        console.error("Erro no carregamento inicial:", err);
      } finally { 
        setLoading(false);
        setIsInitializing(false);
      }
    };
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProProfile(null);
      } else if (session) {
        await fetchProfile(session.user.id, session.user.email);
        await fetchOrders();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProProfile(null);
    setLoading(false);
    window.location.hash = '/';
  };

  if (loading || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e3a8a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-white text-2xl font-black uppercase tracking-tighter">Samej</h1>
          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-2 animate-pulse">Sincronizando...</p>
        </div>
      </div>
    );
  }

  const ProtectedRoute = ({ children, role }: { children?: React.ReactNode, role?: UserRole }) => {
    if (!user) return <Navigate to="/auth" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return <>{children}</>;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar user={user} onLogout={handleLogout} credits={proProfile?.credits} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/auth" element={user ? <Navigate to={user.role === UserRole.PROFESSIONAL ? "/profissional/dashboard" : "/cliente/dashboard"} /> : <Auth />} />
            <Route path="/pedir-orcamento" element={<NewRequest user={user} onAddOrder={async (o) => {
              const { error } = await supabase.from('orders').insert([{ 
                client_id: user?.id || null, 
                client_name: o.clientName, 
                category: o.category, 
                description: o.description, 
                phone: o.phone,
                address: o.address,
                number: o.number,
                complement: o.complement,
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
            
            <Route path="/cliente/dashboard" element={
              <ProtectedRoute role={UserRole.CLIENT}>
                <CustomerDashboard user={user!} orders={orders} />
              </ProtectedRoute>
            } />

            <Route path="/profissional/dashboard" element={
              <ProtectedRoute role={UserRole.PROFESSIONAL}>
                <ProfessionalDashboard user={user!} profile={proProfile} />
              </ProtectedRoute>
            } />

            <Route path="/profissional/leads" element={
              <ProtectedRoute role={UserRole.PROFESSIONAL}>
                <ProfessionalLeads user={user!} profile={proProfile} orders={orders} onUpdateProfile={async (p) => {
                  const { error } = await supabase.from('profiles').update({ credits: p.credits, completed_jobs: p.completed_jobs }).eq('id', p.userId);
                  if (!error) setProProfile(p);
                }} onUpdateOrder={async (o) => {
                  const { error } = await supabase.from('orders').update({ unlocked_by: o.unlockedBy }).eq('id', o.id);
                  if (!error) await fetchOrders();
                }} />
              </ProtectedRoute>
            } />

            <Route path="/profissional/recarregar" element={
              <ProtectedRoute role={UserRole.PROFESSIONAL}>
                <RechargeCredits onAddCredits={async (amt) => {
                   const newCredits = (proProfile?.credits || 0) + amt;
                   await supabase.from('profiles').update({ credits: newCredits }).eq('id', user!.id);
                   setProProfile(prev => prev ? {...prev, credits: newCredits} : null);
                }} />
              </ProtectedRoute>
            } />

            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <ProfileSettings user={user!} profile={proProfile} />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute role={UserRole.ADMIN}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
