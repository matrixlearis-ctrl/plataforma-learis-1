
// Add explicit React import to resolve the React namespace issue
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole } from '../types';
import { Menu, X, User as UserIcon, LogOut, Coins, Search, Plus } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  credits?: number;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, credits }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" onClick={closeMenu} className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-2xl font-bold text-blue-900 tracking-tight">Samej</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-600 hover:text-blue-600 font-semibold text-sm">Início</Link>
          <Link to="/profissionais" className="text-gray-600 hover:text-blue-600 font-semibold text-sm flex items-center">
            <Search className="w-4 h-4 mr-1" /> Encontrar Profissionais
          </Link>
          
          {!user && (
            <>
              <Link to="/auth" className="text-gray-600 hover:text-blue-600 font-semibold text-sm">Sou Profissional</Link>
              <Link to="/pedir-orcamento" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-bold text-sm transition-all shadow-md">
                Pedir Orçamento
              </Link>
            </>
          )}

          {user && (
            <div className="flex items-center space-x-5">
              {user.role === UserRole.PROFESSIONAL && (
                <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                  <Coins className="w-4 h-4 text-amber-600 mr-2" />
                  <span className="text-xs font-black text-amber-700">{credits ?? 0}</span>
                </div>
              )}
              
              <Link to={user.role === UserRole.PROFESSIONAL ? "/profissional/dashboard" : "/cliente/dashboard"} 
                className="text-gray-600 hover:text-blue-600 flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4" />}
                </div>
                <span className="text-sm font-bold text-gray-700">{user.name.split(' ')[0]}</span>
              </Link>
              
              <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button onClick={toggleMenu} className="md:hidden text-gray-600 p-2">
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b shadow-xl z-50 animate-in slide-in-from-top duration-300">
          <div className="p-4 space-y-4">
            <Link to="/profissionais" onClick={closeMenu} className="flex items-center p-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl">
              <Search className="w-5 h-5 mr-3 text-blue-600" /> Encontrar Profissionais
            </Link>
            
            {user ? (
              <>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-black text-gray-400 uppercase mb-2">Minha Conta</p>
                  <Link to={user.role === UserRole.PROFESSIONAL ? "/profissional/dashboard" : "/cliente/dashboard"} onClick={closeMenu} className="flex items-center font-bold text-gray-800 py-2">
                    <UserIcon className="w-5 h-5 mr-3 text-blue-600" /> Painel de Controle
                  </Link>
                  {user.role === UserRole.PROFESSIONAL && (
                    <Link to="/profissional/recarregar" onClick={closeMenu} className="flex items-center font-bold text-amber-600 py-2">
                      <Coins className="w-5 h-5 mr-3" /> Saldo: {credits} créditos
                    </Link>
                  )}
                </div>
                <button onClick={() => { onLogout(); closeMenu(); }} className="w-full flex items-center p-3 text-red-500 font-bold hover:bg-red-50 rounded-xl">
                  <LogOut className="w-5 h-5 mr-3" /> Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" onClick={closeMenu} className="block p-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl text-center border-2 border-gray-100">
                  Entrar / Cadastro
                </Link>
                <Link to="/pedir-orcamento" onClick={closeMenu} className="block p-4 bg-blue-600 text-white font-bold rounded-xl text-center shadow-lg">
                  Pedir Orçamento Grátis
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
