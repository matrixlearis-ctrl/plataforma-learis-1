
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { User, OrderStatus, OrderRequest } from '../types';
import { Send, CheckCircle2, ChevronRight, Loader2, MapPin, AlertCircle } from 'lucide-react';

interface NewRequestProps {
  user: User | null;
  onAddOrder: (order: OrderRequest) => void;
}

const NewRequest: React.FC<NewRequestProps> = ({ user, onAddOrder }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step < 2) {
      if (!formData.category) return;
      setStep(step + 1);
      return;
    }
    
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
      setError("Não foi possível enviar seu pedido. Verifique as permissões do banco de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-20 p-12 bg-white rounded-[2.5rem] text-center border shadow-2xl animate-in zoom-in-95">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">PEDIDO ENVIADO!</h2>
        <p className="text-gray-700 mb-8 text-lg font-medium leading-relaxed">
          Sua solicitação já está disponível para os profissionais qualificados da Samej.
        </p>
        <button 
          onClick={() => navigate(user ? '/cliente/dashboard' : '/')} 
          className="w-full bg-blue-600 text-white px-8 py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl active:scale-95"
        >
          {user ? 'VER MEUS PEDIDOS' : 'VOLTAR AO INÍCIO'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-12 px-4">
      <div className="bg-white rounded-[2.5rem] border shadow-2xl overflow-hidden">
        <div className="bg-[#1e3a8a] p-10 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <h2 className="text-3xl font-black mb-2 tracking-tight">ORÇAMENTO GRÁTIS</h2>
          <p className="text-blue-100 font-bold">Receba até 4 propostas em poucos minutos.</p>
          
          <div className="flex mt-10 items-center space-x-6 relative z-10">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= 1 ? 'bg-blue-500 text-white shadow-lg scale-110' : 'bg-blue-900 text-blue-300'}`}>1</div>
              <span className="ml-3 font-bold text-xs uppercase tracking-widest opacity-100">Categoria</span>
            </div>
            <div className="h-0.5 w-12 bg-blue-800"></div>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= 2 ? 'bg-blue-500 text-white shadow-lg scale-110' : 'bg-blue-800 text-blue-300'}`}>2</div>
              <span className="ml-3 font-bold text-xs uppercase tracking-widest opacity-100">Detalhes</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center text-sm font-bold animate-pulse">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({...formData, category: cat.id})}
                    className={`flex items-center px-6 py-5 border-2 rounded-2xl text-left transition-all group ${
                      formData.category === cat.id 
                      ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50' 
                      : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <div className={`mr-4 transition-colors ${formData.category === cat.id ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`}>
                      {cat.icon}
                    </div>
                    <span className={`text-base font-black transition-colors ${formData.category === cat.id ? 'text-blue-900' : 'text-gray-700'}`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3 ml-1">Seu Nome</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Seu nome completo" 
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:border-blue-600 outline-none text-gray-900 font-bold transition-all bg-white placeholder-gray-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3 ml-1">O que você precisa?</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:border-blue-600 outline-none text-gray-900 font-bold transition-all bg-white resize-none placeholder-gray-500"
                  placeholder="Ex: Preciso pintar 3 quartos e uma sala com tinta acrílica..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3 ml-1">WhatsApp</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="(00) 00000-0000" className="w-full p-4 border-2 border-gray-300 rounded-2xl outline-none text-gray-900 bg-white font-bold placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3 ml-1">CEP</label>
                  <div className="relative">
                    <input type="text" required maxLength={9} value={formData.cep} onChange={(e) => setFormData({...formData, cep: e.target.value})} placeholder="00000-000" className="w-full p-4 border-2 border-gray-300 rounded-2xl outline-none text-gray-900 bg-white font-bold placeholder-gray-500" />
                    {loadingCep && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="w-5 h-5 text-blue-600 animate-spin" /></div>}
                  </div>
                </div>
              </div>

              {formData.location && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3 ml-1">Endereço (Rua/Avenida)</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})} 
                      placeholder="Nome da rua" 
                      className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:border-blue-600 outline-none text-gray-900 font-bold transition-all bg-white" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3 ml-1">Número</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.number} 
                        onChange={(e) => setFormData({...formData, number: e.target.value})} 
                        placeholder="Nº" 
                        className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:border-blue-600 outline-none text-gray-900 font-bold transition-all bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3 ml-1">Complemento</label>
                      <input 
                        type="text" 
                        value={formData.complement} 
                        onChange={(e) => setFormData({...formData, complement: e.target.value})} 
                        placeholder="Apt / Bloco" 
                        className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:border-blue-600 outline-none text-gray-900 font-bold transition-all bg-white" 
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-300">
                    <div className="flex items-center text-blue-900 font-black mb-2 text-sm uppercase tracking-tight">
                      <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                      Localização Confirmada
                    </div>
                    <p className="text-blue-900 font-bold">{formData.neighborhood}</p>
                    <p className="text-blue-700 text-xs font-black uppercase tracking-widest mt-1">{formData.location}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3 ml-1">Urgência do Serviço</label>
                <div className="relative">
                  <select value={formData.deadline} required onChange={(e) => setFormData({...formData, deadline: e.target.value})} className="w-full p-4 border-2 border-gray-300 rounded-2xl text-gray-900 bg-white font-bold cursor-pointer hover:border-blue-600 transition-all appearance-none">
                    <option value="">Selecione...</option>
                    <option value="imediato">O mais rápido possível</option>
                    <option value="15_dias">Nos próximos 15 dias</option>
                    <option value="um_mes">No próximo mês</option>
                    <option value="mais_3_meses">Apenas planejando (3+ meses)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-8 flex justify-between items-center border-t-2 border-gray-100">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-3 font-black text-gray-500 hover:text-blue-600 transition-colors uppercase text-sm tracking-widest">
                Voltar
              </button>
            ) : <div />}
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95 flex items-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                step === 2 ? 'ENVIAR PEDIDO' : 'PRÓXIMO PASSO'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRequest;
