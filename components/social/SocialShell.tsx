import React, { useState } from 'react';
import { User } from '../../types';
import Topbar from './Topbar';
import LeftMenu from './LeftMenu';
import RightPanel from './RightPanel';
import BottomNav from './BottomNav';

interface SocialShellProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const SocialShell: React.FC<SocialShellProps> = ({ user, onLogout, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg">
      <Topbar
        user={user}
        onLogout={onLogout}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <div className="max-w-[1200px] mx-auto px-3 md:px-6 pt-4 md:pt-6 pb-24 lg:pb-10 flex gap-6 items-start">
        <aside className="hidden lg:block w-[260px] flex-shrink-0 sticky top-[76px] self-start">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
            <LeftMenu user={user} onLogout={onLogout} />
          </div>
        </aside>

        <main className="flex-1 min-w-0 max-w-[680px] w-full mx-auto lg:mx-0">
          {children}
        </main>

        <aside className="hidden lg:block w-[300px] flex-shrink-0 sticky top-[76px] self-start">
          <RightPanel />
        </aside>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-[280px] max-w-[85vw] bg-white shadow-2xl overflow-y-auto z-10">
            <LeftMenu
              user={user}
              onLogout={() => { setMobileMenuOpen(false); onLogout(); }}
              mobile
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      <BottomNav user={user} />
    </div>
  );
};

export default SocialShell;