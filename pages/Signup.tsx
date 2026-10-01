import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2, AlertCircle, CheckCircle2, ArrowLeft, UserRound, Briefcase, ShieldCheck, Eye, EyeOff,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Step = 'form' | 'confirm' | 'role';

const maskPhone = (value: string) => {
  value = value.replace(/\D/g, '');
  return value
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2')
    .substring(0, 15);
};

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!firstName.trim() || !lastName.trim()) return 'Informe seu nome e sobrenome.';
    if (!birthDate) return 'Informe sua data de nascimento.';
    if (!gender) return 'Informe seu gênero.';
    if ((phone || '').replace(/\D/g, '').length < 10) return 'Informe um número de celular válido.';
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Informe um e-mail válido.';
    if ((password || '').length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    return null;
  };

  const fullName = `${firstName.trim()} ${lastName.trim()}`;

  const ensureProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      role: 'USER',
      phone: phone.replace(/\D/g, '') || null,
    });
  };

  const handleSend = async () => {
    const invalid = validate();
    if (invalid) { setError(invalid); return; }
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: fullName,
            birth_date: birthDate,
            gender,
            phone: phone.replace(/\D/g, ''),
            signup_pending: 'role',
          },
        },
      });
      if (signUpError) throw signUpError;
      if (data.session) {
        await ensureProfile();
        setStep('role');
        return;
      }
      setStep('confirm');
      setInfo(`Enviamos um link de confirmação para ${email.trim()}. Abra o e-mail e clique em “Confirmar e-mail”.`);
    } catch (e: any) {
      setError(e?.message || 'Falha ao criar a conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resendLink = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
      if (resendError) throw resendError;
      setInfo('Novo link de confirmação enviado. Verifique sua caixa de entrada e o spam.');
    } catch (e: any) {
      setError(e?.message || 'Não foi possível reenviar o link.');
    } finally {
      setLoading(false);
    }
  };

  const markConfirmed = () => {
    void ensureProfile().finally(() => setStep('role'));
  };

  const handleAlreadyConfirmed = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await ensureProfile();
        setStep('role');
      } else {
        setError(
          'Ainda não encontramos sua confirmação. Clique no link do e-mail. Se o Samej abriu em outra aba, escolha seu tipo de perfil por lá e retorne para esta aba depois.',
        );
      }
    } catch (e: any) {
      setError(e?.message || 'Falha ao verificar a confirmação.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 'confirm') return;
    const t = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        clearInterval(t);
        markConfirmed();
      }
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const finishSignup = async (dest: string) => {
    setLoading(true);
    await ensureProfile();
    try {
      await supabase.auth.updateUser({ data: { signup_pending: 'done' } });
    } catch (e) { console.warn(e); }
    setLoading(false);
    navigate(dest);
  };

  const inputCls =
    'w-full h-11 bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-11 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-all';
  const labelCls = 'block text-xs font-black text-gray-500 mb-1.5';

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      <header className="w-full">
        <div className="px-3 pt-6 md:pt-8">
          <Link to="/">
            <img src="/images/logo.png" alt="Logo Samej" className="h-14 md:h-16 w-auto object-contain" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {step === 'form' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
              <div>
                <h1 className="text-2xl font-black text-brand-darkBlue tracking-tight">Criar uma conta</h1>
                <p className="text-sm text-gray-500 font-bold mt-1">É rápido e fácil.</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nome</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="Nome" />
                </div>
                <div>
                  <label className={labelCls}>Sobrenome</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} placeholder="Sobrenome" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Data de nascimento</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Gênero</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
                    <option value="">Selecione</option>
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                    <option value="outro">Outro</option>
                    <option value="prefiro-nao-dizer">Prefiro não dizer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Número de celular</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="seuemail@exemplo.com" />
              </div>

              <div>
                <label className={labelCls}>Senha</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Mínimo 6 caracteres" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-brand-blue transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={loading}
                className="w-full h-11 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black rounded-lg transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Enviar'}
              </button>

              <p className="text-[11px] text-gray-400 font-bold text-center leading-relaxed">
                Ao se cadastrar, você concorda com os Termos de Uso e a Política de Privacidade do Samej.
              </p>
            </div>
          )}

          {step === 'confirm' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
              <button onClick={() => setStep('form')} className="flex items-center text-gray-500 hover:text-brand-blue font-bold text-xs transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </button>
              <div>
                <h1 className="text-2xl font-black text-brand-darkBlue tracking-tight">Confirme seu e-mail</h1>
                <p className="text-sm text-gray-500 font-bold mt-1 leading-relaxed">{info}</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {(info || step === 'confirm') && !error && (
                <div className="flex items-start gap-2 p-3 bg-green-50 text-green-700 rounded-xl border border-green-100 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Abra o e-mail enviado para <b>{email.trim()}</b>, clique em <b>“Confirmar e-mail”</b> e volte aqui.
                  </span>
                </div>
              )}

              <button
                onClick={handleAlreadyConfirmed}
                disabled={loading}
                className="w-full h-11 bg-brand-blue hover:bg-brand-darkBlue disabled:opacity-60 text-white font-black rounded-lg transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Já cliquei no link — Continuar'}
              </button>

              <button
                onClick={resendLink}
                disabled={loading}
                className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-lg transition-all"
              >
                Reenviar link de confirmação
              </button>

              <p className="flex items-center justify-center text-[11px] text-gray-400 font-bold">
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-brand-orange" />
                Detectamos automaticamente quando você confirmar.
              </p>
            </div>
          )}

          {step === 'role' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-5">
              <div className="text-center">
                <h1 className="text-2xl font-black text-brand-darkBlue tracking-tight">Seu perfil no Samej</h1>
                <p className="text-sm text-gray-500 font-bold mt-1">{fullName}, como você quer usar a plataforma?</p>
              </div>

              <button
                onClick={() => finishSignup('/profile')}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-brand-blue hover:bg-blue-50/40 transition-all text-left"
              >
                <div className="w-11 h-11 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center flex-shrink-0">
                  <UserRound className="w-5 h-5 text-brand-blue" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-900">Usuário</p>
                  <p className="text-xs text-gray-500 font-bold mt-0.5">Entre no feed, faça buscas, curta e siga pessoas e negócios.</p>
                </div>
              </button>

              <button
                onClick={() => finishSignup('/negocios')}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-brand-orange hover:bg-orange-50/40 transition-all text-left"
              >
                <div className="w-11 h-11 rounded-2xl bg-brand-orange/5 border border-brand-orange/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-brand-orange" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-900">Profissional / Empresa</p>
                  <p className="text-xs text-gray-500 font-bold mt-0.5">Crie um perfil profissional (CPF) ou de empresa (CNPJ) e publique no feed.</p>
                </div>
              </button>

              <p className="inline-flex items-center text-center text-[11px] text-gray-400 font-bold mx-auto">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                Perfis profissionais/empresas passam por revisão administrativa antes de publicar.
              </p>

              {loading && <Loader2 className="w-6 h-6 animate-spin text-brand-orange mx-auto" />}
            </div>
          )}

          <p className="text-center mt-6 text-sm">
            Já tem uma conta?{' '}
            <Link to="/" className="font-black text-brand-blue hover:underline">Entrar</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Signup;