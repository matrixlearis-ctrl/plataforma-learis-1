import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone, Briefcase, Building2, CheckCircle2, X, Loader2, ShieldCheck, Camera, TrendingUp, Sparkles,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { UFS } from '../lib/format';
import Avatar from '../components/Avatar';

interface BusinessProps {
  user: User | null;
}

type Kind = 'professional' | 'company' | null;

interface FormState {
  profession: string;
  document: string;
  specialties: string;
  formation: string;
  experienceYears: string;
  description: string;
  city: string;
  state: string;
  whatsapp: string;
  website: string;
}

const emptyForm: FormState = {
  profession: '',
  document: '',
  specialties: '',
  formation: '',
  experienceYears: '',
  description: '',
  city: '',
  state: '',
  whatsapp: '',
  website: '',
};

const Business: React.FC<BusinessProps> = ({ user }) => {
  const [kind, setKind] = useState<Kind>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [hasPro, setHasPro] = useState<boolean | null>(null);
  const [hasComp, setHasComp] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const meId = user?.id ?? null;

  useEffect(() => {
    document.title = 'Anunciar meu negócio grátis · Samej';
  }, []);

  useEffect(() => {
    if (!meId) return;
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('professional_profiles').select('id').eq('profile_id', meId).maybeSingle(),
        supabase.from('company_profiles').select('id').eq('profile_id', meId).maybeSingle(),
      ]);
      setHasPro(!!p);
      setHasComp(!!c);
    })();
  }, [meId]);

  const openForm = (k: 'professional' | 'company') => {
    setKind(k);
    setError('');
    setSuccess('');
  };

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!meId) return;
    setBusy(true);
    setError('');
    try {
      if (kind === 'professional') {
        if (!form.profession.trim() || !form.city.trim() || !form.state) {
          throw new Error('Preencha os campos obrigatórios: profissão, cidade e estado.');
        }
        const cpf = form.document.replace(/\D/g, '');
        if (cpf.length !== 11) {
          throw new Error('CPF inválido. Informe os 11 dígitos.');
        }
        const { error: e } = await supabase.from('professional_profiles').insert({
          profile_id: meId,
          profession: form.profession.trim(),
          cpf,
          specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
          formation: form.formation.trim() || null,
          experience_years: form.experienceYears ? Number(form.experienceYears) : null,
          description: form.description.trim() || null,
          city: form.city.trim(),
          state: form.state,
          whatsapp: form.whatsapp.trim() || null,
        });
        if (e) throw e;
        setHasPro(true);
        setSuccess('Perfil profissional criado! Após preencher os dados obrigatórios e a aprovação administrativa, você poderá publicar no feed.');
      } else {
        if (!form.profession.trim() || !form.city.trim() || !form.state) {
          throw new Error('Preencha os campos obrigatórios: nome da empresa, cidade e estado.');
        }
        const cnpj = form.document.replace(/\D/g, '');
        if (cnpj.length !== 14) {
          throw new Error('CNPJ inválido. Informe os 14 dígitos.');
        }
        const { error: e } = await supabase.from('company_profiles').insert({
          profile_id: meId,
          company_name: form.profession.trim(),
          cnpj,
          description: form.description.trim() || null,
          city: form.city.trim(),
          state: form.state,
          whatsapp: form.whatsapp.trim() || null,
          website: form.website.trim() || null,
        });
        if (e) throw e;
        setHasComp(true);
        setSuccess('Perfil de empresa criado! Após preencher os dados obrigatórios e a aprovação administrativa, você poderá publicar no feed.');
      }
      setKind(null);
      setForm(emptyForm);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Não foi possível criar o perfil. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const perks = [
    'Perfil gratuito e público',
    'Publicações com fotos no feed',
    'Divulgação organizada por categoria',
    'Aprovação moderada pela plataforma',
  ];

  const cardBase = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col';

  return (
    <div className="space-y-4">
      {success ? (
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h1 className="text-lg font-black text-gray-900 mb-2">Perfil criado com sucesso!</h1>
          <p className="text-sm text-gray-500 font-bold leading-relaxed mb-5">{success}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to={meId ? `/social/${meId}` : '/criar-conta'} className="bg-brand-blue text-white px-6 py-2.5 rounded-full font-black text-sm hover:bg-brand-darkBlue transition-colors">
              Ver meu perfil
            </Link>
            <Link to="/feed" className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-full font-black text-sm hover:bg-gray-200 transition-colors">
              Ir para o feed
            </Link>
          </div>
        </div>
      ) : (
        <>
          <header className="bg-gradient-to-br from-brand-blue to-brand-darkBlue rounded-2xl p-6 md:p-8 text-white shadow-lg">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <Megaphone className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight">Anuncie seu negócio grátis no Samej</h1>
                <p className="text-white/80 text-sm font-bold mt-1 max-w-xl leading-relaxed">
                  Crie um perfil Profissional ou de Empresa, compartilhe fotos dos seus trabalhos no feed e
                  seja encontrado por quem procura pelos seus serviços.
                </p>
                <p className="inline-flex items-center mt-3 px-3 py-1 bg-brand-orange rounded-full text-[11px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Grátis · sujeito a aprovação
                </p>
              </div>
            </div>
          </header>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cardBase}>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-3">
                <Briefcase className="w-6 h-6 text-brand-orange" />
              </div>
              <h2 className="text-lg font-black text-gray-900">Perfil Profissional</h2>
              <p className="text-sm text-gray-500 font-bold mt-1 leading-relaxed">
                Para autônomos e prestadores de serviço: eletricista, diarista, pedreiro,
                personal e muito mais.
              </p>
              <ul className="mt-4 space-y-2 flex-1">
                {perks.map((p) => (
                  <li key={p} className="flex items-start text-sm text-gray-600 font-bold">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" /> {p}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {!meId ? (
                  <Link to="/criar-conta" className="block text-center bg-brand-orange text-white py-3 rounded-full font-black text-sm hover:bg-brand-lightOrange shadow-lg active:scale-95 transition-all">
                    Criar conta para começar
                  </Link>
                ) : hasPro ? (
                  <div className="text-center">
                    <p className="inline-flex items-center text-sm font-black text-green-600 mb-2">
                      <ShieldCheck className="w-4 h-4 mr-1.5" /> Você já possui perfil profissional
                    </p>
                    <Link to={meId ? `/social/${meId}` : '/feed'} className="block text-center bg-gray-100 text-gray-700 py-3 rounded-full font-black text-sm hover:bg-gray-200 transition-colors">
                      Ver meu perfil
                    </Link>
                  </div>
                ) : (
                  <button onClick={() => openForm('professional')} className="w-full bg-brand-orange text-white py-3 rounded-full font-black text-sm hover:bg-brand-lightOrange shadow-lg active:scale-95 transition-all">
                    Criar perfil profissional
                  </button>
                )}
              </div>
            </div>

            <div className={cardBase}>
              <div className="w-12 h-12 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6 text-brand-blue" />
              </div>
              <h2 className="text-lg font-black text-gray-900">Perfil Empresa</h2>
              <p className="text-sm text-gray-500 font-bold mt-1 leading-relaxed">
                Para  empresas, lojas e equipes que querem divulgar a marca e os serviços no Samej.
              </p>
              <ul className="mt-4 space-y-2 flex-1">
                {perks.map((p) => (
                  <li key={p} className="flex items-start text-sm text-gray-600 font-bold">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" /> {p}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {!meId ? (
                  <Link to="/criar-conta" className="block text-center bg-brand-blue text-white py-3 rounded-full font-black text-sm hover:bg-brand-darkBlue shadow-lg active:scale-95 transition-all">
                    Criar conta para começar
                  </Link>
                ) : hasComp ? (
                  <div className="text-center">
                    <p className="inline-flex items-center text-sm font-black text-green-600 mb-2">
                      <ShieldCheck className="w-4 h-4 mr-1.5" /> Você já possui perfil de empresa
                    </p>
                    <Link to={meId ? `/social/${meId}` : '/feed'} className="block text-center bg-gray-100 text-gray-700 py-3 rounded-full font-black text-sm hover:bg-gray-200 transition-colors">
                      Ver meu perfil
                    </Link>
                  </div>
                ) : (
                  <button onClick={() => openForm('company')} className="w-full bg-brand-blue text-white py-3 rounded-full font-black text-sm hover:bg-brand-darkBlue shadow-lg active:scale-95 transition-all">
                    Criar perfil de empresa
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Por que anunciar de graça?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              <div className="flex items-start">
                <Camera className="w-5 h-5 text-brand-orange mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-black text-gray-800">Fotos dos seus trabalhos</p>
                  <p className="text-xs text-gray-400 font-bold">Mostre resultados no feed da comunidade.</p>
                </div>
              </div>
              <div className="flex items-start">
                <TrendingUp className="w-5 h-5 text-brand-blue mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-black text-gray-800">Descubra no Samej</p>
                  <p className="text-xs text-gray-400 font-bold">Apareça para quem busca o seu serviço.</p>
                </div>
              </div>
              <div className="flex items-start">
                <ShieldCheck className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-black text-gray-800">Ambiente moderado</p>
                  <p className="text-xs text-gray-400 font-bold">Perfis passam por aprovação administrativa.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {kind && meId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { if (!busy) setKind(null); }} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-black text-gray-900">
                {kind === 'professional' ? 'Criar perfil profissional' : 'Criar perfil de empresa'}
              </h3>
              <button onClick={() => setKind(null)} disabled={busy} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold text-xs">{error}</div>
              )}

              <div className="flex items-center space-x-3">
                <Avatar src={user?.avatar} alt={user?.name} size={36} />
                <div>
                  <p className="text-sm font-black text-gray-900">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 font-bold">Você</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  {kind === 'professional' ? 'Profissão *' : 'Nome da empresa *'}
                </label>
                <input
                  value={form.profession}
                  onChange={set('profession')}
                  placeholder={kind === 'professional' ? 'Ex.: Eletricista' : 'Ex.: Construtora ABC'}
                  className="mt-1 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  {kind === 'professional' ? 'CPF *' : 'CNPJ *'}
                </label>
                <input
                  value={form.document}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      document: kind === 'professional'
                        ? e.target.value.replace(/[^\d]/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14)
                        : e.target.value.replace(/[^\d]/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18),
                    }))
                  }
                  placeholder={kind === 'professional' ? '000.000.000-00' : '00.000.000/0000-00'}
                  className="mt-1 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                />
              </div>

              {kind === 'professional' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Especialidades</label>
                      <input
                        value={form.specialties}
                        onChange={set('specialties')}
                        placeholder="residencial, comercial..."
                        className="mt-1 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Anos de experiência</label>
                      <input
                        type="number"
                        min={0}
                        value={form.experienceYears}
                        onChange={set('experienceYears')}
                        placeholder="0"
                        className="mt-1 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Formação</label>
                    <input
                      value={form.formation}
                      onChange={set('formation')}
                      placeholder="Ex.: curso técnico, graduação"
                      className="mt-1 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  rows={2}
                  placeholder="Conte sobre seu serviço/empresa..."
                  className="mt-1 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cidade *</label>
                  <input
                    value={form.city}
                    onChange={set('city')}
                    placeholder="São Paulo"
                    className="mt-1 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Estado *</label>
                  <select
                    value={form.state}
                    onChange={set('state')}
                    className="mt-1 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                  >
                    <option value="">UF</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">WhatsApp / telefone</label>
                <input
                  value={form.whatsapp}
                  onChange={set('whatsapp')}
                  placeholder="(11) 90000-0000"
                  className="mt-1 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                />
              </div>

              {kind === 'company' && (
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Site</label>
                  <input
                    value={form.website}
                    onChange={set('website')}
                    placeholder="https://"
                    className="mt-1 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                  />
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-800 leading-relaxed">
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  O perfil passa por aprovação administrativa antes de permitir publicações no feed.
                  Os dados obrigatórios serão validados pela plataforma.
                </p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-50">
              <button
                onClick={submit}
                disabled={busy}
                className="w-full bg-brand-orange text-white py-3 rounded-full font-black hover:bg-brand-lightOrange shadow-lg shadow-orange-200 active:scale-[0.99] transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando perfil...
                  </>
                ) : (
                  <>Criar perfil {'grátis'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Business;