import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Search,
    Edit3,
    Trash2,
    Filter,
    ArrowLeft,
    XCircle,
    CheckCircle2,
    MapPin,
    Calendar,
    Clock,
    Phone,
    User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OrderStatus } from '../types';

interface OrderRecord {
    id: string;
    client_id: string;
    client_name: string;
    category: string;
    description: string;
    phone: string;
    address: string;
    number: string;
    complement: string;
    location: string;
    neighborhood: string;
    deadline: string;
    status: OrderStatus;
    lead_price: number;
    unlocked_by: string[];
    created_at: string;
}

const OrderManagement: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL');
    const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Form states for editing
    const [formData, setFormData] = useState({
        category: '',
        description: '',
        lead_price: 5,
        status: 'OPEN' as OrderStatus,
        deadline: ''
    });

    const hasLoaded = useRef(false);

    useEffect(() => {
        if (!hasLoaded.current) {
            hasLoaded.current = true;
            loadOrders();
        }
    }, []);

    useEffect(() => {
        let result = orders;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(order =>
                order.client_name.toLowerCase().includes(term) ||
                order.description.toLowerCase().includes(term) ||
                order.category.toLowerCase().includes(term)
            );
        }

        if (filterStatus !== 'ALL') {
            result = result.filter(order => order.status === filterStatus);
        }

        setFilteredOrders(result);
    }, [orders, searchTerm, filterStatus]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setOrders(data);
        } catch (error: any) {
            alert('Erro ao carregar pedidos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este orçamento? Esta ação é irreversível.')) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', id);

            if (error) throw error;
            alert('Orçamento excluído com sucesso!');
            loadOrders();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditOrder = (order: OrderRecord) => {
        setEditingOrder(order);
        setFormData({
            category: order.category,
            description: order.description,
            lead_price: order.lead_price,
            status: order.status,
            deadline: order.deadline
        });
        setShowEditModal(true);
    };

    const handleUpdateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('orders')
                .update({
                    category: formData.category,
                    description: formData.description,
                    lead_price: formData.lead_price,
                    status: formData.status,
                    deadline: formData.deadline
                })
                .eq('id', editingOrder.id);

            if (error) throw error;

            alert('Orçamento atualizado com sucesso!');
            setShowEditModal(false);
            loadOrders();
        } catch (error: any) {
            alert('Erro ao atualizar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'OPEN': return 'border-green-100 bg-green-50 text-green-600';
            case 'CLOSED': return 'border-gray-100 bg-gray-50 text-gray-400';
            default: return 'border-blue-100 bg-blue-50 text-blue-600';
        }
    };

    if (loading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="font-bold">Voltar ao Painel</span>
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase">Gestão de Orçamentos</h2>
                        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest opacity-50">Administre todos os pedidos da plataforma</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar cliente, categoria ou descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-sm"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'ALL')}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none font-bold text-sm"
                        >
                            <option value="ALL">Todos os Status</option>
                            <option value="OPEN">Ativos</option>
                            <option value="CLOSED">Fechados</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none block mb-1">
                                            {order.category}
                                        </span>
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight line-clamp-1">{order.description}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                        {order.status === 'OPEN' ? 'ATIVO' : 'FECHADO'}
                                    </span>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => handleEditOrder(order)}
                                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOrder(order.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <p className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        <User className="w-3 h-3 mr-1" /> Cliente
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{order.client_name}</p>
                                    <p className="text-xs text-gray-500 font-medium">{order.phone}</p>
                                </div>
                                <div>
                                    <p className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        <MapPin className="w-3 h-3 mr-1" /> Localização
                                    </p>
                                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{order.location}</p>
                                    <p className="text-xs text-gray-500 font-medium">{order.neighborhood}</p>
                                </div>
                                <div>
                                    <p className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        <Clock className="w-3 h-3 mr-1" /> Prazo/Custo
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{order.deadline}</p>
                                    <p className="text-xs text-blue-600 font-black">{order.lead_price} Créditos</p>
                                </div>
                                <div>
                                    <p className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        <Calendar className="w-3 h-3 mr-1" /> Criado em
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                                    <p className="text-xs text-gray-500 font-medium">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            {order.address && (
                                <div className="mt-6 pt-6 border-t border-gray-50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Endereço Completo</p>
                                    <p className="text-xs text-gray-600 font-medium">
                                        {order.address}, {order.number} {order.complement && ` - ${order.complement}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <FileText className="mx-auto h-20 w-20 text-gray-100 mb-6" />
                        <h3 className="text-lg font-black text-gray-900 uppercase">Nenhum orçamento encontrado</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Tente ajustar seus filtros de busca.</p>
                    </div>
                )}
            </div>

            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Editar Orçamento</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                                <XCircle className="w-8 h-8" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateOrder} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoria</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Descrição</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Valor do Lead (Créditos)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.lead_price}
                                        onChange={(e) => setFormData({ ...formData, lead_price: parseInt(e.target.value) })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm appearance-none"
                                    >
                                        <option value="OPEN">Aberto (Ativo)</option>
                                        <option value="CLOSED">Fechado</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Prazo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                                />
                            </div>

                            <div className="flex space-x-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-4 border-2 border-gray-50 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
