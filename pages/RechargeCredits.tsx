
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CREDIT_PACKAGES } from '../constants';
import { Coins, Check, ShieldCheck, Zap, ArrowLeft, Loader2, QrCode, Copy } from 'lucide-react';
import { createPixPayment, MercadoPagoPaymentResponse } from '../lib/mercadopago';
import { User } from '../types';

interface RechargeCreditsProps {
  user: User;
  onAddCredits: (amount: number) => void;
}

const RechargeCredits: React.FC<RechargeCreditsProps> = ({ user, onAddCredits }) => {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<MercadoPagoPaymentResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePurchase = async (pkg: typeof CREDIT_PACKAGES[0]) => {
    setSelectedPackage(pkg.id);
    setLoading(true);

    try {
      /* 
        DEBUG/SIMULAÇÃO: 
        Usamos um Promise.race para garantir que se a função do servidor demorar
        (por não estar configurada), o sistema pule para o MOCK em 3 segundos.
      */
      const response = await Promise.race([
        createPixPayment(pkg.price, `Créditos Samej - ${pkg.name}`, user.email, user.id, pkg.credits),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de conexão')), 3000))
      ]) as MercadoPagoPaymentResponse;

      setPaymentData(response);
    } catch (err) {
      console.error('Falha na integração real, usando MOCK para teste de interface:', err);

      // MOCK DATA PARA TESTE DE INTERFACE
      // Isso permite que você veja como a tela de QR Code ficou
      setPaymentData({
        id: 'mock_123456',
        status: 'pending',
        qr_code: '00020101021226850014br.gov.bcb.pix0163mock-key-for-testing-only-12345678905204000053039865802BR5915Samej Plataforma6009SAO PAULO62070503***6304ABCD',
        qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAABlBMVEUAAAD///+l2Z/dAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAWElEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwbzAnAAG6769fAAAAAElFTkSuQmCC',
        external_resource_url: '#'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto my-20 p-12 bg-white rounded-3xl text-center border shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Pagamento Confirmado!</h2>
        <p className="text-gray-600 mb-8 text-lg">
          Seus créditos foram adicionados à sua carteira.
        </p>
        <div className="flex items-center justify-center space-x-2 text-blue-600 font-bold">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Voltando ao mercado de leads...</span>
        </div>
      </div>
    );
  }

  if (paymentData) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-2xl space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900">Finalize seu Pix</h2>
            <p className="text-gray-700 font-bold italic">Escaneie o QR Code ou copie a chave abaixo</p>
          </div>

          <div className="flex justify-center">
            <div className="p-4 bg-white border-4 border-blue-50 rounded-3xl shadow-inner">
              <img
                src={`data:image/jpeg;base64,${paymentData.qr_code_base64}`}
                alt="QR Code Pix"
                className="w-64 h-64"
              />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-black text-gray-800 uppercase tracking-widest text-left">Chave Pix (Copia e Cola)</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={paymentData.qr_code}
                className="flex-grow p-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-[10px] font-mono text-gray-900 font-bold focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg active:scale-95 flex-shrink-0"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-6 border-t space-y-4">
            <p className="text-sm text-gray-900 font-bold italic">
              Aguardando confirmação do pagamento...
            </p>
            <button
              onClick={() => setPaymentData(null)}
              className="w-full py-4 bg-red-50 text-red-700 rounded-2xl font-black text-sm hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center space-x-2 border-2 border-red-100"
            >
              <span>Cancelar e escolher outro pacote</span>
            </button>
          </div>
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
              className={`relative bg-white rounded-[2rem] border-2 transition-all p-8 flex flex-col ${isPopular ? 'border-amber-400 shadow-2xl scale-105 z-10' : 'border-gray-100 shadow-xl'
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
                className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2 ${isPopular
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
            <h4 className="text-xl font-bold text-gray-900 mb-1">Processamento Seguro via Mercado Pago</h4>
            <p className="text-gray-500 font-medium">Sua transação Pix é protegida por criptografia bancária e confirmada em segundos.</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <img src="https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo-1.png" alt="Mercado Pago" className="h-8 opacity-90" />
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
