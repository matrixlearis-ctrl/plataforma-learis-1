import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { User, OrderStatus, OrderRequest } from '../types';
import { Send, CheckCircle2, ChevronRight, Loader2, MapPin, AlertCircle, ArrowLeft, MessageSquare, Calendar, Phone, Info, Home } from 'lucide-react';

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
  });

  const [submitted, setSubmitted] = useState(false);

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
          }
        } catch (error) {
          console.error("Erro ao buscar CEP:", error);
        } finally {
          setLoadingCep(false);
        }
      }
    };
    fetchAddress();
  }, [formData.cep]);

  const handleNext = () => {
    if (step === 1 && !formData.category) return;
    if (step === 2 && (!formData.location || !formData.address || !formData.number)) return;
    if (step === 3 && !formData.description) return;
    if (step === 4 && !formData.deadline) return;
    if (step === 5 && (!formData.name || !formData.phone)) return;
    
    if (step < totalSteps) {
      setStep(step + 1);
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
        unlockedBy: []
      };

      await onAddOrder(newOrder);
      setSubmitted(true);
    } catch (err: any) {
      setError("Não foi possível enviar seu pedido. Verifique os dados.");
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
        <h2 className="text-4xl font-black text-brand-darkBlue mb-6 tracking-tight">PEDIDO ENVIADO COM SUCESSO!</h2>
        <p className="text-gray-500 mb-12 text-xl font-medium leading-relaxed max-w-md mx-auto">
          Excelente! Sua solicitação agora será enviada para profissionais verificados. Você receberá até 4 contatos.
        </p>
        <button 
          onClick={() => navigate(user ? '/cliente/dashboard' : '/')} 
          className="w-full bg-brand-orange text-white px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-brand-lightOrange transition-all shadow-xl active:scale-95"
        >
          {user ? 'VER MEUS PEDIDOS' : 'VOLTAR AO INÍCIO'}
        </button>
      </div>
    );
  }

  const progress = (step / totalSteps) * 100;

  return (
    <div className="max-w-4xl mx-auto my-12 px-4">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={handleBack} className="flex items-center text-gray-400 hover:text-brand-blue font-bold transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
        </button>
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Passo {step} de {totalSteps}</span>
      </div>

      <div className="h-2 w-full bg-gray-100 rounded-full mb-12 overflow-hidden shadow-inner">
        <div className="h-full bg-brand-orange transition-all duration-500 rounded-full shadow-lg shadow-orange-200" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="bg-white rounded-[4rem] border border-gray-100 shadow-3xl overflow-hidden p-8 md:p-20 relative">
        <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-5">
           <MessageSquare className="w-40 h-40 text-brand-blue" />
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-12">
          {error && (
            <div className="p-6 bg-red-50 border-2 border-red-100 text-red-700 rounded-3xl flex items-center text-sm font-bold animate-pulse">
              <AlertCircle className="w-6 h-6 mr-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* STEP 1: CATEGORY */}
          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <h2 className="text-4xl font-black text-brand-darkBlue leading-tight">Olá! O que você precisa fazer hoje?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setFormData({...formData, category: cat.id});
                      setTimeout(() => setStep(2), 300);
                    }}
                    className={`flex items-center px-8 py-6 border-4 rounded-[2.5rem] text-left transition-all group ${
                      formData.category === cat.id 
                      ? 'border-brand-blue bg-blue-50/50 shadow-xl' 
                      : 'border-transparent bg-brand-bg hover:bg-white hover:border-brand-blue/30'
                    }`}
                  >
                    <div className={`mr-6 p-4 rounded-2xl transition-all ${formData.category === cat.id ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-400 group-hover:text-brand-blue'}`}>
                      {React.cloneElement(cat.icon as React.ReactElement, { className: "w-6 h-6" })}
                    </div>
                    <span className={`text-xl font-black transition-colors ${formData.category === cat.id ? 'text-brand-darkBlue' : 'text-gray-600'}`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION & FULL ADDRESS */}
          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-500">
              <h2 className="text-4xl font-black text-brand-darkBlue leading-tight">Onde o serviço será realizado?</h2>
              
              <div className="space-y-8">
                {/* CEP Input */}
                <div className="max-w-md">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Qual seu CEP?</label>
                  <div className="relative group">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-brand-orange transition-transform group-focus-within:scale-110" />
                    <input 
                      type="text" 
                      required 
                      maxLength={9} 
                      autoFocus
                      value={formData.cep} 
                      onChange={(e) => setFormData({...formData, cep: e.target.value})} 
                      placeholder="00000-000" 
                      className="w-full pl-20 pr-8 py-8 border-4 border-gray-50 bg-brand-bg rounded-[2.5rem] outline-none text-2xl font-black text-brand-darkBlue placeholder-gray-300 focus:border-brand-blue/30 transition-all focus:bg-white shadow-sm" 
                    />
                    {loadingCep && <div className="absolute right-8 top-1/2 -translate-y-1/2"><Loader2 className="w-8 h-8 text-brand-blue animate-spin" /></div>}
                  </div>
                </div>

                {/* Conditional Address Detail Fields */}
                {formData.location && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-8 bg-brand-blue/5 rounded-[2.5rem] border-2 border-brand-blue/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-black text-brand-blue uppercase tracking-widest mb-1">Localização encontrada:</p>
                        <p className="text-2xl font-black text-brand-darkBlue leading-none">{formData.neighborhood}</p>
                        <p className="text-lg font-bold text-brand-blue/70 mt-1">{formData.location}</p>
                      </div>
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Home className="text-brand-orange w-6 h-6" />
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Rua / Logradouro</label>
                        <input 
                          type="text" 
                          required 
                          value={formData.address} 
                          onChange={(e) => setFormData({...formData, address: e.target.value})} 
                          placeholder="Ex: Rua das Flores" 
                          className="w-full px-8 py-6 border-4 border-gray-50 bg-brand-bg rounded-[2rem] outline-none text-xl font-black text-brand-darkBlue placeholder-gray-300 focus:border-brand-blue/30 transition-all focus:bg-white" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Número</label>
                          <input 
                            type="text" 
                            required 
                            value={formData.number} 
                            onChange={(e) => setFormData({...formData, number: e.target.value})} 
                            placeholder="Ex: 123" 
                            className="w-full px-8 py-6 border-4 border-gray-50 bg-brand-bg rounded-[2rem] outline-none text-xl font-black text-brand-darkBlue placeholder-gray-300 focus:border-brand-blue/30 transition-all focus:bg-white" 
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Complemento</label>
                          <input 
                            type="text" 
                            value={formData.complement} 
                            onChange={(e) => setFormData({...formData, complement: e.target.value})} 
                            placeholder="Ex: Bloco B, Ap 12" 
                            className="w-full px-8 py-6 border-4 border-gray-50 bg-brand-bg rounded-[2rem] outline-none text-xl font-black text-brand-darkBlue placeholder-gray-300 focus:border-brand-blue/30 transition-all focus:bg-white" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: DESCRIPTION */}
          {step === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-500">
              <h2 className="text-4xl font-black text-brand-darkBlue leading-tight">Conte-nos os detalhes do seu projeto</h2>
              <div className="space-y-6">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">O que exatamente você precisa?</label>
                <textarea 
                  required
                  rows={6}
                  autoFocus
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-8 border-4 border-gray-50 bg-brand-bg rounded-[3rem] outline-none text-xl font-bold text-brand-darkBlue placeholder-gray-300 focus:border-brand-blue/30 transition-all focus:bg-white resize-none shadow-sm"
                  placeholder="Ex: Preciso pintar uma sala de 20m² e dois quartos com tinta lavável branca..."
                />
                <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                   <Info className="w-6 h-6 text-brand-blue mt-1 flex-shrink-0" />
                   <p className="text-sm text-brand-blue/80 font-medium leading-relaxed">Quanto mais detalhes você der, mais precisos serão os orçamentos que você vai receber.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DEADLINE */}
          {step === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-500">
              <h2 className="text-4xl font-black text-brand-darkBlue leading-tight">Para quando você precisa do serviço?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'imediato', label: 'O quanto antes', sub: 'Estou com pressa' },
                  { id: '15_dias', label: 'Próximas 2 semanas', sub: 'Tenho flexibilidade' },
                  { id: 'um_mes', label: 'No próximo mês', sub: 'Estou planejando' },
                  { id: 'mais_3_meses', label: 'Apenas orçamento', sub: 'Mais de 3 meses' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFormData({...formData, deadline: item.id});
                      setTimeout(() => setStep(5), 300);
                    }}
                    className={`flex flex-col items-center justify-center p-10 border-4 rounded-[2.5rem] text-center transition-all ${
                      formData.deadline === item.id 
                      ? 'border-brand-orange bg-orange-50 shadow-xl' 
                      : 'border-transparent bg-brand-bg hover:bg-white hover:border-brand-orange/30 shadow-sm'
                    }`}
                  >
                    <Calendar className={`w-8 h-8 mb-4 ${formData.deadline === item.id ? 'text-brand-orange' : 'text-gray-400'}`} />
                    <span className={`text-xl font-black ${formData.deadline === item.id ? 'text-brand-darkBlue' : 'text-gray-700'}`}>{item.label}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: CONTACT */}
          {step === 5 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-500">
              <h2 className="text-4xl font-black text-brand-darkBlue leading-tight">Como podemos te contatar?</h2>
              <div className="space-y-8 max-w-lg">
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Qual seu nome?</label>
                  <input 
                    type="text" 
                    required 
                    autoFocus
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="Seu nome completo" 
                    className="w-full px-8 py-6 border-4 border-gray-50 bg-brand-bg rounded-[2rem] outline-none text-xl font-black text-brand-darkBlue placeholder-gray-300 focus:border-brand-blue/30 transition-all focus:bg-white shadow-sm" 
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">WhatsApp / Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-blue" />
                    <input 
                      type="tel" 
                      required 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      placeholder="(00) 00000-0000" 
                      className="w-full pl-16 pr-8 py-6 border-4 border-gray-50 bg-brand-bg rounded-[2rem] outline-none text-xl font-black text-brand-darkBlue placeholder-gray-300 focus:border-brand-blue/30 transition-all focus:bg-white shadow-sm" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-12 border-t-4 border-gray-50 flex flex-col md:flex-row items-center gap-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto flex-grow bg-brand-orange text-white px-12 py-6 rounded-[2.5rem] font-black text-xl hover:bg-brand-lightOrange shadow-2xl shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  {step === totalSteps ? 'FINALIZAR E ENVIAR PEDIDO' : 'PRÓXIMO PASSO'}
                  <ChevronRight className="ml-3 w-6 h-6" />
                </>
              )}
            </button>
            <p className="text-gray-400 font-bold text-sm text-center md:text-right">
              {step === totalSteps ? 'Quase lá! Só mais um clique.' : 'Você pode voltar e alterar a qualquer momento.'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRequest;