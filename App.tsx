
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import SocialShell from './components/social/SocialShell';
import Landing from './pages/Landing';
import ProfileSettings from './pages/ProfileSettings';
import Terms from './pages/Terms';
import ResetPassword from './pages/ResetPassword';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import SocialProfile from './pages/SocialProfile';
import ProfessionalsPage from './pages/Professionals';
import CompaniesPage from './pages/Companies';
import Business from './pages/Business';
import SearchPage from './pages/SearchPage';
import ProfileRedirect from './pages/ProfileRedirect';
import Signup from './pages/Signup';
import RoleChoice from './pages/RoleChoice';
import { User, UserRole, ProfessionalProfile } from './types';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingRole, setPendingRole] = useState(false);
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);
  const [isReady, setIsReady] = useState(false); // Substitui loading/isInitializing por um único estado
  const navigate = useNavigate();
  const location = useLocation();
  const hasInitialized = React.useRef(false);

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
          setPendingRole(false);
          setIsReady(true);
        }
        return;
      }

      if (session?.user) {
        const meta = session.user.user_metadata || {};
        let updatedUser = await fetchProfile(session.user.id, session.user.email);
        if (!updatedUser) {
          const fullName = meta.full_name || [meta.first_name, meta.last_name].filter(Boolean).join(' ') || 'Usuário';
          await supabase.from('profiles').upsert({
            id: session.user.id,
            full_name: fullName,
            role: 'USER',
            phone: meta.phone || null,
          });
          updatedUser = await fetchProfile(session.user.id, session.user.email);
        }
        if (mounted) setPendingRole(meta.signup_pending === 'role');
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
    if (!user) return <Navigate to="/" />;

    // Verificação especial para administrador específico
    if (role === UserRole.ADMIN) {
      const isAdminEmail = user.email === 'jamesribeiro413@gmail.com' || user.email === 'sacadm1001@gmail.com';
      if (!isAdminEmail) return <Navigate to="/" />;
    }

    if (role && user.role !== role) return <Navigate to="/" />;
    return <>{children}</>;
  };

  const SOCIAL_PREFIXES = ['/feed', '/publicar', '/post/', '/social/', '/profile', '/professionals', '/companies', '/negocios', '/busca', '/search'];
  const isSocialPath = (path: string): boolean =>
    SOCIAL_PREFIXES.some((p) => path === p || path.startsWith(p));

  if (user && pendingRole && location.pathname !== '/escolher-perfil') {
    return <Navigate to="/escolher-perfil" replace />;
  }

  if (location.pathname === '/escolher-perfil') {
    return user ? <RoleChoice user={user} /> : <Navigate to="/criar-conta" replace />;
  }

  if (location.pathname === '/') {
    return user ? <Navigate to="/feed" replace /> : <Landing user={user} />;
  }

  if (location.pathname === '/criar-conta') {
    return user ? <Navigate to="/feed" replace /> : <Signup />;
  }

  if (location.pathname === '/auth' && location.search.includes('tab=register')) {
    return <Navigate to="/criar-conta" replace />;
  }

  if (isSocialPath(location.pathname)) {
    return (
      <SocialShell user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/feed" element={<Feed user={user} />} />
          <Route path="/publicar" element={
            <ProtectedRoute>
              <CreatePost user={user!} />
            </ProtectedRoute>
          } />
          <Route path="/post/:id" element={<PostDetail user={user} />} />
          <Route path="/social/:id" element={<SocialProfile user={user} />} />
          <Route path="/profile" element={<ProfileRedirect user={user} />} />
          <Route path="/professionals" element={<ProfessionalsPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/negocios" element={<Business user={user} />} />
          <Route path="/busca" element={<SearchPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </SocialShell>
    );
  }

  if (location.pathname === '/configuracoes') {
    return (
      <SocialShell user={user} onLogout={handleLogout}>
        <ProtectedRoute>
          <ProfileSettings user={user!} profile={proProfile} />
        </ProtectedRoute>
      </SocialShell>
    );
  }

  return (
    <Routes>
      <Route path="/termos" element={<Terms />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
