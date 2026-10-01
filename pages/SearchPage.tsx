import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Briefcase, Building2, Tags, BadgeCheck, Users, MapPin, ChevronRight,
} from 'lucide-react';
import {
  ServiceCategoryItem, ServiceItem, ProfessionalCardItem, CompanyCardItem, SocialProfileSummary,
} from '../types';
import {
  getProfessionals, getCompanies, getServiceCategories, getServicesByCategory,
} from '../lib/discovery';
import { supabase } from '../lib/supabase';
import { roleLabel, roleBadgeClass, joinLocation } from '../lib/format';
import Avatar from '../components/Avatar';

type Tab = 'tudo' | 'profissionais' | 'empresas' | 'servicos';

const SearchPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const tab = (params.get('tipo') as Tab) || 'tudo';

  const [profiles, setProfiles] = useState<SocialProfileSummary[]>([]);
  const [pros, setPros] = useState<ProfessionalCardItem[]>([]);
  const [comps, setComps] = useState<CompanyCardItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryItem[]>([]);
  const [servicesByCat, setServicesByCat] = useState<Record<string, ServiceItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Buscar · Samej';
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data: profileRows }, p, c, cats, services] = await Promise.all([
          supabase
            .from('public_profiles')
            .select('id, username, full_name, avatar_url, cover_url, city, state, description, profession, role, verified, created_at'),
          getProfessionals(),
          getCompanies(),
          getServiceCategories(),
          getServicesByCategory(),
        ]);
        setProfiles((profileRows || []).map((a: any) => ({
          id: a.id,
          username: a.username,
          full_name: a.full_name,
          avatar_url: a.avatar_url,
          cover_url: a.cover_url,
          city: a.city,
          state: a.state,
          description: a.description,
          profession: a.profession,
          role: a.role,
          verified: a.verified,
          created_at: a.created_at,
        })));
        setPros(p);
        setComps(c);
        setCategories(cats);
        setServicesByCat(services);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const term = q.trim().toLowerCase();

  const match = (values: (string | null | undefined)[]): boolean =>
    values.some((v) => (v || '').toLowerCase().includes(term));

  const filteredProfiles = useMemo(() => {
    if (!term) return [];
    return profiles.filter((p) =>
      match([p.full_name, p.username, p.profession, p.city, p.state, p.description]),
    );
  }, [term, profiles]);

  const filteredPros = useMemo(() => {
    if (!term) return [];
    return pros.filter((p) =>
      match([
        p.profile.full_name, p.profile.username, p.profession,
        ...(p.specialties || []), p.city, p.state, p.description,
      ]),
    );
  }, [term, pros]);

  const filteredComps = useMemo(() => {
    if (!term) return [];
    return comps.filter((c) =>
      match([c.companyName, c.profile.full_name, c.profile.username, c.city, c.state, c.description]),
    );
  }, [term, comps]);

  const filteredCategories = useMemo(() => {
    if (!term) return categories;
    return categories.filter((c) => {
      const services = servicesByCat[c.id] || [];
      return c.name.toLowerCase().includes(term) || services.some((s) => s.name.toLowerCase().includes(term));
    });
  }, [term, categories, servicesByCat]);

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params);
    next.set('tipo', t);
    if (q) next.set('q', q);
    setParams(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q) next.set('q', q.trim());
    if (tab && tab !== 'tudo') next.set('tipo', tab);
    setParams(next);
  };

  const isEmpty = !term && tab === 'tudo';

  const profileRow = (p: SocialProfileSummary, subtitle?: string) => {
    const name = p.full_name || p.username || 'Usuário';
    return (
      <Link key={p.id} to={`/social/${p.id}`} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
        <Avatar src={p.avatar_url} alt={name} size={42} verified={p.verified} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-gray-900 truncate flex items-center">
            <span className="truncate">{name}</span>
            {p.verified && <BadgeCheck className="w-3.5 h-3.5 ml-1 text-brand-blue flex-shrink-0" />}
          </p>
          <p className="text-xs text-gray-400 font-bold truncate">
            <span className={`inline-flex items-center mr-2 px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-widest ${roleBadgeClass(p.role)}`}>
              {subtitle || roleLabel(p.role)}
            </span>
            {joinLocation(p.city, p.state) || p.profession}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
      </Link>
    );
  };

  const section = (title: string, icon: React.ReactNode, children: React.ReactNode, count: number) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
      <p className="px-1 py-1.5 text-xs font-black uppercase tracking-widest text-gray-400 flex items-center">
        {icon}
        <span className="ml-2 flex-1">{title}</span>
        <span>{count}</span>
      </p>
      {count === 0 ? (
        <p className="px-3 py-4 text-sm text-gray-400 font-bold">
          Nada encontrado{term ? ` para “${q}”` : ''}.
        </p>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl md:text-2xl font-black text-brand-darkBlue tracking-tight flex items-center">
          <Search className="w-6 h-6 mr-2 text-brand-orange" /> Buscar no Samej
        </h1>
      </header>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-full px-4">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            value={q}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set('q', e.target.value);
              setParams(next);
            }}
            placeholder="Buscar pessoas, profissionais, empresas, serviços..."
            className="flex-1 bg-transparent py-3 text-sm font-bold focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {(['tudo', 'profissionais', 'empresas', 'servicos'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-black capitalize transition-colors ${
                tab === t ? 'bg-brand-blue text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t === 'servicos' ? 'Serviços' : t}
            </button>
          ))}
        </div>
      </form>

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3 animate-pulse">
              <div className="h-3 bg-gray-100 rounded-full w-1/3 mb-3"></div>
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center space-x-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                  <div className="flex-1 space-y-2"><div className="h-3 bg-gray-100 rounded-full w-2/3"></div><div className="h-2 bg-gray-100 rounded-full w-1/2"></div></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-black text-gray-700 mb-1">O que você quer encontrar?</p>
          <p className="text-gray-400 font-bold text-sm mb-5">Pesquise por nome, profissão, empresa, cidade ou serviço.</p>
          <div className="flex flex-wrap justify-center gap-2 px-4">
            {categories.slice(0, 6).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  const next = new URLSearchParams();
                  next.set('q', c.name);
                  next.set('tipo', 'servicos');
                  setParams(next);
                }}
                className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-xs font-black text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(tab === 'tudo' || tab === 'profissionais') && (
            section(
              'Profissionais',
              <Briefcase className="w-3.5 h-3.5 text-brand-orange" />,
              filteredPros.map((p) =>
                profileRow(p.profile, p.profession || roleLabel(p.profile.role)),
              ),
              filteredPros.length,
            )
          )}

          {(tab === 'tudo' || tab === 'empresas') && (
            section(
              'Empresas',
              <Building2 className="w-3.5 h-3.5 text-brand-blue" />,
              filteredComps.map((c) =>
                profileRow(c.profile, c.companyName || roleLabel(c.profile.role)),
              ),
              filteredComps.length,
            )
          )}

          {(tab === 'tudo' || tab === 'servicos') && (
            section(
              'Serviços',
              <Tags className="w-3.5 h-3.5 text-green-600" />,
              filteredCategories.map((cat) => {
                const services = servicesByCat[cat.id] || [];
                return (
                  <div key={cat.id} className="px-3 py-2.5 border-t border-gray-50 first:border-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-gray-800">{cat.name}</p>
                      <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{services.length} serviço(s)</span>
                    </div>
                    {services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {services.map((s) => (
                          <span key={s.id} className="px-2.5 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-[11px] font-bold text-gray-500">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }),
              filteredCategories.length,
            )
          )}

          {(tab === 'tudo' || tab === 'profissionais' || tab === 'empresas') && filteredProfiles.length > 0 && (
            section(
              'Pessoas',
              <MapPin className="w-3.5 h-3.5 text-gray-400" />,
              filteredProfiles.map((p) => profileRow(p)),
              filteredProfiles.length,
            )
          )}

          {tab === 'tudo' &&
            filteredProfiles.length === 0 &&
            filteredPros.length === 0 &&
            filteredComps.length === 0 &&
            filteredCategories.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-lg font-black text-gray-700 mb-1">Nada encontrado</p>
                <p className="text-gray-400 font-bold text-sm">Tente buscar por outro termo.</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;