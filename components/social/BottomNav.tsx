import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Search, Briefcase, Building2, UserRound, PlusCircle, Megaphone } from 'lucide-react';
import { User } from '../../types';

interface BottomNavProps {
  user: User | null;
}

const BottomNav: React.FC<BottomNavProps> = ({ user }) => {
  const meId = user?.id ?? null;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center flex-1 py-1.5 text-[10px] font-black transition-colors ${
      isActive ? 'text-brand-orange' : 'text-gray-400'
    }`;

  const withUser = (
    <>
      <NavLink to="/feed" className={linkClass}>
        <Home className="w-5 h-5" /> Início
      </NavLink>
      <NavLink to="/busca" className={linkClass}>
        <Search className="w-5 h-5" /> Buscar
      </NavLink>
      <Link to="/publicar" className="flex-1 flex items-center justify-center -mt-4">
        <span className="w-12 h-12 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg shadow-orange-200 active:scale-95 transition-transform">
          <PlusCircle className="w-6 h-6" />
        </span>
      </Link>
      <NavLink to="/professionals" className={linkClass}>
        <Briefcase className="w-5 h-5" /> Profissionais
      </NavLink>
      <NavLink to={meId ? `/social/${meId}` : '/criar-conta'} className={linkClass}>
        <UserRound className="w-5 h-5" /> Perfil
      </NavLink>
    </>
  );

  const withoutUser = (
    <>
      <NavLink to="/feed" className={linkClass}>
        <Home className="w-5 h-5" /> Início
      </NavLink>
      <NavLink to="/busca" className={linkClass}>
        <Search className="w-5 h-5" /> Buscar
      </NavLink>
      <NavLink to="/professionals" className={linkClass}>
        <Briefcase className="w-5 h-5" /> Profissionais
      </NavLink>
      <NavLink to="/companies" className={linkClass}>
        <Building2 className="w-5 h-5" /> Empresas
      </NavLink>
      <NavLink to="/negocios" className={linkClass}>
        <Megaphone className="w-5 h-5" /> Anunciar
      </NavLink>
    </>
  );

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] flex items-stretch pb-[env(safe-area-inset-bottom)]">
      {user ? withUser : withoutUser}
    </nav>
  );
};

export default BottomNav;