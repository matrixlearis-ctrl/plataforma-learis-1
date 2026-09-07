import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Edit3,
  Trash2,
  Filter,
  UserPlus,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Lock,
  FileText,
  MapPin,
  Briefcase,
  Camera
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface UserRecord {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  document?: string;
  phone?: string;
  credits?: number;
  rating?: number;
  completed_jobs?: number;
  avatar_url?: string;
  description?: string;
  portfolio_urls?: string[];
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  experience?: string;
  profession?: string;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null);
  const [userDetails, setUserDetails] = useState<{
    unlockedLeads: any[];
    clientOrders: any[];
  }>({ unlockedLeads: [], clientOrders: [] });

  // Ref para controlar execução única
  const hasLoaded = useRef(false);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: UserRole.CLIENT,
    document: '',
    credits: 0
  });

  // Load users - com controle para evitar loops
  useEffect(() => {
    console.log('UserManagement: useEffect disparado');
    if (!hasLoaded.current) {
      console.log('UserManagement: Iniciando carga inicial');
      hasLoaded.current = true;
      loadUsers();
    }
  }, []);

  // Filter users
  useEffect(() => {
    let result = users;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user =>
        user.full_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    }

    // Filter by role
    if (filterRole !== 'ALL') {
      result = result.filter(user => user.role === filterRole);
    }

    setFilteredUsers(result);
  }, [users, searchTerm, filterRole]);

  const loadUsers = async () => {
    try {
      console.log('UserManagement: Iniciando carga de usuários...');
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setUsers(data);
      } else if (error) {
        console.error('UserManagement: Erro Supabase:', error);
        alert('Erro ao carregar usuários: ' + error.message);
      }
    } catch (error: any) {
      console.error('UserManagement: Erro fatal ao carregar usuários:', error);
      alert('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (user: UserRecord) => {
    setLoading(true);
    try {
      let unlockedLeads = [];
      let clientOrders = [];

      if (user.role === UserRole.PROFESSIONAL) {
        // Buscar leads desbloqueados
        const { data } = await supabase
          .from('orders')
          .select('*')
          .contains('unlocked_by', [user.id]);
        unlockedLeads = data || [];
      } else if (user.role === UserRole.CLIENT) {
        // Buscar pedidos feitos
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('client_id', user.id);
        clientOrders = data || [];
      }

      setUserDetails({ unlockedLeads, clientOrders });
      setViewingUser(user);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'SenhaPadrao123!', // Senha temporária
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Criar perfil com UPSERT para evitar conflito com trigger
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: formData.full_name,
          email: formData.email, // Salva o email no perfil
          role: formData.role,
          document: formData.role === UserRole.PROFESSIONAL ? formData.document.replace(/\D/g, '') : null,
          credits: formData.role === UserRole.PROFESSIONAL ? 0 : 0,
          completed_jobs: 0,
          rating: 5.0
        });

        if (profileError) throw profileError;

        alert('Usuário criado com sucesso!');
        setShowCreateModal(false);
        resetForm();
        loadUsers();
      }
    } catch (error: any) {
      alert('Erro ao criar usuário: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

    try {
      setLoading(true);
      // Deletar perfil primeiro
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      alert('Usuário excluído com sucesso!');
      loadUsers();
    } catch (error: any) {
      alert('Erro ao excluir usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserRecord) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      document: user.document || '',
      credits: user.credits || 0
    });
    setShowCreateModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    try {
      setLoading(true);

      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role,
          document: formData.role === UserRole.PROFESSIONAL ? formData.document.replace(/\D/g, '') : null,
          credits: formData.role === UserRole.PROFESSIONAL ? Number(formData.credits) : 0
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      alert('Usuário atualizado com sucesso!');
      setShowCreateModal(false);
      resetForm();
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      alert('Erro ao atualizar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      role: UserRole.CLIENT,
      document: '',
      credits: 0
    });
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-100 text-red-800';
      case UserRole.PROFESSIONAL: return 'bg-orange-100 text-orange-800';
      case UserRole.CLIENT: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'Administrador';
      case UserRole.PROFESSIONAL: return 'Profissional';
      case UserRole.CLIENT: return 'Cliente';
      default: return role;
    }
  };

  if (loading && !viewingUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (viewingUser) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 animate-in fade-in duration-500">
        <button
          onClick={() => { setViewingUser(null); setUserDetails({ unlockedLeads: [], clientOrders: [] }); }}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-black uppercase text-xs tracking-widest"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para Lista
        </button>

        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-3xl overflow-hidden">
          <div className="h-4 bg-brand-orange"></div>
          <div className="p-10">
            <div className="flex justify-between items-start mb-10">
              <div>
                <span className={`px-4 py-1.5 inline-flex text-[10px] font-black rounded-full uppercase tracking-widest border mb-4 ${getRoleColor(viewingUser.role)}`}>
                  {getRoleLabel(viewingUser.role)}
                </span>
                <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight leading-none mb-2">{viewingUser.full_name}</h2>
                <p className="text-gray-400 font-bold uppercase text-xs tracking-tighter">{viewingUser.email}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cadastrado em</p>
                <p className="text-lg font-black text-gray-900">{new Date(viewingUser.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 mb-12">
              <div className="flex-shrink-0">
                {viewingUser.avatar_url ? (
                  <img
                    src={viewingUser.avatar_url}
                    alt={viewingUser.full_name}
                    className="w-32 h-32 rounded-[2rem] object-cover border-4 border-gray-50 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-[2rem] bg-gray-50 flex items-center justify-center border-4 border-gray-50">
                    <Users className="w-12 h-12 text-gray-200" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">E-mail de Acesso</p>
                  <p className="text-sm font-black text-gray-900 break-all">{viewingUser.email}</p>
                </div>

                {viewingUser.role === UserRole.PROFESSIONAL && (
                  <>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Telefone/WhatsApp</p>
                      <p className="text-xl font-black text-gray-900">{viewingUser.phone || 'NÃO INFORMADO'}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Documento (CPF/CNPJ)</p>
                      <p className="text-xl font-black text-gray-900">{viewingUser.document || 'NÃO INFORMADO'}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Saldo Atual</p>
                      <p className="text-xl font-black text-blue-600">{viewingUser.credits || 0} CRÉDITOS</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Avaliação</p>
                      <p className="text-xl font-black text-amber-500">★ {viewingUser.rating || '5.0'}</p>
                    </div>
                  </>
                )}

                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Senha</p>
                  <div className="flex items-center text-gray-400 italic text-sm font-bold">
                    <Lock className="w-4 h-4 mr-2" />
                    Criptografada (Protegida)
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço e Profissional */}
            {viewingUser.role === UserRole.PROFESSIONAL && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <div className="bg-brand-bg/30 p-8 rounded-[2.5rem] border border-gray-100">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-brand-blue" />
                    Endereço Completo
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Logradouro</p>
                      <p className="text-sm font-bold text-gray-900">{viewingUser.address || 'Não informado'}, {viewingUser.number || 'S/N'}</p>
                    </div>
                    {viewingUser.complement && (
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Complemento</p>
                        <p className="text-sm font-bold text-gray-900">{viewingUser.complement}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Bairro</p>
                        <p className="text-sm font-bold text-gray-900">{viewingUser.neighborhood || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">CEP</p>
                        <p className="text-sm font-bold text-gray-900">{viewingUser.cep || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Cidade / Estado</p>
                      <p className="text-sm font-bold text-gray-900">{viewingUser.city || '-'} / {viewingUser.state || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-bg/30 p-8 rounded-[2.5rem] border border-gray-100">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center">
                    <Briefcase className="w-4 h-4 mr-2 text-brand-orange" />
                    Perfil Profissional
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Profissão Atual</p>
                      <p className="text-sm font-black text-brand-blue uppercase">{viewingUser.profession || 'Não definida'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Tempo de Experiência</p>
                      <p className="text-sm font-bold text-gray-900">{viewingUser.experience || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Bio / Descrição</p>
                      <p className="text-sm text-gray-600 leading-relaxed italic">"{viewingUser.description || 'Sem descrição cadastrada.'}"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Portfólio de Fotos */}
            {viewingUser.role === UserRole.PROFESSIONAL && (
              <div className="mb-12">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center">
                  <Camera className="w-4 h-4 mr-2 text-purple-500" />
                  Portfólio de Serviços ({viewingUser.portfolio_urls?.length || 0}/6)
                </h3>
                {viewingUser.portfolio_urls && viewingUser.portfolio_urls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {viewingUser.portfolio_urls.map((url, idx) => (
                      <div key={idx} className="aspect-square rounded-2xl overflow-hidden border-2 border-gray-50 shadow-sm hover:shadow-md transition-all group relative">
                        <img src={url} alt={`Portfólio ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Search className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 text-center">
                    <p className="text-sm font-bold text-gray-400 italic">Este profissional ainda não subiu fotos para o portfólio.</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-8">
              {viewingUser.role === UserRole.PROFESSIONAL ? (
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase mb-6 flex items-center">
                    <CheckCircle2 className="w-6 h-6 mr-2 text-green-500" />
                    Leads Desbloqueados ({userDetails.unlockedLeads.length})
                  </h3>
                  <div className="space-y-4">
                    {userDetails.unlockedLeads.length > 0 ? userDetails.unlockedLeads.map((lead: any) => (
                      <div key={lead.id} className="p-6 bg-white border-2 border-gray-50 rounded-2xl flex justify-between items-center hover:border-blue-100 transition-colors">
                        <div>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{lead.category}</p>
                          <p className="font-bold text-gray-900">{lead.client_name}</p>
                          <p className="text-xs text-gray-400">{lead.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-900">-{lead.lead_price} CR</p>
                          <p className="text-[10px] text-gray-400 font-bold">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm font-bold text-gray-400 italic">Este profissional ainda não desbloqueou nenhum lead.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase mb-6 flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-blue-500" />
                    Pedidos de Orçamento ({userDetails.clientOrders.length})
                  </h3>
                  <div className="space-y-6">
                    {userDetails.clientOrders.length > 0 ? userDetails.clientOrders.map((order: any) => (
                      <div key={order.id} className="bg-white border-2 border-gray-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-gray-50 px-8 py-4 border-b flex justify-between items-center">
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{order.category}</span>
                          <span className={`px-3 py-1 rounded-full font-black uppercase text-[9px] border ${order.status === 'OPEN' ? 'border-green-100 bg-green-50 text-green-600' : 'border-gray-100 bg-gray-50 text-gray-500'}`}>
                            {order.status === 'OPEN' ? 'ATIVO' : 'FECHADO'}
                          </span>
                        </div>
                        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Descrição do Problema</p>
                              <p className="text-sm text-gray-700 leading-relaxed font-medium">{order.description}</p>
                            </div>
                            <div className="flex gap-8">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prazo</p>
                                <p className="text-sm font-bold text-gray-900">{order.deadline}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor do Lead</p>
                                <p className="text-sm font-bold text-blue-600">{order.lead_price} Créditos</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4 border-t lg:border-t-0 lg:border-l lg:pl-8 pt-4 lg:pt-0">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Localização Completa</p>
                              <p className="text-sm font-bold text-gray-900">{order.location}</p>
                              <p className="text-sm text-gray-600">{order.neighborhood} {order.address}{order.number ? `, ${order.number}` : ''}</p>
                              {order.complement && <p className="text-xs text-gray-400 italic">{order.complement}</p>}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Telefone de Contato</p>
                              <p className="text-sm font-bold text-gray-900">{order.phone}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Criado em</p>
                              <p className="text-sm font-bold text-gray-900">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm font-bold text-gray-400 italic">Este cliente ainda não fez nenhum pedido.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-6">
      {/* Header */}
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
            <h2 className="text-2xl font-black text-gray-900 uppercase">Gerenciamento de Usuários</h2>
            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest opacity-50">Administre todos os usuários da plataforma</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-sm"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | 'ALL')}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none font-bold text-sm"
            >
              <option value="ALL">Todos os Perfis</option>
              <option value={UserRole.CLIENT}>Clientes</option>
              <option value={UserRole.PROFESSIONAL}>Profissionais</option>
              <option value={UserRole.ADMIN}>Administradores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b">
                <th className="px-8 py-5 text-left">Usuário</th>
                <th className="px-8 py-5 text-left">Perfil</th>
                <th className="px-8 py-5 text-left">Documento</th>
                <th className="px-8 py-5 text-left">Créditos</th>
                <th className="px-8 py-5 text-left">Cadastro</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-5">
                    <button
                      onClick={() => loadUserDetails(user)}
                      className="text-left group"
                    >
                      <div className="text-sm font-black text-gray-900 uppercase group-hover:text-blue-600 transition-colors underline-offset-4 group-hover:underline">{user.full_name}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{user.email}</div>
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 inline-flex text-[9px] font-black rounded-full uppercase tracking-widest border ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-gray-500 uppercase">
                    {user.document || '-'}
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-gray-500 uppercase">
                    {user.credits !== undefined ? user.credits : '-'}
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-gray-500 uppercase">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar usuário"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-20 px-4">
            <Users className="mx-auto h-20 w-20 text-gray-100 mb-6" />
            <h3 className="text-lg font-black text-gray-900 uppercase">Nenhum usuário encontrado</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Tente ajustar seus filtros de busca.</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                {editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                  setEditingUser(null);
                }}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <XCircle className="w-8 h-8" />
              </button>
            </div>

            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  className={`w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm ${editingUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Perfil</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm appearance-none"
                >
                  <option value={UserRole.CLIENT}>Cliente</option>
                  <option value={UserRole.PROFESSIONAL}>Profissional</option>
                </select>
              </div>

              {formData.role === UserRole.PROFESSIONAL && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">CPF/CNPJ</label>
                    <input
                      type="text"
                      required
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                      placeholder="Digite CPF ou CNPJ"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Saldo de Créditos</label>
                    <input
                      type="number"
                      required
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                      className="w-full px-5 py-4 bg-orange-50 border border-orange-100 rounded-2xl focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange transition-all font-black text-sm text-brand-orange"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-4 border-2 border-gray-50 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50"
                >
                  {loading ? 'Processando...' : editingUser ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;