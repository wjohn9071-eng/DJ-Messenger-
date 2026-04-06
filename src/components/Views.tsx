import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { djStyleBg, djStyleText } from '../lib/utils';
import { User, Key, ImagePlus, Trash2, MessageSquare, BarChart2, X, Plus, Download } from 'lucide-react';
import { RestrictedActionPopup } from './RestrictedActionPopup';

import { db, auth, doc, updateDoc, signOut, deleteDoc, collection, addDoc, getDoc, setDoc, arrayUnion, arrayRemove } from '../lib/firebase';
import { updateProfile, updatePassword } from 'firebase/auth';

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

export function Profile({ state, updateState }: { state: AppState, updateState: any }) {
  const isTest = state.currentUser === 'test';
  const user = isTest ? null : state.users[state.currentUser as string];
  const [username, setUsername] = useState(user?.name || '');
  const [password, setPassword] = useState('••••••••');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [toast, setToast] = useState<string | null>(null);
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);

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

        const userRef = doc(db, 'users', auth.currentUser.uid);
        const publicRef = doc(db, 'users_public', auth.currentUser.uid);

        try {
          await updateDoc(userRef, {
            name: username,
            avatar: avatar || ''
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
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
        <label className="relative cursor-pointer group">
          <div className="w-40 h-40 rounded-[2.5rem] bg-white border-8 border-white shadow-2xl flex items-center justify-center overflow-hidden group-hover:ring-8 ring-[#0D98BA]/20 transition-all relative">
            {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={64} className="text-gray-200" />}
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ImagePlus className="text-white mb-2" size={32} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Changer</span>
            </div>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </label>
      </div>

      <div className="space-y-6 bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white/50 mb-8">
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Nom d'utilisateur</label>
          <input 
            type="text" 
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
            onClick={handleSave} 
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(13,152,186,0.3)] hover:scale-[1.02] transition active:scale-95 text-white ${djStyleBg}`}
          >
            Enregistrer les modifications
          </button>
        </div>
      </div>

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

  const handleAddFriend = async (friendId: string) => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    if (currentUser.friends.includes(friendId)) return showToast("Déjà dans tes amis.");
    
    try {
      const userRef = doc(db, 'users', state.currentUser as string);
      const friendRef = doc(db, 'users', friendId);
      
      await setDoc(userRef, { friends: arrayUnion(friendId) }, { merge: true });
      await setDoc(friendRef, { friends: arrayUnion(state.currentUser as string) }, { merge: true });
      
      showToast(`${state.users[friendId]?.name || friendId} ajouté aux amis !`);
    } catch (error) {
      console.error("Error adding friend:", error);
      showToast("Erreur lors de l'ajout de l'ami.");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
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

  // The app "doesn't lie": it searches all registered users
  const searchResults = Object.values(state.users).filter(u => 
    u.id !== state.currentUser && 
    (search === '' || u.name.toLowerCase().includes(search.toLowerCase())) &&
    !currentUser.friends.includes(u.id) &&
    u.id !== 'dj-bot' && u.id !== 'DJ_Bot'
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
                  {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name[0].toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-gray-800 text-lg">@{u.name}</span>
                  <p className="text-xs text-gray-400">Utilisateur DJ Messenger</p>
                </div>
              </div>
              <button 
                onClick={() => handleAddFriend(u.id)} 
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
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Mes amis ({currentUser.friends.length})</h3>
        <div className="grid gap-4">
          {currentUser.friends.filter(f => f !== 'dj-bot' && f !== 'DJ_Bot').map((f, i) => {
            const friendData = state.users[f];
            const friendName = friendData?.name || f;
            return (
              <div key={`${f}-${i}`} className="bg-white p-5 rounded-[2rem] shadow-lg border border-gray-50 flex items-center justify-between group hover:border-[#0D98BA]/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
                    {friendData?.avatar ? <img src={friendData.avatar} className="w-full h-full object-cover" /> : friendName[0].toUpperCase()}
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
          {currentUser.friends.length === 0 && (
            <div className="bg-white/50 border-2 border-dashed border-gray-200 p-12 rounded-[2.5rem] text-center">
              <p className="text-gray-400 font-bold italic">Ta liste d'amis est vide pour le moment.</p>
            </div>
          )}
        </div>
      </div>
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

export function DJSociety({ state, updateState }: { state: AppState, updateState: any }) {
  const [text, setText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  
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
        {state.proposals.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
          <div key={p.id} className={`p-5 rounded-3xl shadow-sm border ${p.isAdminAnnouncement ? 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-100' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`font-bold ${p.isAdminAnnouncement ? djStyleText : 'text-gray-800'}`}>
                @{state.users[p.user]?.name || p.user} {p.isAdminAnnouncement && ' (Admin)'}
              </span>
              {!p.isAdminAnnouncement && (
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : p.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {p.status === 'pending' ? 'En attente' : p.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                </span>
              )}
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
    { version: '2.1.0', date: '05/04/2026', desc: 'Stabilisation majeure de la connexion Firestore (Long Polling + gestion d\'erreurs), correction des avertissements de clés React, amélioration de la navigation mobile et de la cohérence des profils. Refonte esthétique "DJ Style" des formulaires et correction de bugs sur la gestion des amis.' },
    { version: '2.0.0', date: '01/04/2026', desc: 'Refonte majeure des discussions : sous-onglets Publics, Privés et SMS. Nouveau système de création de groupe par étapes avec barre de progression. Recherche d\'amis améliorée et intégration d\'un assistant DJ (Bot) intelligent. Correction du tutoriel et isolation complète de la simulation.' },
    { version: '1.2.0', date: '29/03/2026', desc: 'Ajout des notifications, installation PWA, épinglage de groupes, tutoriel interactif, et refonte des paramètres.' },
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
      showToast("Mode Admin activé !");
    } else {
      showToast("Code incorrect.");
    }
    setAdminCode('');
  };

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
      // Fallback for browsers where beforeinstallprompt isn't supported or fired
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      
      if (isStandalone) {
        showToast("L'application est déjà installée !");
      } else if (isIOS) {
        showToast("Sur iOS, appuyez sur 'Partager' puis 'Sur l'écran d'accueil'.");
      } else {
        showToast("Utilisez le menu de votre navigateur (⋮) pour 'Installer l'application'.");
      }
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteAccount = () => {
    if (isTest) return handleLogout();
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      // 1. Remove from friends' lists using arrayRemove
      const userDoc = state.users[uid];
      if (userDoc && userDoc.friends) {
        for (const friendId of userDoc.friends) {
          const friendRef = doc(db, 'users', friendId);
          await setDoc(friendRef, { friends: arrayRemove(uid) }, { merge: true });
        }
      }

      // 2. Remove from all groups members list
      const groupsToUpdate = Object.values(state.groups).filter(g => g.members.includes(uid));
      for (const group of groupsToUpdate) {
        const groupRef = doc(db, 'groups', group.id);
        await updateDoc(groupRef, {
          members: arrayRemove(uid),
          admins: arrayRemove(uid)
        });
      }

      // 3. Delete user documents
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'users_public', uid));
      
      // 4. Delete from Auth
      await auth.currentUser.delete();
      handleLogout();
      showToast("Compte supprimé avec succès.");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/requires-recent-login') {
        showToast("Sécurité : Reconnecte-toi avant de supprimer ton compte.");
        await signOut(auth);
        handleLogout();
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
              <input type="checkbox" className="sr-only" checked={notifications} onChange={e => setNotifications(e.target.checked)} />
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
          <button onClick={handleInstall} className={`w-full py-3 rounded-xl font-bold text-white shadow-md hover:opacity-90 transition active:scale-95 ${djStyleBg}`}>
            Installer l'application (PWA)
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">Ajoute DJ Messenger à ton écran d'accueil.</p>
        </section>

        {/* Section Compte */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Compte</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Code Administrateur</label>
            <div className="flex gap-2">
              <input type="password" placeholder="Entrer le code..." value={adminCode} onChange={e => setAdminCode(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none bg-gray-50" />
              <button onClick={handleAdminAuth} className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition">OK</button>
            </div>
          </div>

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
