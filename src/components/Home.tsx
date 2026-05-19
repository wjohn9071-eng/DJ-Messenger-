import React from 'react';
import { djStyleText, djStyleBg, DJ_LOGO_SVG } from '../lib/utils';
import { AppState } from '../types';
import { APP_UPDATES } from '../constants';
import { Pin, ChevronDown, ChevronUp, Lightbulb, Bell, Pencil, Users, Shield, Key, ImagePlus } from 'lucide-react';
import Markdown from 'react-markdown';

export default function Home({ state, setView, updateState, startSimulation }: { state: AppState, setView: (v: string, p?: boolean) => void, updateState: any, startSimulation: () => void }) {
  const currentVersion = APP_UPDATES[0]?.version || '3.0.0';
  const isTest = state.currentUser === 'test';
  const currentUserData = !isTest && state.currentUser ? (state.currentUserData || state.users[state.currentUser as string]) : null;
  const isPrivileged = currentUserData?.isAdmin || currentUserData?.isGrandAdmin || currentUserData?.isSuperAdmin;

  const [showUpdateNotice, setShowUpdateNotice] = React.useState(false);
  const [showHomeUpdateDetails, setShowHomeUpdateDetails] = React.useState(false);

  React.useEffect(() => {
    const dismissed = localStorage.getItem(`update_notice_dismissed_${currentVersion}`);
    if (dismissed !== 'true') {
      setShowUpdateNotice(true);
    }
  }, [currentVersion]);
  
  const sensitiveRegex = /([^.!?]*(?:Admin|Staff|Super Admin|Sous-Admin|Staff-Help|Dj2024in|DJ_MASTER_2026|DJ24026IN|staff|admin|révoqué|accorder|droit|power|pouvoir|suppression définitive|visualisation des mots de passe|Visualisation|modération|sécurité)[^.!?]*[.!?])/gi;

  // Filter description for Home Notice
  const filteredDesc = isPrivileged 
    ? (APP_UPDATES[0]?.desc || "")
    : ((APP_UPDATES[0]?.desc || "").replace(sensitiveRegex, '').split('\n').filter(line => line.trim()).join('\n').trim() || APP_UPDATES[0]?.desc || "");

  const filteredManual = isPrivileged
    ? (APP_UPDATES[0]?.manual || "")
    : ((APP_UPDATES[0]?.manual || "").replace(sensitiveRegex, '').split('\n').filter(line => line.trim()).join('\n').trim() || "");

  const username = isTest ? 'Anonyme' : (currentUserData?.name || state.currentUser);
  const isNewUser = !isTest && currentUserData && currentUserData.friends?.length === 0;
  
  const [showMobilePinned, setShowMobilePinned] = React.useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bonjour";
    if (hour >= 12 && hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const welcomeMessage = isTest 
    ? `Bienvenue ${username}` 
    : isNewUser 
      ? `Bienvenue ${username}` 
      : `Content de te revoir, ${username}`;

  const tips = [
    { text: "Tu peux épingler tes groupes préférés pour les retrouver plus vite !", icon: <Pin size={14} className="text-[#0D98BA]" /> },
    { text: "Active les notifications dans les paramètres pour ne rater aucun message.", icon: <Bell size={14} className="text-orange-500" /> },
    { text: "Propose tes idées dans la DJ Society, les admins t'écoutent !", icon: <Lightbulb size={14} className="text-yellow-500" /> },
    { text: "Personnalise la couleur de l'application dans tes paramètres.", icon: <Pencil size={14} className="text-purple-500" /> },
    { text: "Ajoute des amis pour discuter avec eux plus facilement.", icon: <Users size={14} className="text-green-500" /> },
    { text: "Le mode test te permet de découvrir l'app sans créer de compte.", icon: <Shield size={14} className="text-blue-500" /> },
    { text: "Les groupes privés nécessitent un code d'invitation sécurisé.", icon: <Key size={14} className="text-red-500" /> },
    { text: "Tu peux changer ton avatar à tout moment dans ton profil.", icon: <ImagePlus size={14} className="text-pink-500" /> }
  ];
  
  const [tipIndex, setTipIndex] = React.useState(Math.floor(Date.now() / (15 * 60 * 1000)) % tips.length);
  React.useEffect(() => {
    const intv = setInterval(() => {
      setTipIndex(Math.floor(Date.now() / (15 * 60 * 1000)) % tips.length);
    }, 60 * 1000);
    return () => clearInterval(intv);
  }, [tips.length]);
  
  const currentTip = tips[tipIndex];

  const handleNotificationClick = () => {
    updateState({ 
      discussionTab: 'recent'
    });
    setView('discussions');
  };

  const unreadIds = state.newMessages?.filter(id => !id.includes('dj-bot') && id !== 'sim-group') || [];
  let latestUnreadExtract = "";
  if (unreadIds.length > 0) {
    const firstUnreadId = unreadIds[0];
    const group = state.groups?.[firstUnreadId];
    const privateChat = state.privateMessages?.[firstUnreadId];
    const messages = group?.messages || privateChat?.messages || [];
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const sourceName = group ? group.name : (state.users?.[lastMsg.user]?.name || 'Quelqu\'un');
      const msgText = lastMsg.text ? lastMsg.text : (lastMsg.files?.length ? 'Fichier(s) reçu(s)' : 'Nouveau message');
      latestUnreadExtract = `Nouveau message de ${sourceName} : "${msgText.length > 30 ? msgText.substring(0, 30) + '...' : msgText}"`;
    }
  }

  const pinnedIds = currentUserData?.pinnedGroups || [];
  const pinnedDiscussions = pinnedIds.map((id: string) => {
    const isSMS = id.includes('_') && !id.startsWith('simulated-') && !id.startsWith('sim-');
    const group = isSMS ? state.privateMessages?.[id] : state.groups?.[id];
    let name = "Groupe inconnu";
    let avatar = "";
    let isPublic = false;
    let unreadCount = state.newMessages?.filter((msgId: string) => msgId === id).length || 0;

    if (isSMS) {
      const otherUser = id.split('_').find(p => p !== state.currentUser && p !== 'sms') || 'dj-bot';
      const otherUserData = state.users[otherUser];
      name = otherUser === 'dj-bot' ? 'DJ Bot' : (otherUserData?.name || otherUser);
      avatar = otherUserData?.avatar || '';
    } else {
      if (!group) return null;
      name = group.name;
      avatar = group.avatar || '';
      isPublic = group.type === 'public';
    }

    return { id, name, avatar, isSMS, isPublic, unreadCount };
  }).filter(Boolean) as Array<{id: string, name: string, avatar: string, isSMS: boolean, isPublic: boolean, unreadCount: number}>;

  const handleOpenPinned = (id: string, isSMS: boolean, isPublic: boolean) => {
    updateState({ 
      activeGroup: id,
      discussionTab: isSMS ? 'sms' : (isPublic ? 'public' : 'private')
    });
    setView('discussions', true);
  };

  const renderPinnedList = () => (
    <div className="space-y-4 mt-4">
      {pinnedDiscussions.length === 0 ? (
        <div className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-3 ${state.darkMode ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
          <Pin className="text-zinc-300" size={32} />
          <p className={`text-xs font-medium italic ${state.darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Épingle tes discussions favorites pour les voir ici !</p>
        </div>
      ) : (
        pinnedDiscussions.map((grp) => (
          <button
            key={`pinned-${grp.id}`}
            onClick={() => handleOpenPinned(grp.id, grp.isSMS, grp.isPublic)}
            className={`w-full flex items-center justify-between p-4 rounded-[1.75rem] shadow-sm border transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95 text-left group ${state.darkMode ? 'bg-zinc-900/80 border-white/10 hover:border-[#0D98BA]/50' : 'bg-white border-zinc-100 hover:border-blue-200'}`}
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
                <p className={`font-black truncate text-xs uppercase tracking-tighter mb-0.5 ${state.darkMode ? 'text-white' : 'text-zinc-800'}`}>{grp.name}</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${grp.isSMS ? 'bg-green-500' : (grp.isPublic ? 'bg-[#0D98BA]' : 'bg-purple-500')}`} />
                  <p className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${state.darkMode ? 'text-white' : 'text-zinc-600'}`}>
                    {grp.isSMS ? 'Privé' : (grp.isPublic ? 'Public' : 'Groupe')}
                  </p>
                </div>
              </div>
            </div>
            {grp.unreadCount > 0 && (
              <div className="shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse border-2 border-white">
                <span className="text-[10px] font-black text-white">{grp.unreadCount > 9 ? '9+' : grp.unreadCount}</span>
              </div>
            )}
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className={`min-h-full p-6 animate-in fade-in duration-500 overflow-y-auto bg-transparent`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center w-full max-w-6xl mx-auto gap-8">
        
        {/* Main Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto py-8 text-center relative overflow-visible">
        
        {/* Astuces en second plan (fond) */}
        {!isTest && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 opacity-20 pointer-events-none z-0">
             <div className="bg-[#0D98BA]/20 blur-[100px] w-full h-full rounded-full" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-center w-full whitespace-nowrap hidden lg:flex justify-center">
               {tips[tipIndex].icon}
               <span>{tips[tipIndex].text}</span>
             </div>
          </div>
        )}

        <div className={`w-40 h-40 md:w-48 md:h-48 mb-6 flex-shrink-0 flex items-center justify-center shadow-2xl rounded-[2.5rem] overflow-hidden p-6 border relative z-10 ${state.darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-100'}`}>
          <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full" />
        </div>

        <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 z-10 relative ${state.darkMode ? 'text-white' : ''}`}>
          {getGreeting()} !
        </h1>

        <p className={`text-2xl font-bold mb-12 w-full z-10 relative ${djStyleText}`}>
          {welcomeMessage}
        </p>

        {showUpdateNotice && (
          <div className="w-full max-w-md mb-8 z-10 relative">
            <div className={`p-6 rounded-[2rem] shadow-xl border text-left flex flex-col gap-4 ${state.darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-blue-100'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl text-white shadow-lg ${djStyleBg}`}>
                  <Bell size={20} />
                </div>
                <h3 className={`text-lg font-black uppercase tracking-widest ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>Mise à Jour {currentVersion}</h3>
              </div>
              <p className={`text-sm font-bold leading-relaxed ${state.darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                {filteredDesc}
              </p>
              
              {showHomeUpdateDetails && filteredManual && (
                <div className={`mt-2 p-4 rounded-xl text-xs font-bold leading-relaxed ${state.darkMode ? 'bg-black/50 text-zinc-400' : 'bg-blue-50/50 text-gray-600'} markdown-body`}>
                  <Markdown>{filteredManual}</Markdown>
                </div>
              )}
              
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => setShowHomeUpdateDetails(!showHomeUpdateDetails)}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm text-center ${state.darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  {showHomeUpdateDetails ? 'Cacher détails' : 'Comment utiliser ?'}
                </button>
                <button 
                  onClick={() => {
                    localStorage.setItem(`update_notice_dismissed_${currentVersion}`, 'true');
                    setShowUpdateNotice(false);
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg text-white text-center ${djStyleBg}`}
                >
                  J'ai compris
                </button>
              </div>
            </div>
          </div>
        )}

        {!isTest && (
          <div className="w-full max-w-md mb-8 z-0 opacity-80 transition-all duration-1000 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#0D98BA]/5 border border-[#0D98BA]/10">
              <div className="p-2 rounded-xl bg-white shadow-sm ring-4 ring-[#0D98BA]/5">
                {currentTip.icon}
              </div>
              <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase text-center leading-relaxed">
                {currentTip.text}
              </p>
            </div>
          </div>
        )}

        {unreadIds.length > 0 && (
          <button 
            onClick={handleNotificationClick}
            className="bg-blue-50 p-4 rounded-2xl shadow-sm border border-blue-100 w-full mb-8 hover:bg-blue-100 transition animate-in fade-in duration-500 text-left"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <p className="text-sm font-bold text-blue-800 mb-1">Tu as {unreadIds.length} nouveaux messages !</p>
                {latestUnreadExtract && (
                  <p className="text-xs text-blue-600 italic">{latestUnreadExtract}</p>
                )}
              </div>
            </div>
          </button>
        )}

        {/* Pinned Discussions - Mobile */}
        <div className="lg:hidden w-full mb-8 text-left">
          <button
            onClick={() => setShowMobilePinned(!showMobilePinned)}
            className={`w-full flex items-center justify-between p-4 rounded-3xl shadow-sm border transition-colors ${state.darkMode ? (showMobilePinned ? 'bg-zinc-800 border-white/20' : 'bg-black/60 border-white/10 text-white') : (showMobilePinned ? 'bg-gray-50 border-gray-200' : 'bg-white/80 border-gray-100 text-gray-800')}`}
          >
            <div className="flex items-center gap-2">
              <Pin size={18} className="text-[#0D98BA]" />
              <span className="font-black uppercase tracking-widest text-sm">Discussions Épinglées</span>
              {pinnedDiscussions.reduce((acc, g) => acc + g.unreadCount, 0) > 0 && (
                <div className="w-5 h-5 ml-2 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                  <span className="text-[10px] font-black text-white">{pinnedDiscussions.reduce((acc, g) => acc + g.unreadCount, 0)}</span>
                </div>
              )}
            </div>
            {showMobilePinned ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {showMobilePinned && (
            <div className={`mt-3 p-4 rounded-3xl shadow-inner border animate-in slide-in-from-top-4 ${state.darkMode ? 'bg-black/40 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
              {renderPinnedList()}
            </div>
          )}
        </div>

        </div>

        <div className="hidden lg:block w-80 shrink-0 sticky top-8 self-start">
          <div className={`p-6 rounded-[2.5rem] shadow-2xl border ${state.darkMode ? 'bg-black/80 border-white/10' : 'bg-white/90 border-gray-100 backdrop-blur-xl'}`}>
            <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter mb-6">
              <div className={`p-2 rounded-xl ${djStyleBg} shadow-lg`}>
                <Pin size={20} className="text-white" />
              </div>
              <span>Épinglées</span>
              {pinnedDiscussions.reduce((acc, g) => acc + g.unreadCount, 0) > 0 && (
                <div className="w-6 h-6 ml-auto rounded-full bg-[#0D98BA] flex items-center justify-center animate-pulse shadow-lg">
                  <span className="text-[10px] font-black text-white">{pinnedDiscussions.reduce((acc, g) => acc + g.unreadCount, 0)}</span>
                </div>
              )}
            </h2>
            <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {renderPinnedList()}
            </div>
          </div>
        </div>

      </div>

      <div className="mt-auto pb-6 w-full flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4" />
          <p className="text-[10px] md:text-xs font-black tracking-[0.2em] uppercase flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <span className="text-gray-400">une application créé par la</span>
            <span className={djStyleText}>DJ Society</span>
            <span className="text-gray-300 font-light">|</span>
            <span className={djStyleText}>DJ MESSENGER</span>
            <span className="text-gray-300 font-light">|</span>
            <span className={djStyleText}>v{APP_UPDATES[0]?.version || '3.0'} • {APP_UPDATES[0]?.date || '02/05/2026'}</span>
            <span className="text-gray-300 font-light">|</span>
            <span className={djStyleText}>DJ Society</span>
          </p>
        </div>
      </div>
    </div>
  );
}
