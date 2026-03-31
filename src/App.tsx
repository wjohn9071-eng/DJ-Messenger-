import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import Auth from './components/Auth';
import Home from './components/Home';
import { Discussions } from './components/Discussions';
import { Profile, Friends, DJSociety, Updates, Settings } from './components/Views';
import { TutorialGame } from './components/TutorialGame';
import { Menu, Home as HomeIcon, MessageSquare, Users, Lightbulb, Bell, Settings as SettingsIcon, HelpCircle, User } from 'lucide-react';
import { djStyleText, djStyleBg, DJ_LOGO_SVG } from './lib/utils';
import { AppState, Message, Group } from './types';

export default function App() {
  const { state, updateState } = useAppStore();
  const [view, setView] = useState('home');
  const [simulationMode, setSimulationMode] = useState(false);

  useEffect(() => {
    if (state.currentUser && state.users[state.currentUser]?.bgColor) {
      document.documentElement.style.setProperty('--bg-color', state.users[state.currentUser].bgColor);
    }
  }, [state.currentUser, state.users]);

  const handleLogout = () => {
    updateState({ currentUser: null });
    setView('home');
    setSimulationMode(false);
  };

  const startSimulation = () => {
    setSimulationMode(true);
    setView('home');
  };

  const completeSimulation = () => {
    setSimulationMode(false);
    if (state.currentUser === 'test') {
      handleLogout();
    } else {
      setView('home');
    }
  };

  if (!state.currentUser) {
    return <Auth state={state} updateState={updateState} />;
  }

  const isTest = state.currentUser === 'test';
  const user = isTest ? null : state.users[state.currentUser];

  const navItems = [
    { id: 'home', label: 'Accueil', icon: HomeIcon },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'friends', label: 'Amis', icon: Users },
    { id: 'djsociety', label: 'DJ Society', icon: Lightbulb },
    { id: 'updates', label: 'Mises à jour', icon: Bell },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
    { id: 'tutorial', label: 'Tutoriel', icon: HelpCircle },
  ];

  // Simulate incoming messages from Bot DJ every 10 minutes for demo
  useEffect(() => {
    if (!state.currentUser) return;

    const interval = setInterval(() => {
      const botMsg: Message = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user: 'Bot DJ',
        text: "Hé ! N'oublie pas de consulter les dernières propositions dans DJ Society !",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      updateState((prev: AppState) => {
        // Find or create the private Bot DJ group (SMS)
        const botGroupId = `bot-private-${prev.currentUser}`;
        const botGroup = prev.groups[botGroupId];
        
        if (!botGroup) {
          const newBotGroup: Group = {
            id: botGroupId,
            type: 'private',
            name: 'Bot DJ',
            creator: 'system',
            admins: ['system'],
            members: [prev.currentUser as string, 'Bot DJ'],
            banned: [],
            muted: [],
            messages: [
              { id: 'sys-1', user: 'Système', text: 'Conversation privée avec Bot DJ', time: new Date().toLocaleTimeString(), isSystem: true },
              botMsg
            ]
          };
          return {
            groups: { ...prev.groups, [botGroupId]: newBotGroup },
            newMessages: prev.newMessages?.includes(botGroupId) ? prev.newMessages : [...(prev.newMessages || []), botGroupId]
          };
        }

        return { 
          groups: {
            ...prev.groups,
            [botGroupId]: {
              ...prev.groups[botGroupId],
              messages: [...prev.groups[botGroupId].messages, botMsg]
            }
          },
          newMessages: prev.newMessages?.includes(botGroupId) 
            ? prev.newMessages 
            : [...(prev.newMessages || []), botGroupId]
        };
      });
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(interval);
  }, [updateState, state.currentUser]);

  const renderView = () => {
    switch (view) {
      case 'home': return <Home state={state} setView={setView} updateState={updateState} />;
      case 'discussions': return <Discussions state={state} updateState={updateState} />;
      case 'friends': return <Friends state={state} updateState={updateState} />;
      case 'djsociety': return <DJSociety state={state} updateState={updateState} />;
      case 'updates': return <Updates />;
      case 'settings': return <Settings state={state} updateState={updateState} handleLogout={handleLogout} />;
      case 'tutorial': return <TutorialGame state={state} updateState={updateState} onComplete={completeSimulation} />;
      case 'profile': return <Profile state={state} updateState={updateState} />;
      default: return <Home state={state} setView={setView} updateState={updateState} />;
    }
  };

  const handleNavClick = (id: string) => {
    if (id === 'tutorial') {
      startSimulation();
      return;
    }
    setView(id);
    
    // Auto-hide menu if enabled
    if (user?.autoHideSidebar) {
      updateState({ menuOpen: false });
    }
  };

  const toggleMenu = () => {
    updateState({ menuOpen: !state.menuOpen });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden transition-colors duration-500" style={{ backgroundColor: 'var(--bg-color, #f0f2f5)' }}>
      {/* Sidebar / Hamburger Menu */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-black/95 backdrop-blur-2xl text-white flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out ${state.menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-1.5 bg-white">
              <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full" />
            </div>
            <span className={`font-black text-xl tracking-tighter uppercase ${djStyleText}`}>Messenger</span>
          </div>
          <button onClick={toggleMenu} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition">
            <Menu size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <button 
            onClick={() => handleNavClick('profile')}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#00CED1] transition-all shadow-lg">
              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User size={24} className="text-gray-400" />}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-black text-sm uppercase tracking-tight truncate">{isTest ? 'Mode Test' : user?.username}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isTest ? 'Anonyme' : 'En ligne'}</p>
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
              <item.icon size={18} className={view === item.id ? 'text-[#00CED1]' : ''} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <p className="text-[8px] font-black text-center text-gray-500 uppercase tracking-[0.3em]">DJ Society © 2026</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 relative h-full overflow-hidden transition-all duration-300 ${state.menuOpen ? 'ml-72' : 'ml-0'}`}>
        <header className="p-4 bg-white/80 backdrop-blur-md border-b flex items-center shadow-sm sticky top-0 z-30">
          <button onClick={toggleMenu} className="p-2 hover:bg-gray-100 rounded-xl transition mr-2">
            <Menu size={24} className="text-gray-600" />
          </button>
          <h1 className={`ml-2 font-black uppercase tracking-tighter text-xl ${djStyleText}`}>
            {navItems.find(i => i.id === view)?.label || 'DJ Messenger'}
          </h1>
        </header>
        
        <div className="flex-1 relative h-full overflow-y-auto">
          {renderView()}
        </div>
      </main>

      {/* Overlay for mobile when menu is open */}
      {state.menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" 
          onClick={toggleMenu}
        />
      )}

      {simulationMode && (
        <TutorialGame 
          state={state} 
          updateState={updateState}
          onComplete={completeSimulation} 
        />
      )}
    </div>
  );
}
