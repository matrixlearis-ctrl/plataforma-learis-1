import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, MessageCircle, LogOut, Settings, Search, Menu, X, PlusCircle, ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { User } from '../../types';
import { getMyNotifications, getUnreadNotificationsCount, markNotificationsRead } from '../../lib/social';
import { formatRelative } from '../../lib/format';
import Avatar from '../Avatar';

interface TopbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
}

type Panel = 'notif' | 'msg' | 'profile' | null;

const Topbar: React.FC<TopbarProps> = ({ user, onLogout, onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [panel, setPanel] = useState<Panel>(null);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState<any[]>([]);

  const meId = user?.id ?? null;

  useEffect(() => {
    if (!meId) { setUnread(0); return; }
    getUnreadNotificationsCount(meId).then(setUnread).catch(() => setUnread(0));
  }, [meId]);

  useEffect(() => {
    const close = () => setPanel(null);
    window.addEventListener('scroll', close);
    return () => window.removeEventListener('scroll', close);
  }, []);

  const openPanel = (p: Panel) => {
    if (panel === p) { setPanel(null); return; }
    setPanel(p);
    if (p === 'notif' && meId) {
      getMyNotifications(meId)
        .then((list) => {
          setNotifs(list);
          if (unread > 0) {
            markNotificationsRead(meId).then(() => setUnread(0)).catch(() => {});
          }
        })
        .catch(() => setNotifs([]));
    }
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/busca${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-3 md:px-6 h-14 flex items-center gap-3">
        <button onClick={onOpenMobileMenu} className="lg:hidden text-brand-darkBlue p-1.5 rounded-lg hover:bg-gray-50 transition-colors" aria-label="Menu">
          <Menu className="w-6 h-6" />
        </button>

        <Link to="/feed" className="flex items-center space-x-2 flex-shrink-0">
          <div className="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <span className="hidden sm:block text-xl font-black text-brand-darkBlue tracking-tight">Samej</span>
        </Link>

        <form onSubmit={submitSearch} className="hidden sm:flex flex-1 max-w-md items-center bg-gray-100 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-brand-blue/30">
          <Search className="w-4 h-4 text-gray-400 ml-4 flex-shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no Samej..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-800 font-bold focus:outline-none"
          />
        </form>

        <div className="flex-1 sm:flex-none" />

        {user ? (
          <>
            <button
              onClick={() => openPanel('notif')}
              className={`relative p-2 rounded-full transition-colors ${panel === 'notif' ? 'bg-brand-blue/10 text-brand-blue' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-orange text-white text-[10px] font-black flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>

            <button
              onClick={() => openPanel('msg')}
              className={`relative p-2 rounded-full transition-colors ${panel === 'msg' ? 'bg-brand-blue/10 text-brand-blue' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Mensagens"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-brand-blue"></span>
            </button>

            <Link
              to="/publicar"
              className="hidden md:flex items-center bg-brand-orange text-white px-4 py-2 rounded-full hover:bg-brand-lightOrange font-black text-xs transition-all shadow hover:shadow-orange-200 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" /> Publicar
            </Link>

            <button
              onClick={() => openPanel('profile')}
              className={`flex items-center rounded-full transition-colors ${panel === 'profile' ? 'ring-2 ring-brand-blue/40' : 'hover:ring-2 hover:ring-gray-200'}`}
              aria-label="Menu do perfil"
            >
              <Avatar src={user.avatar} alt={user.name} size={36} linkTo="" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/criar-conta')} className="hidden sm:block text-gray-600 hover:text-brand-blue font-bold text-sm px-2 py-2 transition-colors">
              Entrar
            </button>
            <button onClick={() => navigate('/criar-conta')} className="bg-brand-orange text-white px-4 py-2 rounded-full font-black text-xs hover:bg-brand-lightOrange shadow active:scale-95 transition-all">
              Entrar na plataforma
            </button>
          </div>
        )}
      </div>

      {panel && (
        <div className="fixed inset-0 z-50" onClick={() => setPanel(null)}>
          <div
            className="absolute top-14 right-2 md:right-6 w-[330px] max-w-[calc(100vw-16px)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {panel === 'notif' && (
              <div>
                <p className="px-4 py-3 font-black text-gray-900 border-b border-gray-50">Notificações</p>
                {!meId ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400 font-bold">
                    <Link to="/criar-conta" className="text-brand-orange">Entre</Link> para ver suas notificações.
                  </p>
                ) : notifs.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400 font-bold">Nenhuma notificação por enquanto.</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto">
                    {notifs.map((n) => (
                      <li key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-bold text-gray-800">{n.message || 'Nova atividade no Samej'}</p>
                        <p className="text-[11px] text-gray-400 font-bold mt-0.5">{formatRelative(n.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {panel === 'msg' && (
              <div>
                <p className="px-4 py-3 font-black text-gray-900 border-b border-gray-50">Mensagens</p>
                {!meId ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400 font-bold">
                    <Link to="/criar-conta" className="text-brand-orange">Entre</Link> para conversar.
                  </p>
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-gray-400 font-bold">
                    Nenhuma conversa por enquanto.<br />
                    <span className="text-xs">Mensagens chegarão na próxima fase da plataforma.</span>
                  </p>
                )}
              </div>
            )}

            {panel === 'profile' && user && (
              <div>
                <div className="flex items-center space-x-3 px-4 py-4 border-b border-gray-50">
                  <Avatar src={user.avatar} alt={user.name} size={44} />
                  <div className="min-w-0">
                    <p className="font-black text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 font-bold truncate">{user.email}</p>
                  </div>
                </div>
                <div className="py-1">
                  <Link to={meId ? `/social/${meId}` : '/'} onClick={() => setPanel(null)} className="flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                    <UserIcon className="w-4 h-4 mr-3 text-gray-400" /> Meu perfil
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-300" />
                  </Link>
                  <Link to="/configuracoes" onClick={() => setPanel(null)} className="flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4 mr-3 text-gray-400" /> Configurações
                  </Link>
                  <button onClick={() => { setPanel(null); onLogout(); }} className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4 mr-3" /> Sair da conta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;