
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import CustomerDashboard from './pages/CustomerDashboard';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import OrderManagement from './pages/OrderManagement';
import NewRequest from './pages/NewRequest';
import ProfessionalLeads from './pages/ProfessionalLeads';
import ProfileSettings from './pages/ProfileSettings';
import RechargeCredits from './pages/RechargeCredits';
import PublicProfile from './pages/PublicProfile';
import Terms from './pages/Terms';
import TermsBanner from './components/TermsBanner';
import ResetPassword from './pages/ResetPassword';
import JobOffers from './pages/JobOffers';
import JobDetails from './pages/JobDetails';
import ServicePage from './pages/ServicePage';
import { User, UserRole, ProfessionalProfile, OrderRequest, OrderStatus } from './types';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [isReady, setIsReady] = useState(false); // Substitui loading/isInitializing por um único estado
  const [professionals, setProfessionals] = useState<(ProfessionalProfile & { name: string, avatar: string, id: string })[]>([]);
  const navigate = useNavigate();
  const hasInitialized = React.useRef(false);

  const fetchOrders = async () => {
    try {
      // Opção 2: Limite de Dados - Buscamos apenas os 20 mais recentes para ser mais rápido
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

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
          unlockedBy: o.unlocked_by || [],
          imageUrl: o.image_url
        })));
      }
    } catch (e) {
      console.error("Erro ao buscar pedidos:", e);
    }
  };

  const fetchProfessionals = async () => {
    try {
      // Limitamos a 50 profissionais para a busca inicial
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'PROFESSIONAL')
        .limit(50);

      if (!error && data) {
        setProfessionals(data.map(p => ({
          id: p.id, userId: p.id, name: p.full_name || 'Profissional',
          avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`,
          description: p.description || 'Profissional qualificado.',
          categories: p.categories || [], region: p.region || 'Brasil',
          rating: p.rating || 5, credits: p.credits || 0,
          completedJobs: p.completed_jobs || 0, phone: p.phone || '',
          portfolioUrls: p.portfolio_urls || []
        })));
      }
    } catch (e) { console.error("Erro ao buscar profissionais:", e); }
  };

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        const newUser: User = {
          id: data.id,
          name: data.full_name || 'Usuário',
          email: email || '',
          role: data.role as UserRole,
          avatar: data.avatar_url
        };

        setUser(newUser);

        if (data.role === UserRole.PROFESSIONAL) {
          setProProfile({
            id: data.id,
            userId: data.id,
            name: data.full_name || 'Usuário',
            description: data.description || '',
            categories: data.categories || [],
            region: data.region || '',
            rating: data.rating || 5,
            credits: data.credits || 0,
            completedJobs: data.completed_jobs || 0,
            phone: data.phone || '',
            avatar: data.avatar_url,
            portfolioUrls: data.portfolio_urls || [],
            cep: data.cep || '',
            address: data.address || '',
            number: data.number || '',
            complement: data.complement || '',
            neighborhood: data.neighborhood || '',
            city: data.city || '',
            state: data.state || '',
            experience: data.experience || '',
            profession: data.profession || ''
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
    let mounted = true;

    const handleAuth = async (event: string, session: any) => {
      console.log(`App: Evento de Auth: ${event}`, session?.user?.email || "sem sessão");

      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setProProfile(null);
          setIsReady(true);
        }
        return;
      }

      if (session?.user) {
        const updatedUser = await fetchProfile(session.user.id, session.user.email);
        if (mounted && updatedUser) {
          fetchOrders();
          fetchProfessionals();
        }
      }

      if (mounted) {
        setIsReady(true);
      }

      if (event === 'PASSWORD_RECOVERY') {
        navigate('/redefinir-senha');
      }
    };

    // Inicializa carregamento
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuth(event, session);
    });

    // Verificação inicial manual caso o onAuthStateChange demore a disparar o INITIAL_SESSION
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !user) {
        handleAuth('INITIAL_SESSION', session);
      } else if (!session) {
        if (mounted) setIsReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to run only once

  // Removal of manual hash manipulation to allow Supabase to process recovery tokens

  const handleLogout = async () => {
    console.log("App: Executando logout...");
    setIsReady(false); // Mostra o loader durante o desligamento para evitar flashes
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("App: Erro ao deslogar:", e);
    } finally {
      setUser(null);
      setProProfile(null);
      setIsReady(true);
      navigate('/');
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-darkBlue">
        <div className="text-center">
          <div className="w-16 h-16 border-8 border-white/10 border-t-brand-orange rounded-full animate-spin mx-auto mb-6 shadow-2xl"></div>
          <h1 className="text-white text-3xl font-black uppercase tracking-tighter">Samej</h1>
          <p className="text-brand-orange text-xs font-black uppercase tracking-[0.5em] mt-2 animate-pulse">Carregando Ecossistema</p>
        </div>
      </div>
    );
  }

  const ProtectedRoute = ({ children, role }: { children?: React.ReactNode, role?: UserRole }) => {
    if (!user) return <Navigate to="/auth" />;

    // Verificação especial para administrador específico
    if (role === UserRole.ADMIN) {
      const isAdminEmail = user.email === 'jamesribeiro413@gmail.com' || user.email === 'sacadm1001@gmail.com';
      if (!isAdminEmail) return <Navigate to="/" />;
    }

    if (role && user.role !== role) return <Navigate to="/" />;
    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} onLogout={handleLogout} credits={proProfile?.credits} />
      <TermsBanner />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/auth" element={user ? (
            <Navigate to={
              user.role === UserRole.ADMIN ? "/admin" :
                user.role === UserRole.PROFESSIONAL ? "/profissional/dashboard" : "/cliente/dashboard"
            } replace />
          ) : <Auth />} />
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
              lead_price: o.leadPrice,
              image_url: o.imageUrl
            }]);

            if (!error) {
              await fetchOrders();
            } else {
              console.error('Erro ao salvar pedido:', error);
              throw error;
            }
          }} />} />
          <Route path="/perfil/:id" element={<PublicProfile professionals={professionals} />} />

          <Route path="/cliente/dashboard" element={
            <ProtectedRoute role={UserRole.CLIENT}>
              <CustomerDashboard user={user!} orders={orders} />
            </ProtectedRoute>
          } />

          <Route path="/profissional/dashboard" element={
            <ProtectedRoute role={UserRole.PROFESSIONAL}>
              <ProfessionalDashboard
                user={user!}
                profile={proProfile}
                onUpdateProfile={async (p: ProfessionalProfile) => {
                  const { error } = await supabase.from('profiles').update({
                    full_name: p.name,
                    description: p.description,
                    region: p.region,
                    phone: p.phone,
                    avatar_url: p.avatar,
                    portfolio_urls: p.portfolioUrls,
                    cep: p.cep,
                    address: p.address,
                    number: p.number,
                    complement: p.complement,
                    neighborhood: p.neighborhood,
                    city: p.city,
                    state: p.state,
                    experience: p.experience,
                    profession: p.profession
                  }).eq('id', p.userId);
                  if (!error) setProProfile(p);
                }}
              />
            </ProtectedRoute>
          } />

          <Route path="/profissional/leads" element={
            <ProtectedRoute role={UserRole.PROFESSIONAL}>
              <ProfessionalLeads user={user!} profile={proProfile} orders={orders} onUpdateProfile={async (p) => {
                const { error } = await supabase.from('profiles').update({
                  credits: p.credits,
                  completed_jobs: p.completedJobs
                }).eq('id', p.userId);
                if (!error) setProProfile(p);
              }} onUpdateOrder={async (o) => {
                const { error } = await supabase.from('orders').update({ unlocked_by: o.unlockedBy }).eq('id', o.id);
                if (!error) await fetchOrders();
              }} />
            </ProtectedRoute>
          } />

          <Route path="/profissional/recarregar" element={
            <ProtectedRoute role={UserRole.PROFESSIONAL}>
              <RechargeCredits user={user!} onAddCredits={async (amt) => {
                const newCredits = (proProfile?.credits || 0) + amt;
                await supabase.from('profiles').update({ credits: newCredits }).eq('id', user!.id);
                setProProfile(prev => prev ? { ...prev, credits: newCredits } : null);
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

          <Route path="/admin/usuarios" element={
            <ProtectedRoute role={UserRole.ADMIN}>
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="/admin/pedidos" element={
            <ProtectedRoute role={UserRole.ADMIN}>
              <OrderManagement />
            </ProtectedRoute>
          } />

          <Route path="/trabalhos" element={<JobOffers />} />
          <Route path="/trabalhos/:id" element={<JobDetails user={user} profile={proProfile} onUpdateProfile={(p: ProfessionalProfile) => setProProfile(p)} />} />
          <Route path="/servico/:slug" element={<ServicePage />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
