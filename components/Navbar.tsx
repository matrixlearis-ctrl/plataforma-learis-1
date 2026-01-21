import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole } from '../types';
import { Menu, X, User as UserIcon, LogOut, Coins, Search, PlusCircle } from 'lucide-react';

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
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        <Link to="/" onClick={closeMenu} className="flex items-center space-x-3 h-full">
          {/* Logo Principal do Usuário */}
          <div className="flex items-center py-2 h-full">
            <img
              src="/images/logo.png"
              alt="Samej Logo"
              className="h-full w-auto max-h-[60px] object-contain"
              onError={(e) => {
                // Fallback elegante caso a imagem não seja encontrada
                e.currentTarget.parentElement?.classList.add('hidden');
                e.currentTarget.parentElement?.nextElementSibling?.classList.remove('hidden');
              }}
            />
          </div>
          {/* Logo Alternativa (Caso a imagem falhe) */}
          <div className="hidden flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-black text-2xl">S</span>
            </div>
            <span className="text-2xl font-black text-black tracking-tight">Samej</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-8">
          <Link to="/profissionais" className="text-gray-700 hover:text-brand-blue font-bold text-[20px] transition-colors flex items-center">
            <Search className="w-4 h-4 mr-2" /> Encontrar Profissionais
          </Link>

          {!user && (
            <>
              <Link to="/auth" className="text-gray-700 hover:text-brand-blue font-bold text-[20px] transition-colors">Entrar</Link>
              <Link to="/pedir-orcamento" className="bg-brand-orange text-white px-7 py-3 rounded-full hover:bg-brand-lightOrange font-black text-[20px] transition-all shadow-lg hover:shadow-orange-200 active:scale-95 uppercase">
                Pedir Orçamento Grátis
              </Link>
            </>
          )}

          {user && (
            <div className="flex items-center space-x-6">
              {user.role === UserRole.PROFESSIONAL && (
                <Link to="/profissional/recarregar" className="flex items-center bg-amber-50 px-4 py-2 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors">
                  <Coins className="w-4 h-4 text-brand-orange mr-2" />
                  <span className="text-xs font-black text-amber-800">{credits ?? 0} <span className="opacity-50">CR</span></span>
                </Link>
              )}

              <Link to={user.role === UserRole.PROFESSIONAL ? "/profissional/dashboard" : "/cliente/dashboard"}
                className="group flex items-center space-x-3 bg-gray-50 pr-4 pl-1.5 py-1.5 rounded-full border border-gray-100 hover:border-brand-blue/30 transition-all">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-gray-400" />}
                </div>
                <span className="text-[20px] font-bold text-gray-800 group-hover:text-brand-blue transition-colors">{user.name.split(' ')[0]}</span>
              </Link>

              <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button onClick={toggleMenu} className="lg:hidden text-brand-darkBlue p-2 bg-gray-50 rounded-lg">
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b shadow-2xl z-50 animate-in slide-in-from-top duration-300">
          <div className="p-6 space-y-5">
            <Link to="/profissionais" onClick={closeMenu} className="flex items-center p-4 text-gray-800 font-black hover:bg-brand-blue/5 rounded-2xl">
              <Search className="w-5 h-5 mr-4 text-brand-blue" /> Encontrar Profissionais
            </Link>

            {user ? (
              <div className="space-y-4">
                <div className="p-5 bg-brand-bg rounded-[2rem] border border-gray-100">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest">MINHA CONTA</p>
                  <Link to={user.role === UserRole.PROFESSIONAL ? "/profissional/dashboard" : "/cliente/dashboard"} onClick={closeMenu} className="flex items-center font-black text-gray-800 py-3">
                    <UserIcon className="w-5 h-5 mr-4 text-brand-blue" /> Painel Principal
                  </Link>
                  {user.role === UserRole.PROFESSIONAL && (
                    <Link to="/profissional/recarregar" onClick={closeMenu} className="flex items-center font-black text-brand-orange py-3">
                      <Coins className="w-5 h-5 mr-4" /> Saldo: {credits} créditos
                    </Link>
                  )}
                </div>
                <button onClick={() => { onLogout(); closeMenu(); }} className="w-full flex items-center p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors">
                  <LogOut className="w-5 h-5 mr-4" /> Sair da Conta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-100">
                <Link to="/auth" onClick={closeMenu} className="block p-4 text-gray-800 font-black hover:bg-gray-50 rounded-2xl text-center border-2 border-gray-100">
                  ENTRAR
                </Link>
                <Link to="/pedir-orcamento" onClick={closeMenu} className="block p-5 bg-brand-orange text-white font-black rounded-2xl text-center shadow-lg active:scale-95 uppercase">
                  PEDIR ORÇAMENTO GRÁTIS
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;