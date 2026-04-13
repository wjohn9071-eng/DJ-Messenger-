import React from 'react';
import { djStyleBg, djStyleText } from '../lib/utils';

interface RestrictedActionPopupProps {
  onClose: () => void;
  onSignUp: () => void;
}

export function RestrictedActionPopup({ onClose, onSignUp }: RestrictedActionPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden text-center">
        {/* DJ Style Accents */}
        <div className={`absolute top-0 left-0 w-full h-2 ${djStyleBg}`} />
        
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-xl ${djStyleBg}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        </div>
        
        <h3 className={`text-3xl font-black uppercase tracking-tighter mb-6 ${djStyleText}`}>
          Action Limitée
        </h3>
        
        <p className="text-gray-600 text-lg font-medium leading-relaxed mb-10">
          Si vous voulez parler et pleinement utiliser l'application, veuillez{' '}
          <button 
            onClick={onSignUp}
            className="text-[#0D98BA] font-black hover:underline decoration-2 underline-offset-4 transition-all"
          >
            créer votre compte
          </button>.
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={onSignUp}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-white shadow-lg hover:scale-[1.02] transition-all active:scale-95 ${djStyleBg}`}
          >
            S'inscrire maintenant
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm bg-gray-100 text-gray-400 hover:bg-gray-200 transition-all active:scale-95"
          >
            Continuer la visite
          </button>
        </div>
      </div>
    </div>
  );
}
