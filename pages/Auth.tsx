
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
  const [error, setError] = useState<{message: string, type: string} | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        // 1. Tenta o Login no Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (authError) {
          setError({ message: authError.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : authError.message, type: 'auth' });
          setLoading(false);
          return;
        }
        
        if (!authData.user) throw new Error("Falha na autenticação.");

        // 2. Verifica se o Perfil existe
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        // 3. AUTO-REPARO: Se logou mas não tem perfil no banco, cria um agora
        if (!profile && !profileErr) {
          console.log("Perfil não encontrado, criando auto-reparo...");
          const userRole = authData.user.user_metadata?.role || UserRole.CLIENT;
          const fullName = authData.user.user_metadata?.full_name || 'Usuário Samej';
          
          const { error: insertErr } = await supabase.from('profiles').insert({
            id: authData.user.id,
            full_name: fullName,
            role: userRole,
            credits: userRole === UserRole.PROFESSIONAL ? 15 : 0,
            completed_jobs: 0,
            rating: 5.0
          });

          if (insertErr) {
            setError({ message: "Erro ao criar perfil automático. Verifique as políticas de RLS.", type: 'database' });
            setLoading(false);
            return;
          }
          
          setSuccessMsg("Perfil recuperado! Entrando...");
          setTimeout(() => navigate(userRole === UserRole.PROFESSIONAL ? '/profissional/dashboard' : '/cliente/dashboard'), 1000);
          return;
        }

        // 4. Redirecionamento Normal
        setSuccessMsg("Login realizado com sucesso!");
        setTimeout(() => {
          if (profile?.role === UserRole.PROFESSIONAL) navigate('/profissional/dashboard');
          else if (profile?.role === UserRole.ADMIN) navigate('/admin');
          else navigate('/cliente/dashboard');
        }, 800);

      } else {
        // Cadastro
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: name, role: role } }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: signUpData.user.id,
            full_name: name,
            role: role,
            credits: role === UserRole.PROFESSIONAL ? 15 : 0,
            completed_jobs: 0,
            rating: 5.0
          });
          
          if (profileError) {
             setError({ message: "Usuário criado, mas erro na tabela Profiles: " + profileError.message, type: 'database' });
             return;
          }
          
          setSuccessMsg("Bem-vindo à Samej!");
          setTimeout(() => navigate(role === UserRole.PROFESSIONAL ? '/profissional/dashboard' : '/cliente/dashboard'), 1500);
        }
      }
    } catch (err: any) {
      setError({ message: err.message || 'Erro inesperado.', type: 'general' });
    } finally {
      if (!successMsg) setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-[2.5rem] border shadow-2xl relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-blue-900 tracking-tighter uppercase">{isLogin ? 'Entrar' : 'Cadastrar'}</h2>
      </div>

      {error && (
        <div className="p-5 mb-6 rounded-2xl border-2 flex items-start text-sm font-bold bg-red-50 border-red-200 text-red-900">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <div><p className="font-black mb-1">ERRO</p><span>{error.message}</span></div>
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
              <button type="button" onClick={() => setRole(UserRole.CLIENT)} className={`py-3 rounded-xl border-2 font-black text-[10px] ${role === UserRole.CLIENT ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400'}`}>SOU CLIENTE</button>
              <button type="button" onClick={() => setRole(UserRole.PROFESSIONAL)} className={`py-3 rounded-xl border-2 font-black text-[10px] ${role === UserRole.PROFESSIONAL ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400'}`}>SOU PROFISSIONAL</button>
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
