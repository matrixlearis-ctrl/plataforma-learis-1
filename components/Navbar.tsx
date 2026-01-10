
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { Menu, User as UserIcon, LogOut, Coins, Search } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  credits?: number;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, credits }) => {
  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-2xl font-bold text-blue-900 tracking-tight">Samej</span>
        </Link>

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
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-gray-700">{user.name.split(' ')[0]}</span>
              </Link>
              
              <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <button className="md:hidden text-gray-600">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
