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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setState(prev => ({ ...prev, currentUser: user.uid }));
        // Ensure user document exists
        const userRef = doc(db, 'users', user.uid);
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
            setDoc(userRef, userData).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
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
              }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users_public/${user.uid}`));
            }
          }).catch(e => handleFirestoreError(e, OperationType.GET, `users_public/${user.uid}`));

          // Sync current user to state.users immediately
          setState(prev => ({
            ...prev,
            users: { ...prev.users, [user.uid]: userData }
          }));
        }).catch(e => handleFirestoreError(e, OperationType.GET, `users/${user.uid}`));
      } else {
        setState(prev => ({ ...prev, currentUser: null }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Public Users (for search and display)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users_public'), (snapshot) => {
      const users: Record<string, User> = {};
      snapshot.forEach(doc => {
        users[doc.id] = doc.data() as User;
      });
      setState(prev => ({ ...prev, users }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users_public');
    });
    return () => unsubscribe();
  }, []);

  // Real-time Groups & Messages
  useEffect(() => {
    const unsubMessages: Record<string, () => void> = {};
    
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
      
      setState(prev => ({ ...prev, groups }));
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
    
    const unsubscribe = onSnapshot(collection(db, 'private_messages'), (snapshot) => {
      const privateMessages: Record<string, PrivateChat> = {};
      snapshot.forEach(chatDoc => {
        const chatData = chatDoc.data() as PrivateChat;
        if (!chatData.members?.includes(state.currentUser as string)) return;
        
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
      
      setState(prev => ({ ...prev, privateMessages }));
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
