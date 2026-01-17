
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { User, OrderStatus, OrderRequest } from '../types';
import { Send, CheckCircle2, ChevronRight, Loader2, MapPin, AlertCircle, ArrowLeft, MessageSquare, Calendar, Phone, Home } from 'lucide-react';

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
        <p className="text-gray-600 mb-12 text-xl font-medium leading-relaxed max-w-md mx-auto">
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
        <button onClick={handleBack} className="flex items-center text-gray-700 hover:text-brand-blue font-bold transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
        </button>
        <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Passo {step} de {totalSteps}</span>
      </div>

      <div className="h-2 w-full bg-gray-100 rounded-full mb-12 overflow-hidden shadow-inner">
        <div className="h-full bg-brand-orange transition-all duration-500 rounded-full shadow-lg shadow-orange-200" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="bg-white rounded-[4rem] border border-gray-100 shadow-3xl overflow-hidden p-8 md:p-20 relative">
        <form onSubmit={handleSubmit} className="relative z-10 space-y-12">
          {error && (
            <div className="p-6 bg-red-50 border-2 border-red-100 text-red-700 rounded-3xl flex items-center text-sm font-bold animate-pulse">
              <AlertCircle className="w-6 h-6 mr-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-4xl font-black text-brand-darkBlue tracking-tight">Qual serviço você precisa?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: cat.id });
                      setStep(2);
                    }}
                    className={`flex items-center p-6 rounded-3xl border-4 transition-all text-left group ${
                      formData.category === cat.id 
                      ? 'border-brand-blue bg-blue-50 text-brand-blue shadow-lg' 
                      : 'border-gray-50 hover:border-brand-blue/20 text-gray-700'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-5 transition-colors ${
                      formData.category === cat.id ? 'bg-brand-blue text-white' : 'bg-brand-bg text-brand-blue group-hover:bg-brand-blue group-hover:text-white'
                    }`}>
                      {cat.icon}
                    </div>
                    <span className="font-black uppercase text-sm tracking-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-4xl font-black text-brand-darkBlue tracking-tight">Onde será o serviço?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="CEP"
                    value={formData.cep}
                    onChange={e => setFormData({ ...formData, cep: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase"
                  />
                  {loadingCep && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-brand-blue" />}
                </div>
                <input
                  type="text"
                  placeholder="CIDADE / UF"
                  readOnly
                  value={formData.location}
                  className="w-full px-6 py-5 bg-gray-100 border-2 border-transparent rounded-3xl font-bold text-gray-500 uppercase cursor-not-allowed"
                />
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="ENDEREÇO"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase"
                  />
                </div>
                <input
                  type="text"
                  placeholder="NÚMERO"
                  value={formData.number}
                  onChange={e => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase"
                />
                <input
                  type="text"
                  placeholder="COMPLEMENTO (OPCIONAL)"
                  value={formData.complement}
                  onChange={e => setFormData({ ...formData, complement: e.target.value })}
                  className="w-full px-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase"
                />
              </div>
              <button type="button" onClick={handleNext} className="w-full bg-brand-darkBlue text-white py-6 rounded-3xl font-black text-xl shadow-2xl active:scale-95 transition-all uppercase">
                Próximo Passo
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-4xl font-black text-brand-darkBlue tracking-tight">O que precisa ser feito?</h2>
              <div className="relative">
                <textarea
                  rows={6}
                  placeholder="Descreva os detalhes do serviço. Quanto mais detalhes, melhores os orçamentos!"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-8 bg-brand-bg border-2 border-transparent rounded-[2.5rem] font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase placeholder:normal-case resize-none"
                />
              </div>
              <button type="button" onClick={handleNext} className="w-full bg-brand-darkBlue text-white py-6 rounded-3xl font-black text-xl shadow-2xl active:scale-95 transition-all uppercase">
                Próximo Passo
              </button>
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
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, deadline: opt.id });
                      setStep(5);
                    }}
                    className={`flex items-center p-6 rounded-3xl border-4 transition-all text-left ${
                      formData.deadline === opt.id 
                      ? 'border-brand-blue bg-blue-50 text-brand-blue' 
                      : 'border-gray-50 hover:border-brand-blue/20 text-gray-700'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-5 ${
                      formData.deadline === opt.id ? 'bg-brand-blue text-white' : 'bg-brand-bg text-brand-blue'
                    }`}>
                      {opt.icon}
                    </div>
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
                  <Home className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="SEU NOME COMPLETO"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="WHATSAPP / CELULAR"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-brand-bg border-2 border-transparent rounded-3xl font-bold outline-none focus:border-brand-blue focus:bg-white transition-all uppercase"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-brand-orange text-white py-6 rounded-3xl font-black text-2xl shadow-3xl active:scale-95 disabled:opacity-50 transition-all uppercase flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                  <>
                    Publicar Pedido
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
