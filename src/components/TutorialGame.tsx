import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, Group, Message } from '../types';
import { djStyleText, djStyleBg, DJ_LOGO_SVG } from '../lib/utils';
import Home from './Home';
import { Discussions } from './Discussions';
import { Profile, Friends, DJSociety, Updates, Settings } from './Views';
import { 
  MessageSquare, 
  User, 
  Users, 
  Zap, 
  Settings as SettingsIcon, 
  RefreshCw, 
  Home as HomeIcon,
  ChevronRight,
  Play,
  Bot
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  view: string;
  targetElement?: string;
  action?: (updateState: any) => void;
  requiredAction?: 'click_discussions' | 'send_message' | 'add_friend' | 'submit_proposal' | 'change_color';
}

export function TutorialGame({ 
  state, 
  updateState, 
  onComplete 
}: { 
  state: AppState, 
  updateState: (s: any) => void, 
  onComplete: () => void 
}) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'outro'>('intro');
  const [stepIndex, setStepIndex] = useState(0);
  const [currentView, setCurrentView] = useState('home');
  const [showBotMessage, setShowBotMessage] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);

  const steps: TutorialStep[] = [
    { 
      id: 'welcome',
      title: "Bienvenue dans l'Aventure !", 
      description: "Salut ! Je suis ton assistant DJ. Je vais te montrer comment utiliser cette application incroyable. On commence par l'accueil !", 
      view: 'home' 
    },
    { 
      id: 'home_info',
      title: "Ton Tableau de Bord", 
      description: "Ici, tu retrouves tes notifications, des conseils et les dernières nouvelles. Clique sur le bouton de notification pour voir les messages récents !", 
      view: 'home',
      requiredAction: 'click_discussions'
    },
    { 
      id: 'discussions_intro',
      title: "Le Cœur de l'App : Discussions", 
      description: "C'est ici que tout se passe ! Regarde, je t'envoie un message. Réponds-moi pour continuer !", 
      view: 'discussions',
      requiredAction: 'send_message',
      action: (updateState) => {
        const botMsg: Message = {
          id: 'bot-msg-1',
          user: 'Bot DJ',
          text: "Salut ! Bienvenue dans la simulation. Je t'ai invité dans le groupe 'DJ Crew' !",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const simulatedGroup: Group = {
          id: 'simulated-group',
          name: 'DJ Crew',
          type: 'public',
          creator: 'Bot DJ',
          admins: ['Bot DJ'],
          members: [state.currentUser as string, 'Bot DJ'],
          banned: [],
          muted: [],
          messages: [
            { id: '0', user: 'Système', text: "Bienvenue dans le groupe DJ Crew !", time: '10:00', isSystem: true },
            botMsg
          ]
        };
        updateState((prev: AppState) => ({
          ...prev,
          groups: { ...prev.groups, 'simulated-group': simulatedGroup },
          newMessages: [...(prev.newMessages || []), 'simulated-group'],
          discussionTab: 'recent'
        }));
        setShowBotMessage(true);
      }
    },
    { 
      id: 'djsociety_info',
      title: "DJ Society : Ta Voix Compte", 
      description: "Ici, tu peux proposer tes idées. Essaie d'envoyer une proposition pour voir !", 
      view: 'djsociety',
      requiredAction: 'submit_proposal'
    },
    { 
      id: 'friends_info',
      title: "Ta Communauté", 
      description: "Recherche d'autres utilisateurs et ajoute-les en amis. Essaie d'ajouter un ami fictif !", 
      view: 'friends',
      requiredAction: 'add_friend'
    },
    { 
      id: 'settings_info',
      title: "Personnalisation", 
      description: "Change la couleur de l'app pour qu'elle te ressemble. Essaie de changer la couleur !", 
      view: 'settings',
      requiredAction: 'change_color'
    },
    { 
      id: 'conclusion',
      title: "Prêt à te lancer ?", 
      description: "Tu connais maintenant les bases. Pour sauvegarder tes données et participer pleinement, crée ton compte maintenant !", 
      view: 'home' 
    }
  ];

  const currentStep = steps[stepIndex];

  useEffect(() => {
    if (gameState === 'playing') {
      setCurrentView(currentStep.view);
      if (currentStep.action) currentStep.action(updateState);
      setActionCompleted(!currentStep.requiredAction);
    }
  }, [stepIndex, gameState]);

  // Monitor state changes to detect required actions
  useEffect(() => {
    if (gameState !== 'playing' || !currentStep.requiredAction) return;

    if (currentStep.requiredAction === 'click_discussions' && currentView === 'discussions') {
      setActionCompleted(true);
    }
    if (currentStep.requiredAction === 'send_message') {
      const group = state.groups['simulated-group'];
      if (group && group.messages.length > 2) {
        setActionCompleted(true);
      }
    }
    if (currentStep.requiredAction === 'submit_proposal') {
      if (state.proposals.length > 1) {
        setActionCompleted(true);
      }
    }
    if (currentStep.requiredAction === 'add_friend') {
      const user = state.users[state.currentUser as string];
      if (user && user.friends.length > 0) {
        setActionCompleted(true);
      }
    }
    if (currentStep.requiredAction === 'change_color') {
      const user = state.users[state.currentUser as string];
      if (user && user.bgColor && user.bgColor !== '#f0f2f5') {
        setActionCompleted(true);
      }
    }
  }, [state, currentView, currentStep, gameState]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
      setShowBotMessage(false);
    } else {
      setGameState('outro');
    }
  };

  const renderSimulatedView = () => {
    const simulatedState = { ...state, currentUser: state.currentUser || 'test' };
    switch (currentView) {
      case 'home': return <Home state={simulatedState} setView={setCurrentView} updateState={updateState} />;
      case 'discussions': return <Discussions state={simulatedState} updateState={updateState} />;
      case 'profile': return <Profile state={simulatedState} updateState={updateState} />;
      case 'friends': return <Friends state={simulatedState} updateState={updateState} />;
      case 'djsociety': return <DJSociety state={simulatedState} updateState={updateState} />;
      case 'updates': return <Updates />;
      case 'settings': return <Settings state={simulatedState} updateState={updateState} handleLogout={() => {}} />;
      default: return <Home state={simulatedState} setView={setCurrentView} updateState={updateState} />;
    }
  };

  if (gameState === 'intro') {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(0,127,255,0.3)] mb-8 p-4"
        >
          <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full" />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-black text-white uppercase tracking-tighter mb-4"
        >
          DJ Messenger <span className={djStyleText}>Simulation</span>
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 max-w-md mb-12"
        >
          Découvre l'application à travers un jeu interactif. Apprends à maîtriser toutes les fonctionnalités comme un pro !
        </motion.p>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 0.7 }}
            onClick={() => setGameState('playing')}
            className={`w-full py-5 rounded-[2rem] font-black text-xl text-white shadow-2xl flex items-center justify-center gap-3 ${djStyleBg}`}
          >
            <Play fill="currentColor" /> COMMENCER LE TUTORIEL
          </motion.button>

          {(state.currentUser && state.currentUser !== 'test' || state.users[state.currentUser as string]?.tutorialCompleted) && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ delay: 0.8 }}
              onClick={onComplete}
              className="w-full py-4 rounded-[2rem] font-bold text-white/70 hover:text-white border border-white/20 transition-all"
            >
              ANNULER ET REVENIR
            </motion.button>
          )}
        </div>
        
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-20 -left-20 w-64 h-64 bg-[#007FFF] rounded-full blur-[100px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              rotate: [0, -90, 0],
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#32CD32] rounded-full blur-[100px]"
          />
        </div>
      </div>
    );
  }

  if (gameState === 'outro') {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-8 shadow-[0_0_30px_rgba(34,197,94,0.5)]"
        >
          <Zap size={48} fill="currentColor" />
        </motion.div>
        
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Félicitations !</h2>
        <p className="text-gray-400 max-w-md mb-12">
          Tu as terminé le tutoriel. Tu es maintenant prêt à rejoindre la communauté DJ Messenger. Crée ton compte pour commencer ton aventure !
        </p>
        
        <button
          onClick={onComplete}
          className={`px-12 py-5 rounded-[2rem] font-black text-xl text-white shadow-2xl ${djStyleBg}`}
        >
          CRÉER MON COMPTE
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-gray-100 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Simulation */}
      <aside className="w-full md:w-24 bg-black/90 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/10 flex md:flex-col items-center justify-between p-4 md:py-8 z-20">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg overflow-hidden">
          <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full" />
        </div>
        
        <nav className="flex md:flex-col gap-4 md:gap-6">
          <div className={`p-3 rounded-2xl transition-all ${currentView === 'home' ? 'bg-white/10 text-white' : 'text-white/40'}`}><HomeIcon size={24} /></div>
          <div className={`p-3 rounded-2xl transition-all ${currentView === 'discussions' ? 'bg-white/10 text-white' : 'text-white/40'}`}><MessageSquare size={24} /></div>
          <div className={`p-3 rounded-2xl transition-all ${currentView === 'djsociety' ? 'bg-white/10 text-white' : 'text-white/40'}`}><Zap size={24} /></div>
          <div className={`p-3 rounded-2xl transition-all ${currentView === 'friends' ? 'bg-white/10 text-white' : 'text-white/40'}`}><Users size={24} /></div>
        </nav>
        
        <div className="hidden md:flex flex-col gap-6">
          <div className={`p-3 rounded-2xl transition-all ${currentView === 'profile' ? 'bg-white/10 text-white' : 'text-white/40'}`}><User size={24} /></div>
          <div className={`p-3 rounded-2xl transition-all ${currentView === 'settings' ? 'bg-white/10 text-white' : 'text-white/40'}`}><SettingsIcon size={24} /></div>
        </div>
      </aside>

      {/* Main Content Simulation */}
      <main className="flex-1 relative overflow-hidden bg-white">
        <div className="h-full overflow-y-auto">
          {renderSimulatedView()}
        </div>

        {/* Tutorial Overlay Layer */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={stepIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50"
          >
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${djStyleBg}`}>
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 uppercase tracking-tight">{currentStep.title}</h3>
                  <div className="flex gap-1">
                    {steps.map((_, i) => (
                      <div key={i} className={`h-1 rounded-full transition-all ${i === stepIndex ? `w-4 ${djStyleBg}` : 'w-1 bg-gray-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {currentStep.description}
              </p>
              
              <button 
                onClick={handleNext}
                disabled={!actionCompleted}
                className={`w-full py-4 rounded-2xl font-black text-white shadow-lg flex items-center justify-center gap-2 group transition-all ${actionCompleted ? djStyleBg : 'bg-gray-400 cursor-not-allowed opacity-50'}`}
              >
                {stepIndex === steps.length - 1 ? "TERMINER LA SIMULATION" : actionCompleted ? "CONTINUER" : "ACTION REQUISE"}
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bot Message Simulation Popup */}
        <AnimatePresence>
          {showBotMessage && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute top-4 right-4 z-[60] bg-white p-4 rounded-2xl shadow-xl border border-blue-100 max-w-[250px]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">B</div>
                <span className="font-bold text-sm text-gray-800">Bot DJ</span>
              </div>
              <p className="text-xs text-gray-600">Salut ! Je viens de t'inviter dans le groupe DJ Crew. Va voir dans Discussions !</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
