import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { History, Menu, Home as HomeIcon, MessageSquare, Users, Lightbulb, Bell, Settings as SettingsIcon, HelpCircle, User as UserIcon, Shield } from 'lucide-react';
import { djStyleText, DJ_LOGO_SVG } from '../lib/utils';
import { ProfileMock } from './ProfileMock';
import { UpdatesMock } from './UpdatesMock';
import { HomeMock } from './HomeMock';
import { DiscussionsMock } from './DiscussionsMock';
import { FriendsMock } from './FriendsMock';
import { SocietyMock } from './SocietyMock';
import { SettingsMock } from './SettingsMock';

export function AppMock({ state, setView: setParentView, updateState, onComplete }: { state: AppState, setView: (v: string) => void, updateState: any, onComplete: () => void }) {
  const [view, setView] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  const isTest = state.currentUser === 'test';
  const user = state.users[state.currentUser as string];

  const navItems = [
    { id: 'home', label: 'Accueil', icon: HomeIcon },
    { id: 'profile', label: 'Mon Profil', icon: UserIcon },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'friends', label: 'Amis', icon: Users },
    { id: 'djsociety', label: 'DJ Society', icon: Lightbulb },
    { id: 'staff', label: 'Staff', icon: Shield },
    { id: 'updates', label: 'Mises à jour', icon: Bell },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  const renderView = () => {
    switch (view) {
      case 'home': return <HomeMock state={state} setView={setView} updateState={updateState} onComplete={onComplete} />;
      case 'discussions': return <DiscussionsMock state={state} updateState={updateState} />;
      case 'friends': return <FriendsMock state={state} updateState={updateState} />;
      case 'djsociety': return <SocietyMock state={state} updateState={updateState} />;
      case 'profile': return <ProfileMock state={state} updateState={updateState} />;
      case 'updates': return <UpdatesMock state={state} />;
      case 'settings': return <SettingsMock state={state} updateState={updateState} onLogout={onComplete} />;
      default: return <HomeMock state={state} setView={setView} updateState={updateState} onComplete={onComplete} />;
    }
  };

  const handleNavClick = (id: string) => {
    setView(id);
    setMenuOpen(false);
  };

  // Sync state variables for style
  useEffect(() => {
    const root = document.documentElement;
    if (state.darkMode) root.classList.add('dark'); else root.classList.remove('dark');
    if (user?.bgColor) root.style.setProperty('--bg-color', user.bgColor);
    if (user?.btnColor) root.style.setProperty('--btn-color', user.btnColor);
  }, [state.darkMode, user]);

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${state.darkMode ? 'bg-gray-900 text-white' : 'text-gray-900'}`} style={{ backgroundColor: 'var(--bg-color, #f0f2f5)' }}>
      
      {/* Sidebar Mockup - Exact Copy of Real App Sidebar */}
      <aside className={`fixed inset-y-0 left-0 lg:relative z-[9999] bg-black/90 backdrop-blur-xl border-r border-white/10 text-white flex flex-col transition-all duration-300 ease-in-out h-full overflow-hidden shrink-0 ${menuOpen ? 'w-full lg:w-72' : 'w-0 lg:w-72'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-1.5 bg-white">
              <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full" />
            </div>
            <span className={`font-black text-xl tracking-tighter uppercase ${djStyleText}`}>Messenger</span>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition">
            <Menu size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <button 
            onClick={() => handleNavClick('profile')}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#0D98BA] transition-all shadow-lg">
              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-gray-400" />}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-black text-sm uppercase tracking-tight truncate">{isTest ? 'Mode Tutoriel' : user?.name}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Simulation</p>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold uppercase text-xs tracking-widest ${view === item.id ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
            >
              <item.icon size={18} className={view === item.id ? 'text-[#0D98BA]' : ''} />
              {item.label}
            </button>
          ))}
          
          <button
            onClick={onComplete}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-bold uppercase text-xs tracking-widest mt-4 border border-red-500/20"
          >
            <History size={18} />
            Quitter le mode Démo
          </button>
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <p className="text-[8px] font-black text-center text-gray-500 uppercase tracking-[0.3em]">Simulation Tutoriel v3.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300 ${menuOpen ? 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : 'opacity-100'}`}>
        <header className={`p-4 border-b flex items-center shadow-sm sticky top-0 z-[1000] shrink-0 backdrop-blur-md ${state.darkMode ? 'bg-black/80 border-white/10 text-white' : 'bg-white/80 border-gray-200 text-gray-800'}`}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition mr-2">
            <Menu size={24} />
          </button>
          <h1 className={`ml-2 font-black uppercase tracking-tighter text-xl ${djStyleText}`}>
            {navItems.find(i => i.id === view)?.label || 'Simulation'}
          </h1>
        </header>
        
        <div className="flex-1 relative overflow-hidden">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

