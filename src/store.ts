import { useState, useEffect, useCallback } from 'react';
import { AppState, User, Group, Proposal } from './types';

const defaultState: AppState = {
  users: {
    'DJ Help': {
      username: 'DJ Help',
      isAdmin: true,
      friends: [],
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=help'
    }
  },
  groups: {
    'public-main': {
      id: 'public-main',
      type: 'public',
      name: 'Général',
      creator: 'system',
      admins: ['system'],
      members: [],
      banned: [],
      muted: [],
      messages: [
        { 
          id: '1', 
          user: 'Système', 
          text: 'Bienvenue dans le groupe public général !', 
          time: new Date().toLocaleTimeString(), 
          timestamp: new Date().toISOString(),
          isSystem: true 
        }
      ]
    }
  },
  proposals: [
    {
      id: 'welcome-society',
      user: 'DJ Society',
      text: 'Bienvenue dans DJ messenger. Nous sommes les propriétaires de la société DJ Society et vous pouvez nous proposer quelque chose pour que l\'on puisse vous aider. C\'est à vous de dire vos idées et nous vous répondrons.',
      date: new Date().toISOString(),
      status: 'pending',
      isAdminAnnouncement: true
    }
  ],
  currentUser: null,
  menuOpen: true
};

export function useAppStore() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('dj_app_state');
    if (saved) {
      try {
        return { ...defaultState, ...JSON.parse(saved) };
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('dj_app_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dj_app_state' && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue) as AppState;
          setState(newState);
          
          // Check for new messages to trigger notifications
          if (newState.currentUser && newState.currentUser !== 'test' && newState.users[newState.currentUser]?.notificationsEnabled) {
            // Very basic notification logic: check if total messages increased
            let oldTotal = 0;
            let newTotal = 0;
            
            Object.entries(state.groups).forEach(([id, g]: [string, any]) => {
              if (!id.startsWith('sms-dj-help-')) {
                oldTotal += g.messages?.length || 0;
              }
            });
            
            Object.entries(newState.groups).forEach(([id, g]: [string, any]) => {
              // Exclude DJ Help from notifications
              if (!id.startsWith('sms-dj-help-')) {
                newTotal += g.messages?.length || 0;
              }
            });
            
            if (newTotal > oldTotal && 'Notification' in window && Notification.permission === 'granted') {
              new Notification("DJ Messenger", {
                body: "Vous avez un nouveau message !",
                icon: "/icon.svg"
              });
            }
          }
        } catch (err) {
          console.error("Erreur de synchronisation du state", err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [state]);

  const updateState = useCallback((updates: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => {
    setState(prev => {
      const newValues = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...newValues };
    });
  }, []);

  return { state, updateState };
}
