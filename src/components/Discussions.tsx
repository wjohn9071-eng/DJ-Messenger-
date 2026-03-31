import React, { useState, useRef, useEffect } from 'react';
import { AppState, Message, Group } from '../types';
import { djStyleBg, djStyleText } from '../lib/utils';
import { Send, Trash2, Shield, UserX, Plus, Hash, Lock, MessageSquare } from 'lucide-react';

export function Discussions({ state, updateState }: { state: AppState, updateState: any }) {
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'sms' | 'recent'>(state.discussionTab || (state.newMessages && state.newMessages.length > 0 ? 'recent' : 'public'));
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

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
  const [newGroupInvite, setNewGroupInvite] = useState<string[]>([]);
  const [newGroupCode, setNewGroupCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<{msgId: string, user: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTest = state.currentUser === 'test';
  const currentUser = state.users[state.currentUser as string];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Clear notification for active group
    if (activeGroup && state.newMessages?.includes(activeGroup)) {
      updateState((prev: AppState) => ({
        newMessages: prev.newMessages?.filter(id => id !== activeGroup) || []
      }));
    }
  }, [state.groups[activeGroup || '']?.messages, activeGroup]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !messageInput.trim()) return;

    const group = state.groups[activeGroup];
    if (group.banned.includes(state.currentUser as string)) return showToast("Tu es banni de ce groupe.");
    if (group.muted.includes(state.currentUser as string)) return showToast("Tu es muet dans ce groupe.");

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user: state.currentUser as string,
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    if (isTest) return showToast("Connecte-toi pour créer un groupe.");
    if (!newGroupName.trim()) return showToast("Nom du groupe requis.");

    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newGroup: Group = {
      id: groupId,
      type: activeTab === 'public' ? 'public' : 'private',
      name: newGroupName,
      reason: newGroupReason,
      creator: state.currentUser as string,
      admins: [state.currentUser as string],
      members: [state.currentUser as string, ...newGroupInvite],
      banned: [],
      muted: [],
      code: activeTab === 'private' ? newGroupCode : undefined,
      messages: [{ id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, user: 'Système', text: `Groupe ${newGroupName} créé !`, time: new Date().toLocaleTimeString(), isSystem: true }]
    };

    updateState((prev: AppState) => ({
      groups: { ...prev.groups, [groupId]: newGroup }
    }));
    setShowCreateGroup(false);
    setWizardStep(1);
    setNewGroupName('');
    setNewGroupReason('informer');
    setNewGroupInvite([]);
    setNewGroupCode('');
    setActiveGroup(groupId);
    showToast("Groupe créé !");
  };

  const renderWizard = () => {
    const progress = (wizardStep / 4) * 100;
    return (
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 animate-in slide-in-from-bottom-4">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className={`${djStyleBg} h-2 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }}></div>
        </div>
        {wizardStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Nom du groupe</h3>
            <input type="text" placeholder="Nom du groupe" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0D98BA] outline-none transition" />
            <button onClick={() => setWizardStep(2)} className={`w-full py-3 rounded-xl font-bold text-white shadow-md ${djStyleBg}`}>Suivant</button>
          </div>
        )}
        {wizardStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Raison de la création</h3>
            <select value={newGroupReason} onChange={e => setNewGroupReason(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0D98BA] outline-none transition">
              <option value="informer">Pour informer</option>
              <option value="converser">Pour converser</option>
              <option value="etudier">Pour étudier</option>
              <option value="club">Pour créer un club</option>
              <option value="autre">Autre</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setWizardStep(1)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold">Retour</button>
              <button onClick={() => setWizardStep(activeTab === 'private' ? 3 : 4)} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md ${djStyleBg}`}>Suivant</button>
            </div>
          </div>
        )}
        {wizardStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Inviter des amis</h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {Object.keys(state.users).filter(u => u !== state.currentUser).map(u => (
                <label key={u} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                  <input type="checkbox" checked={newGroupInvite.includes(u)} onChange={e => e.target.checked ? setNewGroupInvite([...newGroupInvite, u]) : setNewGroupInvite(newGroupInvite.filter(i => i !== u))} />
                  {u}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setWizardStep(2)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold">Retour</button>
              <button onClick={() => setWizardStep(4)} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md ${djStyleBg}`}>Suivant</button>
            </div>
          </div>
        )}
        {wizardStep === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Code d'entrée (5 car.)</h3>
            <input type="text" placeholder="Code (ex: A1b2C)" maxLength={5} value={newGroupCode} onChange={e => setNewGroupCode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0D98BA] outline-none transition font-mono uppercase" />
            <div className="flex gap-2">
              <button onClick={() => setWizardStep(activeTab === 'private' ? 3 : 2)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold">Retour</button>
              <button onClick={handleCreateGroup} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md ${djStyleBg}`}>Créer</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleJoinPrivateGroup = () => {
    if (isTest) return showToast("Connecte-toi pour rejoindre.");
    const group = Object.values(state.groups).find(g => g.type === 'private' && g.code === joinCode);
    if (!group) return showToast("Code invalide.");
    if (group.members.includes(state.currentUser as string)) return showToast("Déjà membre.");
    if (group.banned.includes(state.currentUser as string)) return showToast("Tu es banni de ce groupe.");

    updateState((prev: AppState) => {
      const newGroups = { ...prev.groups };
      newGroups[group.id].members.push(prev.currentUser as string);
      return { groups: newGroups };
    });
    setJoinCode('');
    setActiveGroup(group.id);
    showToast(`Bienvenue dans ${group.name} !`);
  };

  const handleTabChange = (tab: 'public' | 'private' | 'sms' | 'recent') => {
    setActiveTab(tab);
    updateState({ discussionTab: tab });
  };

  const handleDeleteMessage = (msgId: string) => {
    if (!activeGroup) return;
    const group = state.groups[activeGroup];
    const msg = group.messages.find(m => m.id === msgId);
    if (!msg) return;

    const isDeletedAccount = !state.users[msg.user];
    const user = state.users[state.currentUser as string];
    const canDelete = msg.user === state.currentUser || group.admins.includes(state.currentUser as string) || user?.isAdmin || isDeletedAccount;
    
    if (!canDelete) return showToast("Non autorisé.");

    if (isDeletedAccount) {
      setDeletePrompt({ msgId, user: msg.user });
      return;
    }

    updateState((prev: AppState) => {
      const newGroups = { ...prev.groups };
      newGroups[activeGroup].messages = newGroups[activeGroup].messages.filter(m => m.id !== msgId);
      return { groups: newGroups };
    });
  };

  const confirmDeleteAll = () => {
    if (!deletePrompt || !activeGroup) return;
    updateState((prev: AppState) => {
      const newGroups = { ...prev.groups };
      newGroups[activeGroup].messages = newGroups[activeGroup].messages.filter(m => m.user !== deletePrompt.user);
      return { groups: newGroups };
    });
    setDeletePrompt(null);
  };

  const confirmDeleteOne = () => {
    if (!deletePrompt || !activeGroup) return;
    updateState((prev: AppState) => {
      const newGroups = { ...prev.groups };
      newGroups[activeGroup].messages = newGroups[activeGroup].messages.filter(m => m.id !== deletePrompt.msgId);
      return { groups: newGroups };
    });
    setDeletePrompt(null);
  };

  const handleBanUser = (userToBan: string) => {
    if (!activeGroup) return;
    const group = state.groups[activeGroup];
    if (!group.admins.includes(state.currentUser as string) && !currentUser?.isAdmin) return showToast("Non autorisé.");
    if (userToBan === group.creator) return showToast("Impossible de bannir le créateur.");

    updateState((prev: AppState) => {
      const newGroups = { ...prev.groups };
      newGroups[activeGroup].banned.push(userToBan);
      newGroups[activeGroup].members = newGroups[activeGroup].members.filter(m => m !== userToBan);
      return { groups: newGroups };
    });
    showToast(`${userToBan} banni.`);
  };

  const handlePinGroup = () => {
    if (isTest || !activeGroup) return;
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      const user = newUsers[prev.currentUser as string];
      if (!user.pinnedGroups) user.pinnedGroups = [];
      
      if (user.pinnedGroups.includes(activeGroup)) {
        user.pinnedGroups = user.pinnedGroups.filter(id => id !== activeGroup);
        showToast("Groupe désépinglé.");
      } else {
        user.pinnedGroups.push(activeGroup);
        showToast("Groupe épinglé !");
      }
      return { users: newUsers };
    });
  };

  const visibleGroups = Object.values(state.groups).filter(g => {
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

  const allRecentMessages = Object.values(state.groups)
    .filter(g => g.type === 'public' || g.members.includes(state.currentUser as string) || currentUser?.isAdmin)
    .flatMap(g => g.messages.map(m => ({ ...m, groupId: g.id, groupName: g.name })))
    .filter(m => !m.isSystem)
    .sort((a, b) => {
      // Extract timestamp from ID if possible, or use a fallback
      const timeA = a.id.split('-')[1] || '0';
      const timeB = b.id.split('-')[1] || '0';
      return parseInt(timeB) - parseInt(timeA);
    });

  if (activeGroup && state.groups[activeGroup]) {
    const group = state.groups[activeGroup];
    const isAdmin = group.admins.includes(state.currentUser as string) || currentUser?.isAdmin;
    const isPinned = currentUser?.pinnedGroups?.includes(activeGroup);
    const isSMS = group.type === 'private' && group.members.length === 2 && !group.code;
    const otherUser = isSMS ? group.members.find(m => m !== state.currentUser) : null;
    const otherUserData = otherUser ? state.users[otherUser] : null;

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
          {group.messages.map(msg => {
            const isMine = msg.user === state.currentUser;
            const isDeletedAccount = !msg.isSystem && !state.users[msg.user];
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
                    {isDeletedAccount ? '?' : (state.users[msg.user]?.avatar ? <img src={state.users[msg.user].avatar!} className="w-full h-full rounded-full object-cover" /> : msg.user[0].toUpperCase())}
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
                    className={`relative px-4 py-2.5 shadow-sm rounded-2xl ${isMine ? `rounded-br-sm text-white ${djStyleBg}` : 'rounded-bl-sm bg-white border border-gray-100 text-gray-800'} ${isDeletedAccount ? 'cursor-pointer hover:bg-red-50 transition-colors' : ''}`}
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
            <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)} placeholder="Écris un message..." className="flex-1 px-5 py-3 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-[#0D98BA] outline-none transition-all disabled:opacity-50" />
            <button type="submit" disabled={!messageInput.trim()} className={`p-3.5 rounded-full text-white shadow-md hover:scale-105 transition active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0 ${djStyleBg}`}>
              <Send size={20} className="ml-0.5" />
            </button>
          </form>
        </div>
        {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-6 pb-0">
        <h2 className={`text-2xl font-bold mb-6 ${djStyleText}`}>Discussions</h2>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-6 shadow-inner">
          <button onClick={() => handleTabChange('public')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'public' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Publics</button>
          <button onClick={() => handleTabChange('private')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'private' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Privés</button>
          <button onClick={() => handleTabChange('recent')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'recent' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Récents</button>
          <button onClick={() => handleTabChange('sms')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'sms' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>SMS</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === 'recent' ? (
          <div className="space-y-4">
            {allRecentMessages.map(msg => (
              <div 
                key={msg.id} 
                onClick={() => {
                  setActiveGroup(msg.groupId);
                  handleTabChange(state.groups[msg.groupId].type === 'public' ? 'public' : 'private');
                }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${djStyleText}`}>{msg.groupName}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{msg.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                    {state.users[msg.user]?.avatar ? <img src={state.users[msg.user].avatar!} className="w-full h-full rounded-full object-cover" /> : msg.user[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700 mb-0.5">@{msg.user === 'test' ? 'Anonyme' : msg.user}</p>
                    <p className="text-sm text-gray-600 truncate">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {allRecentMessages.length === 0 && <p className="text-center text-gray-500 py-8">Aucun message récent.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'private' && (
              <div className="flex gap-2 mb-6">
                <input type="text" placeholder="Code secret..." value={joinCode} onChange={e => setJoinCode(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none transition bg-white shadow-sm" />
                <button onClick={handleJoinPrivateGroup} className={`px-6 py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition active:scale-95 ${djStyleBg}`}>Rejoindre</button>
              </div>
            )}

            {visibleGroups.map(g => {
              const isSMS = activeTab === 'sms';
              const otherUser = isSMS ? g.members.find(m => m !== state.currentUser) : null;
              const otherUserData = otherUser ? state.users[otherUser] : null;

              return (
                <div key={g.id} onClick={() => setActiveGroup(g.id)} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group relative">
                  {state.newMessages?.includes(g.id) && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse z-10" />
                  )}
                  <div className={`w-14 h-14 rounded-2xl ${isSMS ? 'bg-gray-100' : 'bg-gradient-to-br from-[#007FFF] to-[#32CD32]'} flex items-center justify-center text-white font-bold text-xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden`}>
                    {isSMS && otherUserData?.avatar ? (
                      <img src={otherUserData.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(otherUser || g.name)[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900 truncate pr-2">{isSMS ? otherUser : g.name}</h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{g.messages[g.messages.length - 1]?.time}</span>
                    </div>
                    <p className={`text-sm truncate ${state.newMessages?.includes(g.id) ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                      {g.messages[g.messages.length - 1]?.text || 'Aucun message'}
                    </p>
                  </div>
                </div>
              );
            })}
            {visibleGroups.length === 0 && <p className="text-center text-gray-500 py-8">Aucun groupe trouvé.</p>}
          </div>
        )}
      </div>

      {(!isTest || (currentUser?.isAdmin && activeTab === 'public')) && activeTab !== 'sms' && (
        <div className="p-6 pt-0 mt-auto">
          {showCreateGroup ? renderWizard() : (
            <button onClick={() => setShowCreateGroup(true)} className={`w-full py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 flex items-center justify-center gap-2 ${djStyleBg}`}>
              <Plus size={20} /> Nouveau Groupe
            </button>
          )}
        </div>
      )}
      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
      
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
