import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Loader2, AlertCircle, CheckCircle2, Lock, Mail, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CreditCard } from 'lucide-react';

const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  const cpfDigits = cpf.split('').map(el => +el);
  const rest = (count: number) => {
    return (((cpfDigits.slice(0, count - 12).reduce((s, el, i) => s + el * (count - i), 0) * 10) % 11) % 10);
  };
  return rest(10) === cpfDigits[9] && rest(11) === cpfDigits[10];
};

const validateCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;
  const size = cnpj.length - 2;
  const numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  sum = 0;
  pos = size - 6;
  for (let i = size + 1; i >= 1; i--) {
    sum += parseInt(cnpj.charAt(size + 1 - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
};

const maskDocument = (value: string) => {
  value = value.replace(/\D/g, '');
  if (value.length <= 11) {
    return value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
  }
  return value
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);

  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string, type: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isReset) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });

        if (resetError) throw resetError;

        setSuccessMsg("LINK DE RECUPERAÇÃO ENVIADO PARA SEU E-MAIL!");
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
          setError({ message: authError.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : authError.message, type: 'auth' });
          setLoading(false);
          return;
        }

        if (!authData.user) throw new Error("Falha na autenticação.");

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const userRole = profile?.role || UserRole.CLIENT;
        setSuccessMsg("ACESSO CONFIRMADO! REDIRECIONANDO...");

        setTimeout(() => {
          if (userRole === UserRole.PROFESSIONAL) {
            navigate('/profissional/dashboard');
          } else if (userRole === UserRole.ADMIN) { // Keep ADMIN role navigation
            navigate('/admin');
          } else { // Original else block
            navigate('/cliente/dashboard');
          }
        }, 500);

      } else {
        if (role === UserRole.PROFESSIONAL) {
          // Validação obrigatória do documento
          if (!document || document.trim() === '') throw new Error("CPF/CNPJ é obrigatório para profissionais.");
          
          const cleanDoc = document.replace(/\D/g, '');
          if (cleanDoc.length === 11 && !validateCPF(cleanDoc)) throw new Error("CPF Inválido.");
          if (cleanDoc.length === 14 && !validateCNPJ(cleanDoc)) throw new Error("CNPJ Inválido.");
          if (cleanDoc.length !== 11 && cleanDoc.length !== 14) throw new Error("Documento incompleto.");
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, role: role } }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          const { error: insertError } = await supabase.from('profiles').insert({
            id: signUpData.user.id,
            full_name: name,
            role: role,
            document: role === UserRole.PROFESSIONAL ? document.replace(/\D/g, '') : null,
            credits: role === UserRole.PROFESSIONAL ? 15 : 0,
            completed_jobs: 0,
            rating: 5.0
          });

          if (insertError) throw insertError;

          setSuccessMsg("CONTA CRIADA COM SUCESSO!");
          setTimeout(() => {
            navigate(role === UserRole.PROFESSIONAL ? '/profissional/dashboard' : '/cliente/dashboard');
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error("Erro no Auth:", err);
      setError({ message: err.message || 'Erro inesperado ao processar acesso.', type: 'general' });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-3xl overflow-hidden relative">
        <div className="h-4 bg-brand-orange shadow-md"></div>
        <div className="p-10 pt-12">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-brand-darkBlue tracking-tight uppercase">
              {isReset ? 'Recuperar' : isLogin ? 'Entrar' : 'Cadastrar'}
            </h2>
            <p className="text-gray-600 text-lg font-bold mt-2">
              {isReset ? 'Digite seu e-mail para continuar' : isLogin ? 'Bem-vindo de volta à Samej' : 'Comece hoje mesmo'}
            </p>
          </div>

          {error && (
            <div className="p-5 mb-8 rounded-[1.5rem] border-2 flex items-start text-sm font-bold bg-red-50 border-red-100 text-red-900 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <div><p className="font-black mb-1 uppercase text-[10px] tracking-widest">Erro de Acesso</p><span>{error.message}</span></div>
            </div>
          )}

          {successMsg && (
            <div className="p-5 mb-8 bg-green-50 border-2 border-green-100 text-green-900 rounded-[1.5rem] flex items-start text-sm font-bold animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <span className="font-black uppercase tracking-tight">{successMsg}</span>
            </div>
          )}

          {!isReset && (
            <div className="flex bg-brand-bg p-1.5 rounded-[2rem] mb-10 border border-gray-100">
              <button onClick={() => { setIsLogin(true); setIsReset(false); setError(null); setSuccessMsg(null); }} className={`flex-1 py-4 rounded-[1.5rem] font-black transition-all text-sm uppercase tracking-widest ${isLogin ? 'bg-white shadow-xl text-brand-blue' : 'text-gray-600 hover:text-gray-800'}`}>Login</button>
              <button onClick={() => { setIsLogin(false); setIsReset(false); setError(null); setSuccessMsg(null); }} className={`flex-1 py-4 rounded-[1.5rem] font-black transition-all text-sm uppercase tracking-widest ${!isLogin ? 'bg-white shadow-xl text-brand-blue' : 'text-gray-600 hover:text-gray-800'}`}>Cadastro</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button type="button" onClick={() => setRole(UserRole.CLIENT)} className={`py-4 rounded-2xl border-4 font-black text-xs uppercase tracking-widest transition-all ${role === UserRole.CLIENT ? 'border-brand-blue bg-blue-50 text-brand-blue shadow-lg shadow-blue-100' : 'border-gray-50 bg-gray-50 text-gray-600'}`}>SOU CLIENTE</button>
                  <button type="button" onClick={() => setRole(UserRole.PROFESSIONAL)} className={`py-4 rounded-2xl border-4 font-black text-xs uppercase tracking-widest transition-all ${role === UserRole.PROFESSIONAL ? 'border-brand-orange bg-orange-50 text-brand-orange shadow-lg shadow-orange-100' : 'border-gray-50 bg-gray-50 text-gray-600'}`}>SOU PROFISSIONAL</button>
                </div>
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="NOME COMPLETO" className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-[1.5rem] font-bold text-gray-900 text-lg outline-none focus:border-brand-blue focus:bg-white transition-all uppercase placeholder:text-gray-500" />
                </div>
                {role === UserRole.PROFESSIONAL && (
                  <div className="relative">
                    <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      required 
                      value={document} 
                      onChange={e => setDocument(maskDocument(e.target.value))} 
                      placeholder="CPF OU CNPJ (OBRIGATÓRIO)" 
                      className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-[1.5rem] font-bold text-gray-900 text-lg outline-none focus:border-brand-blue focus:bg-white transition-all uppercase placeholder:text-gray-500" 
                    />
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2 ml-2">
                      * Campo obrigatório para profissionais
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="SEU E-MAIL" className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-[1.5rem] font-bold text-gray-900 text-lg outline-none focus:border-brand-blue focus:bg-white transition-all placeholder:text-gray-500" />
            </div>
            {!isReset && (
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="SUA SENHA" className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-[1.5rem] font-bold text-gray-900 text-lg outline-none focus:border-brand-blue focus:bg-white transition-all uppercase placeholder:text-gray-500" />
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-brand-darkBlue text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-900/20 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-tight mt-6 hover:bg-black">
              {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (isReset ? 'ENVIAR LINK' : isLogin ? 'ENTRAR AGORA' : 'CRIAR MINHA CONTA')}
            </button>
          </form>

          <div className="text-center mt-10">
            {isReset ? (
              <button
                onClick={() => setIsReset(false)}
                className="text-sm font-bold text-brand-blue hover:text-brand-darkBlue transition-colors uppercase tracking-widest"
              >
                Voltar para o Login
              </button>
            ) : (
              <p className="text-center text-sm font-bold text-gray-600">
                {isLogin ? (
                  <button
                    onClick={() => { setIsReset(true); setError(null); setSuccessMsg(null); }}
                    className="hover:text-brand-blue transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                ) : 'Ao se cadastrar, você aceita nossos Termos de Uso.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;