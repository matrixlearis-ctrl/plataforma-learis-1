
import React, { useState } from 'react';
import { User, OrderStatus, OrderRequest, ProfessionalProfile } from '../types';
import { CATEGORIES } from '../constants';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, ChevronRight, MessageSquare, Plus, Star, X, Loader2 } from 'lucide-react';

interface CustomerDashboardProps {
  user: User;
  orders: OrderRequest[];
  professionals: (ProfessionalProfile & { name: string, id: string })[];
  onAddReview: (review: { professionalId: string, rating: number, comment: string }) => Promise<void>;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, orders, professionals, onAddReview }) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedProId, setSelectedProId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myRequests = orders.filter(o => o.clientId === user.id);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProId) return;
    
    setIsSubmitting(true);
    try {
      await onAddReview({ professionalId: selectedProId, rating, comment });
      setIsReviewModalOpen(false);
      setComment('');
      setRating(5);
      alert("Avaliação enviada com sucesso!");
    } catch (err) {
      alert("Erro ao enviar avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
          <p className="text-gray-500">Acompanhe o status das suas solicitações.</p>
        </div>
        <Link to="/pedir-orcamento" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center transition-all">
          <Plus className="w-5 h-5 mr-2" />Novo Pedido
        </Link>
      </div>

      <div className="grid gap-6">
        {myRequests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
            <p className="text-gray-400 mb-4">Você ainda não tem pedidos de orçamento.</p>
            <Link to="/pedir-orcamento" className="text-blue-600 font-bold hover:underline">Fazer meu primeiro pedido agora</Link>
          </div>
        ) : (
          myRequests.map(req => {
            const categoryObj = CATEGORIES.find(c => c.id === req.category);
            return (
              <div key={req.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 md:flex items-center justify-between gap-6">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4">{categoryObj?.icon}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900">{categoryObj?.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === OrderStatus.OPEN ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {req.status === OrderStatus.OPEN ? 'Aberto' : 'Concluído'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{req.description}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1" />{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end flex-grow border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="flex flex-col items-end mr-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="font-bold text-gray-900 mr-1">{req.unlockedBy.length}</span> interessados
                      </div>
                      {req.unlockedBy.length > 0 && req.status === OrderStatus.OPEN && (
                        <button 
                          onClick={() => {
                            setIsReviewModalOpen(true);
                            // Seleciona o primeiro profissional que desbloqueou como padrão
                            setSelectedProId(req.unlockedBy[0]);
                          }}
                          className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest mt-1"
                        >
                          Finalizar e Avaliar
                        </button>
                      )}
                    </div>
                    <button className="p-2 text-gray-400 hover:text-blue-600"><ChevronRight className="w-6 h-6" /></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Avaliação */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Avaliar Profissional</h2>
              <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleReviewSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Escolha o Profissional</label>
                <select 
                  required
                  value={selectedProId}
                  onChange={(e) => setSelectedProId(e.target.value)}
                  className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold bg-gray-50 outline-none focus:border-blue-500"
                >
                  {professionals
                    .filter(p => orders.some(o => o.unlockedBy.includes(p.id) && o.clientId === user.id))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Sua Nota</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 transition-transform active:scale-90 ${rating >= star ? 'text-amber-500' : 'text-gray-200'}`}
                    >
                      <Star className={`w-8 h-8 ${rating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Seu Comentário</label>
                <textarea 
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Como foi sua experiência com este profissional?"
                  className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 bg-gray-50 resize-none font-medium"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'ENVIAR AVALIAÇÃO'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
