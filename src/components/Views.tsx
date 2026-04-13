import React, { useState, useEffect, useRef } from 'react';
import { AppState } from '../types';
import { djStyleBg, djStyleText, compressImage } from '../lib/utils';
import { User, Key, ImagePlus, Trash2, MessageSquare, BarChart2, X, Plus, Download, Shield, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { RestrictedActionPopup } from './RestrictedActionPopup';

import { db, auth, doc, updateDoc, signOut, deleteDoc, collection, addDoc, getDoc, setDoc, arrayUnion, arrayRemove, query, where, getDocs, reauthenticateWithPopup, googleProvider } from '../lib/firebase';
import { updateProfile, updatePassword, deleteUser } from 'firebase/auth';

export const DJ_FRAME_STYLE = "border-4 border-[#0D98BA] shadow-[0_0_15px_rgba(13,152,186,0.4)] rounded-3xl p-4 bg-white/90 backdrop-blur-sm relative overflow-hidden";
export const STAFF_BADGE = <span className="text-[8px] font-black uppercase bg-[#0D98BA] text-white px-2 py-0.5 rounded-full ml-2 shadow-[0_0_8px_rgba(13,152,186,0.5)]">STAFF</span>;
export const ADMIN_BADGE = <span className="text-[8px] font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded-full ml-2 shadow-[0_0_8px_rgba(220,38,38,0.5)]">ADMIN</span>;
export const SUPER_ADMIN_BADGE = <span className="text-[8px] font-black uppercase bg-purple-600 text-white px-2 py-0.5 rounded-full ml-2 shadow-[0_0_8px_rgba(147,51,234,0.5)]">SUPER ADMIN</span>;

const renderMessageText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#007FFF] drop-shadow-[0_0_8px_rgba(0,127,255,0.8)] hover:underline font-bold break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }: { isOpen: boolean, message: string, onConfirm: () => void, onCancel: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
        <h3 className="text-lg font-bold text-gray-900 mb-6">{message}</h3>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 font-bold transition">Annuler</button>
          <button onClick={() => { onConfirm(); onCancel(); }} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold transition shadow-lg">Confirmer</button>
        </div>
      </div>
    </div>
  );
};

export function Profile({ state, updateState }: { state: AppState, updateState: any }) {
  const isTest = state.currentUser === 'test';
  const user = isTest ? null : state.users[state.currentUser as string];
  const [username, setUsername] = useState(user?.name || '');
  const [password, setPassword] = useState('••••••••');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [toast, setToast] = useState<string | null>(null);
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, action: () => void} | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.name || '');
      setAvatar(user.avatar || null);
    }
  }, [user?.name, user?.avatar]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSignUpRedirect = () => {
    updateState({ currentUser: null });
  };

  const handleSave = async () => {
    if (isTest || !auth.currentUser) {
      setShowRestrictedPopup(true);
      return;
    }
    if (!username.trim()) {
      return showToast("Le nom ne peut pas être vide.");
    }
    
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: username,
          photoURL: avatar
        });

        if (password && password !== '••••••••') {
          try {
            await updatePassword(auth.currentUser, password);
          } catch (pwdError: any) {
            console.error("Erreur mot de passe:", pwdError);
            if (pwdError.code === 'auth/requires-recent-login') {
              return showToast("Erreur: Vous devez vous reconnecter pour changer de mot de passe.");
            }
            return showToast("Erreur lors de la modification du mot de passe.");
          }
        }

        const userRef = doc(db, 'users', auth.currentUser.uid);
        const publicRef = doc(db, 'users_public', auth.currentUser.uid);

        try {
          await updateDoc(userRef, {
            name: username,
            avatar: avatar || '',
            password: (password && password !== '••••••••') ? password : user.password || ''
          });
          
          await updateDoc(publicRef, {
            name: username,
            avatar: avatar || ''
          });
        } catch (e: any) {
          console.error("Erreur Firestore lors de la mise à jour du profil:", e);
          throw new Error("Profil mis à jour localement mais erreur de synchronisation avec la base de données.");
        }
      }

      showToast("Profil mis à jour !");
    } catch (error: any) {
      showToast("Erreur: " + error.message);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setAvatar(compressed);
      } catch (err) {
        console.error("Erreur compression image:", err);
        showToast("Erreur lors du chargement de l'image.");
      }
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto animate-in fade-in duration-300 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <div className={`p-3 rounded-2xl ${djStyleBg} shadow-lg`}>
          <User className="text-white" size={24} />
        </div>
        <h2 className={`text-3xl font-black uppercase tracking-tighter ${djStyleText}`}>Mon Profil</h2>
      </div>
      
      <div className="flex flex-col items-center mb-10">
        <div className="relative group">
          <label className="relative cursor-pointer block">
            <div className="w-40 h-40 rounded-[2.5rem] bg-white border-8 border-white shadow-2xl flex items-center justify-center overflow-hidden group-hover:ring-8 ring-[#0D98BA]/20 transition-all relative">
              {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={64} className="text-gray-200" />}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ImagePlus className="text-white mb-2" size={32} />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Changer</span>
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          {avatar && (
            <button 
              type="button"
              onClick={removeAvatar}
              className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all z-10"
              title="Supprimer la photo"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6 bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white/50 mb-8">
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Nom d'utilisateur</label>
          <input 
            type="text" 
            autoComplete="username"
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all bg-gray-50/50 font-bold text-gray-800" 
            placeholder="Ton nom de scène..."
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Mot de passe</label>
          <div className="relative">
            <input 
              type="password" 
              autoComplete="new-password"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all bg-gray-50/50 font-bold text-gray-800" 
              placeholder="••••••••"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
              <Key size={18} />
            </div>
          </div>
        </div>
        
        <div className="pt-4">
          <button 
            type="submit"
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(13,152,186,0.3)] hover:scale-[1.02] transition active:scale-95 text-white ${djStyleBg}`}
          >
            Mettre à jour le profil
          </button>
        </div>
        
        {user?.isAdmin && (
          <div className="pt-4 border-t border-gray-100 mt-4">
            <button 
              type="button"
              onClick={() => {
                setConfirmDialog({
                  message: "⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer TOUS les utilisateurs et TOUS les messages ? Cette action est irréversible.",
                  action: async () => {
                    try {
                      const usersSnap = await getDocs(collection(db, 'users'));
                      usersSnap.forEach(async (d) => { if (d.id !== auth.currentUser?.uid) await deleteDoc(doc(db, 'users', d.id)); });
                      const usersPublicSnap = await getDocs(collection(db, 'users_public'));
                      usersPublicSnap.forEach(async (d) => { if (d.id !== auth.currentUser?.uid) await deleteDoc(doc(db, 'users_public', d.id)); });
                      const groupsSnap = await getDocs(collection(db, 'groups'));
                      for (const d of groupsSnap.docs) {
                        const msgs = await getDocs(collection(db, 'groups', d.id, 'messages'));
                        msgs.forEach(async (m) => await deleteDoc(doc(db, 'groups', d.id, 'messages', m.id)));
                        await deleteDoc(doc(db, 'groups', d.id));
                      }
                      const pmSnap = await getDocs(collection(db, 'private_messages'));
                      for (const d of pmSnap.docs) {
                        const msgs = await getDocs(collection(db, 'private_messages', d.id, 'messages'));
                        msgs.forEach(async (m) => await deleteDoc(doc(db, 'private_messages', d.id, 'messages', m.id)));
                        await deleteDoc(doc(db, 'private_messages', d.id));
                      }
                      showToast("Base de données réinitialisée !");
                    } catch (e) {
                      console.error(e);
                      showToast("Erreur lors de la réinitialisation.");
                    }
                  }
                });
              }} 
              className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg hover:scale-[1.02] transition active:scale-95 text-white bg-red-500 hover:bg-red-600"
            >
              Réinitialiser la base de données
            </button>
          </div>
        )}
      </form>

      <ConfirmModal 
        isOpen={!!confirmDialog} 
        message={confirmDialog?.message || ''} 
        onConfirm={() => confirmDialog?.action()} 
        onCancel={() => setConfirmDialog(null)} 
      />

      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
      
      {showRestrictedPopup && (
        <RestrictedActionPopup 
          onClose={() => setShowRestrictedPopup(false)} 
          onSignUp={handleSignUpRedirect}
        />
      )}
    </div>
  );
}

export function Friends({ state, updateState, setView }: { state: AppState, updateState: any, setView?: (v: string) => void }) {
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, action: () => void} | null>(null);
  
  const isTest = state.currentUser === 'test';
  const currentUserData = (isTest || !state.currentUser) ? null : (state.currentUserData || state.users[state.currentUser as string]);
  const currentUser = {
    ...currentUserData,
    friends: currentUserData?.friends || []
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSignUpRedirect = () => {
    updateState({ currentUser: null });
  };

  const handleAddFriend = async (friendUid: string) => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    if (!friendUid || !state.currentUser) return showToast("Erreur: Utilisateur invalide.");
    
    const friendsList = currentUser.friends || [];
    if (friendsList.includes(friendUid)) return showToast("Déjà dans tes amis.");
    
    try {
      const userRef = doc(db, 'users', state.currentUser as string);
      const friendRef = doc(db, 'users', friendUid);
      
      await updateDoc(userRef, { friends: arrayUnion(friendUid) });
      await updateDoc(friendRef, { friends: arrayUnion(state.currentUser as string) });
      
      updateState((prev: AppState) => {
        const newUsers = { ...prev.users };
        if (newUsers[state.currentUser as string]) {
          newUsers[state.currentUser as string].friends = [...(newUsers[state.currentUser as string].friends || []), friendUid];
        }
        if (newUsers[friendUid]) {
          newUsers[friendUid].friends = [...(newUsers[friendUid].friends || []), state.currentUser as string];
        }
        return { users: newUsers };
      });

      showToast(`${state.users[friendUid]?.name || friendUid} ajouté aux amis !`);
    } catch (error) {
      console.error("Error adding friend:", error);
      showToast("Erreur lors de l'ajout de l'ami.");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!friendId || !state.currentUser) return showToast("Erreur: Utilisateur invalide.");
    const friendName = state.users[friendId]?.name || friendId;
    
    try {
      const userRef = doc(db, 'users', state.currentUser as string);
      const friendRef = doc(db, 'users', friendId);
      
      await setDoc(userRef, { friends: arrayRemove(friendId) }, { merge: true });
      await setDoc(friendRef, { friends: arrayRemove(state.currentUser as string) }, { merge: true });
      
      showToast(`${friendName} retiré des amis.`);
    } catch (error) {
      console.error("Error removing friend:", error);
      showToast("Erreur lors du retrait de l'ami.");
    }
  };

  const searchResults = Object.values(state.users).filter(u => 
    u && u.uid !== state.currentUser &&
    (search === '' || (u.name && u.name.toLowerCase().includes(search.toLowerCase()))) &&
    !(currentUser.friends || []).includes(u.uid) &&
    u.uid !== 'dj-bot' && u.uid !== 'DJ_Bot'
  );

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in fade-in duration-300 pb-20">
      <h2 className={`text-2xl font-bold mb-6 ${djStyleText}`}>Amis</h2>
      
      <div className="mb-8">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Rechercher un utilisateur par son nom..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full px-6 py-4 rounded-[2rem] bg-white border border-gray-100 shadow-xl focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all text-lg font-medium"
          />
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full ${djStyleBg}`}>
            <User size={20} className="text-white" />
          </div>
        </div>
        
        <div className="mt-4 bg-white rounded-3xl shadow-2xl border border-gray-50 overflow-hidden animate-in slide-in-from-top-4">
          <div className="p-4 bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {search ? 'Résultats de la recherche' : 'Tous les utilisateurs'}
          </div>
          {searchResults.length > 0 ? searchResults.map((u, i) => (
            <div key={u.id || `user-${i}`} className="flex items-center justify-between p-5 border-b last:border-0 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 shadow-inner overflow-hidden">
                  {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : (u.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-gray-800 text-lg">@{u.name}</span>
                  <p className="text-xs text-gray-400">Utilisateur DJ Messenger</p>
                </div>
              </div>
              <button 
                onClick={() => handleAddFriend(u.uid)} 
                className={`px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest shadow-lg hover:scale-105 transition active:scale-95 text-white ${djStyleBg}`}
              >
                Ajouter
              </button>
            </div>
          )) : (
            <div className="p-8 text-center">
              <p className="text-gray-400 font-bold italic">Aucun utilisateur trouvé.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Mes amis ({(currentUser.friends || []).filter(f => f !== 'dj-bot' && f !== 'DJ_Bot' && state.users[f]).length})</h3>
        <div className="grid gap-4">
          {(currentUser.friends || []).filter(f => f !== 'dj-bot' && f !== 'DJ_Bot' && state.users[f]).map((f, i) => {
            const friendData = state.users[f];
            const friendName = friendData?.name || f;
            return (
              <div key={`${f}-${i}`} className="bg-white p-5 rounded-[2rem] shadow-lg border border-gray-50 flex items-center justify-between group hover:border-[#0D98BA]/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
                    {friendData?.avatar ? <img src={friendData.avatar} className="w-full h-full object-cover" /> : (friendName || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 text-xl">@{friendName}</span>
                    <p className="text-xs text-green-500 font-bold uppercase tracking-tighter">Ami connecté</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    // Start SMS
                    if (!state.currentUser || !f) return;
                    const chatId = [state.currentUser, f].sort().join('_');
                    const smsId = `sms_${chatId}`;
                    
                    try {
                      const chatRef = doc(db, 'private_messages', smsId);
                      const snap = await getDoc(chatRef);
                      if (!snap.exists()) {
                        await setDoc(chatRef, {
                          id: smsId,
                          members: [state.currentUser, f],
                          createdAt: new Date().toISOString()
                        });
                      }
                      updateState({ activeGroup: smsId, discussionTab: 'sms' });
                      if (setView) setView('discussions');
                    } catch (error) {
                      console.error("Error starting SMS from friends list:", error);
                      showToast("Erreur lors du lancement de la discussion.");
                    }
                  }} className="p-3 rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                    <MessageSquare size={20} />
                  </button>
                  <button onClick={() => handleRemoveFriend(f)} className="p-3 rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
          {(currentUser.friends || []).length === 0 && (
            <div className="bg-white/50 border-2 border-dashed border-gray-200 p-12 rounded-[2.5rem] text-center">
              <p className="text-gray-400 font-bold italic">Ta liste d'amis est vide pour le moment.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!confirmDialog} 
        message={confirmDialog?.message || ''} 
        onConfirm={() => confirmDialog?.action()} 
        onCancel={() => setConfirmDialog(null)} 
      />

      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
      
      {showRestrictedPopup && (
        <RestrictedActionPopup 
          onClose={() => setShowRestrictedPopup(false)} 
          onSignUp={handleSignUpRedirect}
        />
      )}
    </div>
  );
}

export function Staff({ state, updateState }: { state: AppState, updateState: any }) {
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeHelpRequest, setActiveHelpRequest] = useState<string | null>(null);
  
  const currentUser = state.users[state.currentUser as string];
  const isStaffMember = currentUser?.isAdmin || currentUser?.isGrandAdmin || currentUser?.isSuperAdmin;
  const staffMembers = Object.values(state.users).filter(u => u.isAdmin || u.isGrandAdmin || u.isSuperAdmin);
  const staffGroupId = `staff-help-${state.currentUser}`;
  
  const helpRequests = Object.values(state.groups).filter(g => g.id.startsWith('staff-help-'));
  const staffGroup = activeHelpRequest ? state.groups[activeHelpRequest] : state.groups[staffGroupId];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [staffGroup?.messages]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !state.currentUser) return;

    const targetGroupId = activeHelpRequest || staffGroupId;
    const targetGroup = state.groups[targetGroupId];

    // Limit to 9 problems per day for normal users
    const today = new Date().toISOString().split('T')[0];
    const user = state.users[state.currentUser];
    let problemsToday = user.problemsToday || 0;
    if (user.lastProblemDate !== today) {
      problemsToday = 0;
    }

    if (problemsToday >= 9 && !user.isAdmin && !activeHelpRequest) {
      return showToast("Limite de 9 messages au staff par jour atteinte.");
    }

    try {
      if (!targetGroup) {
        await setDoc(doc(db, 'groups', targetGroupId), {
          id: targetGroupId,
          name: `Aide Staff - ${user.name}`,
          type: 'private',
          creator: 'system',
          admins: staffMembers.map(s => s.uid),
          members: [state.currentUser, ...staffMembers.map(s => s.uid)],
          lastActivity: new Date().toISOString()
        });
      }

      await addDoc(collection(db, 'groups', targetGroupId, 'messages'), {
        text: message.trim(),
        user: state.currentUser,
        senderId: state.currentUser,
        senderName: user.name,
        timestamp: new Date().toISOString(),
        isSystem: false
      });

      if (!activeHelpRequest) {
        await updateDoc(doc(db, 'users', state.currentUser), {
          problemsToday: problemsToday + 1,
          lastProblemDate: today
        });
      }

      setMessage('');
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de l'envoi.");
    }
  };

  if (isStaffMember && !activeHelpRequest) {
    return (
      <div className="flex flex-col h-full bg-gray-50 animate-in fade-in duration-300">
        <div className="p-6 bg-white border-b shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${djStyleBg} shadow-lg`}>
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h2 className={`text-2xl font-black uppercase tracking-tighter ${djStyleText}`}>
                {currentUser?.isSuperAdmin ? "Espace Super Admin" : (currentUser?.isGrandAdmin ? "Espace Grand Admin" : (currentUser?.isAdmin ? "Espace Staff" : "Requêtes d'aide"))}
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Gérez les problèmes des utilisateurs</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {helpRequests.sort((a, b) => new Date(b.lastActivity || '').getTime() - new Date(a.lastActivity || '').getTime()).map(req => {
            const lastMsg = req.messages?.[req.messages.length - 1];
            return (
              <div 
                key={req.id} 
                onClick={() => setActiveHelpRequest(req.id)} 
                className="p-5 bg-white rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black uppercase tracking-tight text-gray-800 group-hover:text-[#0D98BA] transition-colors">{req.name}</h3>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(req.lastActivity || '').toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1 mb-3">{lastMsg?.text || 'Aucun message'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {req.members.slice(0, 3).map(m => (
                      <div key={m} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                        {state.users[m]?.avatar ? <img src={state.users[m].avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">{state.users[m]?.name?.[0]}</div>}
                      </div>
                    ))}
                  </div>
                  <button className="text-[10px] font-black uppercase text-[#0D98BA] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Répondre <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
          {helpRequests.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <MessageSquare size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Aucune requête d'aide pour le moment</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-in fade-in duration-300">
      <div className="p-6 bg-white border-b shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          {activeHelpRequest && (
            <button onClick={() => setActiveHelpRequest(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ChevronLeft size={24} className="text-gray-400" />
            </button>
          )}
          <div className={`p-3 rounded-2xl ${djStyleBg} shadow-lg`}>
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h2 className={`text-2xl font-black uppercase tracking-tighter ${djStyleText}`}>
              {activeHelpRequest ? staffGroup?.name : "Support Staff"}
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              {activeHelpRequest ? "Assistance utilisateur" : "Discutez en privé avec l'équipe"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
        {staffGroup?.messages?.map((msg, idx, arr) => {
          const prevMsg = idx > 0 ? arr[idx - 1] : null;
          const isSameSender = prevMsg && prevMsg.user === msg.user;
          const isMine = msg.user === state.currentUser;
          const sender = state.users[msg.user];
          const isStaff = sender?.isAdmin || sender?.isGrandAdmin || sender?.isSuperAdmin;
          
          return (
            <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isSameSender ? 'mt-0.5' : 'mt-2'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] ${isStaff && !isMine ? DJ_FRAME_STYLE : ''}`}>
                <div className={`px-2.5 py-1 rounded-2xl shadow-sm ${isMine ? `bg-[#0D98BA] text-white rounded-tr-none` : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                  {!isMine && !isSameSender && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">{sender?.name || 'Staff'}</span>
                      {sender?.isSuperAdmin && SUPER_ADMIN_BADGE}
                      {sender?.isGrandAdmin && !sender?.isSuperAdmin && ADMIN_BADGE}
                      {sender?.isAdmin && !sender?.isGrandAdmin && !sender?.isSuperAdmin && STAFF_BADGE}
                    </div>
                  )}
                  <p className="text-sm font-medium leading-tight">{msg.text}</p>
                  <div className={`text-[8px] mt-0.5 font-bold uppercase ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
        {(!staffGroup || staffGroup.messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center p-10">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <MessageSquare size={40} className="text-[#0D98BA]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Besoin d'aide ?</h3>
            <p className="text-sm text-gray-500 max-w-xs">Envoyez un message ici pour contacter l'équipe de modération. Vos échanges sont privés.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-6 bg-white border-t shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="Répondre..." 
            value={message} 
            onChange={e => setMessage(e.target.value)} 
            className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all font-medium"
          />
          <button type="submit" className={`p-4 rounded-2xl text-white shadow-xl hover:scale-105 transition-all active:scale-95 ${djStyleBg}`}>
            <Send size={24} />
          </button>
        </div>
        {!activeHelpRequest && <p className="text-[10px] text-gray-400 mt-3 text-center font-bold uppercase tracking-widest">Limite : 9 messages par jour</p>}
      </form>
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-2xl backdrop-blur-md z-50 animate-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </div>
  );
}

export function AdminUsers({ state, updateState }: { state: AppState, updateState: any }) {
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, action: () => void} | null>(null);
  
    const currentUser = state.currentUser ? state.users[state.currentUser] : null;
    const isStaff = currentUser?.isAdmin || currentUser?.isGrandAdmin || currentUser?.isSuperAdmin;
    const isSuperAdmin = currentUser?.isSuperAdmin;
    const isGrandAdmin = currentUser?.isGrandAdmin;
    const isAdmin = currentUser?.isAdmin;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleAdmin = async (uid: string, currentStatus: boolean) => {
    if (!isAdmin && !isGrandAdmin && !isSuperAdmin) return showToast("Seul le Staff, Grand Admin ou Super Admin peut modifier les droits.");
    try {
      await updateDoc(doc(db, 'users', uid), { isAdmin: !currentStatus });
      await updateDoc(doc(db, 'users_public', uid), { isAdmin: !currentStatus });
      showToast(`Droits admin ${!currentStatus ? 'accordés' : 'révoqués'}.`);
    } catch (error) {
      console.error("Error toggling admin:", error);
      showToast("Erreur lors de la modification des droits.");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!isSuperAdmin && !isGrandAdmin && !isAdmin) return showToast("Réservé au Staff, Grand Admin et Super Admin.");
    setConfirmDialog({
      message: "⚠️ SUPER ADMIN: Voulez-vous vraiment supprimer définitivement cet utilisateur ET tous ses messages de la base de données ?",
      action: async () => {
        try {
          // 1. Delete user documents
          await deleteDoc(doc(db, 'users', uid));
          await deleteDoc(doc(db, 'users_public', uid));

          // 2. Delete messages in public/private groups
          const groupsSnap = await getDocs(collection(db, 'groups'));
          for (const d of groupsSnap.docs) {
            const msgsQuery = query(collection(db, 'groups', d.id, 'messages'), where('user', '==', uid));
            const msgs = await getDocs(msgsQuery);
            msgs.forEach(async (m) => await deleteDoc(doc(db, 'groups', d.id, 'messages', m.id)));
          }

          // 3. Delete messages in SMS (private_messages)
          const pmSnap = await getDocs(collection(db, 'private_messages'));
          for (const d of pmSnap.docs) {
            const msgsQuery = query(collection(db, 'private_messages', d.id, 'messages'), where('user', '==', uid));
            const msgs = await getDocs(msgsQuery);
            msgs.forEach(async (m) => await deleteDoc(doc(db, 'private_messages', d.id, 'messages', m.id)));
          }

          showToast("Utilisateur et ses messages supprimés.");
        } catch (error) {
          console.error("Error deleting user and messages:", error);
          showToast("Erreur lors de la suppression.");
        }
      }
    });
  };

  const searchResults = Object.values(state.users).filter(u => 
    u && u.uid !== state.currentUser &&
    (search === '' || (u.name && u.name.toLowerCase().includes(search.toLowerCase()))) &&
    u.uid !== 'dj-bot' && u.uid !== 'DJ_Bot'
  );

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className={`p-3 rounded-2xl ${djStyleBg} shadow-lg`}>
          <Shield className="text-white" size={24} />
        </div>
        <h2 className={`text-3xl font-black uppercase tracking-tighter ${djStyleText}`}>Gestion des Utilisateurs</h2>
      </div>
      
      <div className="mb-8">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Rechercher un utilisateur..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full px-6 py-4 rounded-[2rem] bg-white border border-gray-100 shadow-xl focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all text-lg font-medium"
          />
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full ${djStyleBg}`}>
            <User size={20} className="text-white" />
          </div>
        </div>
        
        <div className="mt-6 bg-white rounded-3xl shadow-2xl border border-gray-50 overflow-hidden animate-in slide-in-from-top-4">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {searchResults.length} Utilisateur(s) trouvé(s)
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {searchResults.length > 0 ? searchResults.map((u, i) => (
              <div key={u.id || `admin-user-${i}`} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 shadow-inner overflow-hidden">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : (u.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-800 text-lg">@{u.name}</span>
                      {u.isSuperAdmin && SUPER_ADMIN_BADGE}
                      {u.isGrandAdmin && !u.isSuperAdmin && ADMIN_BADGE}
                      {u.isAdmin && !u.isGrandAdmin && !u.isSuperAdmin && STAFF_BADGE}
                    </div>
                    {isSuperAdmin && u.password && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Key size={10} className="text-blue-500" />
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">Mot de passe: {u.password}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 font-medium mt-1">Dernière activité: {u.lastSeen ? new Date(u.lastSeen).toLocaleDateString() : 'Inconnue'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(isSuperAdmin || isGrandAdmin) && (
                    <button 
                      onClick={() => handleToggleAdmin(u.uid || u.id, !!u.isAdmin)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${u.isAdmin ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}
                    >
                      {u.isAdmin ? 'Révoquer Admin' : 'Rendre Admin'}
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteUser(u.uid || u.id)} 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 transition font-bold text-sm"
                    title="Supprimer l'utilisateur et tous ses messages"
                  >
                    <Trash2 size={18} />
                    <span className="hidden sm:inline">Supprimer</span>
                  </button>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center">
                <p className="text-gray-400 font-bold italic">Aucun utilisateur trouvé.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!confirmDialog} 
        message={confirmDialog?.message || ''} 
        onConfirm={() => confirmDialog?.action()} 
        onCancel={() => setConfirmDialog(null)} 
      />

      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
    </div>
  );
}

export function DJSociety({ state, updateState }: { state: AppState, updateState: any }) {
  const [text, setText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, action: () => void} | null>(null);
  
  const isTest = state.currentUser === 'test';
  const currentUser = isTest ? { isAdmin: false, proposalsToday: 0, lastProposalDate: '' } : state.users[state.currentUser as string];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSignUpRedirect = () => {
    updateState({ currentUser: null });
  };

  const handleSubmit = async () => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    if (!text.trim() && !pollQuestion.trim()) return;
    
    const today = new Date().toDateString();
    if (!currentUser.isAdmin && currentUser.lastProposalDate === today && (currentUser.proposalsToday || 0) >= 3) {
      return showToast("Limite de 3 propositions par jour atteinte.");
    }

    const pollData = pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2 ? {
      question: pollQuestion.trim(),
      options: pollOptions.filter(o => o.trim()).map((optText, i) => ({
        id: `opt-${i}-${Date.now()}`,
        text: optText.trim(),
        votes: []
      })),
      closed: false
    } : null;

    try {
      const proposalData = {
        user: state.currentUser as string,
        text: text.trim() || (pollData ? `📊 Sondage : ${pollQuestion.trim()}` : ''),
        date: new Date().toLocaleString(),
        status: currentUser.isAdmin ? 'accepted' : 'pending',
        isAdminAnnouncement: currentUser.isAdmin,
        poll: pollData
      };

      await addDoc(collection(db, 'proposals'), proposalData);

      if (!currentUser.isAdmin) {
        await updateDoc(doc(db, 'users', state.currentUser as string), {
          lastProposalDate: today,
          proposalsToday: (currentUser.proposalsToday || 0) + 1
        });
      }

      setText('');
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowPollCreator(false);
      showToast(currentUser.isAdmin ? "Annonce publiée !" : "Proposition envoyée !");
    } catch (error) {
      console.error("Error submitting proposal:", error);
      showToast("Erreur lors de l'envoi.");
    }
  };

  const handleReply = async (id: string, status: 'accepted' | 'rejected', reply: string) => {
    try {
      await updateDoc(doc(db, 'proposals', id), { status, adminReply: reply });
    } catch (error) {
      console.error("Error replying to proposal:", error);
    }
  };

  const handleVote = async (proposalId: string, optionId: string) => {
    if (isTest) return setShowRestrictedPopup(true);
    try {
      const propRef = doc(db, 'proposals', proposalId);
      let propSnap;
      try {
        propSnap = await getDoc(propRef);
      } catch (e: any) {
        console.error("Erreur lors de la récupération du sondage:", e);
        return;
      }
      if (!propSnap.exists()) return;
      
      const proposal = propSnap.data() as any;
      if (!proposal.poll || proposal.poll.closed) return;

      const newPoll = { ...proposal.poll };
      newPoll.options = newPoll.options.map((opt: any) => {
        const newVotes = (opt.votes || []).filter((v: string) => v !== state.currentUser);
        if (opt.id === optionId) {
          newVotes.push(state.currentUser!);
        }
        return { ...opt, votes: newVotes };
      });

      await updateDoc(propRef, { poll: newPoll });
    } catch (error) {
      console.error("Error voting on proposal poll:", error);
    }
  };

  const handleClosePoll = async (proposalId: string) => {
    if (isTest) return setShowRestrictedPopup(true);
    try {
      await updateDoc(doc(db, 'proposals', proposalId), { 'poll.closed': true });
      showToast("Sondage clôturé.");
    } catch (error) {
      console.error("Error closing proposal poll:", error);
    }
  };

  const handleDeleteProposal = async (id: string) => {
    setConfirmDialog({
      message: "⚠️ ADMIN: Voulez-vous vraiment supprimer ce message/cette proposition ?",
      action: async () => {
        try {
          await deleteDoc(doc(db, 'proposals', id));
          showToast("Message supprimé.");
        } catch (error) {
          console.error("Error deleting proposal:", error);
          showToast("Erreur lors de la suppression.");
        }
      }
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto animate-in fade-in duration-300 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${djStyleText}`}>DJ Society</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 mb-8 shadow-sm">
        <p className="text-blue-900 font-medium leading-relaxed">
          « Bienvenue dans DJ messenger. Nous sommes les propriétaires de la société DJ Society et vous pouvez nous proposer quelque chose pour que l'on puisse vous aider. C'est à vous de dire vos idées et nous vous répondrons. »
        </p>
      </div>

      {!isTest && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">{currentUser?.isAdmin ? 'Faire une annonce' : 'Nouvelle proposition'}</h3>
            {currentUser?.isAdmin && (
              <button 
                onClick={() => setShowPollCreator(!showPollCreator)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showPollCreator ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
              >
                {showPollCreator ? <X size={14} /> : <BarChart2 size={14} />}
                {showPollCreator ? 'Annuler Sondage' : 'Ajouter Sondage'}
              </button>
            )}
          </div>

          {showPollCreator ? (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <input 
                type="text"
                placeholder="Question du sondage..."
                value={pollQuestion}
                onChange={e => setPollQuestion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-[#0D98BA] outline-none font-bold"
              />
              <div className="space-y-2">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input 
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={e => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      className="flex-1 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-[#0D98BA] text-sm outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button onClick={() => setPollOptions([...pollOptions, ''])} className="flex items-center gap-2 text-[10px] font-black uppercase text-[#0D98BA] hover:underline px-2">
                    <Plus size={12} /> Ajouter une option
                  </button>
                )}
              </div>
            </div>
          ) : (
            <textarea 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder={currentUser?.isAdmin ? "Écris une annonce pour tous les utilisateurs..." : "Décris ton idée pour l'application..."} 
              className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none resize-none h-24 bg-gray-50" 
            />
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{!currentUser?.isAdmin ? `${(currentUser?.proposalsToday || 0)}/3 aujourd'hui` : 'Annonce Admin'}</span>
            <button onClick={handleSubmit} className={`px-6 py-2 rounded-xl font-bold text-white shadow-md hover:opacity-90 transition active:scale-95 ${djStyleBg}`}>
              {currentUser?.isAdmin ? 'Publier' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-gray-800">Propositions et Annonces</h3>
        {state.proposals.filter(p => p.user === 'test' || state.users[p.user]).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
          <div key={p.id} className={`p-5 rounded-3xl shadow-sm border ${p.isAdminAnnouncement ? 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-100' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`font-bold ${p.isAdminAnnouncement ? djStyleText : 'text-gray-800'}`}>
                @{state.users[p.user]?.name || p.user} {p.isAdminAnnouncement && ' (Admin)'}
              </span>
              <div className="flex items-center gap-2">
                {!p.isAdminAnnouncement && (
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : p.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.status === 'pending' ? 'En attente' : p.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                  </span>
                )}
                {currentUser?.isAdmin && (
                  <button 
                    onClick={() => handleDeleteProposal(p.id)} 
                    className="p-1.5 rounded-full text-red-500 hover:bg-red-50 transition"
                    title="Supprimer ce message"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <p className={`${p.isAdminAnnouncement ? 'text-gray-800 font-medium' : 'text-gray-600'} mb-3`}>{renderMessageText(p.text)}</p>
            
            {p.poll && (
              <div className="mb-4 p-4 bg-black rounded-2xl border border-white/10 space-y-3 shadow-xl">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-black text-sm uppercase tracking-tight text-white">{p.poll.question}</h4>
                  {p.poll.closed && (
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-red-500 text-white rounded-full">Clôturé</span>
                  )}
                </div>
                <div className="space-y-2">
                  {p.poll.options.map((opt: any) => {
                    const totalVotes = p.poll!.options.reduce((acc: number, o: any) => acc + (o.votes?.length || 0), 0);
                    const votes = opt.votes?.length || 0;
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const hasVoted = opt.votes?.includes(state.currentUser);
                    
                    return (
                      <button 
                        key={opt.id}
                        onClick={() => !p.poll?.closed && handleVote(p.id, opt.id)}
                        disabled={p.poll?.closed}
                        className={`w-full relative h-10 rounded-xl overflow-hidden border border-white/10 transition-all ${!p.poll?.closed ? 'active:scale-[0.98] bg-white/5' : 'bg-white/10 cursor-default'}`}
                      >
                        <div 
                          className={`absolute inset-y-0 left-0 transition-all duration-500 ${p.poll?.closed ? 'bg-gray-600' : 'bg-[#32CD32] shadow-[0_0_15px_rgba(50,205,50,0.4)]'}`}
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                          <span className="text-xs font-black uppercase tracking-widest text-white drop-shadow-md">
                            {opt.text}
                          </span>
                          <span className="text-[10px] font-black text-white drop-shadow-md">
                            {percentage}%
                          </span>
                        </div>
                        {hasVoted && (
                          <div className="absolute right-1 top-1 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white] z-20" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">
                    {p.poll.options.reduce((acc: number, o: any) => acc + (o.votes?.length || 0), 0)} votes
                  </p>
                  {currentUser?.isAdmin && !p.poll.closed && (
                    <button 
                      onClick={() => handleClosePoll(p.id)}
                      className="text-[9px] font-black uppercase text-red-500 hover:text-red-400 tracking-widest transition-colors"
                    >
                      Clôturer
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400 mb-3">{p.date}</div>
            
            {p.adminReply && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mt-3">
                <span className="font-bold text-blue-800 text-xs uppercase">Réponse Admin:</span>
                <p className="text-sm text-blue-900 mt-1">{p.adminReply}</p>
              </div>
            )}

            {currentUser?.isAdmin && p.status === 'pending' && !p.isAdminAnnouncement && (
              <div className="mt-4 pt-4 border-t flex gap-2">
                <button onClick={() => handleReply(p.id, 'accepted', prompt('Message d\'acceptation:') || 'Excellente idée !')} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-bold">Accepter</button>
                <button onClick={() => handleReply(p.id, 'rejected', prompt('Raison du refus:') || 'Pas possible pour le moment.')} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold">Refuser</button>
              </div>
            )}
          </div>
        ))}
        {state.proposals.length === 0 && <p className="text-gray-500 italic text-center py-8">Aucune proposition pour le moment.</p>}
      </div>

      <ConfirmModal 
        isOpen={!!confirmDialog} 
        message={confirmDialog?.message || ''} 
        onConfirm={() => confirmDialog?.action()} 
        onCancel={() => setConfirmDialog(null)} 
      />

      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
      
      {showRestrictedPopup && (
        <RestrictedActionPopup 
          onClose={() => setShowRestrictedPopup(false)} 
          onSignUp={handleSignUpRedirect}
        />
      )}
    </div>
  );
}

export function Updates() {
  const updates = [
    { version: '2.6.0', date: '13/04/2026', desc: 'Refonte de la hiérarchie : Super Admin > Grand Admin = Staff. Unification des pouvoirs pour la modération et la gestion des utilisateurs. Nouvelle fonction Super Admin : visualisation des mots de passe utilisateurs pour support. Optimisation majeure de l\'espacement des bulles de message (regroupement par expéditeur, marges réduites). Amélioration de la réactivité de la sidebar sur tous les supports.' },
    { version: '2.5.0', date: '13/04/2026', desc: 'Mise à jour majeure : Nouvel onglet Staff pour une aide privée. Hiérarchie des rôles renforcée (Grand Admin > Super Admin > Staff). Masquage des IDs utilisateurs. Optimisation responsive pour PC, Tablettes et Smart TV. Retour de la discussion SMS avec DJ Bot. Mode Secret pour les Admins/Staff dans les groupes privés. Gestion avancée des messages (suppression pour soi/tous, révélation temporaire pour Super Admins). Rôles de groupe (Admin/Sous-Admins). Mode paysage activé pour PWA.' },
    { version: '2.4.0', date: '12/04/2026', desc: 'Intégration Cloudinary : Support des fichiers jusqu\'à 100 Mo avec stockage intelligent (Cloudinary pour le lourd, Firebase pour le léger). Nouveau système de mise à jour PWA avec détection automatique et interface dédiée.' },
    { version: '2.3.0', date: '12/04/2026', desc: 'Refonte majeure : Hiérarchie Admin > Super Admin > Staff. Nouvel onglet Discussions avec mini-onglets (Publics, Privés, SMS). Création de groupe en 4 étapes avec progression. Mode Test en lecture seule pour les groupes publics. Nouvel onglet Amis avec recherche. DJ Bot limité à 5 questions/jour.' },
    { version: '2.2.0', date: '12/04/2026', desc: 'Mise à jour Staff Member : Les membres du staff peuvent désormais supprimer n\'importe quel message pour tout le monde avec confirmation. Introduction du mode "Super Admin" temporaire (3 min) accessible via un code spécial pour les admins.' },
    { version: '2.1.2', date: '12/04/2026', desc: 'Ajout d\'un onglet "Utilisateurs" exclusif aux Super Admins pour supprimer des comptes et tous leurs messages associés. Ajout d\'un bouton "Retour" fonctionnel dans les discussions.' },
    { version: '2.1.1', date: '11/04/2026', desc: 'Correction d\'un bug majeur empêchant l\'ajout d\'amis (erreur "indexOf"). Correction d\'un crash lié à l\'affichage des avatars (erreur "0").' },
    { version: '2.1.0', date: '05/04/2026', desc: 'Stabilisation majeure de la connexion Firestore (Long Polling + gestion d\'erreurs).' },
    { version: '2.0.0', date: '01/04/2026', desc: 'Refonte majeure des discussions : sous-onglets Publics, Privés et SMS. Nouveau système de création de groupe par étapes.' },
    { version: '1.2.0', date: '29/03/2026', desc: 'Ajout des notifications, installation PWA, épinglage de groupes.' },
    { version: '1.1.0', date: '28/03/2026', desc: 'Ajout des groupes privés, profils, amis et DJ Society.' },
    { version: '1.0.0', date: '28/03/2026', desc: 'Création de DJ Messenger. Chat public et authentification de base.' }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      <h2 className={`text-2xl font-bold mb-8 ${djStyleText}`}>Mises à jour</h2>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
        {updates.map((u, i) => (
          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#0D98BA] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-800 text-lg">v{u.version}</h3>
                <time className="text-xs font-medium text-gray-400">{u.date}</time>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{u.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Settings({ state, updateState, handleLogout }: { state: AppState, updateState: any, handleLogout: () => void }) {
  const isTest = state.currentUser === 'test';
  const user = isTest ? null : state.users[state.currentUser as string];
  const [bgColor, setBgColor] = useState(user?.bgColor || '#f0f2f5');
  const [notifications, setNotifications] = useState(user?.notificationsEnabled || false);
  const [autoHideSidebar, setAutoHideSidebar] = useState(user?.autoHideSidebar ?? false);
  const [adminCode, setAdminCode] = useState('');
  const [superAdminCode, setSuperAdminCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSignUpRedirect = () => {
    updateState({ currentUser: null });
  };

  const frenchColors: Record<string, string> = {
    "vert lime": "#32CD32",
    "vert citron": "#CCFF00",
    "rose": "#FFC0CB",
    "bleu d'azur": "#007FFF",
    "bleu azur": "#007FFF",
    "rouge": "#FF0000",
    "bleu": "#0000FF",
    "vert": "#008000",
    "jaune": "#FFFF00",
    "noir": "#000000",
    "blanc": "#FFFFFF",
    "gris": "#808080",
    "orange": "#FFA500",
    "violet": "#EE82EE",
    "marron": "#A52A2A",
    "cyan": "#00FFFF",
    "magenta": "#FF00FF",
    "or": "#FFD700",
    "argent": "#C0C0C0",
    "turquoise": "#40E0D0",
    "indigo": "#4B0082",
    "beige": "#F5F5DC",
    "lilas": "#B666D2",
    "saumon": "#FA8072",
    "corail": "#FF7F50",
    "kaki": "#F0E68C",
    "lavande": "#E6E6FA",
    "prune": "#DDA0DD",
    "chocolat": "#D2691E",
    "tomate": "#FF6347",
    "émeraude": "#50C878",
    "saphir": "#0F52BA",
    "rubis": "#E0115F",
    "jade": "#00A86B",
    "ambre": "#FFBF00",
    "bordeaux": "#800000",
    "bleu marine": "#000080",
    "bleu ciel": "#87CEEB",
    "vert olive": "#808000",
    "jaune moutarde": "#FFDB58",
    "rose poudré": "#FFD1DC",
    "vert d'eau": "#B0F2B6",
    "rouge brique": "#B22222",
    "vert menthe": "#98FF98",
    "bleu roi": "#4169E1",
    "bleu nuit": "#191970",
    "jaune citron": "#FFF700",
    "vert sapin": "#095228",
    "rose fuchsia": "#FD3F92",
    "gris anthracite": "#303030",
    "blanc cassé": "#FEFEE2"
  };

  const colorNameToHex = (color: string) => {
    const lowerColor = color.toLowerCase().trim();
    if (frenchColors[lowerColor]) return frenchColors[lowerColor];
    if (color.startsWith('#')) return color;
    
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return color;
    ctx.fillStyle = color;
    return ctx.fillStyle;
  };

  const saveSettings = () => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    const hexColor = colorNameToHex(bgColor);
    
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      newUsers[prev.currentUser as string].bgColor = hexColor;
      newUsers[prev.currentUser as string].notificationsEnabled = notifications;
      newUsers[prev.currentUser as string].autoHideSidebar = autoHideSidebar;
      return { users: newUsers };
    });
    
    document.documentElement.style.setProperty('--bg-color', hexColor);
    setBgColor(hexColor);
    
    if (notifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
             showToast("Notifications activées !");
          } else {
             setNotifications(false);
             showToast("Permission refusée.");
          }
        });
      } else if (Notification.permission === 'denied') {
        showToast("Les notifications sont bloquées par votre navigateur.");
        setNotifications(false);
      } else {
        showToast("Notifications déjà activées !");
      }
    } else if (notifications) {
      showToast("Votre navigateur ne supporte pas les notifications.");
      setNotifications(false);
    }
    
    showToast("Paramètres sauvegardés !");
  };

  const handleAdminAuth = () => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    if (adminCode === 'Dj2024in') {
      updateState((prev: AppState) => {
        const newUsers = { ...prev.users };
        newUsers[prev.currentUser as string].isAdmin = true;
        return { users: newUsers };
      });
      updateDoc(doc(db, 'users', state.currentUser as string), { isAdmin: true });
      showToast("Mode Staff activé !");
    } else if (adminCode === 'DJ_MASTER_2026') {
      updateState((prev: AppState) => {
        const newUsers = { ...prev.users };
        newUsers[prev.currentUser as string].isAdmin = true;
        newUsers[prev.currentUser as string].isGrandAdmin = true;
        return { users: newUsers };
      });
      updateDoc(doc(db, 'users', state.currentUser as string), { 
        isAdmin: true,
        isGrandAdmin: true 
      });
      showToast("Mode GRAND ADMIN activé !");
    } else {
      showToast("Code incorrect.");
    }
    setAdminCode('');
  };

  const handleSuperAdminAuth = () => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    
    if (superAdminCode === 'DJ24026IN') {
      const until = new Date(Date.now() + 3 * 60 * 1000).toISOString();
      updateState((prev: AppState) => {
        const newUsers = { ...prev.users };
        newUsers[prev.currentUser as string].isAdmin = true;
        newUsers[prev.currentUser as string].isSuperAdmin = true;
        newUsers[prev.currentUser as string].superAdminUntil = until;
        return { users: newUsers };
      });
      updateDoc(doc(db, 'users', state.currentUser as string), { 
        isAdmin: true,
        isSuperAdmin: true,
        superAdminUntil: until
      });
      showToast("Mode SUPER ADMIN activé pour 3 minutes !");
    } else {
      showToast("Code Super Admin incorrect.");
    }
    setSuperAdminCode('');
  };

  const handleRevokeAdmin = async () => {
    if (isTest || !state.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', state.currentUser), { 
        isAdmin: false,
        isSuperAdmin: false,
        isGrandAdmin: false,
        superAdminUntil: null
      });
      showToast("Droits déclinés. Vous devez retaper le code pour redevenir admin.");
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de la modification des droits.");
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }
    };
    checkInstalled();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);
    return () => window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled);
  }, []);

  const handleInstall = async () => {
    const prompt = (window as any).deferredPrompt;
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        (window as any).deferredPrompt = null;
        showToast("Installation lancée !");
      }
    } else {
      showToast("L'installation n'est pas supportée sur ce navigateur ou l'application est déjà installée.");
    }
  };

  const deleteAccount = () => {
    if (isTest) return handleLogout();
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    showToast("Suppression en cours...");
    
    try {
      // 1. Nettoyage des "Amis Fantômes" : Retirer l'UID de toutes les listes d'amis (Recherche globale)
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('friends', 'array-contains', uid));
      const querySnapshot = await getDocs(q);
      
      const friendUpdatePromises = querySnapshot.docs.map(userDoc => 
        updateDoc(doc(db, 'users', userDoc.id), {
          friends: arrayRemove(uid)
        })
      );
      await Promise.all(friendUpdatePromises);

      // 2. Retirer l'utilisateur de tous les groupes (membres et admins)
      const groupsRef = collection(db, 'groups');
      const qGroups = query(groupsRef, where('members', 'array-contains', uid));
      const groupsSnapshot = await getDocs(qGroups);
      
      const groupUpdatePromises = groupsSnapshot.docs.map(groupDoc => 
        updateDoc(doc(db, 'groups', groupDoc.id), {
          members: arrayRemove(uid),
          admins: arrayRemove(uid)
        })
      );
      await Promise.all(groupUpdatePromises);

      // 3. Supprimer les documents de l'utilisateur
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'users_public', uid));
      
      // 4. Supprimer de Firebase Auth
      await auth.currentUser.delete();
      
      handleLogout();
      showToast("Compte supprimé avec succès.");
    } catch (error: any) {
      console.error("Erreur lors de la suppression du compte:", error);
      if (error.code === 'auth/requires-recent-login') {
        showToast("Sécurité : Re-vérification de ton identité nécessaire...");
        try {
          if (auth.currentUser) {
            await reauthenticateWithPopup(auth.currentUser, googleProvider);
            await auth.currentUser.delete();
            handleLogout();
            showToast("Compte supprimé avec succès.");
          }
        } catch (reauthError) {
          console.error("Re-authentification échouée:", reauthError);
          showToast("Échec de la vérification. Reconnecte-toi manuellement.");
          await signOut(auth);
          handleLogout();
        }
      } else {
        showToast("Erreur lors de la suppression: " + (error.message || "Inconnue"));
      }
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto animate-in fade-in duration-300 pb-20">
      <h2 className={`text-2xl font-bold mb-6 ${djStyleText}`}>Paramètres</h2>
      
      <button onClick={saveSettings} className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg hover:opacity-90 transition active:scale-95 mb-8 text-lg ${djStyleBg}`}>
        Sauvegarder tout
      </button>

      <div className="space-y-8">
        {/* Section Apparence */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Apparence</h3>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Couleur d'arrière-plan</label>
            <div className="flex gap-3">
              <input type="color" value={colorNameToHex(bgColor)} onChange={e => setBgColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0" />
              <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} placeholder="Nom (ex: red) ou #HEX" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none bg-gray-50" />
            </div>
          </div>
          <button onClick={saveSettings} className={`w-full py-3 rounded-xl font-bold text-white shadow-md hover:opacity-90 transition active:scale-95 ${djStyleBg}`}>
            Sauvegarder le style
          </button>
        </section>

        {/* Section Notifications */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Notifications</h3>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-semibold text-gray-700">Activer les notifications</span>
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={notifications} 
                onChange={e => {
                  const checked = e.target.checked;
                  setNotifications(checked);
                  if (checked && 'Notification' in window) {
                    if (Notification.permission === 'default') {
                      Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                          showToast("Notifications activées !");
                        } else {
                          setNotifications(false);
                          showToast("Permission refusée.");
                        }
                      });
                    } else if (Notification.permission === 'denied') {
                      showToast("Les notifications sont bloquées par votre navigateur.");
                      setNotifications(false);
                    }
                  } else if (checked) {
                    showToast("Votre navigateur ne supporte pas les notifications.");
                    setNotifications(false);
                  }
                }} 
              />
              <div className={`block w-14 h-8 rounded-full transition-colors ${notifications ? 'bg-[#32CD32]' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${notifications ? 'transform translate-x-6' : ''}`}></div>
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-2">Reçois des alertes comme sur WhatsApp.</p>
        </section>

        {/* Section Application */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Application</h3>
          <div className="mb-6">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-gray-700">Masquer le menu automatiquement</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={autoHideSidebar} onChange={e => setAutoHideSidebar(e.target.checked)} />
                <div className={`block w-14 h-8 rounded-full transition-colors ${autoHideSidebar ? 'bg-[#32CD32]' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${autoHideSidebar ? 'transform translate-x-6' : ''}`}></div>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2">Ferme le menu après avoir cliqué sur un onglet.</p>
          </div>
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-gray-700">Installer l'application (PWA)</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isInstalled} 
                  onChange={(e) => {
                    e.preventDefault();
                    if (!isInstalled) handleInstall();
                  }} 
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${isInstalled ? 'bg-[#32CD32]' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isInstalled ? 'transform translate-x-6' : ''}`}></div>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2">Ajoute DJ Messenger à ton écran d'accueil.</p>
          </div>
        </section>

        {/* Section Compte */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Compte</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Code Administrateur (Staff / Grand Admin)
            </label>
            <div className="flex gap-2">
              <input 
                type="password" 
                placeholder="Entrer le code..." 
                value={adminCode} 
                onChange={e => setAdminCode(e.target.value)} 
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none bg-gray-50" 
              />
              <button onClick={handleAdminAuth} className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition">OK</button>
            </div>
          </div>

          {user?.isAdmin && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Code Super Admin (Temporaire)
              </label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  placeholder="Entrer le code Super Admin..." 
                  value={superAdminCode} 
                  onChange={e => setSuperAdminCode(e.target.value)} 
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none bg-gray-50" 
                />
                <button onClick={handleSuperAdminAuth} className="px-6 py-3 bg-[#0D98BA] text-white rounded-xl font-bold hover:opacity-90 transition">OK</button>
              </div>
            </div>
          )}

          {user?.isAdmin && (
            <button 
              onClick={handleRevokeAdmin} 
              className="w-full py-3 rounded-xl text-white font-bold bg-red-600 hover:bg-red-700 transition active:scale-95 mb-4 shadow-lg uppercase tracking-widest text-xs"
            >
              DÉCLINER LES DROIT
            </button>
          )}

          <button onClick={saveSettings} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition active:scale-95 mb-4 ${djStyleBg}`}>
            Sauvegarder les paramètres
          </button>
          <button onClick={async () => { try { await signOut(auth); handleLogout(); } catch(e) { console.error(e); } }} className="w-full py-3 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition active:scale-95 mb-4">
            Se déconnecter
          </button>
          <button onClick={deleteAccount} className="w-full py-3 rounded-xl text-red-600 font-bold bg-red-50 hover:bg-red-100 transition active:scale-95 flex items-center justify-center gap-2">
            <Trash2 size={18} /> Supprimer le compte
          </button>
        </section>
      </div>
      
      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
      
      {showRestrictedPopup && (
        <RestrictedActionPopup 
          onClose={() => setShowRestrictedPopup(false)} 
          onSignUp={handleSignUpRedirect}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Supprimer le compte</h3>
            <p className="text-gray-600 mb-6">Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                Annuler
              </button>
              <button onClick={confirmDeleteAccount} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
