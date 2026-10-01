import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home, UserRound, Search, Briefcase, Building2, Megaphone, Settings, X, LogOut,
} from 'lucide-react';
import { User } from '../../types';
import { roleLabel } from '../../lib/format';
import Avatar from '../Avatar';

interface LeftMenuProps {
  user: User | null;
  onLogout: () => void;
  mobile?: boolean;
  onCloseMobile?: () => void;
}

const LeftMenu: React.FC<LeftMenuProps> = ({ user, onLogout, mobile, onCloseMobile }) => {
  const meId = user?.id ?? null;
  const { pathname } = useLocation();

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2.5 rounded-xl text-sm font-black transition-colors ${
      isActive ? 'bg-brand-blue text-white shadow' : 'text-gray-700 hover:bg-gray-100'
    }`;

  const iconClass = 'w-5 h-5 mr-3 flex-shrink-0';

  return (
    <div className={mobile ? 'p-4' : ''}>
      <div className={`${mobile ? 'flex items-center justify-between mb-3' : 'md:hidden'}`}>
        {mobile && (
          <>
            <p className="font-black text-gray-900">Menu</p>
            <button onClick={onCloseMobile} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <nav className="space-y-1">
        <NavLink to="/feed" end className={itemClass} onClick={onCloseMobile}>
          <Home className={iconClass} /> Início
        </NavLink>
        <NavLink
          to={meId ? `/social/${meId}` : '/criar-conta'}
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-xl text-sm font-black transition-colors ${
              isActive ? 'bg-brand-blue text-white shadow' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
          onClick={onCloseMobile}
        >
          <UserRound className={iconClass} /> Meu perfil
        </NavLink>
        <NavLink to="/busca" className={itemClass} onClick={onCloseMobile}>
          <Search className={iconClass} /> Buscar
        </NavLink>
        <NavLink to="/professionals" className={itemClass} onClick={onCloseMobile}>
          <Briefcase className={iconClass} /> Profissionais
        </NavLink>
        <NavLink to="/companies" className={itemClass} onClick={onCloseMobile}>
          <Building2 className={iconClass} /> Empresas
        </NavLink>
        <NavLink
          to="/negocios"
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-black transition-colors ${
            location.pathname.startsWith('/negocios')
              ? 'bg-brand-orange text-white shadow'
              : 'text-brand-orange bg-orange-50 hover:bg-orange-100 border border-orange-100'
          }`}
          onClick={onCloseMobile}
        >
          <span className="flex items-center min-w-0">
            <Megaphone className="w-5 h-5 mr-3 flex-shrink-0" /> Anunciar meu negócio grátis
          </span>
          <span className="ml-2 text-[9px] uppercase tracking-widest bg-white text-brand-orange rounded-full px-2 py-0.5 font-black flex-shrink-0">
            Grátis
          </span>
        </NavLink>
        <NavLink to="/configuracoes" className={itemClass} onClick={onCloseMobile}>
          <Settings className={iconClass} /> Configurações
        </NavLink>
      </nav>

      {user && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 px-2">
            <Avatar src={user.avatar} alt={user.name} size={40} linkTo={meId ? `/social/${meId}` : ''} />
            <div className="min-w-0">
              <p className="font-black text-gray-900 text-sm truncate">{user.name}</p>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{roleLabel(user.role)}</p>
            </div>
          </div>
          {mobile && (
            <button onClick={onLogout} className="mt-3 w-full flex items-center px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <LogOut className="w-5 h-5 mr-3" /> Sair da conta
            </button>
          )}
        </div>
      )}

      {!user && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            to="/criar-conta"
            onClick={onCloseMobile}
            className="flex items-center justify-center w-full bg-brand-orange text-white py-2.5 rounded-xl font-black text-sm hover:bg-brand-lightOrange shadow active:scale-95 transition-all"
          >
            Entrar / Criar conta
          </Link>
        </div>
      )}
    </div>
  );
};

export default LeftMenu;