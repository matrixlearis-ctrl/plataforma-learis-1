
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserRole } from '../types';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, KeyRound, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{message: string, type: 'auth' | 'database' | 'profile_missing' | 'general'} | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        // Passo 1: Autenticação
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          setError({ message: authError.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : authError.message, type: 'auth' });
          setLoading(false);
          return;
        }
        
        if (!authData.user) throw new Error("Usuário não retornado pelo sistema.");

        // Passo 2: Busca de Perfil (Aqui costuma dar erro de RLS)
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        if (profileErr) {
          setError({ 
            message: `Erro de Banco (RLS): O Supabase bloqueou a leitura do seu perfil. Verifique as 'Policies' da tabela 'profiles'. Detalhe: ${profileErr.message}`, 
            type: 'database' 
          });
          setLoading(false);
          return;
        }

        if (!profile) {
          setError({ 
            message: "Login OK, mas não achamos seu nome na tabela 'profiles'. Verifique se a linha com ID " + authData.user.id + " existe no Editor de Tabelas.", 
            type: 'profile_missing' 
          });
          setLoading(false);
          return;
        }
        
        // Redirecionamento
        if (profile.role === UserRole.PROFESSIONAL) navigate('/profissional/dashboard');
        else if (profile.role === UserRole.ADMIN) navigate('/admin');
        else navigate('/cliente/dashboard');

      } else {
        // Fluxo de Cadastro
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: name, role: role } }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              full_name: name,
              role: role,
              credits: role === UserRole.PROFESSIONAL ? 15 : 0,
              completed_jobs: 0,
              rating: 5.0
            });
          
          if (profileError) {
             setError({ message: "Usuário criado, mas erro ao inserir na tabela profiles: " + profileError.message, type: 'database' });
             return;
          }
          
          setSuccessMsg("Conta Samej criada! Redirecionando...");
          setTimeout(() => {
            if (role === UserRole.PROFESSIONAL) navigate('/profissional/dashboard');
            else navigate('/cliente/dashboard');
          }, 1500);
        }
      }
    } catch (err: any) {
      setError({ message: err.message || 'Erro inesperado.', type: 'general' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-[2.5rem] border shadow-2xl relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-blue-900 tracking-tighter uppercase">{isLogin ? 'Entrar' : 'Cadastrar'}</h2>
      </div>

      {error && (
        <div className={`p-5 mb-6 rounded-2xl border-2 flex items-start text-sm font-bold ${
          error.type === 'database' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          {error.type === 'database' ? <Database className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />}
          <span>{error.message}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-5 mb-6 bg-green-50 border-2 border-green-200 text-green-900 rounded-2xl flex items-start text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
        <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl font-black transition-all ${isLogin ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>Login</button>
        <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl font-black transition-all ${!isLogin ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>Cadastro</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setRole(UserRole.CLIENT)} className={`py-3 rounded-xl border-2 font-black text-[10px] ${role === UserRole.CLIENT ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400'}`}>CLIENTE</button>
              <button type="button" onClick={() => setRole(UserRole.PROFESSIONAL)} className={`py-3 rounded-xl border-2 font-black text-[10px] ${role === UserRole.PROFESSIONAL ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400'}`}>PROFISSIONAL</button>
            </div>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Nome" className="w-full p-4 border-2 border-gray-300 rounded-2xl bg-white font-bold text-gray-900 outline-none focus:border-blue-600" />
          </>
        )}
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" className="w-full p-4 border-2 border-gray-300 rounded-2xl bg-white font-bold text-gray-900 outline-none focus:border-blue-600" />
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" className="w-full p-4 border-2 border-gray-300 rounded-2xl bg-white font-bold text-gray-900 outline-none focus:border-blue-600" />
        
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 disabled:opacity-50">
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (isLogin ? 'ENTRAR' : 'CRIAR CONTA')}
        </button>
      </form>
    </div>
  );
};

export default Auth;
