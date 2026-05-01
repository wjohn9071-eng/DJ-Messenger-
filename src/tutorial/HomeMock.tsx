import React, { useState } from 'react';
import { djStyleText, djStyleBg, DJ_LOGO_SVG } from '../lib/utils';
import { AppState } from '../types';
import { Pin, ChevronDown, ChevronUp, Bell, Info } from 'lucide-react';
import { APP_UPDATES } from '../constants';

export function HomeMock({ state, setView, updateState, onComplete }: { state: AppState, setView: (v: string) => void, updateState: any, onComplete: () => void }) {
  const currentVersion = APP_UPDATES[0]?.version || '3.0.0';
  const username = state.users[state.currentUser as string]?.name || 'Acteur';
  const [showUpdateNotice, setShowUpdateNotice] = useState(true);
  const [showMobilePinned, setShowMobilePinned] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bonjour";
    if (hour >= 12 && hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const tips = [
    "Astuce : Tu peux épingler tes groupes préférés pour les retrouver plus vite !",
    "Simulation : Dans le vrai monde, tes messages sont chiffrés et sécurisés.",
    "Astuce : Propose tes idées dans la DJ Society, les admins t'écoutent !",
    "Démo : Le DJ Bot répond intelligemment à tes questions techniques."
  ];
  
  const tipIndex = Math.floor(Date.now() / (10 * 60 * 1000)) % tips.length;
  const currentTip = tips[tipIndex];

  const pinnedDiscussions = Object.values(state.groups).slice(0, 2).map((g: any) => ({
    id: g.id,
    name: g.name,
    avatar: g.avatar || '',
    isSMS: g.isSMS,
    isPublic: g.type === 'public',
    unreadCount: 0
  }));

  const handleOpenPinned = (id: string) => {
    setView('discussions');
  };

  const renderPinnedList = () => (
    <div className="space-y-4 mt-4">
      {pinnedDiscussions.map((grp) => (
        <button
          key={`pinned-${grp.id}`}
          onClick={() => handleOpenPinned(grp.id)}
          className={`w-full flex items-center justify-between p-4 rounded-[1.75rem] shadow-sm border transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95 text-left group bg-white border-zinc-100 hover:border-blue-200 dark:bg-zinc-900/80 dark:border-white/10`}
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-zinc-100 flex items-center justify-center text-white font-bold shadow-inner overflow-hidden border border-black/5">
              {grp.avatar ? (
                <img src={grp.avatar} alt={grp.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-lg ${djStyleBg}`}>
                  {(grp.name || '?')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className={`font-black truncate text-xs uppercase tracking-tighter mb-0.5 dark:text-white`}>{grp.name}</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${grp.isSMS ? 'bg-green-500' : (grp.isPublic ? 'bg-[#0D98BA]' : 'bg-purple-500')}`} />
                <p className={`text-[9px] font-black uppercase tracking-widest opacity-60 dark:text-white`}>
                  {grp.isSMS ? 'Privé' : (grp.isPublic ? 'Public' : 'Simulation')}
                </p>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div className={`min-h-full p-6 animate-in fade-in duration-500 overflow-y-auto backdrop-blur-sm h-full flex flex-col ${state.darkMode ? 'bg-black/50 text-white' : 'bg-white/50 text-gray-800'}`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center w-full max-w-6xl mx-auto gap-8 flex-1">
        
        {/* Pinned Discussions - Mockup Left */}
        <div className="hidden lg:block w-80 shrink-0 sticky top-8">
          <div className={`p-5 rounded-3xl shadow-xl border ${state.darkMode ? 'bg-black/60 border-white/10' : 'bg-white/80 border-gray-100'}`}>
            <h2 className="flex items-center gap-2 text-lg font-black uppercase tracking-tighter mb-2">
              <Pin size={18} className="text-[#0D98BA]" />
              Discussions Épinglées
            </h2>
            {renderPinnedList()}
          </div>
        </div>

        {/* Main Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto py-8 text-center h-full">
          <div className={`w-40 h-40 md:w-48 md:h-48 mb-6 flex-shrink-0 flex items-center justify-center shadow-2xl rounded-[2.5rem] overflow-hidden p-6 border ${state.darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-100'}`}>
            <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">
            {getGreeting()} !
          </h1>

          <p className={`text-2xl font-bold mb-8 w-full ${djStyleText}`}>
            Mode Simulation Tutoriel
          </p>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl mb-8 flex items-start gap-3 text-left">
            <Info className="text-yellow-600 shrink-0" size={20} />
            <p className="text-xs font-bold text-yellow-800 uppercase tracking-tight leading-relaxed">
              Tu es actuellement dans le tutoriel. Rien de ce que tu fais ici n'est sauvegardé sur ton profil réel.
            </p>
          </div>

          <div className="bg-zinc-900 justify-center text-white p-8 rounded-[2.5rem] shadow-2xl w-full mb-8 text-left relative animate-in zoom-in-95 duration-300 border border-zinc-800">
              <h3 className="text-xl font-black uppercase tracking-tighter text-[#0D98BA] mb-2">Bienvenue & Découverte</h3>
              <p className="text-sm text-zinc-300 font-medium mb-6 leading-relaxed">
                Tu te trouves dans l'espace de simulation pour découvrir rapidement les fonctionnalités principales de DJ Messenger.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setView('discussions')}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs text-white shadow-lg transition-all active:scale-95 ${djStyleBg}`}
                >
                  Voir Discussions
                </button>
              </div>
          </div>

          {showUpdateNotice && (
            <div className="bg-blue-50/80 backdrop-blur-md p-6 rounded-3xl shadow-md border border-blue-100 w-full mb-8 text-left relative animate-in zoom-in-95 duration-300">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#0D98BA] mb-3">Mise à jour v{currentVersion} - Simulation</h3>
              <p className="text-sm text-gray-700 font-medium mb-6">
                Le tutoriel a été mis à jour pour refléter la v3.0 stable. Découvre le nouveau design !
              </p>
              <button 
                onClick={() => setShowUpdateNotice(false)}
                className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs text-white shadow-lg transition-all active:scale-95 ${djStyleBg}`}
              >
                C'est compris !
              </button>
            </div>
          )}

          <div className="lg:hidden w-full mb-8 text-left">
            <button
              onClick={() => setShowMobilePinned(!showMobilePinned)}
              className={`w-full flex items-center justify-between p-4 rounded-3xl shadow-sm border transition-colors ${state.darkMode ? 'bg-zinc-800 border-white/20' : 'bg-white border-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Pin size={18} className="text-[#0D98BA]" />
                <span className="font-black uppercase tracking-widest text-sm">Discussions Épinglées</span>
              </div>
              {showMobilePinned ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showMobilePinned && (
              <div className="mt-3 p-4 rounded-3xl shadow-inner border border-zinc-100 bg-gray-50/50 animate-in slide-in-from-top-4">
                {renderPinnedList()}
              </div>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-gray-100 w-full mb-8">
            <p className="text-sm font-semibold text-gray-600 italic">💡 {currentTip}</p>
          </div>


        </div>

        <div className="hidden lg:block w-80 shrink-0 select-none pointer-events-none" />
      </div>

      <div className="mt-auto pb-6 w-full flex justify-center shrink-0">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] md:text-xs font-black tracking-[0.2em] uppercase flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <span className="text-gray-400">Simulation par la</span>
            <span className={djStyleText}>DJ Society</span>
            <span className="text-gray-300 font-light">|</span>
            <span className={djStyleText}>DJ MESSENGER</span>
            <span className="text-gray-300 font-light">|</span>
            <span className={djStyleText}>v3.0.0 TUTO</span>
          </p>
        </div>
      </div>
    </div>
  );
}
