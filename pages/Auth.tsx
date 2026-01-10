import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
        
        // Buscar o perfil para saber para onde redirecionar
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === UserRole.PROFESSIONAL) {
          navigate('/profissional/dashboard');
        } else if (profile?.role === UserRole.ADMIN) {
          navigate('/admin');
        } else {
          navigate('/cliente/dashboard');
        }
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: signUpData.user.id,
                full_name: name,
                role: role,
                credits: role === UserRole.PROFESSIONAL ? 15 : 0, // Bônus inicial de 15 créditos
                completed_jobs: 0,
                rating: 5.0
              }
            ]);
          
          if (profileError) throw profileError;
          setSuccessMsg("Conta criada com sucesso! Você já pode fazer login.");
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-[2.5rem] border shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-blue-900 tracking-tighter">
          {isLogin ? 'BEM-VINDO' : 'CRIE SUA CONTA'}
        </h2>
        <p className="text-gray-500 mt-2 font-medium">
          {isLogin ? 'Acesse o ecossistema Samej' : 'Comece a escalar seus serviços'}
        </p>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
        <button 
          onClick={() => { setIsLogin(true); setError(null); }}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${isLogin ? 'bg-white shadow-lg text-blue-600 scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Login
        </button>
        <button 
          onClick={() => { setIsLogin(false); setError(null); }}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isLogin ? 'bg-white shadow-lg text-blue-600 scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Registo
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tipo de Perfil</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setRole(UserRole.CLIENT)}
                  className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${role === UserRole.CLIENT ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}
                >
                  Cliente
                </button>
                <button 
                  type="button"
                  onClick={() => setRole(UserRole.PROFESSIONAL)}
                  className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${role === UserRole.PROFESSIONAL ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}
                >
                  Profissional
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva" 
                className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none bg-gray-50 text-gray-900 font-medium transition-all"
              />
            </div>
          </>
        )}
        
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com" 
            className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none bg-gray-50 text-gray-900 font-medium transition-all"
          />
        </div>
        
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Senha</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
            className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none bg-gray-50 text-gray-900 font-medium transition-all"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all mt-4 shadow-xl active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? 'ENTRAR' : 'CRIAR MINHA CONTA')}
        </button>
      </form>
      
      <p className="text-center mt-8 text-xs text-gray-400 font-medium">
        Ao continuar, você concorda com os Termos de Uso e Política de Privacidade da Samej.
      </p>
    </div>
  );
};

export default Auth;