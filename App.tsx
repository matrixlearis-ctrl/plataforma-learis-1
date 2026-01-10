
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
import { User, UserRole, ProfessionalProfile } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);

  // Mock initial session check
  useEffect(() => {
    const savedUser = localStorage.getItem('samej_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      if (parsed.role === UserRole.PROFESSIONAL) {
        setProProfile({
          userId: parsed.id,
          description: "Profissional experiente em reformas residenciais.",
          categories: ['obras', 'pintura'],
          region: "São Paulo",
          rating: 4.8,
          credits: 45,
          completedJobs: 12,
          phone: "+55 11 98888-7777"
        });
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('samej_user');
    setUser(null);
    setProProfile(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar user={user} onLogout={handleLogout} credits={proProfile?.credits} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/auth" element={<Auth onLogin={setUser} />} />
            
            {/* Customer Routes */}
            <Route path="/pedir-orcamento" element={<NewRequest user={user} />} />
            <Route path="/cliente/dashboard" element={
              user?.role === UserRole.CLIENT ? <CustomerDashboard user={user} /> : <Navigate to="/auth" />
            } />

            {/* Professional Routes */}
            <Route path="/profissional/dashboard" element={
              user?.role === UserRole.PROFESSIONAL ? <ProfessionalDashboard user={user} profile={proProfile} /> : <Navigate to="/auth" />
            } />
            <Route path="/profissional/leads" element={
              user?.role === UserRole.PROFESSIONAL ? <ProfessionalLeads user={user} profile={proProfile} onUpdateProfile={setProProfile} /> : <Navigate to="/auth" />
            } />
            <Route path="/configuracoes" element={<ProfileSettings user={user} profile={proProfile} />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
              user?.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/" />
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <footer className="bg-white border-t py-8 px-4 mt-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-600">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Samej</h3>
              <p>Conectando quem precisa de serviços a quem sabe fazer.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Links Úteis</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-blue-600">Como funciona</a></li>
                <li><a href="#" className="hover:text-blue-600">Termos de uso</a></li>
                <li><a href="#" className="hover:text-blue-600">Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Aviso Legal</h3>
              <p className="italic text-xs">
                A Samej não se responsabiliza pela execução, qualidade ou pagamento dos serviços contratados. 
                Atuamos exclusivamente como plataforma de intermediação.
              </p>
            </div>
          </div>
          <div className="text-center mt-8 text-gray-400 text-xs">
            © 2024 Samej Intermediação de Serviços Ltda.
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
