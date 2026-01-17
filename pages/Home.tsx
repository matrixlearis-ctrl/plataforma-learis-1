import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { User, UserRole } from '../types';
import { Search, CheckCircle, ShieldCheck, Zap, ArrowRight, Star, Edit, Search as SearchIcon, Mail, Handshake, Users, Coins, Smartphone, UserPlus } from 'lucide-react';

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

      {/* "Como Funciona?" Section - Baseada no Print */}
      <section className="bg-white py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-black text-brand-darkBlue mb-20 tracking-tight">Como Funciona?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24">
            {/* Passo 1 */}
            <div className="flex flex-col items-center group">
              <div className="relative mb-10">
                <div className="absolute -top-4 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm z-10 shadow-lg">1</div>
                <div className="w-24 h-24 bg-gray-50 text-blue-600 rounded-full flex items-center justify-center border-2 border-gray-100 group-hover:border-blue-600 group-hover:bg-white transition-all duration-300">
                  <Edit className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-xl font-black text-brand-darkBlue mb-4">Descreva seu projeto</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed px-4">
                Conte-nos o que você precisa. Quanto mais detalhes, melhor será o orçamento que você receberá.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="flex flex-col items-center group">
              <div className="relative mb-10">
                <div className="absolute -top-4 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm z-10 shadow-lg">2</div>
                <div className="w-24 h-24 bg-gray-50 text-blue-600 rounded-full flex items-center justify-center border-2 border-gray-100 group-hover:border-blue-600 group-hover:bg-white transition-all duration-300">
                  <SearchIcon className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-xl font-black text-brand-darkBlue mb-4">Encontramos profissionais</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed px-4">
                Nossa plataforma conecta você automaticamente com profissionais qualificados da sua região.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="flex flex-col items-center group">
              <div className="relative mb-10">
                <div className="absolute -top-4 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm z-10 shadow-lg">3</div>
                <div className="w-24 h-24 bg-gray-50 text-blue-600 rounded-full flex items-center justify-center border-2 border-gray-100 group-hover:border-blue-600 group-hover:bg-white transition-all duration-300">
                  <Mail className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-xl font-black text-brand-darkBlue mb-4">Receba orçamentos</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed px-4">
                Receba até 4 orçamentos gratuitos por email e WhatsApp em até 24 horas.
              </p>
            </div>

            {/* Passo 4 */}
            <div className="flex flex-col items-center group">
              <div className="relative mb-10">
                <div className="absolute -top-4 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm z-10 shadow-lg">4</div>
                <div className="w-24 h-24 bg-gray-50 text-blue-600 rounded-full flex items-center justify-center border-2 border-gray-100 group-hover:border-blue-600 group-hover:bg-white transition-all duration-300">
                  <Handshake className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-xl font-black text-brand-darkBlue mb-4">Escolha e contrate</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed px-4">
                Compare preços, avalie perfis e escolha o profissional ideal. Negocie diretamente com ele!
              </p>
            </div>
          </div>

          {/* Yellow Banner Section - Baseada no Print */}
          <div className="bg-[#fff161] rounded-[2rem] md:rounded-[3rem] p-10 md:p-16 text-left relative overflow-hidden">
            <div className="max-w-4xl">
              <h2 className="text-3xl md:text-4xl font-black text-brand-darkBlue mb-6">Seja um Profissional Samej</h2>
              <p className="text-lg md:text-xl text-brand-darkBlue/80 font-bold mb-10 leading-relaxed">
                Cadastre-se gratuitamente e conecte-se com milhares de clientes em busca dos seus serviços. Aumente sua renda e faça seu negócio crescer!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-4" />
                  <span className="font-bold text-brand-darkBlue">Acesso a milhares de clientes</span>
                </div>
                <div className="flex items-center">
                  <Coins className="w-5 h-5 text-blue-600 mr-4" />
                  <span className="font-bold text-brand-darkBlue">Sistema de moedas flexível</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-blue-600 mr-4" />
                  <span className="font-bold text-brand-darkBlue">Sistema de avaliações</span>
                </div>
                <div className="flex items-center">
                  <Smartphone className="w-5 h-5 text-blue-600 mr-4" />
                  <span className="font-bold text-brand-darkBlue">Acesse de qualquer lugar</span>
                </div>
              </div>

              <Link to="/auth" className="inline-flex items-center bg-transparent border-none text-brand-darkBlue font-black text-lg hover:underline transition-all">
                <UserPlus className="mr-3 w-6 h-6" />
                Cadastrar-se Grátis
              </Link>
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