
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { OrderRequest, OrderStatus } from '../types';
import { CATEGORIES } from '../constants';
import {
    Search,
    MapPin,
    Clock,
    ChevronRight,
    Filter,
    Package,
    Calendar,
    Zap,
    Tag
} from 'lucide-react';

const JobOffers: React.FC = () => {
    const [orders, setOrders] = useState<OrderRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [locationSearch, setLocationSearch] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('status', 'OPEN')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setOrders(data.map(o => ({
                    id: o.id,
                    clientId: o.client_id,
                    clientName: o.client_name,
                    category: o.category,
                    description: o.description,
                    phone: o.phone || '',
                    address: o.address || '',
                    number: o.number || '',
                    complement: o.complement || '',
                    location: o.location,
                    neighborhood: o.neighborhood || '',
                    deadline: o.deadline,
                    status: o.status as OrderStatus,
                    createdAt: o.created_at,
                    leadPrice: o.lead_price || 5,
                    unlockedBy: o.unlocked_by || [],
                    imageUrl: o.image_url
                })));
            }
        } catch (err) {
            console.error('Erro ao carregar ofertas:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || order.category === selectedCategory;
        const matchesLocation = order.location.toLowerCase().includes(locationSearch.toLowerCase());

        return matchesSearch && matchesCategory && matchesLocation;
    });

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="bg-brand-darkBlue py-20 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                        Ofertas de <span className="text-brand-orange">Trabalho</span>
                    </h1>
                    <p className="text-blue-100/70 text-lg font-medium max-w-2xl mx-auto">
                        Encontre novas oportunidades de serviço perto de você e aumente seu faturamento hoje mesmo.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-12 px-4 md:px-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar Filters */}
                    <aside className="lg:w-1/4 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5">
                            <div className="flex items-center gap-3 mb-8">
                                <Filter className="w-5 h-5 text-brand-orange" />
                                <h3 className="text-lg font-black text-brand-darkBlue uppercase tracking-tight">Filtros</h3>
                            </div>

                            <div className="space-y-6">
                                {/* Search */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">O que você procura?</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Ex: Pintura, Telhado..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Localização</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Sua cidade ou região"
                                            value={locationSearch}
                                            onChange={(e) => setLocationSearch(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Categories */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Categoria</label>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        <button
                                            onClick={() => setSelectedCategory('all')}
                                            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${selectedCategory === 'all' ? 'bg-brand-darkBlue text-white shadow-lg shadow-blue-100' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            Todas as categorias
                                        </button>
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-between group ${selectedCategory === cat.id ? 'bg-brand-darkBlue text-white shadow-lg shadow-blue-100' : 'hover:bg-gray-50 text-gray-600'}`}
                                            >
                                                {cat.name}
                                                {cat.icon && React.cloneElement(cat.icon as React.ReactElement<any>, { className: `w-4 h-4 ${selectedCategory === cat.id ? 'text-brand-orange' : 'text-gray-300 group-hover:text-brand-orange'}` })}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Sidebar */}
                        <div className="bg-brand-orange p-8 rounded-[2.5rem] text-white shadow-xl shadow-orange-100 relative overflow-hidden">
                            <Zap className="absolute top-4 right-4 w-12 h-12 opacity-20" />
                            <h4 className="text-xl font-black uppercase tracking-tight mb-4">Receba novas ofertas</h4>
                            <p className="text-white/80 text-sm font-bold mb-6">Cadastre-se para ser notificado sempre que surgir um novo trabalho na sua área.</p>
                            <Link to="/auth" className="block w-full text-center bg-brand-darkBlue text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">
                                Começar Agora
                            </Link>
                        </div>
                    </aside>

                    {/* Jobs List */}
                    <main className="lg:w-3/4">
                        <div className="flex items-center justify-between mb-8 px-4">
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                                Mostrando <span className="text-brand-darkBlue">{filteredOrders.length}</span> trabalhos encontrados
                            </p>
                        </div>

                        <div className="space-y-6">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 animate-pulse space-y-4">
                                        <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                                        <div className="h-8 bg-gray-100 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                                    </div>
                                ))
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map(order => {
                                    const category = CATEGORIES.find(c => c.id === order.category);
                                    return (
                                        <Link
                                            key={order.id}
                                            to={`/trabalhos/${order.id}`}
                                            className="block group bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-blue-900/5 hover:border-brand-orange/30 hover:shadow-2xl transition-all relative overflow-hidden active:scale-[0.98]"
                                        >
                                            <div className="absolute top-0 right-0 p-3 bg-green-50 text-green-600 font-black text-[9px] uppercase tracking-widest rounded-bl-3xl border-l border-b border-green-100">
                                                Aberta
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center gap-8">
                                                {/* Icon/Image */}
                                                <div className="w-20 h-20 bg-brand-bg rounded-[2rem] flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange group-hover:text-white transition-all duration-500 shadow-inner">
                                                    {category?.icon ? React.cloneElement(category.icon as React.ReactElement<any>, { className: "w-8 h-8" }) : <Package className="w-8 h-8" />}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-grow space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] bg-orange-50 px-3 py-1 rounded-full">
                                                            {category?.name || 'Serviço'}
                                                        </span>
                                                        <div className="flex items-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                                        </div>
                                                        <div className="flex items-center text-brand-blue text-[10px] font-black uppercase tracking-widest">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            Prazo: {order.deadline === 'imediato' ? 'Urgente' : order.deadline === 'um_mes' ? '30 dias' : order.deadline === 'mais_3_meses' ? '3+ meses' : 'A combinar'}
                                                        </div>
                                                    </div>

                                                    <h2 className="text-2xl md:text-3xl font-black text-brand-darkBlue uppercase tracking-tighter group-hover:text-brand-orange transition-colors">
                                                        {order.description.length > 60 ? order.description.substring(0, 60) + '...' : order.description}
                                                    </h2>

                                                    <div className="flex flex-wrap items-center gap-6 text-gray-500 font-bold text-sm">
                                                        <div className="flex items-center">
                                                            <MapPin className="w-4 h-4 mr-2 text-brand-blue" />
                                                            {order.location} {order.neighborhood ? `• ${order.neighborhood}` : ''}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Tag className="w-4 h-4 mr-2 text-brand-blue" />
                                                            {order.leadPrice} Créditos
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-shrink-0 flex items-center justify-center">
                                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-all group-hover:translate-x-2">
                                                        <ChevronRight className="w-6 h-6" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="bg-white p-20 text-center rounded-[3rem] border border-dashed border-gray-200">
                                    <Package className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                                    <h3 className="text-2xl font-black text-brand-darkBlue uppercase mb-2">Nenhum trabalho encontrado</h3>
                                    <p className="text-gray-500 font-bold">Tente mudar os filtros ou a região de busca.</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default JobOffers;
