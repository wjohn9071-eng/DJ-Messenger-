import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from './store';
import Auth from './components/Auth';
import Home from './components/Home';
import { Discussions } from './components/Discussions';
import { Profile, Friends, AdminUsers, DJSociety, Updates as UpdatesView, Settings, Staff } from './components/Views';
import { TutorialGame } from './components/TutorialGame';
import { PWAUpdateModal } from './components/PWAUpdateModal';
import { Menu, Home as HomeIcon, MessageSquare, Users, Lightbulb, Bell, Settings as SettingsIcon, HelpCircle, User as UserIcon, Plus, Shield } from 'lucide-react';
import { djStyleText, djStyleBg, DJ_LOGO_SVG } from './lib/utils';
import { AppState, Message, Group, User } from './types';
import { db, collection, doc, addDoc, setDoc, updateDoc, arrayUnion, getDoc } from './lib/firebase';
import { UserProfileModal } from './components/UserProfileModal';

export default function App() {
  const { state, updateState } = useAppStore();
  const [view, setView] = useState('home');
  const [simulationMode, setSimulationMode] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  // Version check logic removed in favor of Service Worker native API

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

  useEffect(() => {
    if (showUpdateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showUpdateModal]);

  // Service Worker Update Detection
  useEffect(() => {
    let swRegistration: ServiceWorkerRegistration | null = null;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        swRegistration = reg;
        
        // Immediate check on load
        reg.update();

        // Check if there is already a waiting worker
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowUpdateModal(true);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                // Aggressive: auto-update immediately without asking
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            });
          }
        });
      }).catch(err => console.error('SW registration failed:', err));

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      // Periodically check for updates on the worker
      const checkSWUpdate = () => {
        if (swRegistration) {
          swRegistration.update().catch(() => { /* silent handle */ });
        }
      };

      // Aggressive: Periodic website refresh every 5 minutes as requested
      const refreshInterval = setInterval(() => {
        if (swRegistration) {
          swRegistration.update().catch(() => {});
        }
        window.location.reload();
      }, 5 * 60 * 1000);

      const updateCheckInterval = setInterval(checkSWUpdate, 2 * 60 * 1000); // Check SW more frequently
      
      // Also check and reload if visible
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          if (swRegistration) swRegistration.update().catch(() => {});
        }
      };
      window.addEventListener('visibilitychange', handleVisibilityChange);
      // window.addEventListener('focus', checkSWUpdate); // Focus might be too frequent, visibility is better

      return () => {
        clearInterval(refreshInterval);
        clearInterval(updateCheckInterval);
        window.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  // Dark Mode application
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  const setViewAndCloseMenu = (id: string) => {
    if (id === 'tutorial') {
      startSimulation();
      return;
    }
    setView(id);
    
    // Clear active group when navigating
    updateState({ activeGroup: null });
  };

  // Fermeture automatique du menu lors du changement d'onglet
  useEffect(() => {
    updateState({ menuOpen: false });
  }, [view]);

  const handleLogout = () => {
    updateState({ currentUser: null });
    setViewAndCloseMenu('home');
    setSimulationMode(false);
  };

  const handleNavClick = (id: string) => {
    setViewAndCloseMenu(id);
  };

  const toggleMenu = () => {
    updateState({ menuOpen: !state.menuOpen });
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
    const helpGroupId = `sms_dj_bot_${state.currentUser}`;
    
    // Check if any group has messages from 'Bot DJ' or 'DJ Help'
    const hasBotMessages = (Object.values(state.groups) as Group[]).some(g => 
      g.messages.some(m => m.user === 'Bot DJ' || m.user === 'DJ Help' || m.user === 'Simulateur DJ (Faux)')
    );

    // Ensure DJ Bot SMS exists in Firestore
    const setupDJBot = async () => {
      const botRef = doc(db, 'private_messages', helpGroupId);
      const botSnap = await getDoc(botRef);
      if (!botSnap.exists()) {
        await setDoc(botRef, {
          id: helpGroupId,
          members: [state.currentUser, 'dj-bot'],
          type: 'sms',
          lastActivity: new Date().toISOString()
        });
        
        // Initial message
        await addDoc(collection(db, 'private_messages', helpGroupId, 'messages'), {
          text: "Salut ! Je suis DJ Bot. Je suis là pour t'aider à utiliser DJ Messenger. Pose-moi tes questions !",
          user: 'dj-bot',
          senderId: 'dj-bot',
          senderName: 'DJ Bot',
          timestamp: new Date().toISOString(),
          isSystem: false
        });
      }
    };

    setupDJBot();

    if (hasBotMessages) {
      updateState((prev: AppState) => {
        const newGroups = { ...prev.groups };
        const newUsers = { ...prev.users };
      
        // 0. Ensure DJ Bot user exists
        if (!newUsers['dj-bot']) {
          newUsers['dj-bot'] = {
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
        
        // 2. Remove all messages from 'Bot DJ', 'DJ Help' or 'Simulateur DJ (Faux)' in all groups
        Object.keys(newGroups).forEach(id => {
          newGroups[id] = {
            ...newGroups[id],
            messages: newGroups[id].messages.filter(m => m.user !== 'Bot DJ' && m.user !== 'DJ Help' && m.user !== 'Simulateur DJ (Faux)')
          };
        });

        return { ...prev, groups: newGroups, users: newUsers };
      });
    }
  }, [state.currentUser]);

    // DJ Bot: Auto-tips every 20 minutes and Response logic
    useEffect(() => {
      if (!state.currentUser || state.currentUser === 'test') return;
      
      const helpGroupId = `sms_dj_bot_${state.currentUser}`;
    
    const tips = [
      "Astuce : Les groupes publics sont accessibles à tous, mais les groupes privés nécessitent un code d'invitation ou une invitation directe.",
      "Astuce : Vous pouvez désormais créer des groupes en 4 étapes avec une barre de progression pour mieux définir l'utilité du groupe.",
      "Astuce : L'onglet SMS est réservé aux discussions privées en tête-à-tête avec vos amis.",
      "Astuce : Dans les paramètres, vous pouvez changer la couleur de l'application pour qu'elle corresponde à votre style DJ.",
      "Astuce : Les administrateurs de groupes privés peuvent bannir des membres ou supprimer des messages inappropriés.",
      "Astuce : Si vous êtes en mode test, vous pouvez lire les messages des groupes publics mais pas y participer.",
      "Astuce : Dans les discussions publiques, vous pouvez voir qui a envoyé un message et même bannir des utilisateurs si vous êtes admin.",
      "Astuce : Votre profil vous permet de changer votre avatar et votre mot de passe à tout moment.",
      "Astuce : Consultez l'onglet 'Mises à jour' pour découvrir les dernières nouveautés de DJ Messenger.",
      "Astuce : Si un utilisateur est supprimé, vous pouvez choisir de supprimer tous ses messages passés pour nettoyer la discussion.",
      "Astuce : Pour devenir administrateur, utilisez le code 'Dj2024in' dans la section Compte des paramètres.",
      "Astuce : Les groupes privés sont protégés par un code de 5 caractères que seul le créateur connaît au départ.",
      "Astuce : L'onglet 'Récents' dans les discussions vous montre les derniers messages de tous vos groupes en un coup d'œil.",
      "Astuce : Vous pouvez proposer jusqu'à 3 idées par jour dans la DJ Society si vous n'êtes pas admin."
    ];

    const sendTip = async () => {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      const newMsg = {
        user: 'dj-bot',
        text: randomTip,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        senderId: 'dj-bot',
        senderName: 'DJ Bot'
      };
      
      try {
        const msgRef = collection(db, 'private_messages', helpGroupId, 'messages');
        await addDoc(msgRef, newMsg);
      } catch (e) {
        console.error("Error sending bot tip:", e);
      }
    };

    // Send a tip every 20 minutes
    const interval = setInterval(sendTip, 20 * 60 * 1000);
    
    // Response logic: Check for new user messages in DJ Bot group
    const helpGroup = state.privateMessages[helpGroupId];
    const currentUserData = state.users[state.currentUser as string];

    if (helpGroup && helpGroup.messages) {
      const lastMsg = helpGroup.messages[helpGroup.messages.length - 1];
      if (lastMsg && lastMsg.user === state.currentUser && !lastMsg.isSystem) {
        // User just sent a message, respond after 1 second
        const timer = setTimeout(async () => {
          const today = new Date().toLocaleDateString();
          const questionsToday = currentUserData?.lastBotQuestionDate === today ? (currentUserData?.botQuestionsToday || 0) : 0;

          if (questionsToday >= 5) {
            const response = "Désolé, vous avez atteint votre limite de 5 questions pour aujourd'hui. Revenez demain pour plus de conseils !";
            const botResponse = {
              user: 'dj-bot',
              text: response,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date().toISOString(),
              senderId: 'dj-bot',
              senderName: 'DJ Bot'
            };
            try {
              const msgRef = collection(db, 'private_messages', helpGroupId, 'messages');
              await addDoc(msgRef, botResponse);
            } catch (e) {
              console.error("Error sending bot limit message:", e);
            }
            return;
          }

          let response = "Je ne suis pas sûr de comprendre, mais je peux vous aider sur les groupes, les amis, la DJ Society ou les paramètres !";
          const text = lastMsg.text.toLowerCase();
          
          if (text.includes('bonjour') || text.includes('salut') || text.includes('coucou') || text.includes('hello')) {
            response = "Bonjour ! Je suis DJ Bot, votre assistant personnel. Comment puis-je vous aider aujourd'hui ? Je peux vous expliquer comment créer des groupes, ajouter des amis ou utiliser les fonctionnalités avancées.";
          } else if (text.includes('groupe')) {
            response = "Les groupes sont essentiels ! \n1. Publics : Tout le monde peut les voir et les rejoindre.\n2. Privés : Nécessitent un code de 5-7 caractères.\n3. SMS : Discussions privées 1-à-1.\nPour créer un groupe, cliquez sur '+' dans Discussions. Vous suivrez un assistant en 4 étapes : Nom, Raison, Invitations et Code secret.";
          } else if (text.includes('ami')) {
            response = "Pour ajouter un ami :\n1. Allez dans l'onglet 'Amis'.\n2. Recherchez son pseudo.\n3. Cliquez sur 'Ajouter'.\nUne fois accepté, vous pourrez lui envoyer des SMS privés.";
          } else if (text.includes('paramètre') || text.includes('couleur') || text.includes('style')) {
            response = "Personnalisez votre expérience dans 'Paramètres' :\n- Changez la couleur de fond.\n- Modifiez votre mot de passe.\n- Devenez Admin avec le code secret.\n- Activez le mode sombre ou clair.";
          } else if (text.includes('society') || text.includes('idée') || text.includes('proposer')) {
            response = "La DJ Society est l'endroit où vous proposez des améliorations. Les admins examinent vos idées et peuvent les valider. Vous avez droit à 3 propositions par jour.";
          } else if (text.includes('test')) {
            response = "En mode test, vous êtes un spectateur. Vous pouvez voir les groupes publics, mais pour envoyer des messages, créer des groupes ou avoir des amis, vous devez créer un compte réel. C'est gratuit et rapide !";
          } else if (text.includes('code')) {
            response = "Les codes de groupe (5-7 caractères) sécurisent vos discussions privées. Vous les définissez à la création. Pour rejoindre un groupe, saisissez le code dans l'onglet 'Privés'.";
          } else if (text.includes('sms') || text.includes('message') || text.includes('privé')) {
            response = "Les SMS sont vos discussions secrètes. Vous pouvez y envoyer du texte, des images, des vidéos et des stickers. Recherchez un ami pour commencer !";
          } else if (text.includes('fichier') || text.includes('image') || text.includes('vidéo') || text.includes('photo') || text.includes('partage')) {
            response = "Le partage de fichiers est simple : cliquez sur le trombone (📎). Vous pouvez envoyer des photos et vidéos jusqu'à 200 Mo. Les fichiers sont stockés de manière sécurisée et accessibles par tous les membres du groupe.";
          } else if (text.includes('admin')) {
            response = "Les Admins gèrent l'application. Il y a 3 niveaux : Admin simple, Super Admin (temporaire) et Grand Admin. Ils peuvent supprimer des messages, bannir des utilisateurs et gérer les comptes.";
          } else if (text.includes('merci')) {
            response = "Avec plaisir ! Je suis là pour ça. Une autre question ?";
          } else if (text.includes('aide') || text.includes('help') || text.includes('comment')) {
            response = "Je peux vous aider sur tout ! Posez-moi une question précise sur : les groupes, les SMS, les fichiers, les amis ou les paramètres.";
          }

          const botResponse = {
            user: 'dj-bot',
            text: response,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
            senderId: 'dj-bot',
            senderName: 'DJ Bot'
          };

          try {
            const msgRef = collection(db, 'private_messages', helpGroupId, 'messages');
            await addDoc(msgRef, botResponse);
            
            const userRef = doc(db, 'users', state.currentUser as string);
            await updateDoc(userRef, {
              botQuestionsToday: questionsToday + 1,
              lastBotQuestionDate: today
            });
          } catch (e) {
            console.error("Error sending bot response:", e);
          }
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
    { id: 'profile', label: 'Mon Profil', icon: UserIcon },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'friends', label: 'Amis', icon: Users },
    { id: 'djsociety', label: 'DJ Society', icon: Lightbulb },
    { id: 'staff', label: 'Staff', icon: Shield },
    { id: 'updates', label: 'Mises à jour', icon: Bell },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
    { id: 'tutorial', label: 'Tutoriel', icon: HelpCircle },
  ];

  if (user?.isAdmin) {
    navItems.splice(4, 0, { id: 'admin_users', label: 'Utilisateurs', icon: Shield });
  }

  const renderView = () => {
    switch (view) {
      case 'home': return <Home state={state} setView={setViewAndCloseMenu} updateState={updateState} startSimulation={startSimulation} />;
      case 'discussions': return <Discussions state={state} updateState={updateState} />;
      case 'friends': return <Friends state={state} updateState={updateState} setView={setViewAndCloseMenu} />;
      case 'admin_users': return <AdminUsers state={state} updateState={updateState} />;
      case 'staff': return <Staff state={state} updateState={updateState} />;
      case 'djsociety': return <DJSociety state={state} updateState={updateState} />;
      case 'updates': return <UpdatesView state={state} />;
      case 'settings': return <Settings state={state} updateState={updateState} handleLogout={handleLogout} />;
      case 'profile': return <Profile state={state} updateState={updateState} />;
      default: return <Home state={state} setView={setViewAndCloseMenu} updateState={updateState} startSimulation={startSimulation} />;
    }
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
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 dark:bg-gray-900 dark:text-white ${state.darkMode ? 'bg-gray-900 text-white' : ''}`} style={!state.darkMode ? { backgroundColor: 'var(--bg-color, #f0f2f5)' } : undefined}>
      {/* Sidebar / Hamburger Menu */}
      <aside className={`fixed inset-y-0 left-0 lg:relative z-[9999] ${state.darkMode ? 'bg-black/95 border-r border-white/10' : 'bg-black shadow-[15px_0_40px_rgba(0,0,0,0.5)]'} text-white flex flex-col transition-all duration-300 ease-in-out h-full overflow-hidden shrink-0 ${state.menuOpen ? 'w-full lg:w-72' : 'w-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5 shrink-0 min-w-[100vw] lg:min-w-max">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-1.5 bg-white">
              <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full" />
            </div>
            <span className={`font-black text-xl tracking-tighter uppercase ${djStyleText}`}>Messenger</span>
          </div>
          <button onClick={toggleMenu} className="p-2 hover:bg-white/10 rounded-xl transition">
            <Menu size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <button 
            onClick={() => handleNavClick('profile')}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#00CED1] transition-all shadow-lg">
              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-gray-400" />}
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
      <main className={`flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300 ${state.menuOpen ? 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : 'opacity-100'}`}>
        <header className="p-4 bg-white border-b flex items-center shadow-sm sticky top-0 z-[1000] shrink-0">
          <button onClick={toggleMenu} className="p-2 hover:bg-gray-100 rounded-xl transition mr-2 relative z-[10001]">
            <Menu size={24} className="text-gray-600" />
          </button>
          <h1 className={`ml-2 font-black uppercase tracking-tighter text-xl ${djStyleText}`}>
            {navItems.find(i => i.id === view)?.label || 'DJ Messenger'}
          </h1>
        </header>
        
        <div className="flex-1 relative overflow-y-auto w-full">
          {renderView()}
        </div>
      </main>

      {state.selectedUserModal && (
        <UserProfileModal 
          userId={state.selectedUserModal} 
          state={state} 
          updateState={updateState} 
          onClose={() => updateState({ selectedUserModal: null })}
          setView={setView}
        />
      )}
      
      <PWAUpdateModal show={showUpdateModal} onUpdate={handleUpdate} />
    </div>
  );
}
