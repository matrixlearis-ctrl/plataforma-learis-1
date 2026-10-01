import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        let subscription: { unsubscribe: () => void } | null = null;

        const checkSession = async () => {
            setLoading(true);

            // Tenta obter a sessão atual
            const { data: { session: initialSession } } = await supabase.auth.getSession();

            if (initialSession) {
                setLoading(false);
                return;
            }

            // Fallback: Verifica se há tokens na URL (hash) que o Supabase ainda não processou
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                try {
                    // Tenta extrair manualmente (embora o listener onAuthStateChange deva pegar isso)
                    const params = new URLSearchParams(hash.replace('#', '?'));
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken) {
                        const { data, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '',
                        });

                        if (!error && data.session) {
                            setLoading(false);
                            return;
                        }
                    }
                } catch (e) {
                    console.error("Erro ao processar hash manual:", e);
                }
            }

            const { data } = supabase.auth.onAuthStateChange((event, session) => {
                if (session) {
                    setError(null);
                    setLoading(false);
                    if (subscription) subscription.unsubscribe();
                    if (timeout) clearTimeout(timeout);
                }
            });
            subscription = data.subscription;

            timeout = setTimeout(() => {
                setError("Link de recuperação expirado ou inválido.");
                setLoading(false);
                if (subscription) subscription.unsubscribe();
            }, 5000); // Aumentei para 5s
        };

        checkSession();

        return () => {
            if (timeout) clearTimeout(timeout);
            if (subscription) subscription.unsubscribe();
        };
    }, [navigate]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }
        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: resetError } = await supabase.auth.updateUser({ password });
            if (resetError) throw resetError;

            setSuccess(true);
            setTimeout(() => navigate('/feed'), 3000);
        } catch (err: any) {
            console.error("Erro no update:", err);
            setError(err.message || "Erro ao atualizar senha.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto my-16 px-4">
            <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-3xl overflow-hidden relative">
                {/* ... header ... */}
                <div className="h-4 bg-brand-orange shadow-md"></div>
                <div className="p-10 pt-12">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-black text-brand-darkBlue tracking-tight uppercase">Nova Senha</h2>
                        <p className="text-gray-600 text-lg font-bold mt-2">Defina sua nova senha de acesso</p>
                    </div>

                    {error && (
                        <div className="p-5 mb-8 rounded-[1.5rem] border-2 flex items-start text-sm font-bold bg-red-50 border-red-100 text-red-900">
                            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success ? (
                        <div className="text-center p-5 mb-8">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <p className="font-black text-green-900 uppercase">Senha atualizada com sucesso!</p>
                            <p className="text-sm text-gray-500 mt-2">Redirecionando para o login...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="NOVA SENHA"
                                    className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-[1.5rem] font-bold text-gray-900 text-lg outline-none focus:border-brand-blue focus:bg-white transition-all uppercase placeholder:text-gray-500"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="CONFIRME A SENHA"
                                    className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-[1.5rem] font-bold text-gray-900 text-lg outline-none focus:border-brand-blue focus:bg-white transition-all uppercase placeholder:text-gray-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-darkBlue text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 disabled:opacity-50 transition-all uppercase mt-6 hover:bg-black"
                            >
                                {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : 'REDEFINIR SENHA'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
