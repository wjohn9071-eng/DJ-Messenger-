import React, { useState, useRef, useEffect } from 'react';
import { AppState, Message, Group } from '../types';
import { djStyleBg, djStyleText } from '../lib/utils';
import { Send, Trash2, Shield, UserX, Plus, Hash, Lock, MessageSquare } from 'lucide-react';
import { RestrictedActionPopup } from './RestrictedActionPopup';

export function Discussions({ state, updateState }: { state: AppState, updateState: any }) {
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'sms' | 'recent'>(state.discussionTab || (state.newMessages && state.newMessages.length > 0 ? 'recent' : 'public'));
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);

  useEffect(() => {
    if (state.discussionTab) {
      setActiveTab(state.discussionTab);
    }
  }, [state.discussionTab]);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupReason, setNewGroupReason] = useState('informer');
  const [newGroupReasonDetail, setNewGroupReasonDetail] = useState('');
  const [newGroupInvite, setNewGroupInvite] = useState<string[]>([]);
  const [newGroupCode, setNewGroupCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<{msgId: string, user: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTest = state.currentUser === 'test';
  const currentUser = (isTest || !state.users || !state.currentUser) ? null : state.users[state.currentUser as string];

  const handleSignUpRedirect = () => {
    updateState({ currentUser: null });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Clear notification for active group and update last read timestamp
    if (activeGroup && state.groups && state.groups[activeGroup]) {
      setTimeout(() => {
        updateState((prev: AppState) => {
          const newMessages = prev.newMessages?.filter(id => id !== activeGroup) || [];
          const newUsers = { ...prev.users };
          if (prev.currentUser && newUsers[prev.currentUser]) {
            const user = { ...newUsers[prev.currentUser] };
            user.lastReadTimestamps = {
              ...(user.lastReadTimestamps || {}),
              [activeGroup]: new Date().toISOString()
            };
            newUsers[prev.currentUser] = user;
          }
          return { newMessages, users: newUsers };
        });
      }, 0);
    }
  }, [state.groups?.[activeGroup || '']?.messages, activeGroup]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    if (!activeGroup || !messageInput.trim()) return;

    const group = state.groups?.[activeGroup];
    if (!group) return;
    if (group.banned.includes(state.currentUser as string)) return showToast("Tu es banni de ce groupe.");
    if (group.muted.includes(state.currentUser as string)) return showToast("Tu es muet dans ce groupe.");

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user: state.currentUser as string,
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString()
    };

    updateState((prev: AppState) => ({
      groups: {
        ...prev.groups,
        [activeGroup]: {
          ...prev.groups[activeGroup],
          messages: [...prev.groups[activeGroup].messages, newMsg]
        }
      }
    }));
    setMessageInput('');
  };

  const handleCreateGroup = () => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    if (!newGroupName.trim()) return showToast("Nom du groupe requis.");

    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newGroup: Group = {
      id: groupId,
      type: activeTab === 'public' ? 'public' : 'private',
      name: newGroupName,
      reason: newGroupReason,
      reasonDetail: newGroupReasonDetail,
      creator: state.currentUser as string,
      admins: [state.currentUser as string],
      members: [state.currentUser as string, ...newGroupInvite],
      banned: [],
      muted: [],
      code: activeTab === 'private' ? newGroupCode : undefined,
      messages: [{ 
        id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        user: 'Système', 
        text: `Groupe ${newGroupName} créé !`, 
        time: new Date().toLocaleTimeString(), 
        timestamp: new Date().toISOString(),
        isSystem: true 
      }]
    };

    updateState((prev: AppState) => ({
      groups: { ...prev.groups, [groupId]: newGroup }
    }));
    setShowCreateGroup(false);
    setWizardStep(1);
    setNewGroupName('');
    setNewGroupReason('informer');
    setNewGroupReasonDetail('');
    setNewGroupInvite([]);
    setNewGroupCode('');
    setActiveGroup(groupId);
    showToast("Groupe créé !");
  };

  const renderWizard = () => {
    const progress = (wizardStep / 4) * 100;
    const reasons = [
      { id: 'informer', label: 'Pour informer' },
      { id: 'converser', label: 'Pour converser' },
      { id: 'etudier', label: 'Pour étudier' },
      { id: 'club', label: 'Pour créer un club' },
      { id: 'autre', label: 'Autres' }
    ];

    return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-8 duration-500 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-black uppercase tracking-tighter ${djStyleText}`}>Créer un groupe {activeTab === 'public' ? 'Public' : 'Privé'}</h3>
          <button onClick={() => { setShowCreateGroup(false); setWizardStep(1); }} className="text-gray-400 hover:text-gray-600">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">
            <span>Progression</span>
            <span>Étape {wizardStep}/4</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
            <div className={`${djStyleBg} h-full transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {wizardStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Nom du groupe</label>
              <input 
                type="text" 
                placeholder="Ex: Les Fans de DJ..." 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)} 
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all text-lg font-bold" 
              />
            </div>
            <button onClick={() => newGroupName.trim() ? setWizardStep(2) : showToast("Nom requis")} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-all active:scale-95 ${djStyleBg}`}>
              Continuer
            </button>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Raison de la création</label>
              <div className="grid grid-cols-1 gap-2">
                {reasons.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setNewGroupReason(r.id)}
                    className={`px-6 py-3 rounded-xl border-2 font-bold transition-all text-left flex justify-between items-center ${newGroupReason === r.id ? 'border-[#0D98BA] bg-blue-50 text-[#0D98BA]' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}
                  >
                    {r.label}
                    {newGroupReason === r.id && <div className="w-2 h-2 rounded-full bg-[#0D98BA]" />}
                  </button>
                ))}
              </div>
              {newGroupReason === 'autre' && (
                <input 
                  type="text" 
                  placeholder="Précisez l'utilité (optionnel)..." 
                  value={newGroupReasonDetail} 
                  onChange={e => setNewGroupReasonDetail(e.target.value)} 
                  className="w-full mt-3 px-6 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white outline-none transition-all font-medium" 
                />
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setWizardStep(1)} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Retour</button>
              <button onClick={() => setWizardStep(activeTab === 'private' ? 3 : 4)} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-all active:scale-95 ${djStyleBg}`}>Suivant</button>
            </div>
          </div>
        )}

        {wizardStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Inviter des membres (Optionnel)</label>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {Object.keys(state.users).filter(u => u !== state.currentUser && u !== 'DJ_Bot').map(u => (
                  <label key={u} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${newGroupInvite.includes(u) ? 'border-[#0D98BA] bg-blue-50' : 'border-gray-50 hover:border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xs">
                        {state.users[u].avatar ? <img src={state.users[u].avatar!} className="w-full h-full rounded-full object-cover" /> : u[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-700">@{u}</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-gray-300 text-[#0D98BA] focus:ring-[#0D98BA]"
                      checked={newGroupInvite.includes(u)} 
                      onChange={e => e.target.checked ? setNewGroupInvite([...newGroupInvite, u]) : setNewGroupInvite(newGroupInvite.filter(i => i !== u))} 
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setWizardStep(2)} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Retour</button>
              <button onClick={() => setWizardStep(4)} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-all active:scale-95 ${djStyleBg}`}>Suivant</button>
            </div>
          </div>
        )}

        {wizardStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Code d'entrée (5 caractères)</label>
              <p className="text-[10px] text-gray-400 mb-3 italic">Mélangez majuscules, minuscules, chiffres et symboles (ex: A1b2!).</p>
              <input 
                type="text" 
                placeholder="Code secret" 
                maxLength={5} 
                value={newGroupCode} 
                onChange={e => setNewGroupCode(e.target.value)} 
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all text-2xl font-black text-center tracking-[0.5em] font-mono" 
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setWizardStep(activeTab === 'private' ? 3 : 2)} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Retour</button>
              <button onClick={handleCreateGroup} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-all active:scale-95 ${djStyleBg}`}>Créer le groupe</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleJoinPrivateGroup = () => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    const group = Object.values(state.groups).find(g => g.type === 'private' && g.code === joinCode);
    if (!group) return showToast("Code invalide.");
    if (group.members.includes(state.currentUser as string)) return showToast("Déjà membre.");
    if (group.banned.includes(state.currentUser as string)) return showToast("Tu es banni de ce groupe.");

    updateState((prev: AppState) => {
      const newGroups = { ...prev.groups };
      newGroups[group.id] = {
        ...newGroups[group.id],
        members: [...newGroups[group.id].members, prev.currentUser as string]
      };
      return { groups: newGroups };
    });
    setJoinCode('');
    setActiveGroup(group.id);
    showToast(`Bienvenue dans ${group.name} !`);
  };

  const handleTabChange = (tab: 'public' | 'private' | 'sms' | 'recent') => {
    if (isTest && (tab === 'private' || tab === 'sms')) {
      setShowRestrictedPopup(true);
      return;
    }
    setActiveTab(tab);
    updateState({ discussionTab: tab });
  };

  const handleDeleteMessage = (msgId: string) => {
    if (!activeGroup || !state.groups || !state.groups[activeGroup]) return;
    const group = state.groups[activeGroup];
    const msg = group.messages?.find(m => m.id === msgId);
    if (!msg) return;

    const isDeletedAccount = !state.users || !state.users[msg.user];
    const user = state.users && state.currentUser ? state.users[state.currentUser as string] : null;
    const canDelete = msg.user === state.currentUser || group.admins.includes(state.currentUser as string) || user?.isAdmin || isDeletedAccount;
    
    if (!canDelete) return showToast("Non autorisé.");

    if (isDeletedAccount) {
      setDeletePrompt({ msgId, user: msg.user });
      return;
    }

    updateState((prev: AppState) => {
      const newGroups = { ...prev.groups };
      newGroups[activeGroup] = {
        ...newGroups[activeGroup],
        messages: newGroups[activeGroup].messages.filter(m => m.id !== msgId)
      };
      return { groups: newGroups };
    });
  };

  const confirmDeleteAll = () => {
    if (!deletePrompt || !activeGroup) return;
    updateState((prev: AppState) => {
      const newGroups = { ...prev.groups };
      newGroups[activeGroup] = {
        ...newGroups[activeGroup],
        messages: newGroups[activeGroup].messages.filter(m => m.user !== deletePrompt.user)
      };
      return { groups: newGroups };
    });
    setDeletePrompt(null);
  };

  const confirmDeleteOne = () => {
    if (!deletePrompt || !activeGroup) return;
    updateState((prev: AppState) => {
      const newGroups = { ...prev.groups };
      newGroups[activeGroup] = {
        ...newGroups[activeGroup],
        messages: newGroups[activeGroup].messages.filter(m => m.id !== deletePrompt.msgId)
      };
      return { groups: newGroups };
    });
    setDeletePrompt(null);
  };

  const handleBanUser = (userToBan: string) => {
    if (!activeGroup || !state.groups || !state.groups[activeGroup]) return;
    const group = state.groups[activeGroup];
    if (!group.admins.includes(state.currentUser as string) && !currentUser?.isAdmin) return showToast("Non autorisé.");
    if (userToBan === group.creator) return showToast("Impossible de bannir le créateur.");

    updateState((prev: AppState) => {
      const newGroups = { ...prev.groups };
      newGroups[activeGroup] = {
        ...newGroups[activeGroup],
        banned: [...newGroups[activeGroup].banned, userToBan],
        members: newGroups[activeGroup].members.filter(m => m !== userToBan)
      };
      return { groups: newGroups };
    });
    showToast(`${userToBan} banni.`);
  };

  const handlePinGroup = () => {
    if (isTest || !activeGroup) return;
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      const user = { ...newUsers[prev.currentUser as string] };
      const pinned = user.pinnedGroups ? [...user.pinnedGroups] : [];
      
      if (pinned.includes(activeGroup)) {
        user.pinnedGroups = pinned.filter(id => id !== activeGroup);
        showToast("Groupe désépinglé.");
      } else {
        user.pinnedGroups = [...pinned, activeGroup];
        showToast("Groupe épinglé !");
      }
      newUsers[prev.currentUser as string] = user;
      return { users: newUsers };
    });
  };

  const visibleGroups = Object.values(state.groups || {}).filter(g => {
    if (activeTab === 'public') return g.type === 'public';
    if (activeTab === 'private') {
      // For private tab, show groups that are NOT direct messages (more than 2 members or has a code)
      return g.type === 'private' && 
             (g.members.includes(state.currentUser as string) || currentUser?.isAdmin) &&
             (g.members.length > 2 || g.code);
    }
    if (activeTab === 'sms') {
      // For SMS tab, show direct messages (exactly 2 members, no code)
      return g.type === 'private' && 
             g.members.includes(state.currentUser as string) &&
             g.members.length === 2 &&
             !g.code;
    }
    return false; // Recent handled separately
  }).sort((a, b) => {
    const aPinned = currentUser?.pinnedGroups?.includes(a.id) ? 1 : 0;
    const bPinned = currentUser?.pinnedGroups?.includes(b.id) ? 1 : 0;
    return bPinned - aPinned;
  });

  const allRecentMessages = Object.values(state.groups || {})
    .filter(g => (g.type === 'public' || (g.members && g.members.includes(state.currentUser as string)) || currentUser?.isAdmin) && !g.id.startsWith('sms-dj-help-'))
    .map(g => {
      const lastRead = currentUser?.lastReadTimestamps?.[g.id] || '0';
      const newCount = (g.messages || []).filter(m => !m.isSystem && m.timestamp > lastRead).length;
      const lastMsg = (g.messages || []).filter(m => !m.isSystem).slice(-1)[0];
      
      return {
        groupId: g.id,
        groupName: g.name,
        type: g.type,
        lastMessage: lastMsg,
        newCount,
        timestamp: lastMsg?.timestamp || '0'
      };
    })
    .filter(g => g.lastMessage)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (activeGroup && state.groups && state.groups[activeGroup]) {
    const group = state.groups[activeGroup];
    const isAdmin = group.admins?.includes(state.currentUser as string) || currentUser?.isAdmin;
    const isPinned = currentUser?.pinnedGroups?.includes(activeGroup);
    const isSMS = group.type === 'private' && group.members?.length === 2 && !group.code;
    const otherUser = isSMS ? group.members?.find(m => m !== state.currentUser) : null;
    const otherUserData = (otherUser && state.users) ? state.users[otherUser] : null;
    const lastRead = currentUser?.lastReadTimestamps?.[activeGroup] || '0';

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-full bg-[#f9fafb] animate-in slide-in-from-right-8 duration-300">
        <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveGroup(null)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className={`w-10 h-10 rounded-full ${isSMS ? 'bg-gray-100' : 'bg-gradient-to-br from-[#007FFF] to-[#32CD32]'} flex items-center justify-center text-white font-bold shadow-md overflow-hidden`}>
              {isSMS && otherUserData?.avatar ? (
                <img src={otherUserData.avatar} className="w-full h-full object-cover" />
              ) : (
                <span>{(otherUser || group.name)[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 leading-tight">{isSMS ? otherUser : group.name}</h3>
              <p className="text-xs text-gray-500 font-medium">{isSMS ? (otherUserData?.lastSeen ? `Vu ${otherUserData.lastSeen}` : 'En ligne') : `${group.members.length} membres`}</p>
            </div>
          </div>
          {!isTest && (
            <button onClick={handlePinGroup} className={`p-2 rounded-full transition ${isPinned ? djStyleText + ' bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`} title={isPinned ? "Désépingler" : "Épingler"}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(group.messages || []).map(msg => {
            const isMine = msg.user === state.currentUser;
            const isUnread = !isMine && !msg.isSystem && msg.timestamp > lastRead;
            const isDeletedAccount = !msg.isSystem && (!state.users || !state.users[msg.user]);
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <span className="bg-gray-200/80 text-gray-600 text-[10px] px-4 py-1.5 rounded-full uppercase font-bold shadow-sm">{msg.text}</span>
                </div>
              );
            }
            return (
              <div key={msg.id} className={`flex ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group/msg`}>
                {!isMine && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white shadow-sm mb-4 shrink-0">
                    {isDeletedAccount ? '?' : (state.users && state.users[msg.user]?.avatar ? <img src={state.users[msg.user].avatar!} className="w-full h-full rounded-full object-cover" /> : msg.user[0].toUpperCase())}
                  </div>
                )}
                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <div className="flex items-center gap-2 mb-1 mx-1">
                    <span className="text-[10px] text-gray-500 font-semibold">{msg.user === 'test' ? 'Anonyme' : msg.user}</span>
                    {isDeletedAccount && <span className="text-[10px] text-red-500 font-bold uppercase">Compte supprimé</span>}
                    {isAdmin && !isMine && msg.user !== group.creator && !isDeletedAccount && msg.user !== 'test' && (
                      <button onClick={() => handleBanUser(msg.user)} className="text-[10px] text-red-500 hover:underline opacity-0 group-hover/msg:opacity-100 transition">Bannir</button>
                    )}
                  </div>
                  <div 
                    className={`relative px-4 py-2.5 shadow-sm rounded-2xl ${isMine ? `rounded-br-sm text-white ${djStyleBg}` : 'rounded-bl-sm bg-white border border-gray-100 text-gray-800'} ${isDeletedAccount ? 'cursor-pointer hover:bg-red-50 transition-colors' : ''} ${isUnread ? 'ring-2 ring-[#0D98BA] shadow-[0_0_15px_rgba(13,152,186,0.3)]' : ''}`}
                    onClick={() => isDeletedAccount && handleDeleteMessage(msg.id)}
                  >
                    <p className="text-sm break-words leading-relaxed">{msg.text}</p>
                    {(isMine || isAdmin) && !isDeletedAccount && (
                      <button onClick={() => handleDeleteMessage(msg.id)} className={`absolute ${isMine ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 p-1.5 text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover/msg:opacity-100 transition`}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 mx-1 font-medium">{msg.time}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        <div className="p-3 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <form className="flex gap-2 items-center max-w-3xl mx-auto" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              value={messageInput} 
              onChange={e => setMessageInput(e.target.value)} 
              onClick={() => isTest && setShowRestrictedPopup(true)}
              placeholder={isTest ? "Connectez-vous pour écrire..." : "Écris un message..."} 
              className="flex-1 px-5 py-3 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-[#0D98BA] outline-none transition-all disabled:opacity-50" 
              readOnly={isTest}
            />
            <button type="submit" disabled={!messageInput.trim() && !isTest} className={`p-3.5 rounded-full text-white shadow-md hover:scale-105 transition active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0 ${djStyleBg}`}>
              <Send size={20} className="ml-0.5" />
            </button>
          </form>
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

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-6 pb-0">
        <h2 className={`text-2xl font-bold mb-6 ${djStyleText}`}>Discussions</h2>
        <div className="flex gap-1.5 p-1 bg-gray-200/50 backdrop-blur-sm rounded-2xl mb-6 shadow-inner">
          <button 
            onClick={() => handleTabChange('public')} 
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'public' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Publics
          </button>
          <button 
            onClick={() => handleTabChange('private')} 
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'private' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Privés
          </button>
          <button 
            onClick={() => handleTabChange('recent')} 
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'recent' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Récents
          </button>
          <button 
            onClick={() => handleTabChange('sms')} 
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sms' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            SMS
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === 'recent' ? (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Discussions récentes</h3>
            {allRecentMessages.map(item => (
              <div 
                key={item.groupId} 
                onClick={() => {
                  setActiveGroup(item.groupId);
                  handleTabChange(item.type === 'public' ? 'public' : 'private');
                }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 transition relative overflow-hidden"
              >
                {item.newCount > 0 && (
                  <div className="absolute top-0 right-0 bg-[#0D98BA] text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-md animate-pulse">
                    {item.newCount} nouveau{item.newCount > 1 ? 'x' : ''} message{item.newCount > 1 ? 's' : ''}
                  </div>
                )}
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${djStyleText}`}>{item.groupName}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{item.lastMessage.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                    {state.users[item.lastMessage.user]?.avatar ? <img src={state.users[item.lastMessage.user].avatar!} className="w-full h-full rounded-xl object-cover" /> : item.lastMessage.user[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700 mb-0.5">@{item.lastMessage.user === 'test' ? 'Anonyme' : item.lastMessage.user}</p>
                    <p className={`text-sm truncate ${item.newCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{item.lastMessage.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {allRecentMessages.length === 0 && <p className="text-center text-gray-500 py-8">Aucune discussion récente.</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'public' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Groupes publics</h3>
                  <button onClick={() => { setShowCreateGroup(true); setWizardStep(1); }} className={`p-2 rounded-full ${djStyleBg} shadow-lg hover:scale-110 transition-transform`}>
                    <Plus size={16} className="text-white" />
                  </button>
                </div>
                {visibleGroups.map(g => (
                  <div key={g.id} onClick={() => setActiveGroup(g.id)} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group relative">
                    {state.newMessages?.includes(g.id) && (
                      <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse z-10" />
                    )}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#007FFF] to-[#32CD32] flex items-center justify-center text-white font-bold text-xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                      <span>{g.name[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 truncate pr-2">{g.name}</h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1]?.time : ''}</span>
                      </div>
                      <p className={`text-sm truncate ${state.newMessages?.includes(g.id) ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                        {g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1]?.text : 'Aucun message'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'private' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Groupes privés</h3>
                  <button onClick={() => { setShowCreateGroup(true); setWizardStep(1); }} className={`p-2 rounded-full ${djStyleBg} shadow-lg hover:scale-110 transition-transform`}>
                    <Plus size={16} className="text-white" />
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-50 mb-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Intégrer un groupe via le code</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Code (ex: A1b2!)" 
                      maxLength={5}
                      value={joinCode} 
                      onChange={e => setJoinCode(e.target.value)} 
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-100 focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all bg-gray-50 font-mono text-center tracking-widest" 
                    />
                    <button onClick={handleJoinPrivateGroup} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:opacity-90 transition active:scale-95 text-white ${djStyleBg}`}>Rejoindre</button>
                  </div>
                </div>

                {visibleGroups.map(g => (
                  <div key={g.id} onClick={() => setActiveGroup(g.id)} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group relative">
                    {state.newMessages?.includes(g.id) && (
                      <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse z-10" />
                    )}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#007FFF] to-[#32CD32] flex items-center justify-center text-white font-bold text-xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                      <span>{g.name[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 truncate pr-2">{g.name}</h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1]?.time : ''}</span>
                      </div>
                      <p className={`text-sm truncate ${state.newMessages?.includes(g.id) ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                        {g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1]?.text : 'Aucun message'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'sms' && (
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">SMS</h3>
                {visibleGroups.map(g => {
                  const otherUser = g.members.find(m => m !== state.currentUser);
                  const otherUserData = (otherUser && state.users) ? state.users[otherUser] : null;
                  return (
                    <div key={g.id} onClick={() => setActiveGroup(g.id)} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group relative">
                      {state.newMessages?.includes(g.id) && (
                        <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse z-10" />
                      )}
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                        {otherUserData?.avatar ? (
                          <img src={otherUserData.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <span>{(otherUser || g.name)[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 truncate pr-2">{otherUser}</h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1]?.time : ''}</span>
                        </div>
                        <p className={`text-sm truncate ${state.newMessages?.includes(g.id) ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                          {g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1]?.text : 'Aucun message'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {visibleGroups.length === 0 && activeTab !== 'recent' && (
              <div className="bg-white/50 border-2 border-dashed border-gray-200 p-12 rounded-[2.5rem] text-center">
                <p className="text-gray-400 font-bold italic">Aucun groupe trouvé dans cette catégorie.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          {renderWizard()}
        </div>
      )}
      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
      
      {showRestrictedPopup && (
        <RestrictedActionPopup 
          onClose={() => setShowRestrictedPopup(false)} 
          onSignUp={handleSignUpRedirect}
        />
      )}

      {deletePrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Compte supprimé</h3>
            <p className="text-gray-600 mb-6">Voulez-vous supprimer tous les messages de ce compte supprimé, ou seulement ce message ?</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDeleteAll} className="w-full py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition">
                Supprimer TOUS ses messages
              </button>
              <button onClick={confirmDeleteOne} className="w-full py-3 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition">
                Supprimer uniquement ce message
              </button>
              <button onClick={() => setDeletePrompt(null)} className="w-full py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition mt-2">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
