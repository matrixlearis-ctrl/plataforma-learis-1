
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { User } from '../types';
import { 
  Search, 
  CheckCircle, 
  Star, 
  ArrowRight, 
  Users, 
  Coins, 
  Smartphone, 
  UserPlus,
  ShieldCheck,
  Zap,
  Award,
  Edit3,
  Mail,
  Handshake
} from 'lucide-react';

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

  const testimonials = [
    {
      name: "Clayton Amaral",
      role: "Cliente - São Paulo, SP",
      avatar: "/images/clayton.jpg"
    },
    {
      name: "José Reis",
      role: "Pedreiro - Rio de Janeiro, RJ",
      avatar: "/images/jose.jpg"
    },
    {
      name: "Clara Almeida",
      role: "Cliente - Belo Horizonte, MG",
      avatar: "/images/clara.jpg"
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section - Estilo Habitissimo Premium */}
      <section className="bg-brand-darkBlue text-white pt-24 pb-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-orange/20 rounded-full -mr-64 -mt-64 blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-[100px]"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center bg-white/10 border border-white/20 px-5 py-2 rounded-full mb-10 backdrop-blur-md">
            <Award className="text-brand-orange mr-2 w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Líder em orçamentos online</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[0.95] tracking-tighter max-w-5xl mx-auto">
            Sua casa, <span className="text-brand-orange italic">perfeita</span>. <br/>Sem complicações.
          </h1>
          <p className="text-xl md:text-2xl text-blue-100/70 mb-14 max-w-2xl mx-auto font-medium">
            Conte com a gente para conectar você aos melhores profissionais e receba até 4 orçamentos gratuitos.
          </p>
          
          <form 
            onSubmit={handleSearch}
            className="bg-white p-2 md:p-4 rounded-[3rem] shadow-3xl flex flex-col md:flex-row max-w-3xl mx-auto border-[10px] border-white/10 mb-12 transform hover:scale-[1.02] transition-transform"
          >
            <div className="flex-grow flex items-center px-8 py-5 md:py-0">
              <Search className="text-brand-blue mr-4 w-6 h-6" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="O que você precisa?" 
                className="w-full py-4 text-gray-900 font-bold focus:outline-none placeholder-gray-400 bg-transparent text-xl uppercase"
              />
            </div>
            <button 
              type="submit"
              className="bg-brand-orange text-white px-14 py-6 rounded-[2.5rem] font-black hover:bg-brand-lightOrange transition-all text-center shadow-2xl active:scale-95 text-lg uppercase tracking-tight"
            >
              Pedir Orçamento
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-10 text-blue-100/60 font-black text-[10px] uppercase tracking-widest">
            <div className="flex items-center"><Zap className="w-4 h-4 mr-2 text-brand-orange" /> Rápido e Grátis</div>
            <div className="flex items-center"><ShieldCheck className="w-4 h-4 mr-2 text-brand-orange" /> Profissionais Ativos</div>
            <div className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-brand-orange" /> Sem Compromisso</div>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-black text-brand-darkBlue">+50k</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Serviços Realizados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-black text-brand-darkBlue">4.9/5</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Avaliação Média</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-black text-brand-darkBlue">15min</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Tempo Médio de Resposta</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-black text-brand-darkBlue">100%</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Segurança Garantida</p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="bg-brand-bg py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-brand-darkBlue tracking-tighter">
              Explore por <span className="text-brand-blue">Categorias</span>
            </h2>
            <p className="text-lg text-gray-500 font-bold max-w-xl mx-auto uppercase tracking-tight">
              Selecione o serviço desejado e conect-se com especialistas.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {CATEGORIES.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/pedir-orcamento?category=${cat.id}`}
                className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-blue-900/5 hover:shadow-2xl transition-all flex flex-col items-center text-center group active:scale-95"
              >
                <div className="w-24 h-24 bg-brand-bg text-brand-blue rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-brand-orange group-hover:text-white transition-all duration-500 shadow-inner group-hover:rotate-6">
                  {React.cloneElement(cat.icon as React.ReactElement<any>, { className: "w-10 h-10" })}
                </div>
                <span className="font-black text-gray-800 text-xl group-hover:text-brand-orange transition-colors leading-tight mb-2">
                  {cat.name}
                </span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ver Profissionais</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="bg-white py-24 px-4 border-t border-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-brand-darkBlue text-center mb-20 tracking-tight">
            Como Funciona?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-8">
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#2b6be6] rounded-full flex items-center justify-center text-white font-black text-sm z-10 border-4 border-white shadow-md">1</div>
                <div className="w-32 h-32 bg-white border-2 border-gray-100 group-hover:bg-[#2b6be6] group-hover:border-transparent rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500">
                  <Edit3 className="w-12 h-12 text-[#2b6be6] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-[#2b6be6] transition-colors">Descreva seu projeto</h3>
              <p className="text-gray-500 font-medium leading-relaxed text-sm px-4">Conte-nos o que você precisa. Quanto mais detalhes, melhor será o orçamento que você receberá.</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-8">
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#2b6be6] rounded-full flex items-center justify-center text-white font-black text-sm z-10 border-4 border-white shadow-md">2</div>
                <div className="w-32 h-32 bg-white border-2 border-gray-100 group-hover:bg-[#2b6be6] group-hover:border-transparent rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500">
                  <Search className="w-12 h-12 text-[#2b6be6] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-[#2b6be6] transition-colors">Encontramos profissionais</h3>
              <p className="text-gray-500 font-medium leading-relaxed text-sm px-4">Nossa plataforma conecta você automaticamente com profissionais qualificados da sua região.</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-8">
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#2b6be6] rounded-full flex items-center justify-center text-white font-black text-sm z-10 border-4 border-white shadow-md">3</div>
                <div className="w-32 h-32 bg-white border-2 border-gray-100 group-hover:bg-[#2b6be6] group-hover:border-transparent rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500">
                  <Mail className="w-12 h-12 text-[#2b6be6] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-[#2b6be6] transition-colors">Receba orçamentos</h3>
              <p className="text-gray-500 font-medium leading-relaxed text-sm px-4">Receba até 4 orçamentos gratuitos por email e WhatsApp.</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-8">
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#2b6be6] rounded-full flex items-center justify-center text-white font-black text-sm z-10 border-4 border-white shadow-md">4</div>
                <div className="w-32 h-32 bg-white border-2 border-gray-100 group-hover:bg-[#2b6be6] group-hover:border-transparent rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500">
                  <Handshake className="w-12 h-12 text-[#2b6be6] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-[#2b6be6] transition-colors">Escolha e contrate</h3>
              <p className="text-gray-500 font-medium leading-relaxed text-sm px-4">Compare preços, avalie perfis e escolha o profissional ideal. Negocie diretamente com ele!</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Para Profissionais */}
      <section className="py-24 px-4 bg-brand-darkBlue overflow-hidden relative">
         <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-brand-orange/10 rounded-full blur-[100px]"></div>
         <div className="max-w-7xl mx-auto bg-brand-orange rounded-[4rem] p-12 md:p-24 text-white flex flex-col md:flex-row items-center gap-16 relative z-10 shadow-3xl">
            <div className="md:w-3/5 space-y-8">
              <h2 className="text-4xl md:text-6xl font-black leading-none tracking-tighter">
                É um profissional? Conquiste mais clientes facilmente com a <span className="text-brand-darkBlue">Samej</span>.
              </h2>
              <p className="text-xl font-bold opacity-90 leading-relaxed max-w-lg">
                Receba pedidos de orçamento direto no seu celular e feche novos negócios todos os dias.
              </p>
              <Link to="/auth" className="inline-flex items-center bg-brand-darkBlue text-white px-12 py-6 rounded-[2.5rem] font-black text-xl hover:scale-105 transition-all shadow-2xl active:scale-95 uppercase">
                Sou Profissional
                <ArrowRight className="ml-3 w-6 h-6" />
              </Link>
            </div>
            <div className="md:w-2/5">
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop" 
                alt="Profissional Ativo" 
                className="rounded-[3rem] shadow-4xl border-8 border-white/20 transform md:rotate-3 hover:rotate-0 transition-transform duration-700"
              />
            </div>
         </div>
      </section>

      {/* Testimonials - O que nossos usuários dizem */}
      <section className="bg-brand-bg py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-brand-darkBlue mb-16 text-center tracking-tight">O que nossos usuários dizem</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex items-center">
                <div className="flex-shrink-0 mr-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm">
                    <img 
                      src={item.avatar} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://picsum.photos/seed/${item.name}/200`;
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight mb-1">{item.name}</h3>
                  <p className="text-sm font-bold text-gray-400 mb-2">{item.role}</p>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
