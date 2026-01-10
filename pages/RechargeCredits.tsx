
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CREDIT_PACKAGES } from '../constants';
import { Coins, Check, ShieldCheck, Zap, ArrowLeft, Loader2, QrCode } from 'lucide-react';

/* 
  NOTA PARA O DESENVOLVEDOR:
  Para produção, você deve instalar: npm install @stripe/stripe-js @stripe/react-stripe-js
  E usar o componente <Elements> para envolver este fluxo.
*/

interface RechargeCreditsProps {
  onAddCredits: (amount: number) => void;
}

const RechargeCredits: React.FC<RechargeCreditsProps> = ({ onAddCredits }) => {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePurchase = async (pkg: typeof CREDIT_PACKAGES[0]) => {
    setSelectedPackage(pkg.id);
    setLoading(true);
    
    /* 
      FLUXO REAL STRIPE:
      1. Chamar seu backend: const { sessionId } = await fetch('/create-checkout-session', { method: 'POST', body: JSON.stringify({ pkgId: pkg.id }) });
      2. Redirecionar: const stripe = await loadStripe('sua_chave_publicavel');
      3. await stripe.redirectToCheckout({ sessionId });
    */

    // Simular processamento de pagamento via Stripe (PIX)
    setTimeout(() => {
      onAddCredits(pkg.credits);
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/profissional/leads');
      }, 2000);
    }, 1500);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto my-20 p-12 bg-white rounded-3xl text-center border shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Pagamento Pix Confirmado!</h2>
        <p className="text-gray-600 mb-8 text-lg">
          Seus créditos foram adicionados instantaneamente à sua carteira.
        </p>
        <div className="flex items-center justify-center space-x-2 text-blue-600 font-bold">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Voltando ao mercado de leads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-500 hover:text-blue-600 font-bold mb-8 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Voltar para o Mercado
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-4">Adquira seus Créditos</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Pagamento rápido e seguro via <span className="text-teal-600 font-bold">Pix</span>. Créditos caem na hora!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {CREDIT_PACKAGES.map((pkg) => {
          const isPopular = pkg.id === 'p2';
          return (
            <div 
              key={pkg.id} 
              className={`relative bg-white rounded-[2rem] border-2 transition-all p-8 flex flex-col ${
                isPopular ? 'border-amber-400 shadow-2xl scale-105 z-10' : 'border-gray-100 shadow-xl'
              }`}
            >
              {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                  Melhor Valor
                </div>
              )}
              
              <div className="flex items-center justify-between mb-8">
                <div className={`p-4 rounded-2xl ${isPopular ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                  <Coins className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-gray-900 leading-none">{pkg.credits}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Créditos</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-6">{pkg.name}</h3>
              
              <div className="space-y-4 mb-10 flex-grow">
                <div className="flex items-center text-gray-600 font-medium text-sm">
                  <Check className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" />
                  <span>Liberação via Pix Instantâneo</span>
                </div>
                <div className="flex items-center text-gray-600 font-medium text-sm">
                  <Check className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" />
                  <span>Custo fixo por lead: 5 cr</span>
                </div>
                <div className="flex items-center text-gray-600 font-medium text-sm">
                  <Check className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" />
                  <span>Acesso por 6 meses por lead</span>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-4xl font-black text-gray-900 leading-none">
                  <span className="text-lg font-bold">R$</span> {pkg.price.toFixed(2).split('.')[0]}
                  <span className="text-lg font-bold">,{pkg.price.toFixed(2).split('.')[1]}</span>
                </p>
                <p className={`text-xs mt-2 font-bold ${isPopular ? 'text-amber-600' : 'text-gray-400'}`}>
                  Apenas R$ {(pkg.price / pkg.credits).toFixed(2)} por crédito
                </p>
              </div>

              <button 
                onClick={() => handlePurchase(pkg)}
                disabled={loading}
                className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2 ${
                  isPopular 
                  ? 'bg-amber-500 text-white hover:bg-amber-600' 
                  : 'bg-gray-900 text-white hover:bg-black'
                }`}
              >
                {loading && selectedPackage === pkg.id ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    <span>Pagar com Pix</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border shadow-lg flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-6 md:mb-0">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mr-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-1">Processamento Seguro via Stripe</h4>
            <p className="text-gray-500 font-medium">Sua transação Pix é protegida por criptografia bancária e confirmada em segundos.</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6 opacity-60" />
          <div className="flex items-center font-bold text-teal-600 text-lg">
            <QrCode className="w-6 h-6 mr-2" />
            PIX
          </div>
        </div>
      </div>
    </div>
  );
};

export default RechargeCredits;
