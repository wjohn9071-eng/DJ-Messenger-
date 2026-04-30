import React from 'react';
import { djStyleText, djStyleBg, DJ_LOGO_SVG } from '../lib/utils';
import { AppState } from '../types';
import { APP_UPDATES } from './Views';
import { Pin, ChevronDown, ChevronUp } from 'lucide-react';

export default function Home({ state, setView, updateState, startSimulation }: { state: AppState, setView: (v: string) => void, updateState: any, startSimulation: () => void }) {
  const currentVersion = APP_UPDATES[0].version;
  const [showUpdateNotice, setShowUpdateNotice] = React.useState(() => {
    return localStorage.getItem(`update_notice_dismissed_${currentVersion}`) !== 'true';
  });
  const isTest = state.currentUser === 'test';
  const currentUserData = !isTest && state.currentUser ? (state.currentUserData || state.users[state.currentUser as string]) : null;
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
    "Astuce : Tu peux épingler tes groupes préférés pour les retrouver plus vite !",
    "Astuce : Active les notifications dans les paramètres pour ne rater aucun message.",
    "Astuce : Propose tes idées dans la DJ Society, les admins t'écoutent !",
    "Astuce : Personnalise la couleur de l'application dans tes paramètres.",
    "Astuce : Ajoute des amis pour discuter avec eux plus facilement.",
    "Astuce : Le mode test te permet de découvrir l'app sans créer de compte.",
    "Astuce : Les groupes privés nécessitent un code d'invitation sécurisé.",
    "Astuce : Tu peux changer ton avatar à tout moment dans ton profil."
  ];
  
  // Change tip every 10 minutes
  const tipIndex = Math.floor(Date.now() / (10 * 60 * 1000)) % tips.length;
  const currentTip = tips[tipIndex];

  const handleNotificationClick = () => {
    updateState({ 
      discussionTab: 'recent'
    });
    setView('discussions');
  };

  const unreadIds = state.newMessages?.filter(id => !id.startsWith('sms_dj_bot_') && id !== 'simulated-group') || [];
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
    const isSMS = id.startsWith('sms_');
    const group = isSMS ? state.privateMessages?.[id] : state.groups?.[id];
    let name = "Groupe inconnu";
    let avatar = "";
    let isPublic = false;
    let unreadCount = state.newMessages?.filter((msgId: string) => msgId === id).length || 0;

    if (isSMS) {
      const otherUser = id.replace('sms_', '').replace(state.currentUser as string, '').replace('_', '');
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
    setView('discussions');
  };

  const renderPinnedList = () => (
    <div className="space-y-3 mt-4">
      {pinnedDiscussions.length === 0 ? (
        <p className={`text-sm italic pb-4 ${state.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucune discussion épinglée.</p>
      ) : (
        pinnedDiscussions.map((grp) => (
          <button
            key={`pinned-${grp.id}`}
            onClick={() => handleOpenPinned(grp.id, grp.isSMS, grp.isPublic)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl shadow-sm border transition-all hover:scale-[1.02] active:scale-95 text-left ${state.darkMode ? 'bg-zinc-800/80 border-white/10 hover:border-[#0D98BA]' : 'bg-white border-gray-100 hover:border-blue-100'}`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#007FFF] to-[#32CD32] flex items-center justify-center text-white font-bold shadow-inner overflow-hidden">
                {grp.avatar ? <img src={grp.avatar} alt={grp.name} className="w-full h-full object-cover" /> : <span>{(grp.name || '?')[0].toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className={`font-bold truncate text-sm leading-tight ${state.darkMode ? 'text-white' : 'text-gray-800'}`}>{grp.name}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${grp.isSMS ? 'text-[#32CD32]' : (grp.isPublic ? 'text-[#0D98BA]' : 'text-purple-500')}`}>
                  {grp.isSMS ? 'Message Privé' : (grp.isPublic ? 'Groupe Public' : 'Groupe Privé')}
                </p>
              </div>
            </div>
            {grp.unreadCount > 0 && (
              <div className="shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse">
                <span className="text-[10px] font-black text-white">{grp.unreadCount > 9 ? '9+' : grp.unreadCount}</span>
              </div>
            )}
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className={`min-h-full p-6 animate-in fade-in duration-500 overflow-y-auto backdrop-blur-sm ${state.darkMode ? 'bg-black/50 text-white' : 'bg-white/50 text-gray-800'}`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center w-full max-w-6xl mx-auto gap-8">
        
        {/* Pinned Discussions - Desktop Left */}
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
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto py-8 text-center">
        <div className={`w-40 h-40 md:w-48 md:h-48 mb-8 flex-shrink-0 flex items-center justify-center shadow-2xl rounded-[2.5rem] overflow-hidden p-6 border ${state.darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-100'}`}>
          <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full" />
        </div>
        
        <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 ${state.darkMode ? 'text-white' : 'text-gray-800'}`}>
          {getGreeting()} !
        </h1>
        
        <p className={`text-2xl font-bold mb-8 w-full ${djStyleText}`}>
          {welcomeMessage}
        </p>

        {unreadIds.length > 0 && (
          <button 
            onClick={handleNotificationClick}
            className="bg-blue-50 p-4 rounded-2xl shadow-sm border border-blue-100 w-full mb-8 hover:bg-blue-100 transition animate-in fade-in duration-500 text-left"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <p className="text-sm font-bold text-blue-800 mb-1">Tu as de nouveaux messages !</p>
                {latestUnreadExtract && (
                  <p className="text-xs text-blue-600 italic">{latestUnreadExtract}</p>
                )}
              </div>
            </div>
          </button>
        )}

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-gray-100 w-full mb-8 animate-in slide-in-from-bottom-4">
          <p className="text-sm font-semibold text-gray-600 italic">💡 {currentTip}</p>
        </div>

        {showUpdateNotice && (
          <div className="bg-blue-50/80 backdrop-blur-md p-6 rounded-3xl shadow-md border border-blue-100 w-full mb-12 text-left relative animate-in zoom-in-95 duration-300">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#0D98BA] mb-3">Version {APP_UPDATES[0].version} - {APP_UPDATES[0].date}</h3>
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-4 font-medium mb-6">
              <li><b>Nouveautés :</b> {APP_UPDATES[0].desc}</li>
            </ul>
            <button 
              onClick={() => {
                setShowUpdateNotice(false);
                localStorage.setItem(`update_notice_dismissed_${currentVersion}`, 'true');
              }}
              className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs text-white shadow-lg hover:scale-[1.02] transition-all active:scale-95 ${djStyleBg}`}
            >
              C'est incroyable !
            </button>
          </div>
        )}

        {/* Pinned Discussions - Mobile */}
        <div className="lg:hidden w-full mb-12 text-left">
          <button
            onClick={() => setShowMobilePinned(!showMobilePinned)}
            className={`w-full flex items-center justify-between p-4 rounded-3xl shadow-sm border transition-colors ${state.darkMode ? (showMobilePinned ? 'bg-zinc-800 border-white/20' : 'bg-black/60 border-white/10 text-white') : (showMobilePinned ? 'bg-gray-50 border-gray-200' : 'bg-white/80 border-gray-100 text-gray-800')}`}
          >
            <div className="flex items-center gap-2">
              <Pin size={18} className="text-[#0D98BA]" />
              <span className="font-black uppercase tracking-widest text-sm">Discussions Épinglées</span>
              {pinnedDiscussions.filter(g => g.unreadCount > 0).length > 0 && (
                <div className="w-5 h-5 ml-2 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                  <span className="text-[10px] font-black text-white">{pinnedDiscussions.filter(g => g.unreadCount > 0).reduce((acc, g) => acc + g.unreadCount, 0)}</span>
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

        {(isTest || isNewUser) && (
          <button 
            onClick={startSimulation}
            className={`px-10 py-5 rounded-full font-black uppercase tracking-widest text-lg shadow-2xl hover:scale-105 transition-transform active:scale-95 mb-12 w-full max-w-xs ${djStyleBg}`}
          >
            Découvrir le tutoriel
          </button>
        )}
        </div>

        {/* Empty Spacer on Right for Balancing Desktop Layout */}
        <div className="hidden lg:block w-80 shrink-0 select-none pointer-events-none" />
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
            <span className={djStyleText}>DJ Society</span>
          </p>
        </div>
      </div>
    </div>
  );
}
