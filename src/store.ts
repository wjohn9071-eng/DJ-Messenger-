import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, User, Group, Proposal, Message, PrivateChat } from './types';
import { 
  db, auth, onAuthStateChanged, 
  collection, doc, onSnapshot, query, orderBy, 
  setDoc, updateDoc, getDoc, serverTimestamp, Timestamp
} from './lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't necessarily want to throw here in the store as it might crash the whole app, 
  // but we log it clearly for debugging.
}

const defaultState: AppState = {
  users: {},
  groups: {},
  privateMessages: {},
  proposals: [],
  currentUser: null,
  currentUserData: null,
  menuOpen: true,
  activeGroup: null,
  newMessages: []
};

export function useAppStore() {
  const [state, setState] = useState<AppState>(defaultState);
  const stateRef = useRef<AppState>(state);
  const isInitialMount = useRef(true);

  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Super Admin Timer
  useEffect(() => {
    if (!state.currentUserData?.isSuperAdmin || !state.currentUserData?.superAdminUntil) return;

    const checkTimer = () => {
      const until = new Date(state.currentUserData!.superAdminUntil!).getTime();
      const now = new Date().getTime();
      
      if (now >= until) {
        // Mode Super Admin expiré
        const userRef = doc(db, 'users', state.currentUser as string);
        updateDoc(userRef, {
          isSuperAdmin: false,
          superAdminUntil: null
        }).catch(e => console.error("Erreur lors de la désactivation du Super Admin:", e));
      }
    };

    const interval = setInterval(checkTimer, 10000); // Vérifier toutes les 10 secondes
    checkTimer(); // Vérifier immédiatement

    return () => clearInterval(interval);
  }, [state.currentUser, state.currentUserData?.isSuperAdmin, state.currentUserData?.superAdminUntil]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setState(prev => ({ ...prev, currentUser: user.uid }));
        
        // Ensure user document exists
        const userRef = doc(db, 'users', user.uid);
        
        // On utilise getDocFromServer pour s'assurer qu'on a bien une connexion
        getDoc(userRef).then(snap => {
          const userData = snap.exists() ? snap.data() as User : {
            id: user.uid,
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Anonyme',
            email: user.email || '',
            avatar: user.photoURL || '',
            role: 'user',
            friends: [],
            lastSeen: new Date().toISOString(),
            lastReadTimestamps: {},
            pinnedGroups: [],
            isAdmin: false
          };

          if (!snap.exists()) {
            setDoc(userRef, userData).catch(e => {
              if (e.code !== 'unavailable') handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
            });
          }
          
          // Ensure public profile exists
          const publicRef = doc(db, 'users_public', user.uid);
          getDoc(publicRef).then(publicSnap => {
            if (!publicSnap.exists()) {
              setDoc(publicRef, {
                uid: user.uid,
                name: userData.name,
                avatar: userData.avatar,
                role: userData.role || 'user',
                isAdmin: userData.isAdmin || false
              }).catch(e => {
                if (e.code !== 'unavailable') handleFirestoreError(e, OperationType.WRITE, `users_public/${user.uid}`);
              });
            }
          }).catch(e => {
            if (e.code !== 'unavailable') handleFirestoreError(e, OperationType.GET, `users_public/${user.uid}`);
          });

          // Sync current user to state.users immediately
          setState(prev => ({
            ...prev,
            currentUserData: userData,
            users: { ...prev.users, [user.uid]: userData }
          }));
        }).catch(e => {
          if (e.code !== 'unavailable') handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
        });
        
        // Listen to current user document for real-time updates (like friends list)
        const unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setState(prev => ({
              ...prev,
              currentUserData: snap.data() as User
            }));
          }
        }, (error) => {
          if (error.code !== 'unavailable') handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });
        
        // Store the unsubscribe function to clean up later if needed
        (window as any).unsubCurrentUser = unsubUser;
        
      } else {
        setState(prev => ({ ...prev, currentUser: null, currentUserData: null }));
        if ((window as any).unsubCurrentUser) {
          (window as any).unsubCurrentUser();
        }
      }
    }, (error) => {
      console.error("Auth State Error:", error);
      if (error.message?.includes('network-request-failed')) {
        console.warn("⚠️ Problème réseau détecté lors de l'authentification. Vérifiez votre connexion.");
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Public Users (for search and display)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users: Record<string, User> = {};
      snapshot.forEach(doc => {
        users[doc.id] = doc.data() as User;
      });
      setState(prev => {
        // Preserve DJ Bot if it exists
        if (prev.users['DJ Bot']) {
          users['DJ Bot'] = prev.users['DJ Bot'];
        }
        return { ...prev, users };
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => unsubscribe();
  }, []);

  // Browser Notifications Helper
  const sendNotification = useCallback((title: string, body: string) => {
    if (Notification.permission === 'granted' && stateRef.current.currentUserData?.notificationsEnabled) {
      new Notification(title, { body, icon: '/logo192.png' });
    }
  }, []);

  // Real-time Groups & Messages
  useEffect(() => {
    const unsubMessages: Record<string, () => void> = {};
    const lastMsgIds: Record<string, string> = {};
    
    const unsubscribe = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const groups: Record<string, Group> = {};
      snapshot.forEach(groupDoc => {
        const groupData = groupDoc.data() as Group;
        groups[groupDoc.id] = { ...groupData, id: groupDoc.id, messages: stateRef.current.groups[groupDoc.id]?.messages || [] };
        
        // Sub-collection listener for messages if not already listening
        if (!unsubMessages[groupDoc.id]) {
          unsubMessages[groupDoc.id] = onSnapshot(query(collection(db, 'groups', groupDoc.id, 'messages'), orderBy('timestamp', 'asc')), (msgSnap) => {
            const messages: Message[] = [];
            msgSnap.forEach(mDoc => {
              const data = mDoc.data();
              messages.push({ 
                id: mDoc.id, 
                ...data,
                user: data.user || data.senderId // Ensure user is the UID
              } as Message);
            });

            // Notification logic
            if (messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              if (lastMsgIds[groupDoc.id] && lastMsgIds[groupDoc.id] !== lastMsg.id && lastMsg.user !== stateRef.current.currentUser) {
                sendNotification(`DJ Messenger - ${groupData.name}`, `${lastMsg.senderName || 'Nouveau message'}: ${lastMsg.text}`);
              }
              lastMsgIds[groupDoc.id] = lastMsg.id || '';
            }

            setState(prev => ({
              ...prev,
              groups: {
                ...prev.groups,
                [groupDoc.id]: { ...prev.groups[groupDoc.id], messages }
              }
            }));
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `groups/${groupDoc.id}/messages`);
          });
        }
      });
      
      // Cleanup listeners for deleted groups
      Object.keys(unsubMessages).forEach(id => {
        if (!groups[id]) {
          unsubMessages[id]();
          delete unsubMessages[id];
        }
      });
      
      setState(prev => {
        const newGroups = { ...prev.groups };
        // Remove deleted groups
        Object.keys(newGroups).forEach(id => {
          if (!groups[id]) {
            delete newGroups[id];
          }
        });
        // Update existing/new groups while preserving their messages
        Object.keys(groups).forEach(id => {
          newGroups[id] = {
            ...groups[id],
            messages: prev.groups[id]?.messages || []
          };
        });
        return { ...prev, groups: newGroups };
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'groups');
    });
    
    return () => {
      unsubscribe();
      Object.values(unsubMessages).forEach(unsub => unsub());
    };
  }, []);

  // Real-time Private Messages
  useEffect(() => {
    if (!state.currentUser) return;
    
    const unsubMessages: Record<string, () => void> = {};
    const lastMsgIds: Record<string, string> = {};
    
    const unsubscribe = onSnapshot(collection(db, 'private_messages'), (snapshot) => {
      const privateMessages: Record<string, PrivateChat> = {};
      snapshot.forEach(chatDoc => {
        const chatData = chatDoc.data() as PrivateChat;
        const isSuperAdmin = stateRef.current.currentUserData?.isSuperAdmin;
        
        if (!chatData.members?.includes(state.currentUser as string) && !isSuperAdmin) return;
        
        privateMessages[chatDoc.id] = { 
          ...chatData, 
          id: chatDoc.id, 
          messages: stateRef.current.privateMessages[chatDoc.id]?.messages || [] 
        };
        
        // Sub-collection listener for messages if not already listening
        if (!unsubMessages[chatDoc.id]) {
          unsubMessages[chatDoc.id] = onSnapshot(query(collection(db, 'private_messages', chatDoc.id, 'messages'), orderBy('timestamp', 'asc')), (msgSnap) => {
            const messages: Message[] = [];
            msgSnap.forEach(mDoc => {
              const data = mDoc.data();
              messages.push({ 
                id: mDoc.id, 
                ...data,
                user: data.senderId || data.user, // Ensure user is the UID
                time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              } as Message);
            });

            // Notification logic
            if (messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              if (lastMsgIds[chatDoc.id] && lastMsgIds[chatDoc.id] !== lastMsg.id && lastMsg.user !== stateRef.current.currentUser) {
                const otherUser = stateRef.current.users[lastMsg.user]?.name || 'Quelqu\'un';
                sendNotification(`DJ Messenger - SMS de ${otherUser}`, lastMsg.text);
              }
              lastMsgIds[chatDoc.id] = lastMsg.id || '';
            }

            setState(prev => ({
              ...prev,
              privateMessages: {
                ...prev.privateMessages,
                [chatDoc.id]: { ...prev.privateMessages[chatDoc.id], messages }
              }
            }));
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `private_messages/${chatDoc.id}/messages`);
          });
        }
      });
      
      // Cleanup listeners for deleted chats
      Object.keys(unsubMessages).forEach(id => {
        if (!privateMessages[id]) {
          unsubMessages[id]();
          delete unsubMessages[id];
        }
      });
      
      setState(prev => {
        const newPrivateMessages = { ...prev.privateMessages };
        // Remove deleted chats
        Object.keys(newPrivateMessages).forEach(id => {
          if (!privateMessages[id]) {
            delete newPrivateMessages[id];
          }
        });
        // Update existing/new chats while preserving their messages
        Object.keys(privateMessages).forEach(id => {
          newPrivateMessages[id] = {
            ...privateMessages[id],
            messages: prev.privateMessages[id]?.messages || []
          };
        });
        return { ...prev, privateMessages: newPrivateMessages };
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'private_messages');
    });
    
    return () => {
      unsubscribe();
      Object.values(unsubMessages).forEach(unsub => unsub());
    };
  }, [state.currentUser]);

  // Real-time Proposals
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'proposals'), (snapshot) => {
      const proposals: Proposal[] = [];
      snapshot.forEach(doc => {
        proposals.push({ id: doc.id, ...doc.data() } as Proposal);
      });
      setState(prev => ({ ...prev, proposals }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'proposals');
    });
    return () => unsubscribe();
  }, []);

  const updateState = useCallback((updates: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => {
    setState(prev => {
      const newValues = typeof updates === 'function' ? updates(prev) : updates;
      const nextState = { ...prev, ...newValues };
      
      // Sync specific fields back to Firebase if needed
      // (Most logic will now use direct Firebase calls in components)
      
      return nextState;
    });
  }, []);

  return { state, updateState };
}
