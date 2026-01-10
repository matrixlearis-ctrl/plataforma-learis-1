
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { ProfessionalProfile } from '../types';
import { Search, MapPin, Star, ShieldCheck, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface DirectoryProps {
  professionals: (ProfessionalProfile & { name: string, avatar: string, id: string })[];
}

const ProfessionalDirectory: React.FC<DirectoryProps> = ({ professionals }) => {
  const [filter, setFilter] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const filteredPros = professionals.filter(p => {
    const matchesText = p.name.toLowerCase().includes(filter.toLowerCase()) || p.description.toLowerCase().includes(filter.toLowerCase());
    const matchesCat = catFilter === 'all' || p.categories.includes(catFilter);
    return matchesText && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-4">Encontre os melhores profissionais</h1>
        <p className="text-lg text-gray-500">Navegue por perfis verificados e escolha quem melhor se adapta ao seu projeto.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-1/4 space-y-8">
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Pesquisar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Nome ou serviço..." 
                    className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Categorias</label>
                <div className="space-y-2">
                  <button 
                    onClick={() => setCatFilter('all')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${catFilter === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Todas
                  </button>
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setCatFilter(cat.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${catFilter === cat.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
            <h4 className="text-xl font-bold mb-4 relative z-10">É um profissional?</h4>
            <p className="text-blue-100 text-sm mb-6 relative z-10">Dê o salto para o digital e consiga novos clientes todos os dias.</p>
            <Link to="/auth" className="block text-center bg-white text-blue-900 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all">
              Cadastre-se Agora
            </Link>
          </div>
        </aside>

        {/* Results List */}
        <div className="lg:w-3/4 space-y-6">
          <div className="flex justify-between items-center text-sm text-gray-500 font-medium">
            <span>Mostrando {filteredPros.length} profissionais</span>
            <select className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer">
              <option>Relevância</option>
              <option>Melhor avaliados</option>
              <option>Mais recentes</option>
            </select>
          </div>

          {filteredPros.length === 0 ? (
            <div className="bg-white p-20 text-center rounded-2xl border border-dashed">
              <p className="text-gray-400">Nenhum profissional encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            filteredPros.map(pro => (
              <div key={pro.id} className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
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
                        <div className="flex items-center space-x-3 mt-1 text-gray-400 text-sm font-medium">
                          <div className="flex items-center text-amber-500 font-bold">
                            <Star className="w-4 h-4 mr-1 fill-current" /> {pro.rating}
                          </div>
                          <span>•</span>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" /> {pro.region}
                          </div>
                          <span>•</span>
                          <span className="text-blue-600 font-bold">{pro.completedJobs} trabalhos</span>
                        </div>
                      </div>
                      <Link to={`/perfil/${pro.id}`} className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ChevronRight className="w-6 h-6" />
                      </Link>
                    </div>

                    <p className="text-gray-600 mt-4 line-clamp-2 leading-relaxed font-medium">
                      {pro.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-6">
                      {pro.categories.map(cId => {
                        const cat = CATEGORIES.find(c => c.id === cId);
                        return (
                          <span key={cId} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            {cat?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDirectory;