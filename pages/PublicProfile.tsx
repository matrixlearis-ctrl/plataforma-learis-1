
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProfessionalProfile } from '../types';
import { Star, MapPin, ShieldCheck, Phone, MessageCircle, ArrowLeft, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PublicProfileProps {
  professionals: (ProfessionalProfile & { name: string, avatar: string, id: string })[];
}

const PublicProfile: React.FC<PublicProfileProps> = ({ professionals }) => {
  const { id } = useParams();
  const pro = professionals.find(p => p.id === id);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('professional_id', id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setReviews(data);
      }
      setLoadingReviews(false);
    };

    fetchReviews();
  }, [id]);

  if (!pro) return <div className="text-center py-20 font-bold">Profissional não encontrado.</div>;

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
                      <Star className="w-6 h-6 mr-1 fill-current" /> {pro.rating.toFixed(1)}
                    </div>
                    <div className="flex items-center font-bold">
                      <MapPin className="w-5 h-5 mr-2" /> {pro.region}
                    </div>
                 </div>
               </div>
             </div>

             <div className="prose max-w-none text-gray-600 text-lg leading-relaxed mb-10">
               <h3 className="text-xl font-bold text-gray-900 mb-4">Sobre a Empresa</h3>
               <p>{pro.description || "Nenhuma descrição fornecida."}</p>
             </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[3rem] border shadow-sm">
            <h3 className="text-2xl font-black text-brand-darkBlue mb-8 flex items-center tracking-tight">
              <MessageSquare className="w-6 h-6 mr-3 text-brand-blue" /> O que dizem os clientes
            </h3>
            
            {loadingReviews ? (
              <div className="text-center py-8 text-gray-400 font-bold">Carregando avaliações...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-gray-400 font-bold">
                Nenhuma avaliação disponível ainda. Seja o primeiro a avaliar!
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-inner">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 font-bold italic text-lg leading-relaxed">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[3rem] border shadow-sm">
            <h3 className="text-2xl font-black text-brand-darkBlue mb-8 flex items-center tracking-tight">
              <ImageIcon className="w-6 h-6 mr-3 text-brand-blue" /> Galeria de Projetos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-gray-100 rounded-[2rem] overflow-hidden group border-4 border-white shadow-md">
                  <img src={`https://picsum.photos/seed/${pro.id}-${i}/400`} alt="Projeto" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-2xl sticky top-24">
            <h3 className="text-xl font-black text-brand-darkBlue mb-6 uppercase tracking-tight">Contatar agora</h3>
            <Link to="/pedir-orcamento" className="block w-full bg-brand-orange text-white py-5 rounded-[1.5rem] font-black text-center hover:bg-brand-lightOrange shadow-xl shadow-orange-200 transition-all mb-4 uppercase text-sm">
              Pedir Orçamento Grátis
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <a href={`tel:${pro.phone}`} className="flex items-center justify-center p-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-gray-700 hover:bg-gray-100 transition-colors shadow-sm">
                <Phone className="w-5 h-5" />
              </a>
              <a href="#" className="flex items-center justify-center p-5 bg-green-50 border border-green-100 rounded-[1.5rem] text-green-600 hover:bg-green-100 transition-colors shadow-sm">
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
