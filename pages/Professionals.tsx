import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, MapPin, Search, Star, BadgeCheck, SlidersHorizontal, Users,
} from 'lucide-react';
import { ProfessionalCardItem, ServiceCategoryItem, ServiceItem } from '../types';
import { getProfessionals, getServiceCategories, getServicesByCategory } from '../lib/discovery';
import { supabase } from '../lib/supabase';
import { joinLocation, formatCount } from '../lib/format';
import Avatar from '../components/Avatar';

const ProfessionalsPage: React.FC = () => {
  const [all, setAll] = useState<ProfessionalCardItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryItem[]>([]);
  const [catServices, setCatServices] = useState<Record<string, ServiceItem[]>>({});
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [pros, cats, servicesByCat, links] = await Promise.all([
          getProfessionals(),
          getServiceCategories(),
          getServicesByCategory(),
          fetchLinks(),
        ]);
        setAll(pros);
        setCategories(cats);
        setCatServices(servicesByCat);
        setLinked(links);
      } catch (e: any) {
        setError(e?.message || 'Não foi possível carregar os profissionais.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchLinks = async () => {
    const { data } = await supabase.from('professional_services').select('profile_id, service_id');
    return new Set((data || []).map((l: any) => l.service_id + ':' + l.profile_id));
  };

  const cities = useMemo(() => {
    const set = new Set(all.map((p) => p.city).filter(Boolean) as string[]);
    return [...set].sort();
  }, [all]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = all;
    if (term) {
      list = list.filter((p) => {
        const name = (p.profile.full_name || p.profile.username || '').toLowerCase();
        const profession = (p.profession || '').toLowerCase();
        const specialties = (p.specialties || []).join(' ').toLowerCase();
        const where = `${p.city || ''} ${p.state || ''}`.toLowerCase();
        return [name, profession, specialties, where].some((v) => v.includes(term));
      });
    }
    if (city) list = list.filter((p) => p.city === city);
    if (category) {
      const serviceIds = (catServices[category] || []).map((s) => s.id);
      const allowed = new Set<string>();
      serviceIds.forEach((sid) => {
        linked.forEach((key) => {
          if (key.startsWith(sid + ':')) allowed.add(key.split(':')[1]);
        });
      });
      list = list.filter((p) => allowed.has(p.profileId));
    }
    return list;
  }, [all, q, city, category, catServices, linked]);

  useEffect(() => {
    document.title = 'Profissionais · Samej';
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl md:text-2xl font-black text-brand-darkBlue tracking-tight flex items-center">
          <Briefcase className="w-6 h-6 mr-2 text-brand-orange" /> Encontrar profissionais
        </h1>
        <p className="text-sm text-gray-400 font-bold mt-1">
          {formatCount(all.length)} profissional(ais) com perfil aprovado na plataforma.
        </p>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-full px-4">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, profissão, especialidade..."
            className="flex-1 bg-transparent py-2.5 text-sm font-bold focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-full px-3 py-2 text-xs font-black text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
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
          {(q || city || category) && (
            <button
              onClick={() => { setQ(''); setCity(''); setCategory(''); }}
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
                <div className="w-14 h-14 rounded-full bg-gray-100"></div>
                <div className="flex-1 space-y-2"><div className="h-3 bg-gray-100 rounded-full w-2/3"></div><div className="h-2 bg-gray-100 rounded-full w-1/2"></div></div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full w-full mb-2"></div>
              <div className="h-3 bg-gray-100 rounded-full w-3/4"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-black text-gray-700 mb-1">Nenhum profissional encontrado</p>
          <p className="text-gray-400 font-bold text-sm">Ajuste sua busca ou remova os filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const name = p.profile.full_name || p.profile.username || 'Profissional';
            const location = joinLocation(p.city, p.state);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
                <div className="flex items-start space-x-3">
                  <Avatar src={p.profile.avatar_url} alt={name} size={56} verified={p.profile.verified} linkTo={`/social/${p.profileId}`} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/social/${p.profileId}`} className="font-black text-gray-900 hover:underline flex items-center truncate">
                      {name}
                      {p.profile.verified && <BadgeCheck className="w-4 h-4 ml-1 text-brand-blue flex-shrink-0" />}
                    </Link>
                    <p className="text-sm font-bold text-brand-orange truncate">{p.profession || 'Profissional'}</p>
                    {location && (
                      <p className="flex items-center text-xs text-gray-400 font-bold mt-0.5">
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" /> {location}
                      </p>
                    )}
                  </div>
                </div>

                {p.description && (
                  <p className="text-sm text-gray-600 font-medium mt-3 line-clamp-2">{p.description}</p>
                )}

                {p.specialties && p.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.specialties.slice(0, 3).map((s, i) => (
                      <span key={i} className="px-2.5 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-[11px] font-bold text-gray-500">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {p.experienceYears != null && (
                  <p className="flex items-center text-xs font-black text-gray-400 mt-3">
                    <Star className="w-3.5 h-3.5 mr-1 text-amber-400" /> {p.experienceYears} ano(s) de experiência
                  </p>
                )}

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                  <Link to={`/social/${p.profileId}`} className="flex-1 text-center bg-brand-blue text-white py-2 rounded-full text-xs font-black hover:bg-brand-darkBlue transition-colors">
                    Ver perfil
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

export default ProfessionalsPage;