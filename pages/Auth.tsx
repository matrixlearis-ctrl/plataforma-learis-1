
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { User as UserIcon, Briefcase, ShieldCheck } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('samej_user', JSON.stringify(user));
    onLogin(user);
    
    if (user.role === UserRole.PROFESSIONAL) navigate('/profissional/dashboard');
    else if (user.role === UserRole.ADMIN) navigate('/admin');
    else navigate('/cliente/dashboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || 'Usuário Samej',
      email: email,
      role: isLogin ? (email.includes('admin') ? UserRole.ADMIN : (email.includes('pro') ? UserRole.PROFESSIONAL : UserRole.CLIENT)) : role
    };
    handleLoginSuccess(user);
  };

  const quickLogin = (type: UserRole) => {
    const mockUsers = {
      [UserRole.CLIENT]: { id: 'c123', name: 'João Cliente (Teste)', email: 'cliente@samej.com', role: UserRole.CLIENT },
      [UserRole.PROFESSIONAL]: { id: 'p123', name: 'Carlos Pro (Teste)', email: 'pro@samej.com', role: UserRole.PROFESSIONAL },
      [UserRole.ADMIN]: { id: 'a123', name: 'Admin Samej', email: 'admin@samej.com', role: UserRole.ADMIN },
    };
    handleLoginSuccess(mockUsers[type]);
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-blue-900">{isLogin ? 'Bem-vindo de volta' : 'Crie a sua conta'}</h2>
        <p className="text-gray-500 mt-2">{isLogin ? 'Acesse o seu painel Samej' : 'Comece a usar a Samej hoje mesmo'}</p>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
        <button 
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${isLogin ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
        >
          Login
        </button>
        <button 
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${!isLogin ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
        >
          Registo
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
              >
                <option value={UserRole.CLIENT}>Quero contratar serviços</option>
                <option value={UserRole.PROFESSIONAL}>Sou profissional / empresa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva" 
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
              />
            </div>
          </>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com" 
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input 
            type="password" 
            required 
            placeholder="••••••••" 
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all mt-4 shadow-lg active:scale-95"
        >
          {isLogin ? 'Entrar' : 'Criar Conta'}
        </button>
      </form>

      {/* Quick Login Section */}
      <div className="mt-10 pt-8 border-t">
        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Acesso Rápido para Testes</p>
        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => quickLogin(UserRole.CLIENT)}
            className="flex items-center justify-center space-x-3 w-full p-3 border-2 border-blue-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
          >
            <UserIcon className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-blue-700">Entrar como Cliente</span>
          </button>
          <button 
            onClick={() => quickLogin(UserRole.PROFESSIONAL)}
            className="flex items-center justify-center space-x-3 w-full p-3 border-2 border-amber-100 rounded-xl hover:bg-amber-50 hover:border-amber-200 transition-all group"
          >
            <Briefcase className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-amber-700">Entrar como Profissional</span>
          </button>
          <button 
            onClick={() => quickLogin(UserRole.ADMIN)}
            className="flex items-center justify-center space-x-3 w-full p-3 border-2 border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all group"
          >
            <ShieldCheck className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-red-700">Entrar como Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
