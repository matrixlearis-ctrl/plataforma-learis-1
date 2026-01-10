
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProfessionalProfile } from '../types';
import { CATEGORIES } from '../constants';
import { Star, MapPin, ShieldCheck, CheckCircle2, Phone, MessageCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';

interface PublicProfileProps {
  professionals: (ProfessionalProfile & { name: string, avatar: string, id: string })[];
}

const PublicProfile: React.FC<PublicProfileProps> = ({ professionals }) => {
  const { id } = useParams();
  const pro = professionals.find(p => p.id === id);

  if (!pro) return <div className="text-center py-20">Profissional não encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <Link to="/profissionais" className="flex items-center text-gray-500 hover:text-blue-600 font-bold mb-8 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Voltar ao diretório
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 md:p-12 rounded-[3rem] border shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8">
               <div className="flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                 <ShieldCheck className="w-4 h-4 mr-2" />
                 <span className="text-xs font-black uppercase tracking-widest">Verificado</span>
               </div>
             </div>

             <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
               <img src={pro.avatar} alt={pro.name} className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] object-cover border-8 border-white shadow-2xl" />
               <div className="text-center md:text-left pt-4">
                 <h1 className="text-4xl font-black text-gray-900 mb-3">{pro.name}</h1>
                 <div className="flex items-center justify-center md:justify-start space-x-6 text-gray-400">
                    <div className="flex items-center text-amber-500 font-black text-xl">
                      <Star className="w-6 h-6 mr-1 fill-current" /> {pro.rating}
                    </div>
                    <div className="flex items-center font-bold">
                      <MapPin className="w-5 h-5 mr-2" /> {pro.region}
                    </div>
                 </div>
               </div>
             </div>

             <div className="prose max-w-none text-gray-600 text-lg leading-relaxed mb-10">
               <h3 className="text-xl font-bold text-gray-900 mb-4">Sobre a Empresa</h3>
               <p>{pro.description}</p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-gray-100">
               <div className="text-center">
                 <p className="text-2xl font-black text-blue-600">{pro.completedJobs}</p>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trabalhos</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-black text-blue-600">100%</p>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sucesso</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-black text-blue-600">24h</p>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resposta</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-black text-blue-600">3</p>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Anos Exp.</p>
               </div>
             </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[3rem] border shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <ImageIcon className="w-6 h-6 mr-3 text-blue-600" /> Galeria de Projectos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-gray-100 rounded-3xl overflow-hidden group cursor-pointer border-2 border-white shadow-sm">
                  <img src={`https://picsum.photos/seed/${pro.id}-${i}/400`} alt="Projecto" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <aside className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-2xl sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Contactar agora</h3>
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                <p className="text-sm text-gray-600 font-medium">Orçamentos sem compromisso</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                <p className="text-sm text-gray-600 font-medium">Atendimento personalizado</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                <p className="text-sm text-gray-600 font-medium">Garantia de serviço</p>
              </div>
            </div>

            <Link to="/pedir-orcamento" className="block w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-center hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all mb-4">
              Pedir Orçamento Grátis
            </Link>
            
            <div className="grid grid-cols-2 gap-3">
              <a href={`tel:${pro.phone}`} className="flex items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 hover:bg-gray-100 transition-colors">
                <Phone className="w-5 h-5" />
              </a>
              <a href="#" className="flex items-center justify-center p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 hover:bg-green-100 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
            <h4 className="font-bold text-amber-800 text-sm mb-2">Compromisso Samej</h4>
            <p className="text-amber-700 text-xs leading-relaxed">
              Todos os profissionais passam por uma verificação de identidade e antecedentes para garantir a sua segurança.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PublicProfile;