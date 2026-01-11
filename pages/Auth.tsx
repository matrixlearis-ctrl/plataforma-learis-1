
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserRole } from '../types';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || searchParams.get('mode') === 'reset') {
      setIsResettingPassword(true);
    }
  }, [searchParams]);

  const translateError = (err: any): string => {
    const message = err?.message || String(err);
    
    if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos. Verifique e tente novamente.';
    if (message.includes('User already registered')) return 'Este e-mail já está em uso por outra conta.';
    if (message.includes('security purposes')) return 'Por segurança, aguarde alguns segundos antes de tentar novamente.';
    if (message.includes('row-level security policy') || message.includes('permission denied')) {
      return 'Erro de permissão no banco de dados. Certifique-se de ter executado as políticas RLS para a tabela "profiles" no Editor SQL do Supabase.';
    }
    if (message.includes('Email not confirmed')) return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
    if (message.includes('Password should be at least 6 characters')) return 'A senha deve conter no mínimo 6 caracteres.';
    
    return 'Erro ao processar solicitação. Tente novamente em instantes.';
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/auth?mode=reset`,
      });
      if (resetError) throw resetError;
      setSuccessMsg("Link enviado! Verifique seu e-mail.");
    } catch (err: any) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccessMsg("Senha atualizada! Redirecionando...");
      setTimeout(() => {
        setIsResettingPassword(false);
        setIsLogin(true);
      }, 2000);
    } catch (err: any) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (profile?.role === UserRole.PROFESSIONAL) navigate('/profissional/dashboard');
        else if (profile?.role === UserRole.ADMIN) navigate('/admin');
        else navigate('/cliente/dashboard');
      } else {
        // Cadastro de novo usuário
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: name, role: role }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Criar perfil manualmente se o trigger do banco não estiver ativo
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: signUpData.user.id,
              full_name: name,
              role: role,
              credits: role === UserRole.PROFESSIONAL ? 15 : 0,
              completed_jobs: 0,
              rating: 5.0
            });
          
          if (profileError) throw profileError;
          
          setSuccessMsg("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-[2.5rem] border shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
      
      {isResettingPassword ? (
        <div className="animate-in fade-in duration-500">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-blue-900 tracking-tighter">NOVA SENHA</h2>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha (min. 6 caracteres)" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none bg-gray-50 focus:bg-white focus:border-blue-500 transition-all" />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl disabled:opacity-50">
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'ATUALIZAR SENHA'}
            </button>
          </form>
        </div>
      ) : isForgotPassword ? (
        <div className="animate-in fade-in duration-500">
          <button onClick={() => setIsForgotPassword(false)} className="flex items-center text-gray-400 hover:text-blue-600 font-bold mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </button>
          <h2 className="text-3xl font-black text-blue-900 tracking-tighter text-center mb-8">RECUPERAR SENHA</h2>
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail cadastrado" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none bg-gray-50" />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl disabled:opacity-50">
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'ENVIAR LINK'}
            </button>
          </form>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-blue-900 tracking-tighter uppercase">{isLogin ? 'Bem-vindo' : 'Cadastro'}</h2>
            <p className="text-gray-500 mt-2 font-medium">{isLogin ? 'Acesse sua conta Samej' : 'Crie sua conta profissional ou cliente'}</p>
          </div>

          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${isLogin ? 'bg-white shadow-lg text-blue-600' : 'text-gray-500'}`}>Login</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isLogin ? 'bg-white shadow-lg text-blue-600' : 'text-gray-500'}`}>Cadastro</button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-start text-xs font-bold animate-pulse">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-start text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setRole(UserRole.CLIENT)} className={`py-3 rounded-xl border-2 font-bold text-xs ${role === UserRole.CLIENT ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}>CLIENTE</button>
                  <button type="button" onClick={() => setRole(UserRole.PROFESSIONAL)} className={`py-3 rounded-xl border-2 font-bold text-xs ${role === UserRole.PROFESSIONAL ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}>PROFISSIONAL</button>
                </div>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none bg-gray-50 focus:bg-white focus:border-blue-500 transition-all" />
              </>
            )}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none bg-gray-50 focus:bg-white focus:border-blue-500 transition-all" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none bg-gray-50 focus:bg-white focus:border-blue-500 transition-all" />
            
            {isLogin && (
              <div className="text-right">
                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs font-bold text-blue-600 hover:underline">Esqueci minha senha</button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl disabled:opacity-50 mt-4">
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (isLogin ? 'ENTRAR' : 'CRIAR CONTA')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Auth;
