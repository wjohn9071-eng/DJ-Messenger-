import React, { useState } from 'react';
import { AppState } from '../types';
import { X, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { djStyleBg, djStyleText } from '../lib/utils';

interface UserProfileModalProps {
  userId: string;
  state: AppState;
  updateState: (newState: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => void;
  onClose: () => void;
  setView: (view: string) => void;
}

export function UserProfileModal({ userId, state, updateState, onClose, setView }: UserProfileModalProps) {
  const [showPhoto, setShowPhoto] = useState(false);
  const user = state.users[userId];

  if (!user) return null;

  const handleSendSMS = () => {
    // If it's a test user, we might want to block or it's handled outside. Here we just open the SMS.
    updateState({ 
      activeGroup: `sms_${[state.currentUser, userId].sort().join('_')}`,
      discussionTab: 'sms'
    });
    setView('discussions');
    onClose();
  };

  if (showPhoto) {
    return (
      <div className="fixed inset-0 z-[100000] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowPhoto(false)}>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowPhoto(false); }} 
          className="absolute top-4 right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors backdrop-blur-md"
        >
          <X size={24} />
        </button>
        <img 
          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
          alt={user.name} 
          className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl transition-transform duration-300 scale-100"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="relative h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
          <div className={`absolute inset-0 opacity-40 ${djStyleBg}`}></div>
          <div className="absolute -bottom-10 flex justify-center w-full">
            <div className="relative">
              <img 
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                referrerPolicy="no-referrer"
              />
              {user.isGrandAdmin && (
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm uppercase tracking-wider">
                  DJ
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition backdrop-blur-md">
            <X size={20} />
          </button>
        </div>
        
        <div className="pt-14 pb-8 px-6 text-center">
          <h2 className={`text-2xl font-black uppercase tracking-tighter ${djStyleText} mb-1`}>{user.name}</h2>
          <p className="text-gray-500 text-sm font-medium mb-6">
            {user.role || (user.isAdmin ? 'Admin' : 'Membre')}
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setShowPhoto(true)}
              className="w-full py-4 bg-gray-50 flex items-center justify-center gap-2 rounded-2xl text-gray-700 font-bold hover:bg-gray-100 transition active:scale-95 border border-gray-100"
            >
              <ImageIcon size={20} />
              <span>Voir la photo</span>
            </button>
            
            {state.currentUser !== user.uid && (
              <button 
                onClick={handleSendSMS}
                className={`w-full py-4 text-white flex items-center justify-center gap-2 rounded-2xl font-bold transition shadow-lg active:scale-95 ${djStyleBg}`}
              >
                <MessageSquare size={20} />
                <span>Envoyer un SMS</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
