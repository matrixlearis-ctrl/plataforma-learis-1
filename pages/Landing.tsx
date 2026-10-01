import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Loader2, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LandingProps {
  user: User | null;
}

const Landing: React.FC<LandingProps> = ({ user }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReset, setIsReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = 'Samej · Conecte-se a profissionais e empresas da sua cidade';
  }, []);

  if (user) return <Navigate to="/feed" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(
          authError.message.includes('Invalid login') || authError.message.includes('Email not confirmed')
            ? 'E-mail ou senha incorretos.'
            : authError.message,
        );
        setLoading(false);
        return;
      }
      navigate('/feed', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Falha ao entrar. Tente novamente.');
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Digite seu e-mail para recuperar a senha.');
      return;
    }
    setLoading(true);
    setError(null);
    setResetSuccess(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      setResetSuccess('Enviamos um link de recuperação para o seu e-mail.');
    } catch (err: any) {
      setError(err?.message || 'Falha ao enviar o link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      <header className="w-full">
        <div className="px-3 pt-6 md:pt-8">
          <img
            src="/images/logo.png"
            alt="Logo Samej"
            className="h-20 md:h-24 w-auto object-contain"
          />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[980px] grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="md:pt-6">
            <img
              src="/images/imagem.png"
              alt="Samej"
              className="w-full max-w-[710px] h-auto object-contain"
            />
            <p className="mt-6 text-2xl md:text-3xl font-black text-brand-darkBlue leading-tight tracking-tight max-w-md mx-auto text-center">
              Encontre os Melhores Profissionais
            </p>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 max-w-[420px] mx-auto w-full space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-1.5">E-mail ou telefone</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-all"
                />
              </div>

              {!isReset && (
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-11 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-all"
                    />
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
              )}

              {isReset && (
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-black text-brand-darkBlue">Recupere sua senha</h3>
                  <p className="text-xs font-bold text-gray-500">
                    Digite seu e-mail e enviaremos um link para você redefinir sua senha.
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="flex items-start gap-2 p-3 bg-green-50 text-green-700 rounded-xl border border-green-100 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {resetSuccess}
                    <span className="block mt-1 font-semibold text-green-600">
                      Verifique também a caixa de spam ou lixo eletrônico — o e-mail pode ter sido filtrado para lá.
                    </span>
                  </span>
                </div>
              )}

              {isReset ? (
                <>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    className="w-full h-11 bg-brand-blue hover:bg-brand-darkBlue disabled:opacity-60 text-white font-black rounded-lg font-bold transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Enviar link'}
                  </button>
                  <p className="text-center">
                    <button
                      type="button"
                      onClick={() => { setIsReset(false); setError(null); setResetSuccess(null); }}
                      className="text-sm font-bold text-brand-blue hover:underline"
                    >
                      Voltar para o login
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full h-11 bg-brand-blue hover:bg-brand-darkBlue disabled:opacity-60 text-white font-black rounded-lg font-bold transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Entrar'}
                  </button>

                  <p className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsReset(true)}
                      className="text-sm font-bold text-brand-blue hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </p>
                </>
              )}

              {!isReset && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">ou</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <Link
                    to="/criar-conta"
                    className="block text-center h-11 bg-green-600 hover:bg-green-700 text-white font-black rounded-lg leading-[44px] transition-all"
                  >
                    Criar nova conta
                  </Link>
                </>
              )}
            </div>

            <p className="text-center mt-6 text-sm">
              <Link to="/negocios" className="font-black text-brand-darkBlue hover:underline">
                Criar uma Página para o seu negócio
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-5">
        <div className="max-w-[980px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs font-bold text-gray-400">
            <span>Criar página</span>
            <span>·</span>
            <Link to="/professionals" className="hover:text-brand-blue">Profissionais</Link>
            <span>·</span>
            <Link to="/companies" className="hover:text-brand-blue">Empresas</Link>
            <span>·</span>
            <Link to="/termos" className="hover:text-brand-blue">Termos</Link>
            <span>·</span>
            <Link to="/" className="hover:text-brand-blue">Privacidade</Link>
          </div>
          <p className="text-xs font-black text-gray-300">© 2026 Samej · Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;