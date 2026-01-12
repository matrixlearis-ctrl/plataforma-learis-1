
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { ProfessionalProfile, Review } from '../types';
import { Search, MapPin, Star, ShieldCheck, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface DirectoryProps {
  professionals: (ProfessionalProfile & { name: string, avatar: string, id: string })[];
  reviews: Review[];
}

const ProfessionalDirectory: React.FC<DirectoryProps> = ({ professionals, reviews }) => {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('search') || '');
  const [catFilter, setCatFilter] = useState(searchParams.get('cat') || 'all');

  useEffect(() => {
    const s = searchParams.get('search');
    const c = searchParams.get('cat');
    if (s !== null) setFilter(s);
    if (c !== null) setCatFilter(c);
  }, [searchParams]);

  const filteredPros = professionals.filter(p => {
    const matchesText = p.name.toLowerCase().includes(filter.toLowerCase()) || 
                      p.description.toLowerCase().includes(filter.toLowerCase()) ||
                      p.categories.some(c => c.toLowerCase().includes(filter.toLowerCase()));
    const matchesCat = catFilter === 'all' || p.categories.includes(catFilter);
    return matchesText && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Encontre Especialistas</h1>
        <p className="text-lg text-gray-500 font-medium">Navegue por perfis verificados e escolha quem melhor se adapta ao seu projeto.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/4 space-y-8">
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
              <SlidersHorizontal className="w-4 h-4 mr-2 text-blue-600" /> Filtros
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Pesquisar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Nome ou serviço..." className="w-full pl-10 pr-4 py-3 border-2 border-gray-50 rounded-xl outline-none focus:border-blue-500 bg-gray-50 text-sm font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Categorias</label>
                <div className="space-y-2">
                  <button onClick={() => setCatFilter('all')} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-all ${catFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}>Todas</button>
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setCatFilter(cat.id)} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-all ${catFilter === cat.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}>{cat.name}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:w-3/4 space-y-6">
          {filteredPros.length === 0 ? (
            <div className="bg-white p-20 text-center rounded-2xl border border-dashed">
              <p className="text-gray-400 font-bold">Nenhum profissional encontrado para os filtros selecionados.</p>
              <button onClick={() => {setFilter(''); setCatFilter('all');}} className="text-blue-600 font-bold mt-4 hover:underline">Limpar filtros</button>
            </div>
          ) : (
            filteredPros.map(pro => {
              const proReviews = reviews.filter(r => r.professionalId === pro.id);
              const avgRating = proReviews.length > 0 
                ? (proReviews.reduce((acc, r) => acc + r.rating, 0) / proReviews.length).toFixed(1)
                : pro.rating;

              return (
                <div key={pro.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="relative flex-shrink-0">
                      <img src={pro.avatar} alt={pro.name} className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover shadow-md" />
                      <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-xl border-4 border-white shadow-lg">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h2 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{pro.name}</h2>
                          <div className="flex items-center space-x-3 mt-1 text-gray-400 text-sm font-bold">
                            <div className="flex items-center text-amber-500">
                              <Star className="w-4 h-4 mr-1 fill-current" /> {avgRating}
                            </div>
                            <span>•</span>
                            <div className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {pro.region}</div>
                            <span>•</span>
                            <span className="text-blue-600">{proReviews.length} avaliações</span>
                          </div>
                        </div>
                        <Link to={`/perfil/${pro.id}`} className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><ChevronRight className="w-6 h-6" /></Link>
                      </div>
                      <p className="text-gray-600 mt-4 line-clamp-2 leading-relaxed font-medium">{pro.description}</p>
                      <div className="flex flex-wrap gap-2 mt-6">
                        {pro.categories.map(cId => (
                          <span key={cId} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">{CATEGORIES.find(c => c.id === cId)?.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDirectory;
