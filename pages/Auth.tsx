
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
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (authError) {
          setError({ message: authError.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : authError.message, type: 'auth' });
          setLoading(false);
          return;
        }
        
        if (!authData.user) throw new Error("Falha na autenticação.");

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const userRole = profile?.role || UserRole.CLIENT;

        setSuccessMsg("ACESSO GARANTIDO! REDIRECIONANDO...");
        
        // Navegação direta com base no role
        if (userRole === UserRole.PROFESSIONAL) {
          navigate('/profissional/dashboard');
        } else if (userRole === UserRole.ADMIN) {
          navigate('/admin');
        } else {
          navigate('/cliente/dashboard');
        }

      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: name, role: role } }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          await supabase.from('profiles').insert({
            id: signUpData.user.id,
            full_name: name,
            role: role,
            credits: role === UserRole.PROFESSIONAL ? 15 : 0,
            completed_jobs: 0,
            rating: 5.0
          });
          
          setSuccessMsg("CONTA CRIADA COM SUCESSO!");
          setTimeout(() => {
            navigate(role === UserRole.PROFESSIONAL ? '/profissional/dashboard' : '/cliente/dashboard');
          }, 1000);
        }
      }
    } catch (err: any) {
      setError({ message: err.message || 'Erro inesperado.', type: 'general' });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-[2.5rem] border shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 shadow-md"></div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-blue-900 tracking-tighter uppercase">{isLogin ? 'Entrar' : 'Cadastrar'}</h2>
      </div>

      {error && (
        <div className="p-5 mb-6 rounded-2xl border-2 flex items-start text-sm font-bold bg-red-50 border-red-200 text-red-900 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <div><p className="font-black mb-1 uppercase text-[10px] tracking-widest">Erro no Acesso</p><span>{error.message}</span></div>
        </div>
      )}

      {successMsg && (
        <div className="p-5 mb-6 bg-green-50 border-2 border-green-200 text-green-900 rounded-2xl flex items-start text-sm font-bold animate-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <span className="font-black uppercase tracking-tight">{successMsg}</span>
        </div>
      )}

      <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
        <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${isLogin ? 'bg-white shadow-md text-blue-600' : 'text-gray-400'}`}>Login</button>
        <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${!isLogin ? 'bg-white shadow-md text-blue-600' : 'text-gray-400'}`}>Cadastro</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setRole(UserRole.CLIENT)} className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${role === UserRole.CLIENT ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' : 'border-gray-200 text-gray-400'}`}>SOU CLIENTE</button>
              <button type="button" onClick={() => setRole(UserRole.PROFESSIONAL)} className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${role === UserRole.PROFESSIONAL ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' : 'border-gray-200 text-gray-400'}`}>SOU PROFISSIONAL</button>
            </div>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="SEU NOME COMPLETO" className="w-full p-4 border-2 border-gray-300 rounded-2xl bg-white font-bold text-gray-900 outline-none focus:border-blue-600 uppercase placeholder:text-gray-300" />
          </>
        )}
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="SEU E-MAIL" className="w-full p-4 border-2 border-gray-300 rounded-2xl bg-white font-bold text-gray-900 outline-none focus:border-blue-600 uppercase placeholder:text-gray-300" />
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="SUA SENHA" className="w-full p-4 border-2 border-gray-300 rounded-2xl bg-white font-bold text-gray-900 outline-none focus:border-blue-600 uppercase placeholder:text-gray-300" />
        
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-tight">
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (isLogin ? 'ENTRAR AGORA' : 'CRIAR MINHA CONTA')}
        </button>
      </form>
    </div>
  );
};

export default Auth;
