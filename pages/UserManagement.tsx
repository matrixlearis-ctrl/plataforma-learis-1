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
  ArrowLeft
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
  credits?: number;
  rating?: number;
  completed_jobs?: number;
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
  
  // Ref para controlar execução única
  const hasLoaded = useRef(false);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: UserRole.CLIENT,
    document: ''
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
      
      // Adicionar timeout e limite de registros
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Limitar quantidade de registros

      clearTimeout(timeoutId);
      
      if (!error && data) {
        console.log('UserManagement: Usuários carregados com sucesso:', data.length);
        setUsers(data);
      } else if (error) {
        console.error('UserManagement: Erro Supabase:', error);
        alert('Erro ao carregar usuários: ' + error.message);
      }
    } catch (error: any) {
      console.error('UserManagement: Erro fatal ao carregar usuários:', error);
      if (error.name === 'AbortError') {
        alert('Tempo limite excedido ao carregar usuários. Tente novamente.');
      } else {
        alert('Erro ao carregar usuários: ' + error.message);
      }
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
        // Criar perfil
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          full_name: formData.full_name,
          role: formData.role,
          document: formData.role === UserRole.PROFESSIONAL ? formData.document.replace(/\D/g, '') : null,
          credits: formData.role === UserRole.PROFESSIONAL ? 15 : 0,
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

      // Deletar usuário do auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) throw authError;

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
      document: user.document || ''
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
          document: formData.role === UserRole.PROFESSIONAL ? formData.document.replace(/\D/g, '') : null
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
      document: ''
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                    <div>
                      <div className="text-sm font-black text-gray-900 uppercase">{user.full_name}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{user.email}</div>
                    </div>
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