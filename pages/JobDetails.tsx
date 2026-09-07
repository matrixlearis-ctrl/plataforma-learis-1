
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { OrderRequest, ProfessionalProfile, User, OrderStatus } from '../types';
import { CATEGORIES } from '../constants';
import {
    ArrowLeft,
    MapPin,
    Clock,
    Tag,
    Phone,
    Lock,
    Coins,
    ChevronRight,
    CheckCircle2,
    Zap,
    Info,
    User as UserIcon
} from 'lucide-react';

interface JobDetailsProps {
    user: User | null;
    profile: ProfessionalProfile | null;
    onUpdateProfile?: (profile: ProfessionalProfile) => void;
}

const JobDetails: React.FC<JobDetailsProps> = ({ user, profile, onUpdateProfile }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                setOrder({
                    id: data.id,
                    clientId: data.client_id,
                    clientName: data.client_name,
                    category: data.category,
                    description: data.description,
                    phone: data.phone || '',
                    address: data.address || '',
                    number: data.number || '',
                    complement: data.complement || '',
                    location: data.location,
                    neighborhood: data.neighborhood || '',
                    deadline: data.deadline,
                    status: data.status as OrderStatus,
                    createdAt: data.created_at,
                    leadPrice: data.lead_price || 5,
                    unlockedBy: data.unlocked_by || [],
                    imageUrl: data.image_url
                });
            }
        } catch (err) {
            console.error('Erro ao carregar detalhes:', err);
            // navigate('/trabalhos');
        } finally {
            setLoading(false);
        }
    };

    const isUnlocked = order?.unlockedBy.includes(user?.id || '');

    const buyLead = async () => {
        if (!user) {
            navigate('/auth');
            return;
        }

        if (user.role !== 'PROFESSIONAL') {
            alert("Apenas profissionais cadastrados podem comprar leads.");
            return;
        }

        if (!profile) return;

        if (profile.credits < (order?.leadPrice || 0)) {
            alert("Saldo insuficiente! Por favor, recarregue seus créditos.");
            navigate('/profissional/recarregar');
            return;
        }

        if (confirm(`Deseja desbloquear os contatos por ${order?.leadPrice} créditos?`)) {
            setPurchasing(true);
            try {
                const newCredits = profile.credits - (order?.leadPrice || 0);

                // Atualizar créditos do perfil
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ credits: newCredits })
                    .eq('id', user.id);

                if (profileError) throw profileError;

                // Atualizar state global
                if (onUpdateProfile) {
                    onUpdateProfile({
                        ...profile,
                        credits: newCredits,
                        completedJobs: (profile.completedJobs || 0) + 1
                    });
                }

                // Atualizar ordem
                const updatedUnlockedBy = [...(order?.unlockedBy || []), user.id];
                const { error: orderError } = await supabase
                    .from('orders')
                    .update({ unlocked_by: updatedUnlockedBy })
                    .eq('id', order?.id);

                if (orderError) throw orderError;

                await fetchOrder();
                alert("Contatos desbloqueados com sucesso!");
            } catch (err) {
                console.error('Erro ao comprar lead:', err);
                alert('Erro ao realizar a compra.');
            } finally {
                setPurchasing(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-32 bg-gray-50">
                <h2 className="text-2xl font-black text-brand-darkBlue">Trabalho não encontrado</h2>
                <Link to="/trabalhos" className="text-brand-orange font-bold mt-4 inline-block">Voltar para a lista</Link>
            </div>
        );
    }

    const categoryObj = CATEGORIES.find(c => c.id === order.category);

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto py-12 px-4 md:px-8">
                <Link
                    to="/trabalhos"
                    className="inline-flex items-center text-gray-500 hover:text-brand-darkBlue font-black uppercase text-xs tracking-widest mb-8 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Voltar para as ofertas
                </Link>

                <div className="bg-white rounded-[4rem] border border-gray-100 shadow-3xl overflow-hidden">
                    {/* Header Card */}
                    <div className="p-10 md:p-14 border-b border-gray-50">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-brand-blue bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-100">
                                        {categoryObj?.name || 'Serviço'}
                                    </span>
                                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-green-100 flex items-center">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Aberta
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black text-brand-darkBlue uppercase tracking-tighter leading-[0.95]">
                                    {order.description.length > 50 ? order.description.substring(0, 50) + '...' : order.description}
                                </h1>
                                <div className="flex flex-wrap items-center gap-6 text-gray-500 font-bold">
                                    <p className="flex items-center"><MapPin className="w-5 h-5 mr-2 text-brand-orange" /> {order.location} {order.neighborhood ? `• ${order.neighborhood}` : ''}</p>
                                    <p className="flex items-center"><Clock className="w-5 h-5 mr-2 text-brand-orange" /> Postado em {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>

                            {!isUnlocked && (
                                <div className="bg-brand-bg p-8 rounded-[2.5rem] border border-gray-100 text-center w-full md:w-auto shadow-inner">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Custo do Lead</p>
                                    <div className="flex items-center justify-center text-4xl font-black text-brand-orange leading-none gap-2">
                                        <Coins className="w-8 h-8" />
                                        {order.leadPrice} <span className="text-sm">CR</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-10 md:p-14 space-y-12">
                        {/* Information Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-10">
                                <section className="space-y-4">
                                    <h3 className="flex items-center text-base font-black text-brand-darkBlue uppercase tracking-tight">
                                        <Info className="w-5 h-5 mr-3 text-brand-blue" /> Descrição do Pedido
                                    </h3>
                                    <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner">
                                        <p className="text-gray-700 font-medium text-lg leading-relaxed italic">
                                            "{order.description}"
                                        </p>
                                    </div>
                                </section>

                                <section className="grid grid-cols-2 gap-6">
                                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-gray-50 shadow-sm">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Prazo de Realização</p>
                                        <p className="font-black text-brand-darkBlue uppercase flex items-center text-sm">
                                            <Zap className="w-4 h-4 mr-2 text-brand-orange fill-current" />
                                            {order.deadline === 'imediato' ? 'Urgente / O quanto antes' : order.deadline === 'um_mes' ? 'Próximos 30 dias' : order.deadline === 'mais_3_meses' ? 'Mais de 3 meses' : 'A combinar'}
                                        </p>
                                    </div>
                                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-gray-50 shadow-sm">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Local do Serviço</p>
                                        <p className="font-black text-brand-darkBlue uppercase text-sm truncate">
                                            {order.neighborhood || 'Região Central'}
                                        </p>
                                    </div>
                                </section>
                            </div>

                            {/* Side Column: Action / Contacts */}
                            <div className="space-y-8">
                                {isUnlocked ? (
                                    <div className="bg-green-50 p-10 rounded-[3rem] border-2 border-green-100 space-y-8 shadow-xl shadow-green-100/50">
                                        <div className="text-center">
                                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                                                <Phone className="w-10 h-10 text-white" />
                                            </div>
                                            <h3 className="text-2xl font-black text-green-700 uppercase tracking-tight mb-2">Contatos Liberados</h3>
                                            <p className="text-green-600/70 font-bold text-sm">Fale diretamente com {order.clientName}</p>
                                        </div>

                                        <div className="bg-white p-8 rounded-3xl border border-green-100 shadow-inner space-y-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                                    <UserIcon className="w-6 h-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cliente</p>
                                                    <p className="text-lg font-black text-gray-900 uppercase tracking-tight">{order.clientName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                                    <Phone className="w-6 h-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</p>
                                                    <p className="text-xl font-black text-gray-900">{order.phone}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <a
                                            href={`https://wa.me/55${order.phone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full bg-green-500 text-white py-6 rounded-[2rem] font-black text-xl text-center shadow-xl shadow-green-200 hover:bg-green-600 hover:scale-[1.02] transition-all uppercase"
                                        >
                                            Abrir no WhatsApp
                                        </a>
                                    </div>
                                ) : (
                                    <div className="bg-brand-darkBlue p-10 rounded-[3rem] text-white space-y-8 shadow-3xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-[80px]"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md">
                                                    <Lock className="w-8 h-8 text-brand-orange" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black uppercase tracking-tight">Contatos Protegidos</h3>
                                                    <p className="text-blue-200/60 font-medium text-xs">Desbloqueie para falar com o cliente</p>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-4 mb-8">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-blue-200">Interessados:</span>
                                                    <span className="bg-brand-orange px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        {order.unlockedBy.length} / 4
                                                    </span>
                                                </div>
                                                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-brand-orange h-full transition-all duration-1000"
                                                        style={{ width: `${(order.unlockedBy.length / 4) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-[10px] text-blue-200/50 font-bold uppercase tracking-widest text-center">
                                                    {order.unlockedBy.length >= 4 ? 'Vagas Esgotadas' : 'Vagas Disponíveis'}
                                                </p>
                                            </div>

                                            <button
                                                onClick={buyLead}
                                                disabled={purchasing || order.unlockedBy.length >= 4}
                                                className="w-full bg-brand-orange text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-brand-lightOrange active:scale-95 disabled:opacity-50 transition-all uppercase tracking-tight flex items-center justify-center"
                                            >
                                                {purchasing ? (
                                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : order.unlockedBy.length >= 4 ? (
                                                    'Esgotado'
                                                ) : (
                                                    <>
                                                        Desbloquear Agora
                                                        <ChevronRight className="ml-3 w-6 h-6" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Info Box */}
                                {!isUnlocked && (
                                    <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100/50 flex items-start gap-4">
                                        <Info className="w-6 h-6 text-brand-blue flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-brand-darkBlue uppercase mb-1">Como funciona?</p>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                                Ao clicar em desbloquear, você usará seus créditos para ver o telefone de contato deste cliente. O Samej não cobra comissões sobre o serviço fechado.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Images Gallery Preview */}
                        {order.imageUrl && (
                            <section className="pt-12 border-t border-gray-50">
                                <h3 className="text-base font-black text-brand-darkBlue uppercase tracking-tight mb-8">Fotos anexadas pelo cliente</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="aspect-video bg-gray-200 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-xl">
                                        <img src={order.imageUrl} alt="Serviço" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
