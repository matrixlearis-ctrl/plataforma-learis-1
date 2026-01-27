import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { User, OrderStatus, OrderRequest } from '../types';
import { compressImage, getStoragePath } from '../lib/imageUtils';
import { supabase } from '../lib/supabase';
import {
  Send,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MapPin,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Calendar,
  Phone,
  Home,
  User as UserIcon,
  Star,
  Clock,
  Hammer,
  Paintbrush,
  Lightbulb,
  Shovel,
  Droplets,
  Camera,
  X
} from 'lucide-react';

interface NewRequestProps {
  user: User | null;
  onAddOrder: (order: OrderRequest) => void;
}

const NewRequest: React.FC<NewRequestProps> = ({ user, onAddOrder }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [loadingCep, setLoadingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    category: searchParams.get('category') || '',
    description: '',
    phone: '',
    cep: '',
    address: '',
    neighborhood: '',
    number: '',
    complement: '',
    location: '',
    deadline: '',
    imageUrl: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const compressed = await compressImage(file);
      const path = getStoragePath('order-images', user?.id || 'anonymous', file.name);

      const { data, error } = await supabase.storage
        .from('order-images')
        .upload(path, compressed);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('order-images')
        .getPublicUrl(path);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
    } catch (err) {
      console.error(err);
      alert("Erro ao subir imagem.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const [submitted, setSubmitted] = useState(false);

  // Dados dos profissionais para o carrossel do Passo 3
  const proPreviews = [
    { name: 'João Silva', role: 'Pedreiro', rating: 4.9, reviews: 127, exp: 15, loc: 'São Paulo, SP', tags: ['Alvenaria', 'Acabamentos', 'Reformas'], img: '/images/João Silva.jpg', icon: <Hammer className="w-4 h-4" /> },
    { name: 'Tiago Menezes', role: 'Pintor', rating: 4.8, reviews: 89, exp: 12, loc: 'Rio de Janeiro, RJ', tags: ['Pintura Residencial', 'Textura', 'Verniz'], img: '/images/Tiago Menezes.jpg', icon: <Paintbrush className="w-4 h-4" /> },
    { name: 'Ricardo Santos', role: 'Eletricista', rating: 5.0, reviews: 156, exp: 20, loc: 'Belo Horizonte, MG', tags: ['Instalações', 'Manutenção', 'Emergência'], img: '/images/Ricardo Santos.jpg', icon: <Lightbulb className="w-4 h-4" /> },
    { name: 'Francisco Lessa', role: 'Jardineiro', rating: 4.7, reviews: 64, exp: 10, loc: 'Curitiba, PR', tags: ['Paisagismo', 'Poda', 'Adubação'], img: '/images/Francisco Lessa.jpg', icon: <Shovel className="w-4 h-4" /> },
    { name: 'Pedro Lima', role: 'Encanador', rating: 4.9, reviews: 112, exp: 8, loc: 'Porto Alegre, RS', tags: ['Hidráulica', 'Reparos', 'Desentupimento'], img: '/images/Pedro Lima.jpg', icon: <Droplets className="w-4 h-4" /> },
    { name: 'Mara da Silva', role: 'Arquiteta', rating: 5.0, reviews: 42, exp: 5, loc: 'Florianópolis, SC', tags: ['Projetos 3D', 'Interiores', 'Reformas'], img: '/images/Mara da Silva.jpg', icon: <Home className="w-4 h-4" /> },
  ];

  // Estado para o carrossel infinito e responsividade
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [visibleCards, setVisibleCards] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setVisibleCards(1);
      else if (window.innerWidth < 1024) setVisibleCards(2);
      else setVisibleCards(3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (step === 3) {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => {
          if (prev >= proPreviews.length) return 0;
          return prev + 1;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step, proPreviews.length]);

  useEffect(() => {
    if (carouselIndex === proPreviews.length) {
      const timeout = setTimeout(() => {
        setTransitionEnabled(false);
        setCarouselIndex(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitionEnabled(true);
          });
        });
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [carouselIndex, proPreviews.length]);

  const maskPhone = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    return value.substring(0, 15);
  };

  useEffect(() => {
    const fetchAddress = async () => {
      const cleanCep = formData.cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        setLoadingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              location: `${data.localidade}, ${data.uf}`,
              neighborhood: data.bairro || '',
              address: data.logradouro || ''
            }));
            setError(null);
          } else {
            setError("CEP não encontrado.");
          }
        } catch (error) {
          setError("Erro ao consultar o CEP.");
        } finally {
          setLoadingCep(false);
        }
      }
    };
    fetchAddress();
  }, [formData.cep]);

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1: return !!formData.category;
      case 2: return !!formData.cep && !!formData.location && !!formData.address && !!formData.neighborhood && !!formData.number;
      case 3: return !!formData.description && formData.description.length > 10;
      case 4: return !!formData.deadline;
      case 5: {
        const cleanPhone = formData.phone.replace(/\D/g, '');
        return !!formData.name && cleanPhone.length === 11;
      }
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setError(null);
      if (step < totalSteps) setStep(step + 1);
    } else {
      setError(step === 5 ? "Preencha o telefone com DDD e os 9 dígitos." : "Por favor, preencha todos os campos obrigatórios.");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps) {
      handleNext();
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const newOrder: OrderRequest = {
        id: crypto.randomUUID(),
        clientId: user?.id || '',
        clientName: formData.name,
        category: formData.category,
        description: formData.description,
        phone: formData.phone,
        address: formData.address,
        number: formData.number,
        complement: formData.complement,
        location: formData.location,
        neighborhood: formData.neighborhood,
        deadline: formData.deadline,
        status: OrderStatus.OPEN,
        createdAt: new Date().toISOString(),
        leadPrice: 5,
        unlockedBy: [],
        imageUrl: formData.imageUrl
      };
      await onAddOrder(newOrder);
      setSubmitted(true);
    } catch (err: any) {
      setError("Não foi possível enviar seu pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-20 p-16 bg-white rounded-[4rem] text-center border-4 border-white shadow-3xl animate-in zoom-in-95">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
          <CheckCircle2 className="w-14 h-14" />
        </div>
        <h2 className="text-4xl font-black text-brand-darkBlue mb-6 tracking-tight">PEDIDO ENVIADO!</h2>
        <p className="text-gray-600 mb-12 text-xl font-medium leading-relaxed max-w-md mx-auto">
          Excelente! Sua solicitação será enviada para profissionais verificados.
        </p>
        <button onClick={() => navigate(user ? '/cliente/dashboard' : '/')} className="w-full bg-brand-orange text-white px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-brand-lightOrange shadow-xl">
          {user ? 'VER MEUS PEDIDOS' : 'VOLTAR AO INÍCIO'}
        </button>
      </div>
    );
  }

  const progress = (step / totalSteps) * 100;

  return (
    <div className="max-w-7xl mx-auto my-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center text-gray-700 hover:text-brand-blue font-bold transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
          </button>
          <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Passo {step} de {totalSteps}</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full mb-12 overflow-hidden shadow-inner">
          <div className="h-full bg-brand-orange transition-all duration-500 rounded-full shadow-lg shadow-orange-200" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className={`bg-white rounded-[4rem] border border-gray-100 shadow-3xl overflow-hidden p-8 md:p-20 relative mx-auto ${step === 3 ? 'max-w-7xl' : 'max-w-4xl'}`}>
        <form onSubmit={handleSubmit} className="relative z-10 space-y-12">
          {error && (
            <div className="p-6 bg-red-50 border-2 border-red-100 text-red-700 rounded-3xl flex items-center text-sm font-bold animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-6 h-6 mr-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-4xl font-black text-brand-darkBlue tracking-tight">Qual serviço você precisa?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => { setFormData({ ...formData, category: cat.id }); setStep(2); }} className={`flex items-center p-6 rounded-3xl border-4 transition-all text-left group ${formData.category === cat.id ? 'border-brand-blue bg-blue-50 text-brand-blue shadow-lg' : 'border-gray-50 hover:border-brand-blue/20 text-gray-700'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-5 transition-colors ${formData.category === cat.id ? 'bg-brand-blue text-white' : 'bg-brand-bg text-brand-blue group-hover:bg-brand-blue group-hover:text-white'}`}>{cat.icon}</div>
                    <span className="font-black uppercase text-sm tracking-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-4xl font-black text-brand-darkBlue tracking-tight">Onde será o serviço?</h2>
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="CEP" required maxLength={9} value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase text-gray-900 placeholder-gray-600" />
                    {loadingCep && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-brand-blue" />}
                  </div>
                  <input type="text" placeholder="CIDADE / UF" readOnly required value={formData.location} className="w-full px-6 py-5 bg-gray-100 border-2 border-transparent rounded-3xl font-bold text-gray-700 uppercase cursor-not-allowed placeholder-gray-600" />
                </div>
                <input type="text" placeholder="RUA / LOGRADOURO" required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase text-gray-900 placeholder-gray-600" />
                <input type="text" placeholder="BAIRRO" required value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} className="w-full px-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase text-gray-900 placeholder-gray-600" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" placeholder="NÚMERO" required value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} className="w-full px-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase text-gray-900 placeholder-gray-600" />
                  <input type="text" placeholder="COMPLEMENTO (OPCIONAL)" value={formData.complement} onChange={e => setFormData({ ...formData, complement: e.target.value })} className="w-full px-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase text-gray-900 placeholder-gray-600" />
                </div>
              </div>
              <button type="button" onClick={handleNext} className="w-full bg-brand-darkBlue text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all uppercase tracking-tight">Próximo Passo</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-4xl font-black text-brand-darkBlue tracking-tight">O que precisa ser feito?</h2>

              <div className="space-y-6">
                <textarea rows={6} required placeholder="Descreva os detalhes do serviço..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-8 bg-brand-bg border-2 border-transparent rounded-[2.5rem] font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase placeholder:normal-case resize-none text-gray-900 placeholder-gray-600 shadow-inner" />

                <div className="p-8 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                  <div className="flex flex-col items-center justify-center text-center">
                    {formData.imageUrl ? (
                      <div className="relative w-full max-w-[200px] aspect-video rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                        <img src={formData.imageUrl} className="w-full h-full object-cover" />
                        <button onClick={removeImage} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-xl shadow-lg hover:bg-red-600 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer group flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                          {uploadingImage ? <Loader2 className="w-8 h-8 animate-spin text-brand-blue" /> : <Camera className="w-8 h-8 text-brand-blue" />}
                        </div>
                        <span className="text-sm font-black text-brand-darkBlue uppercase tracking-tight">Anexar foto do serviço (Opcional)</span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest text-[#2b6be6]">As fotos do pedido expiram em 50 dias</p>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <button type="button" onClick={handleNext} className="w-full bg-brand-darkBlue text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all uppercase">
                Próximo Passo
              </button>

              {/* Seção de Profissionais Disponíveis (Solicitado pelo usuário) */}
              <div className="pt-20 border-t border-gray-100 text-center">
                <h2 className="text-3xl md:text-4xl font-black text-brand-darkBlue mb-4 tracking-tight">Profissionais disponíveis na sua região</h2>
                <p className="text-gray-500 font-bold mb-12">Conheça alguns dos profissionais que podem atender você</p>

                <div className="relative overflow-hidden w-full pb-10">
                  <div
                    className={`flex gap-6 ${transitionEnabled ? 'transition-transform duration-700 ease-in-out' : ''}`}
                    style={{ transform: `translateX(-${carouselIndex * (100 / visibleCards)}%)` }}
                  >
                    {[...proPreviews, ...proPreviews].map((pro, idx) => (
                      <div key={idx}
                        className="bg-white rounded-[2rem] border border-gray-100 shadow-lg p-8 flex flex-col items-center group hover:shadow-2xl transition-all"
                        style={{ minWidth: `calc(${100 / visibleCards}% - ${(6 * (visibleCards - 1)) / visibleCards}px)` }}
                      >
                        <div className="relative mb-6">
                          <img
                            src={pro.img}
                            alt={pro.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-brand-blue shadow-md"
                            onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${pro.name}/200`; }}
                          />
                        </div>
                        <h3 className="text-[22px] font-black text-brand-darkBlue mb-1">{pro.name}</h3>
                        <div className="flex items-center text-brand-blue font-bold text-sm uppercase mb-3">
                          {pro.icon}
                          <span className="ml-2">{pro.role}</span>
                        </div>
                        <div className="flex text-amber-400 mb-1">
                          {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 fill-current ${i >= Math.floor(pro.rating) ? 'text-gray-200' : ''}`} />)}
                        </div>
                        <p className="text-xs text-gray-400 font-bold mb-4">{pro.rating} ({pro.reviews} avaliações)</p>
                        <div className="space-y-2 mb-6 text-sm text-gray-500 font-bold w-full">
                          <div className="flex items-center justify-center"><Clock className="w-3 h-3 mr-2 text-brand-blue" /> {pro.exp} anos de experiência</div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mb-8">
                          {pro.tags.map(tag => (
                            <span key={tag} className="bg-blue-50 text-brand-blue text-[11px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider">{tag}</span>
                          ))}
                        </div>
                        <button className="w-full flex items-center justify-center py-3 px-4 border-2 border-brand-blue text-brand-blue rounded-2xl font-black text-[10px] uppercase hover:bg-brand-blue hover:text-white transition-all group-hover:shadow-lg">
                          <Send className="w-3 h-3 mr-2" /> Solicitar Orçamento
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-4xl font-black text-brand-darkBlue tracking-tight">Qual o prazo de execução?</h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'imediato', label: 'O QUANTO ANTES', icon: <Calendar className="w-5 h-5" /> },
                  { id: 'um_mes', label: 'NOS PRÓXIMOS 30 DIAS', icon: <Calendar className="w-5 h-5" /> },
                  { id: 'mais_3_meses', label: 'MAIS DE 3 MESES', icon: <Calendar className="w-5 h-5" /> },
                  { id: 'orcamento', label: 'APENAS ORÇAMENTO', icon: <Calendar className="w-5 h-5" /> }
                ].map(opt => (
                  <button key={opt.id} type="button" onClick={() => { setFormData({ ...formData, deadline: opt.id }); setStep(5); }} className={`flex items-center p-6 rounded-3xl border-4 transition-all text-left ${formData.deadline === opt.id ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-50 hover:border-brand-blue/20 text-gray-700'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-5 ${formData.deadline === opt.id ? 'bg-brand-blue text-white' : 'bg-brand-bg text-brand-blue'}`}>{opt.icon}</div>
                    <span className="font-black text-sm uppercase">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-4xl font-black text-brand-darkBlue tracking-tight">Dados de Contato</h2>
              <div className="space-y-6">
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" required placeholder="SEU NOME COMPLETO" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase text-gray-900 placeholder-gray-600" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="tel" required placeholder="WHATSAPP / CELULAR" value={formData.phone} onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })} className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase text-gray-900 placeholder-gray-600" />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-brand-darkBlue text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-3xl active:scale-95 disabled:opacity-50 transition-all uppercase flex items-center justify-center">
                {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                  <>
                    ENVIAR PEDIDO
                    <ChevronRight className="ml-3 w-6 h-6" />
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewRequest;