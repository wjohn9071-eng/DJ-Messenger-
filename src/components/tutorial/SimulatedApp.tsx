import React, { useState } from 'react';
import { AppState } from '../../types';
import { djStyleText, djStyleBg, DJ_LOGO_SVG } from '../../lib/utils';
import { 
  MessageSquare, 
  User, 
  Users, 
  Zap, 
  Settings as SettingsIcon, 
  Home as HomeIcon,
  Menu,
  X
} from 'lucide-react';
import SimulatedHome from './SimulatedHome';
import { SimulatedDiscussions } from './SimulatedDiscussions';
import { SimulatedProfile } from './SimulatedProfile';
import { SimulatedFriends } from './SimulatedFriends';
import { SimulatedDJSociety } from './SimulatedDJSociety';
import { SimulatedSettings } from './SimulatedSettings';
import { SimulatedUpdates } from './SimulatedUpdates';

export function SimulatedApp({ 
  state, 
  updateState, 
  currentView, 
  setCurrentView 
}: { 
  state: AppState, 
  updateState: any, 
  currentView: string, 
  setCurrentView: (v: string) => void 
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'home': return <SimulatedHome state={state} setView={setCurrentView} updateState={updateState} />;
      case 'discussions': return <SimulatedDiscussions state={state} updateState={updateState} />;
      case 'profile': return <SimulatedProfile state={state} updateState={updateState} />;
      case 'friends': return <SimulatedFriends state={state} updateState={updateState} />;
      case 'djsociety': return <SimulatedDJSociety state={state} updateState={updateState} />;
      case 'updates': return <SimulatedUpdates />;
      case 'settings': return <SimulatedSettings state={state} updateState={updateState} />;
      default: return <SimulatedHome state={state} setView={setCurrentView} updateState={updateState} />;
    }
  };

  const handleNavClick = (id: string) => {
    setCurrentView(id);
    setMenuOpen(false);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#f0f2f5]">
      {/* Sidebar Simulation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-black/95 backdrop-blur-2xl text-white flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-24 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/10 md:justify-center md:p-4">
          <div className="flex items-center gap-3 md:flex-col">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-1.5 bg-white">
              <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full" />
            </div>
            <span className={`font-black text-xl tracking-tighter uppercase md:hidden ${djStyleText}`}>Messenger</span>
          </div>
          <button onClick={() => setMenuOpen(false)} className="md:hidden p-2 hover:bg-white/10 rounded-xl transition">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 md:flex md:flex-col md:items-center md:gap-4 md:pt-8">
          {[
            { id: 'home', icon: HomeIcon, label: 'Accueil' },
            { id: 'discussions', icon: MessageSquare, label: 'Messages' },
            { id: 'djsociety', icon: Zap, label: 'DJ Society' },
            { id: 'friends', icon: Users, label: 'Amis' },
            { id: 'profile', icon: User, label: 'Profil' },
            { id: 'settings', icon: SettingsIcon, label: 'Paramètres' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group md:w-14 md:h-14 md:justify-center ${currentView === item.id ? `bg-white/10 text-white shadow-lg` : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={24} className={currentView === item.id ? djStyleText : ''} />
              <span className="font-bold text-sm md:hidden">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Simulation */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b p-4 flex items-center justify-between z-40">
          <button onClick={() => setMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center p-1 bg-black">
              <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full invert" />
            </div>
            <span className={`font-black text-lg tracking-tighter uppercase ${djStyleText}`}>Messenger</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-hidden relative">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
