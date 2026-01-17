import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Instagram, Facebook, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#101e2c] text-white pt-20 pb-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Logo and Tagline */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center">
              <img 
                src="/images/logo.png" 
                alt="Samej Logo" 
                className="h-14 w-auto object-contain brightness-0 invert" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-2xl">S</span>
                </div>
                <span className="text-2xl font-black text-white tracking-tight">Samej</span>
              </div>
            </Link>
            <p className="text-gray-400 font-bold text-sm leading-relaxed max-w-xs">
              O seu melhor portal de Serviços. Conectando quem precisa com quem sabe fazer.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                <Instagram className="w-5 h-5 text-gray-300" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                <Facebook className="w-5 h-5 text-gray-300" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                <Linkedin className="w-5 h-5 text-gray-300" />
              </a>
            </div>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="text-lg font-black mb-8 uppercase tracking-widest text-white">Para Clientes</h4>
            <ul className="space-y-4 text-gray-400 font-bold text-sm">
              <li>
                <Link to="/pedir-orcamento" className="hover:text-brand-orange transition-colors">Solicitar Orçamento</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-brand-orange transition-colors">Como Funciona</Link>
              </li>
              <li>
                <Link to="/profissionais" className="hover:text-brand-orange transition-colors">Diretório de Profissionais</Link>
              </li>
            </ul>
          </div>

          {/* For Professionals */}
          <div>
            <h4 className="text-lg font-black mb-8 uppercase tracking-widest text-white">Para Profissionais</h4>
            <ul className="space-y-4 text-gray-400 font-bold text-sm">
              <li>
                <Link to="/auth" className="hover:text-brand-orange transition-colors">Cadastrar-se</Link>
              </li>
              <li>
                <Link to="/profissional/recarregar" className="hover:text-brand-orange transition-colors">Comprar Moedas</Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-brand-orange transition-colors">Painel do Profissional</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-black mb-8 uppercase tracking-widest text-white">Contato</h4>
            <ul className="space-y-4 text-gray-400 font-bold text-sm">
              <li className="flex items-center">
                <Mail className="w-4 h-4 mr-3 text-brand-orange" />
                <a href="mailto:samejgrup@gmail.com" className="hover:text-brand-orange transition-colors">samejgrup@gmail.com</a>
              </li>
              <li className="pt-4">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Atendimento</p>
                <p>Segunda à Sexta</p>
                <p>08:00 às 18:00</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 text-center">
          <p className="text-gray-500 text-sm font-bold tracking-tight">
            © 2026 Samej - Todos os direitos reservados
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;