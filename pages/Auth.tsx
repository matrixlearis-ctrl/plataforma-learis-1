
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tradutor de erros do Supabase para PT-BR
  const translateError = (err: any): string => {
    const message = err.message || '';
    if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (message.includes('User already registered')) return 'Este e-mail já está cadastrado no sistema.';
    if (message.includes('security purposes')) {
      const seconds = message.match(/\d+/);
      return `Por motivos de segurança, aguarde ${seconds ? seconds[0] : 'alguns'} segundos antes de tentar novamente.`;
    }
    if (message.includes('row-level security policy')) {
      return 'Erro de permissão: Verifique as políticas RLS da tabela "profiles" no seu painel do Supabase.';
    }
    if (message.includes('Email not confirmed')) return 'Por favor, confirme seu e-mail antes de acessar.';
    if (message.includes('Password should be at least 6 characters')) return 'A senha deve ter pelo menos 6 caracteres.';
    
    return 'Ocorreu um erro inesperado. Tente novamente em instantes.';
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
      setSuccessMsg("Link de recuperação enviado para o seu e-mail!");
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
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
        
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
                credits: role === UserRole.PROFESSIONAL ? 15 : 0,
                completed_jobs: 0,
                rating: 5.0
              }
            ]);
          
          if (profileError) throw profileError;
          setSuccessMsg("Conta criada com sucesso! Verifique seu e-mail ou faça login.");
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-[2.5rem] border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
        <button 
          onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMsg(null); }}
          className="flex items-center text-gray-400 hover:text-blue-600 font-bold mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Login
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-blue-900 tracking-tighter">RECUPERAR SENHA</h2>
          <p className="text-gray-500 mt-2 font-medium">Enviaremos um link de acesso para o seu e-mail.</p>
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

        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail cadastrado</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" 
              className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none bg-gray-50 text-gray-900 font-medium transition-all"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all mt-4 shadow-xl active:scale-95 flex items-center justify-center disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'ENVIAR LINK'}
          </button>
        </form>
      </div>
    );
  }

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
          onClick={() => { setIsLogin(true); setError(null); setSuccessMsg(null); }}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${isLogin ? 'bg-white shadow-lg text-blue-600 scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Login
        </button>
        <button 
          onClick={() => { setIsLogin(false); setError(null); setSuccessMsg(null); }}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isLogin ? 'bg-white shadow-lg text-blue-600 scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Cadastro
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="leading-tight">{successMsg}</span>
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
          {isLogin && (
            <div className="text-right mt-2">
              <button 
                type="button"
                onClick={() => { setIsForgotPassword(true); setError(null); }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>
          )}
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
