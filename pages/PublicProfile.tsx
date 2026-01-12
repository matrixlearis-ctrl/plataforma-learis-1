
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProfessionalProfile, Review } from '../types';
import { Star, MapPin, ShieldCheck, CheckCircle2, Phone, MessageCircle, ArrowLeft, Image as ImageIcon, MessageSquare } from 'lucide-react';

interface PublicProfileProps {
  professionals: (ProfessionalProfile & { name: string, avatar: string, id: string })[];
  reviews: Review[];
}

const PublicProfile: React.FC<PublicProfileProps> = ({ professionals, reviews }) => {
  const { id } = useParams();
  const pro = professionals.find(p => p.id === id);
  const proReviews = reviews.filter(r => r.professionalId === id);
  
  const avgRating = proReviews.length > 0 
    ? (proReviews.reduce((acc, r) => acc + r.rating, 0) / proReviews.length).toFixed(1)
    : pro?.rating || "5.0";

  if (!pro) return <div className="text-center py-20">Profissional não encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <Link to="/profissionais" className="flex items-center text-gray-500 hover:text-blue-600 font-bold mb-8 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Voltar ao diretório
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                      <Star className="w-6 h-6 mr-1 fill-current" /> {avgRating}
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
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Serviços</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-black text-blue-600">{proReviews.length}</p>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avaliações</p>
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

          {/* Seção de Avaliações */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] border shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <MessageSquare className="w-6 h-6 mr-3 text-blue-600" /> Opiniões dos Clientes
            </h3>
            
            <div className="space-y-6">
              {proReviews.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium bg-gray-50 rounded-2xl border-2 border-dashed">
                  Nenhuma avaliação disponível ainda.
                </div>
              ) : (
                proReviews.map(review => (
                  <div key={review.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-black text-gray-900">{review.clientName}</p>
                        <div className="flex text-amber-500 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-600 text-sm italic">"{review.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[3rem] border shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <ImageIcon className="w-6 h-6 mr-3 text-blue-600" /> Galeria de Projetos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-gray-100 rounded-3xl overflow-hidden group cursor-pointer border-2 border-white shadow-sm">
                  <img src={`https://picsum.photos/seed/${pro.id}-${i}/400`} alt="Projeto" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-2xl sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Contatar agora</h3>
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
        </aside>
      </div>
    </div>
  );
};

export default PublicProfile;
