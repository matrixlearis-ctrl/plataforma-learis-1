import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Loader2, UserRound, Briefcase, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RoleChoiceProps {
  user: User;
}

const RoleChoice: React.FC<RoleChoiceProps> = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const ensureName = async () => {
    const { data: { user: su } } = await supabase.auth.getUser();
    if (!su) return;
    const meta = su.user_metadata || {};
    const fullName = meta.full_name || [meta.first_name, meta.last_name].filter(Boolean).join(' ') || user.name || 'Usuário';
    const phone = meta.phone || null;
    await supabase.from('profiles').upsert({
      id: su.id,
      full_name: fullName,
      role: 'USER',
      phone: phone || null,
    });
  };

  const finish = async (dest: string) => {
    setLoading(true);
    await ensureName();
    try {
      await supabase.auth.updateUser({ data: { signup_pending: 'done' } });
    } catch (e) { console.warn(e); }
    setLoading(false);
    navigate(dest);
  };

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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-5">
            <div className="text-center">
              <h1 className="text-2xl font-black text-brand-darkBlue tracking-tight">Seu perfil no Samej</h1>
              <p className="text-sm text-gray-500 font-bold mt-1">{user.name}, como você quer usar a plataforma?</p>
            </div>

            <button
              onClick={() => finish('/profile')}
              disabled={loading}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-brand-blue hover:bg-blue-50/40 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center flex-shrink-0">
                <UserRound className="w-5 h-5 text-brand-blue" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-gray-900">Usuário</p>
                <p className="text-xs text-gray-500 font-bold mt-0.5">Entre no feed, faça buscas, curta e siga pessoas e negócios.</p>
              </div>
            </button>

            <button
              onClick={() => finish('/negocios')}
              disabled={loading}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-brand-orange hover:bg-orange-50/40 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-2xl bg-brand-orange/5 border border-brand-orange/10 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-brand-orange" />
              </div>
              <div className="flex-1 text-left">
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
        </div>
      </main>
    </div>
  );
};

export default RoleChoice;