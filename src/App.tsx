import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import Auth from './components/Auth';
import Home from './components/Home';
import { Discussions } from './components/Discussions';
import { Profile, Friends, DJSociety, Updates, Settings } from './components/Views';
import { TutorialGame } from './components/TutorialGame';
import { Menu, Home as HomeIcon, MessageSquare, Users, Lightbulb, Bell, Settings as SettingsIcon, HelpCircle, User, Plus } from 'lucide-react';
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

  // PWA Install Prompt handling
  const [canInstall, setCanInstall] = useState(false);
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

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

  // Cleanup and Initialization: Remove Bot DJ, clean messages, and setup DJ Help
  useEffect(() => {
    if (!state.currentUser) return;
    
    const botGroupId = `bot-private-${state.currentUser}`;
    const simulatedGroupId = 'simulated-group';
    const helpGroupId = `sms-dj-bot-${state.currentUser}`;
    
    const hasBotGroup = !!state.groups[botGroupId];
    const hasSimulatedGroup = !!state.groups[simulatedGroupId];
    const hasHelpGroup = !!state.groups[helpGroupId];
    const hasDJBotUser = !!state.users['DJ Bot'];
    
    // Check if any group has messages from 'Bot DJ' or 'DJ Help'
    const hasBotMessages = (Object.values(state.groups) as Group[]).some(g => 
      g.messages.some(m => m.user === 'Bot DJ' || m.user === 'DJ Help')
    );

    if (hasBotGroup || hasSimulatedGroup || hasBotMessages || !hasHelpGroup || !hasDJBotUser) {
      setTimeout(() => {
        updateState((prev: AppState) => {
          const newGroups = { ...prev.groups };
        const newUsers = { ...prev.users };
        
        // 0. Ensure DJ Bot user exists
        if (!newUsers['DJ Bot']) {
          newUsers['DJ Bot'] = {
            id: 'dj-bot',
            uid: 'dj-bot',
            name: 'DJ Bot',
            email: 'bot@djsociety.com',
            isAdmin: true,
            friends: [],
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=dj-bot'
          };
        }

        // 1. Remove old bot groups and simulation artifacts
        delete newGroups[botGroupId];
        delete newGroups[simulatedGroupId];
        delete newGroups[`sms-dj-help-${state.currentUser}`];
        
        // 2. Remove all messages from 'Bot DJ', 'DJ Help' or 'Simulateur DJ (Faux)' in all groups
        Object.keys(newGroups).forEach(id => {
          newGroups[id] = {
            ...newGroups[id],
            messages: newGroups[id].messages.filter(m => m.user !== 'Bot DJ' && m.user !== 'DJ Help' && m.user !== 'Simulateur DJ (Faux)')
          };
        });

        // 3. Ensure DJ Bot SMS exists
        if (!newGroups[helpGroupId]) {
          newGroups[helpGroupId] = {
            id: helpGroupId,
            type: 'private',
            name: 'DJ Bot (IA)',
            creator: 'system',
            admins: ['system'],
            members: [prev.currentUser as string, 'DJ Bot'],
            banned: [],
            muted: [],
            messages: [
              { 
                id: `sys-bot-${Date.now()}`, 
                user: 'Système', 
                text: 'Bienvenue dans votre discussion avec DJ Bot ! Posez-moi vos questions sur l\'application.', 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
                timestamp: new Date().toISOString(),
                isSystem: true 
              },
              {
                id: `bot-msg-init`,
                user: 'DJ Bot',
                text: "Bonjour ! Je suis DJ Bot, votre assistant intelligent. Je peux répondre à 5 questions par jour pour vous aider à maîtriser l'application. Que souhaitez-vous savoir ?",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date().toISOString()
              }
            ]
          };
        }

        return {
          groups: newGroups,
          users: newUsers,
          newMessages: prev.currentUser === 'test' && view === 'home' 
            ? [] 
            : prev.newMessages?.filter(id => id !== botGroupId && id !== simulatedGroupId) || []
        };
      });
    }, 0);
  }
}, [state.currentUser, state.groups, state.users, updateState, view]);

  // DJ Bot: Auto-tips every 20 minutes and Response logic
  useEffect(() => {
    if (!state.currentUser || state.currentUser === 'test') return;
    
    const helpGroupId = `sms-dj-bot-${state.currentUser}`;
    
    const tips = [
      "Astuce : Les groupes publics sont accessibles à tous, mais les groupes privés nécessitent un code d'invitation ou une invitation directe.",
      "Astuce : Vous pouvez désormais créer des groupes en 4 étapes avec une barre de progression pour mieux définir l'utilité du groupe.",
      "Astuce : L'onglet SMS est réservé aux discussions privées en tête-à-tête avec vos amis.",
      "Astuce : Dans les paramètres, vous pouvez changer la couleur de l'application pour qu'elle corresponde à votre style DJ.",
      "Astuce : Les administrateurs de groupes privés peuvent bannir des membres ou supprimer des messages inappropriés.",
      "Astuce : Si vous etes en mode test, vous pouvez lire les messages des groupes publics mais pas y participer.",
      "Astuce : Dans les discussions publiques, vous pouvez voir qui a envoyé un message et même bannir des utilisateurs si vous etes admin.",
      "Astuce : Votre profil vous permet de changer votre avatar et votre mot de passe à tout moment.",
      "Astuce : Consultez l'onglet 'Mises à jour' pour découvrir les dernières nouveautés de DJ Messenger.",
      "Astuce : Si un utilisateur est supprimé, vous pouvez choisir de supprimer tous ses messages passés pour nettoyer la discussion.",
      "Astuce : Pour devenir administrateur, utilisez le code 'Dj2024in' dans la section Compte des paramètres.",
      "Astuce : Les groupes privés sont protégés par un code de 5 caractères que seul le créateur connaît au départ.",
      "Astuce : L'onglet 'Récents' dans les discussions vous montre les derniers messages de tous vos groupes en un coup d'œil.",
      "Astuce : Vous pouvez proposer jusqu'à 3 idées par jour dans la DJ Society si vous n'etes pas admin."
    ];

    const sendTip = () => {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      const newMsg: Message = {
        id: `bot-tip-${Date.now()}`,
        user: 'DJ Bot',
        text: randomTip,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString()
      };
      
      updateState((prev: AppState) => {
        if (!prev.groups[helpGroupId]) return prev;
        return {
          groups: {
            ...prev.groups,
            [helpGroupId]: {
              ...prev.groups[helpGroupId],
              messages: [...prev.groups[helpGroupId].messages, newMsg]
            }
          }
        };
      });
    };

    // Send a tip every 20 minutes
    const interval = setInterval(sendTip, 20 * 60 * 1000);
    
    // Response logic: Check for new user messages in DJ Bot group
    const helpGroup = state.groups[helpGroupId];
    const currentUserData = state.users[state.currentUser as string];

    if (helpGroup) {
      const lastMsg = helpGroup.messages[helpGroup.messages.length - 1];
      if (lastMsg && lastMsg.user === state.currentUser && !lastMsg.isSystem) {
        // User just sent a message, respond after 1 second
        const timer = setTimeout(() => {
          const today = new Date().toLocaleDateString();
          const questionsToday = currentUserData?.lastBotQuestionDate === today ? (currentUserData?.botQuestionsToday || 0) : 0;

          if (questionsToday >= 5) {
            const response = "Désolé, vous avez atteint votre limite de 5 questions pour aujourd'hui. Revenez demain pour plus de conseils !";
            const botResponse: Message = {
              id: `bot-resp-${Date.now()}`,
              user: 'DJ Bot',
              text: response,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date().toISOString()
            };
            updateState((prev: AppState) => ({
              groups: {
                ...prev.groups,
                [helpGroupId]: {
                  ...prev.groups[helpGroupId],
                  messages: [...prev.groups[helpGroupId].messages, botResponse]
                }
              }
            }));
            return;
          }

          let response = "Je ne suis pas sûr de comprendre, mais je peux vous aider sur les groupes, les amis, la DJ Society ou les paramètres !";
          const text = lastMsg.text.toLowerCase();
          
          if (text.includes('groupe')) {
            response = "Les groupes se divisent en 3 catégories : Publics (ouverts à tous), Privés (sur invitation ou code) et SMS (privé 1-à-1). Pour créer un groupe, utilisez le bouton '+' dans l'onglet Discussions. Vous suivrez un processus en 4 étapes : Nom, Raison, Invitations et Code secret.";
          } else if (text.includes('ami')) {
            response = "Pour ajouter un ami, allez dans l'onglet 'Amis' et utilisez la barre de recherche. Une fois ajouté, vous pourrez démarrer une discussion SMS privée avec lui.";
          } else if (text.includes('paramètre') || text.includes('couleur')) {
            response = "Dans les 'Paramètres', vous pouvez changer la couleur de fond de l'application, modifier votre mot de passe, ou activer les notifications. C'est aussi là que vous pouvez devenir administrateur avec le code secret.";
          } else if (text.includes('society') || text.includes('idée')) {
            response = "La DJ Society est un espace communautaire où vous pouvez proposer des idées d'amélioration. Les administrateurs peuvent répondre à vos suggestions et même les valider.";
          } else if (text.includes('test')) {
            response = "Le mode test vous permet d'explorer l'application sans compte. Vous pouvez lire les messages des groupes publics, mais vous ne pouvez pas envoyer de messages ni créer de groupes sans créer un compte réel.";
          } else if (text.includes('code')) {
            response = "Les codes de groupe privé font 5 caractères. Vous pouvez en créer un lors de la création d'un groupe privé, ou en rejoindre un en saisissant le code dans l'onglet 'Privés'.";
          }

          const botResponse: Message = {
            id: `bot-resp-${Date.now()}`,
            user: 'DJ Bot',
            text: response,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
          };

          updateState((prev: AppState) => ({
            groups: {
              ...prev.groups,
              [helpGroupId]: {
                ...prev.groups[helpGroupId],
                messages: [...prev.groups[helpGroupId].messages, botResponse]
              }
            },
            users: {
              ...prev.users,
              [state.currentUser as string]: {
                ...prev.users[state.currentUser as string],
                botQuestionsToday: questionsToday + 1,
                lastBotQuestionDate: today
              }
            }
          }));
        }, 1000);
        return () => {
          clearTimeout(timer);
          clearInterval(interval);
        };
      }
    }

    return () => clearInterval(interval);
  }, [state.currentUser, state.groups, state.users, updateState]);

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

  const renderView = () => {
    switch (view) {
      case 'home': return <Home state={state} setView={setView} updateState={updateState} startSimulation={startSimulation} />;
      case 'discussions': return <Discussions state={state} updateState={updateState} />;
      case 'friends': return <Friends state={state} updateState={updateState} setView={setView} />;
      case 'djsociety': return <DJSociety state={state} updateState={updateState} />;
      case 'updates': return <Updates />;
      case 'settings': return <Settings state={state} updateState={updateState} handleLogout={handleLogout} />;
      case 'profile': return <Profile state={state} updateState={updateState} />;
      default: return <Home state={state} setView={setView} updateState={updateState} startSimulation={startSimulation} />;
    }
  };

  const handleNavClick = (id: string) => {
    if (id === 'tutorial') {
      startSimulation();
      return;
    }
    setView(id);
    
    // Clear active group if navigating away from discussions
    if (id !== 'discussions') {
      updateState({ activeGroup: null });
    }
    
    // Always close menu on mobile, or if autoHideSidebar is enabled
    if (window.innerWidth < 1024 || user?.autoHideSidebar) {
      updateState({ menuOpen: false });
    }
  };

  const toggleMenu = () => {
    updateState({ menuOpen: !state.menuOpen });
  };

  if (simulationMode) {
    return (
      <TutorialGame 
        state={state} 
        onComplete={completeSimulation} 
      />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden transition-colors duration-500 overscroll-none" style={{ backgroundColor: 'var(--bg-color, #f0f2f5)', touchAction: 'pan-x pan-y' }}>
      {/* Sidebar / Hamburger Menu */}
      <aside className={`fixed inset-y-0 left-0 z-[9999] w-72 bg-black/95 backdrop-blur-2xl text-white flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out ${state.menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
              <p className="font-black text-sm uppercase tracking-tight truncate">{isTest ? 'Mode Test' : user?.name}</p>
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
          
          {/* Install Button */}
          {((window as any).deferredPrompt || canInstall) && (
            <button
              onClick={async () => {
                const prompt = (window as any).deferredPrompt;
                if (prompt) {
                  prompt.prompt();
                  const { outcome } = await prompt.userChoice;
                  if (outcome === 'accepted') {
                    (window as any).deferredPrompt = null;
                    setCanInstall(false);
                  }
                }
              }}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-green-400 hover:bg-white/5 transition-all font-bold uppercase text-xs tracking-widest mt-4 border border-green-400/20"
            >
              <Plus size={18} />
              Installer l'App
            </button>
          )}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <p className="text-[8px] font-black text-center text-gray-500 uppercase tracking-[0.3em]">DJ Society © 2026</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 relative h-full overflow-hidden transition-all duration-300 ${state.menuOpen ? 'lg:ml-72 ml-0' : 'ml-0'}`}>
        <header className="p-4 bg-white/80 backdrop-blur-md border-b flex items-center shadow-sm sticky top-0 z-[90]">
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] lg:hidden" 
          onClick={toggleMenu}
        />
      )}
    </div>
  );
}
