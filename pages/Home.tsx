
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { User, UserRole } from '../types';
import { Search, CheckCircle, ShieldCheck, Zap } from 'lucide-react';

interface HomeProps {
  user: User | null;
}

const Home: React.FC<HomeProps> = ({ user }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/pedir-orcamento');
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-[#1e3a8a] text-white py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Encontre profissionais qualificados perto de você
          </h1>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto opacity-90">
            Receba orçamentos gratuitos dos melhores profissionais da sua região para obras, limpezas, reparos e muito mais.
          </p>
          
          <form 
            onSubmit={handleSearch}
            className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row max-w-3xl mx-auto border-4 border-white/10"
          >
            <div className="flex-grow flex items-center px-5 py-3 md:py-0 bg-white rounded-xl">
              <Search className="text-gray-400 mr-3 w-6 h-6" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="O que procura? Ex: Eletricista, Pintor..." 
                className="w-full py-3 text-gray-900 font-medium focus:outline-none placeholder-gray-400 bg-white"
              />
            </div>
            <button 
              type="submit"
              className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all text-center shadow-lg hover:shadow-blue-500/30 active:scale-95"
            >
              Pedir Orçamento Grátis
            </button>
          </form>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto py-20 px-4 w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Principais Categorias</h2>
          <div className="h-1.5 w-20 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/pedir-orcamento?category=${cat.id}`}
              className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                {cat.icon}
              </div>
              <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works for Client */}
      <section className="bg-gray-100 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900">Como funciona para Clientes</h2>
            <p className="text-gray-600 mt-4 text-lg">Conseguir o profissional certo nunca foi tão fácil.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="flex flex-col items-center text-center relative">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-8 shadow-xl">1</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Peça orçamentos</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Explique o seu pedido de forma detalhada e gratuita através do nosso formulário inteligente.</p>
            </div>
            <div className="flex flex-col items-center text-center relative">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-8 shadow-xl">2</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Receba contatos</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Você receberá até 4 orçamentos de profissionais qualificados na sua região.</p>
            </div>
            <div className="flex flex-col items-center text-center relative">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-8 shadow-xl">3</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Compare e escolha</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Analise perfis, fotos de trabalhos e avaliações antes de fechar com o melhor profissional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional CTA */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto bg-[#1e3a8a] rounded-[3rem] p-12 md:p-20 text-white flex flex-col md:flex-row items-center shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32"></div>
          <div className="md:w-2/3 mb-12 md:mb-0 md:pr-16 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">É um profissional ou empresa de serviços?</h2>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Encontre novos clientes todos os dias. Na Samej você decide quais pedidos quer atender e paga apenas pelo contato do cliente. Sem mensalidades!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <div className="flex items-center">
                <Zap className="w-6 h-6 mr-4 text-amber-400" />
                <span className="text-lg font-medium">Pedidos reais e verificados</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 mr-4 text-amber-400" />
                <span className="text-lg font-medium">Sem taxas de comissão</span>
              </div>
              <div className="flex items-center">
                <ShieldCheck className="w-6 h-6 mr-4 text-amber-400" />
                <span className="text-lg font-medium">Pagamento seguro via Stripe</span>
              </div>
              <div className="flex items-center">
                <ShieldCheck className="w-6 h-6 mr-4 text-amber-400" />
                <span className="text-lg font-medium">Gestão total no seu painel</span>
              </div>
            </div>
            <Link to="/auth" className="inline-block bg-white text-blue-900 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0">
              Registre sua Empresa Grátis
            </Link>
          </div>
          <div className="md:w-1/3 relative z-10">
             <div className="relative">
               <div className="absolute inset-0 bg-blue-500 rounded-2xl rotate-3 scale-105 opacity-20"></div>
               <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop" alt="Profissional" className="rounded-2xl shadow-2xl relative z-10 grayscale hover:grayscale-0 transition-all duration-700" />
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
