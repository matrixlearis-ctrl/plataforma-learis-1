
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { Menu, User as UserIcon, LogOut, Coins, Bell } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  credits?: number;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, credits }) => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-2xl font-bold text-blue-900 tracking-tight">Samej</span>
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">Início</Link>
          {!user && (
            <>
              <Link to="/auth" className="text-gray-600 hover:text-blue-600 font-medium">Sou Profissional</Link>
              <Link to="/pedir-orcamento" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">
                Pedir Orçamento
              </Link>
            </>
          )}

          {user && (
            <div className="flex items-center space-x-4">
              {user.role === UserRole.PROFESSIONAL && (
                <div className="flex items-center bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <Coins className="w-4 h-4 text-amber-600 mr-2" />
                  <span className="text-sm font-bold text-amber-700">{credits ?? 0} créditos</span>
                </div>
              )}
              
              <Link to={user.role === UserRole.PROFESSIONAL ? "/profissional/dashboard" : "/cliente/dashboard"} 
                className="text-gray-600 hover:text-blue-600">
                <UserIcon className="w-6 h-6" />
              </Link>
              
              <button onClick={onLogout} className="text-gray-400 hover:text-red-500">
                <LogOut className="w-6 h-6" />
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
