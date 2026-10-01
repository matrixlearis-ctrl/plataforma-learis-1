import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Building2, Tags, Megaphone, Eye } from 'lucide-react';
import { ProfessionalCardItem, CompanyCardItem } from '../../types';
import { getSuggestions } from '../../lib/discovery';
import { roleLabel } from '../../lib/format';
import Avatar from '../Avatar';

const RightPanel: React.FC = () => {
  const [pros, setPros] = useState<ProfessionalCardItem[]>([]);
  const [comps, setComps] = useState<CompanyCardItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getSuggestions(3)
      .then(({ professionals, companies }) => {
        setPros(professionals);
        setComps(companies);
      })
      .catch(() => setError('Não foi possível carregar sugestões.'));
  }, []);

  const item = (pro: ProfessionalCardItem) => (
    <Link key={pro.id} to={`/social/${pro.profileId}`} className="flex items-center space-x-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
      <Avatar src={pro.profile.avatar_url} alt={pro.profile.full_name || 'Profissional'} size={40} verified={pro.profile.verified} />
      <div className="min-w-0">
        <p className="text-sm font-black text-gray-900 truncate">{pro.profile.full_name || pro.profile.username || 'Profissional'}</p>
        <p className="text-xs text-gray-400 font-bold truncate">{pro.profession || roleLabel(pro.profile.role)}</p>
      </div>
    </Link>
  );

  const compItem = (c: CompanyCardItem) => (
    <Link key={c.id} to={`/social/${c.profileId}`} className="flex items-center space-x-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
      <Avatar src={c.logoUrl || c.profile.avatar_url} alt={c.companyName || 'Empresa'} size={40} verified={c.profile.verified} />
      <div className="min-w-0">
        <p className="text-sm font-black text-gray-900 truncate">{c.companyName || c.profile.full_name || 'Empresa'}</p>
        <p className="text-xs text-gray-400 font-bold truncate">
          {[c.city, c.state].filter(Boolean).join(' · ') || 'Empresa'}
        </p>
      </div>
    </Link>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Descubra no Samej</p>
        <div className="space-y-1">
          <Link to="/professionals" className="flex items-center px-2 py-2 rounded-xl text-sm font-black text-gray-700 hover:bg-gray-50 transition-colors">
            <Briefcase className="w-4 h-4 mr-3 text-brand-blue" /> Profissionais
          </Link>
          <Link to="/companies" className="flex items-center px-2 py-2 rounded-xl text-sm font-black text-gray-700 hover:bg-gray-50 transition-colors">
            <Building2 className="w-4 h-4 mr-3 text-brand-blue" /> Empresas
          </Link>
          <Link to="/busca" className="flex items-center px-2 py-2 rounded-xl text-sm font-black text-gray-700 hover:bg-gray-50 transition-colors">
            <Tags className="w-4 h-4 mr-3 text-brand-orange" /> Produtos e serviços
          </Link>
        </div>
      </div>

      {pros.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Profissionais em destaque</p>
          <div className="space-y-0.5">{pros.map(item)}</div>
          <Link to="/professionals" className="block text-center text-sm font-black text-brand-blue mt-2 pt-2 border-t border-gray-50 hover:underline">
            Ver todos
          </Link>
        </div>
      )}

      {comps.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Empresas para seguir</p>
          <div className="space-y-0.5">{comps.map(compItem)}</div>
          <Link to="/companies" className="block text-center text-sm font-black text-brand-blue mt-2 pt-2 border-t border-gray-50 hover:underline">
            Ver todas
          </Link>
        </div>
      )}

      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/60 p-6 text-center">
        <Megaphone className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Publicidade</p>
        <p className="text-xs text-gray-400 font-bold leading-relaxed">
          Espaço reservado para anunciantes.
        </p>
        <p className="inline-flex items-center text-[11px] font-black text-brand-orange mt-2">
          <Eye className="w-3 h-3 mr-1" /> Anuncie aqui em breve
        </p>
      </div>

      {error && <p className="text-xs text-gray-400 font-bold text-center">{error}</p>}
    </div>
  );
};

export default RightPanel;