
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { User, OrderStatus, OrderRequest } from '../types';
import { Send, CheckCircle2, ChevronRight, Loader2, MapPin } from 'lucide-react';

interface NewRequestProps {
  user: User | null;
  onAddOrder: (order: OrderRequest) => void;
}

const NewRequest: React.FC<NewRequestProps> = ({ user, onAddOrder }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loadingCep, setLoadingCep] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      if (!formData.category) return;
      setStep(step + 1);
      return;
    }
    
    const newOrder: OrderRequest = {
      id: 'ord-' + Math.random().toString(36).substr(2, 5),
      clientId: user?.id || 'guest',
      clientName: formData.name,
      category: formData.category,
      description: formData.description,
      location: formData.location,
      neighborhood: formData.neighborhood,
      deadline: formData.deadline,
      status: OrderStatus.OPEN,
      createdAt: new Date().toISOString(),
      leadPrice: 5,
      unlockedBy: []
    };

    onAddOrder(newOrder);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-20 p-12 bg-white rounded-3xl text-center border shadow-xl">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Pedido Enviado com Sucesso!</h2>
        <p className="text-gray-600 mb-8 text-lg">
          O seu pedido foi enviado para o mercado de profissionais.
        </p>
        <button 
          onClick={() => navigate(user ? '/cliente/dashboard' : '/')} 
          className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
        >
          {user ? 'Ver Meus Pedidos' : 'Voltar ao Início'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-12 px-4">
      <div className="bg-white rounded-2xl border shadow-xl overflow-hidden">
        <div className="bg-[#1e3a8a] p-10 text-white">
          <h2 className="text-3xl font-bold mb-2">Solicite o seu Orçamento Grátis</h2>
          <div className="flex mt-10 items-center space-x-6">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= 1 ? 'bg-blue-500 text-white shadow-lg scale-110' : 'bg-blue-800 text-blue-300'}`}>1</div>
              <span className="ml-3 font-semibold text-sm">Categoria</span>
            </div>
            <div className="h-px w-12 bg-blue-800"></div>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= 2 ? 'bg-blue-500 text-white shadow-lg scale-110' : 'bg-blue-800 text-blue-300'}`}>2</div>
              <span className="ml-3 font-semibold text-sm">Detalhes</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white">
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
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    <div className={`mr-4 transition-colors ${formData.category === cat.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`}>
                      {cat.icon}
                    </div>
                    <span className={`text-base font-bold transition-colors ${formData.category === cat.id ? 'text-blue-900' : 'text-gray-700'}`}>
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
                <label className="block text-lg font-bold text-gray-800 mb-3">Nome</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Seu nome completo" 
                  className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-900 transition-all bg-white" 
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">Descrição detalhada</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-900 transition-all bg-white"
                  placeholder="Ex: Pintura de 4 quartos..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-lg font-bold text-gray-800 mb-3">Telefone de Contato</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="(00) 00000-0000" className="w-full p-5 border-2 border-gray-200 rounded-2xl outline-none text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-800 mb-3">CEP</label>
                  <div className="relative">
                    <input type="text" required maxLength={9} value={formData.cep} onChange={(e) => setFormData({...formData, cep: e.target.value})} placeholder="00000-000" className="w-full p-5 border-2 border-gray-200 rounded-2xl outline-none text-gray-900 bg-white" />
                    {loadingCep && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>}
                  </div>
                </div>
              </div>

              {formData.location && (
                <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
                  <div className="flex items-center text-blue-900 font-bold mb-2">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    Endereço Identificado
                  </div>
                  <p className="text-gray-700 font-medium">{formData.address}, {formData.neighborhood}</p>
                  <p className="text-blue-600 text-sm font-bold uppercase">{formData.location}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <input type="text" required value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} placeholder="Número" className="w-full p-3 border rounded-xl" />
                    <input type="text" value={formData.complement} onChange={(e) => setFormData({...formData, complement: e.target.value})} placeholder="Complemento" className="w-full p-3 border rounded-xl" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">Tempo para execução do serviço</label>
                <select value={formData.deadline} required onChange={(e) => setFormData({...formData, deadline: e.target.value})} className="w-full p-5 border-2 border-gray-200 rounded-2xl text-gray-900 bg-white cursor-pointer hover:border-blue-400 transition-all">
                  <option value="">Selecione o tempo de execução</option>
                  <option value="imediato">Imediato</option>
                  <option value="15_dias">em 15 dias</option>
                  <option value="um_mes">em um mês</option>
                  <option value="mais_3_meses">mais de 3 meses</option>
                </select>
              </div>
            </div>
          )}

          <div className="pt-8 flex justify-between items-center border-t border-gray-100">
            {step > 1 ? <button type="button" onClick={() => setStep(step - 1)} className="px-8 py-4 font-bold text-gray-500 hover:text-blue-600">Voltar</button> : <div />}
            <button type="submit" className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold hover:bg-blue-700 shadow-xl transition-all">
              {step === 2 ? 'Enviar Pedido' : 'Próximo Passo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRequest;
