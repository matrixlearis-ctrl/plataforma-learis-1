import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { User, UserRole } from '../types';
import { Search, CheckCircle, ShieldCheck, Zap, ArrowRight, Star } from 'lucide-react';

interface HomeProps {
  user: User | null;
}

const Home: React.FC<HomeProps> = ({ user }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/profissionais?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate('/pedir-orcamento');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-brand-darkBlue text-white pt-24 pb-32 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/10 rounded-full -mr-64 -mt-64 blur-[120px]"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
            <span className="text-brand-orange mr-2 font-black">★</span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-100">A maior rede de serviços da região</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-[1.1] tracking-tight max-w-4xl mx-auto">
            Resolva seus projetos com os <span className="text-brand-orange">melhores</span> profissionais
          </h1>
          <p className="text-xl md:text-2xl text-blue-100/80 mb-12 max-w-2xl mx-auto font-medium">
            Obras, reformas, limpeza e manutenções. Receba até 4 orçamentos gratuitos em poucos minutos.
          </p>
          
          <form 
            onSubmit={handleSearch}
            className="bg-white p-3 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row max-w-3xl mx-auto border-8 border-white/10 mb-8"
          >
            <div className="flex-grow flex items-center px-6 py-4 md:py-0 bg-gray-50 rounded-3xl md:rounded-l-[2rem] md:rounded-r-none border border-gray-100 md:border-none">
              <Search className="text-brand-blue mr-3 w-6 h-6" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: Pintor, Eletricista, Limpeza..." 
                className="w-full py-4 text-gray-900 font-semibold focus:outline-none placeholder-gray-400 bg-transparent text-lg"
              />
            </div>
            <button 
              type="submit"
              className="bg-brand-orange text-white px-12 py-5 rounded-3xl md:rounded-r-[2rem] md:rounded-l-none font-black hover:bg-brand-lightOrange transition-all text-center shadow-lg active:scale-95 text-lg uppercase tracking-tight mt-3 md:mt-0"
            >
              Pedir Orçamento
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-8 text-blue-100/60 font-bold text-sm">
            <div className="flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-brand-orange" /> 100% Grátis para o cliente</div>
            <div className="flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-brand-orange" /> Profissionais Verificados</div>
            <div className="flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-brand-orange" /> Sem compromisso</div>
          </div>
        </div>
      </section>

      {/* Categories Grid - Elevated Style */}
      <section className="max-w-7xl mx-auto -mt-16 py-20 px-4 w-full relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {CATEGORIES.slice(0, 8).map((cat) => (
            <Link 
              key={cat.id} 
              to={`/pedir-orcamento?category=${cat.id}`}
              className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:border-brand-blue/20 hover:-translate-y-2 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 bg-brand-bg text-brand-blue rounded-3xl flex items-center justify-center mb-6 group-hover:bg-brand-blue group-hover:text-white transition-all duration-500 shadow-inner">
                {React.cloneElement(cat.icon as React.ReactElement, { className: "w-8 h-8" })}
              </div>
              <span className="font-extrabold text-gray-800 text-lg group-hover:text-brand-blue transition-colors leading-tight">{cat.name}</span>
              <span className="text-brand-orange text-xs font-black uppercase mt-4 opacity-0 group-hover:opacity-100 transition-all tracking-widest">Pedir Agora</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works - Conversational Flow */}
      <section className="bg-white py-32 px-4 border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-20">
            <div className="md:w-1/2">
              <h2 className="text-4xl md:text-5xl font-black text-brand-darkBlue mb-8 leading-tight">Como a Samej te ajuda a economizar tempo e dinheiro?</h2>
              <div className="space-y-10">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200">1</div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Descreva seu projeto</h3>
                    <p className="text-gray-500 text-lg font-medium leading-relaxed">Conte-nos o que você precisa. Nosso formulário inteligente guia você para dar os detalhes certos.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-orange text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-orange-200">2</div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Compare orçamentos</h3>
                    <p className="text-gray-500 text-lg font-medium leading-relaxed">Até 4 profissionais qualificados entrarão em contato. Você analisa perfis, fotos e avaliações.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-darkBlue text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-slate-300">3</div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Contrate o melhor</h3>
                    <p className="text-gray-500 text-lg font-medium leading-relaxed">Sem taxas de intermediação. O pagamento e os detalhes são combinados diretamente com o profissional.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 relative">
               <div className="absolute -inset-4 bg-brand-blue/5 rounded-[3rem] -rotate-2"></div>
               <img src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop" alt="Trabalho Manual" className="rounded-[3rem] shadow-2xl relative z-10 border-8 border-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-brand-bg py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
           <h2 className="text-3xl font-black text-brand-darkBlue mb-16 uppercase tracking-tight">O que dizem sobre nós</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Carlos Silva", role: "Cliente", text: "Consegui 3 orçamentos para pintar minha casa em 2 horas. Atendimento excelente!", stars: 5 },
                { name: "Maria Oliveira", role: "Cliente", text: "Fácil de usar e os profissionais são muito atenciosos. Recomendo a todos.", stars: 5 },
                { name: "Ricardo Santos", role: "Profissional", text: "A Samej transformou meu negócio. Hoje recebo pedidos todos os dias.", stars: 5 }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-white">
                   <div className="flex justify-center mb-6 text-brand-orange">
                      {[...Array(item.stars)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                   </div>
                   <p className="text-gray-600 font-medium italic mb-8 text-lg leading-relaxed">"{item.text}"</p>
                   <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 bg-brand-blue rounded-full"></div>
                      <div className="text-left">
                         <p className="font-black text-gray-900 text-sm leading-none">{item.name}</p>
                         <p className="text-brand-blue text-[10px] font-black uppercase mt-1 tracking-widest">{item.role}</p>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Professional CTA - Bold habitissimo blue/orange */}
      {!user && (
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto bg-brand-darkBlue rounded-[4rem] p-12 md:p-24 text-white flex flex-col md:flex-row items-center shadow-3xl overflow-hidden relative border-8 border-white/5">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-orange/10 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
            <div className="md:w-3/5 mb-16 md:mb-0 md:pr-16 relative z-10">
              <h2 className="text-5xl md:text-6xl font-black mb-10 leading-[1.1]">Você é um <span className="text-brand-orange">profissional</span>?</h2>
              <p className="text-xl text-blue-100/90 mb-12 leading-relaxed font-medium">
                Encontre novos clientes diariamente na sua região. Sem mensalidades, você paga apenas pelos contatos que desejar atender.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16">
                <div className="flex items-center group">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-brand-orange transition-colors">
                    <Zap className="w-6 h-6 text-brand-orange group-hover:text-white" />
                  </div>
                  <span className="text-lg font-bold">Leads em Tempo Real</span>
                </div>
                <div className="flex items-center group">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-brand-orange transition-colors">
                    <CheckCircle className="w-6 h-6 text-brand-orange group-hover:text-white" />
                  </div>
                  <span className="text-lg font-bold">Sem Taxas de Serviço</span>
                </div>
              </div>
              <Link to="/auth" className="inline-flex items-center bg-brand-orange text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:bg-brand-lightOrange transition-all shadow-2xl hover:-translate-y-1 active:translate-y-0">
                CADASTRAR MINHA EMPRESA
                <ArrowRight className="ml-3 w-6 h-6" />
              </Link>
            </div>
            <div className="md:w-2/5 relative z-10">
              <div className="relative">
                <div className="absolute -inset-4 bg-brand-orange/20 rounded-[3rem] rotate-3 blur-2xl"></div>
                <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop" alt="Profissional Ativo" className="rounded-[3rem] shadow-2xl relative z-10 border-4 border-white/10" />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;