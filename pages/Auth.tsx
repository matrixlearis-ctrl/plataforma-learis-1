
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{message: string, type: string} | null>(null);
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
        
        if (!authData.user) throw new Error("Falha na autenticação.");

        // Passo 2: Busca de Perfil com Retry (Tratando o AbortError)
        let profile = null;
        let profileErr = null;
        let attempts = 0;

        while (attempts < 2) {
          const result = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();
          
          if (!result.error) {
            profile = result.data;
            break;
          }
          
          profileErr = result.error;
          if (profileErr.message.includes('abort') || profileErr.message.includes('signal')) {
            console.warn("Requisição abortada, tentando novamente...");
            await new Promise(resolve => setTimeout(resolve, 500)); // Espera meio segundo
            attempts++;
          } else {
            break;
          }
        }
        
        if (profileErr && attempts >= 2) {
          setError({ 
            message: `Erro de Banco: Verifique se a política 'Public read access' foi criada na tabela profiles. Detalhe: ${profileErr.message}`, 
            type: 'database' 
          });
          setLoading(false);
          return;
        }

        // AUTO-REPARO: Se o perfil não existe, tenta criar um agora
        if (!profile) {
          const { error: repairError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              full_name: authData.user.user_metadata?.full_name || 'Usuário Samej',
              role: authData.user.user_metadata?.role || UserRole.CLIENT,
              credits: 0,
              completed_jobs: 0,
              rating: 5.0
            });
          
          if (repairError) {
            setError({ 
              message: "Seu usuário existe, mas não conseguimos criar seu perfil. Verifique a política de INSERT (Allow profile registration).", 
              type: 'profile_missing' 
            });
            setLoading(false);
            return;
          }
          window.location.reload(); // Recarrega para aplicar o perfil novo
          return;
        }
        
        // Redirecionamento bem-sucedido baseado no cargo
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
             setError({ message: "Conta criada, mas erro ao salvar perfil: " + profileError.message, type: 'database' });
             return;
          }
          
          setSuccessMsg("Conta Samej criada com sucesso!");
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
          error.type === 'database' || error.type === 'profile_missing' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          {error.type === 'database' || error.type === 'profile_missing' ? <RefreshCw className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />}
          <div>
            <p className="font-black mb-1">{error.type === 'profile_missing' ? 'PERFIL NÃO ENCONTRADO' : 'OPS!'}</p>
            <span>{error.message}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-5 mb-6 bg-green-50 border-2 border-green-200 text-green-900 rounded-2xl flex items-start text-sm font-bold animate-bounce">
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
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Seu Nome" className="w-full p-4 border-2 border-gray-300 rounded-2xl bg-white font-bold text-gray-900 outline-none focus:border-blue-600" />
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
