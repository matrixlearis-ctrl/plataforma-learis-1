import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, MapPin, Search, BadgeCheck, SlidersHorizontal, Globe, Store, Users,
} from 'lucide-react';
import { CompanyCardItem } from '../types';
import { getCompanies } from '../lib/discovery';
import { joinLocation, formatCount } from '../lib/format';
import Avatar from '../components/Avatar';

const CompaniesPage: React.FC = () => {
  const [all, setAll] = useState<CompanyCardItem[]>([]);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCompanies()
      .then(setAll)
      .catch((e: any) => setError(e?.message || 'Não foi possível carregar as empresas.'))
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => {
    const set = new Set(all.map((c) => c.city).filter(Boolean) as string[]);
    return [...set].sort();
  }, [all]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = all;
    if (term) {
      list = list.filter((c) => {
        const name = (
          c.companyName || c.profile.full_name || c.profile.username || ''
        ).toLowerCase();
        const where = `${c.city || ''} ${c.state || ''} ${c.description || ''}`.toLowerCase();
        return [name, where].some((v) => v.includes(term));
      });
    }
    if (city) list = list.filter((c) => c.city === city);
    return list;
  }, [all, q, city]);

  useEffect(() => {
    document.title = 'Empresas · Samej';
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl md:text-2xl font-black text-brand-darkBlue tracking-tight flex items-center">
          <Building2 className="w-6 h-6 mr-2 text-brand-orange" /> Encontrar empresas
        </h1>
        <p className="text-sm text-gray-400 font-bold mt-1">
          {formatCount(all.length)} empresa(s) com perfil aprovado na plataforma.
        </p>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-full px-4">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, descrição ou cidade..."
            className="flex-1 bg-transparent py-2.5 text-sm font-bold focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-full px-3 py-2 text-xs font-black text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          >
            <option value="">Todas as cidades</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {(q || city) && (
            <button
              onClick={() => { setQ(''); setCity(''); }}
              className="inline-flex items-center text-xs font-black text-brand-orange px-3 py-2 hover:underline"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1" /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100"></div>
                <div className="flex-1 space-y-2"><div className="h-3 bg-gray-100 rounded-full w-2/3"></div><div className="h-2 bg-gray-100 rounded-full w-1/2"></div></div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full w-full mb-2"></div>
              <div className="h-3 bg-gray-100 rounded-full w-3/4"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <Store className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-black text-gray-700 mb-1">Nenhuma empresa encontrada</p>
          <p className="text-gray-400 font-bold text-sm">Ajuste sua busca ou remova os filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const name = c.companyName || c.profile.full_name || c.profile.username || 'Empresa';
            const location = joinLocation(c.city, c.state);
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
                <div className="flex items-start space-x-3">
                  <Avatar src={c.logoUrl || c.profile.avatar_url} alt={name} size={56} verified={c.profile.verified} linkTo={`/social/${c.profileId}`} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/social/${c.profileId}`} className="font-black text-gray-900 hover:underline flex items-center truncate">
                      {name}
                      {c.profile.verified && <BadgeCheck className="w-4 h-4 ml-1 text-brand-blue flex-shrink-0" />}
                    </Link>
                    <p className="text-sm font-bold text-brand-blue truncate">Empresa</p>
                    {location && (
                      <p className="flex items-center text-xs text-gray-400 font-bold mt-0.5">
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" /> {location}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 font-medium mt-3 line-clamp-2">
                  {c.description || 'Empresa com perfil aprovado no Samej.'}
                </p>

                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-xs font-bold text-brand-blue hover:underline mt-2 break-all"
                  >
                    <Globe className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {c.website}
                  </a>
                )}

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                  <Link to={`/social/${c.profileId}`} className="flex-1 text-center bg-brand-blue text-white py-2 rounded-full text-xs font-black hover:bg-brand-darkBlue transition-colors">
                    Ver empresa
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;