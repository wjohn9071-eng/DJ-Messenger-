import React from 'react';
import { djStyleText, djStyleBg, DJ_LOGO_SVG } from '../lib/utils';
import { AppState } from '../types';

export default function Home({ state, setView, updateState, startSimulation }: { state: AppState, setView: (v: string) => void, updateState: any, startSimulation: () => void }) {
  const isTest = state.currentUser === 'test';
  const currentUserData = !isTest && state.currentUser ? (state.currentUserData || state.users[state.currentUser as string]) : null;
  const username = isTest ? 'Anonyme' : (currentUserData?.name || state.currentUser);
  const isNewUser = !isTest && currentUserData && currentUserData.friends?.length === 0;
  
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
  
  // Change tip every 25 minutes
  const tipIndex = Math.floor(Date.now() / (25 * 60 * 1000)) % tips.length;
  const currentTip = tips[tipIndex];

  const handleNotificationClick = () => {
    updateState({ 
      discussionTab: 'recent',
      newMessages: []
    });
    setView('discussions');
  };

  return (
    <div className="flex flex-col items-center min-h-full p-6 text-center animate-in fade-in duration-500 overflow-y-auto bg-white/50 backdrop-blur-sm">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto py-8">
        <div className="w-40 h-40 md:w-48 md:h-48 mb-8 flex-shrink-0 flex items-center justify-center shadow-2xl rounded-[2.5rem] overflow-hidden p-6 bg-white border border-gray-100">
          <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 text-gray-800">
          {getGreeting()} !
        </h1>
        
        <p className={`text-2xl font-bold mb-8 w-full ${djStyleText}`}>
          {welcomeMessage}
        </p>

        {state.newMessages && state.newMessages.filter(id => !id.startsWith('sms-dj-help-') && id !== 'simulated-group').length > 0 && (
          <button 
            onClick={handleNotificationClick}
            className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100 w-full mb-8 animate-bounce hover:bg-red-100 transition"
          >
            <p className="text-sm font-bold text-red-600">🔔 Tu as de nouveaux messages ! Clique ici pour les voir.</p>
          </button>
        )}

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-gray-100 w-full mb-8 animate-in slide-in-from-bottom-4">
          <p className="text-sm font-semibold text-gray-600 italic">💡 {currentTip}</p>
        </div>

        <div className="bg-blue-50/80 backdrop-blur-md p-6 rounded-3xl shadow-md border border-blue-100 w-full mb-12 text-left">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0D98BA] mb-3">Mise à jour - Samedi 11 avril 2026</h3>
          <ul className="text-sm text-gray-700 space-y-2 list-disc pl-4 font-medium">
            <li>Correction d'un bug majeur empêchant l'ajout d'amis (erreur "indexOf").</li>
            <li>Correction d'un crash de l'application lié à l'affichage des avatars (erreur "0").</li>
            <li>Correction d'un bug qui affichait les options en double dans l'onglet SMS.</li>
            <li>Amélioration de la synchronisation en temps réel de la liste des utilisateurs (les comptes supprimés n'apparaissent plus).</li>
            <li>Correction d'un bug (écran blanc) empêchant l'accès au profil.</li>
            <li>Le gestionnaire de mots de passe du navigateur reconnaît désormais correctement DJ Messenger.</li>
            <li>Ajout d'une option de réinitialisation complète de la base de données (réservée aux administrateurs).</li>
          </ul>
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

      <div className="mt-auto pb-6 w-full">
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
