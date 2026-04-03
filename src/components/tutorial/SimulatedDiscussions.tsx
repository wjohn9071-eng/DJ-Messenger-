import React, { useState, useRef, useEffect } from 'react';
import { AppState, Message, Group } from '../../types';
import { djStyleBg, djStyleText } from '../../lib/utils';
import { Send, Trash2, Plus } from 'lucide-react';

export function SimulatedDiscussions({ state, updateState }: { state: AppState, updateState: any }) {
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'sms' | 'recent'>(state.discussionTab || (state.newMessages && state.newMessages.length > 0 ? 'recent' : 'public'));
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = (state.users && state.currentUser) ? state.users[state.currentUser as string] : { pinnedGroups: [], lastReadTimestamps: {} as Record<string, string> };

  useEffect(() => {
    if (state.discussionTab) {
      setActiveTab(state.discussionTab);
    }
  }, [state.discussionTab]);

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
    if (!activeGroup || !messageInput.trim() || !state.groups || !state.groups[activeGroup]) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      user: state.currentUser as string,
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString()
    };

    updateState((prev: AppState) => {
      if (!prev.groups || !prev.groups[activeGroup]) return prev;
      return {
        groups: {
          ...prev.groups,
          [activeGroup]: {
            ...prev.groups[activeGroup],
            messages: [...(prev.groups[activeGroup].messages || []), newMsg]
          }
        }
      };
    });
    setMessageInput('');
  };

  const handleTabChange = (tab: 'public' | 'private' | 'sms' | 'recent') => {
    setActiveTab(tab);
    updateState({ discussionTab: tab });
  };

  const visibleGroups = Object.values(state.groups || {}).filter(g => {
    if (!g) return false;
    if (activeTab === 'public') return g.type === 'public';
    if (activeTab === 'private') return g.type === 'private' && (g.members && (g.members.length > 2 || g.code));
    if (activeTab === 'sms') return g.type === 'private' && g.members && g.members.length === 2 && !g.code;
    return false;
  }).sort((a, b) => {
    const aPinned = currentUser?.pinnedGroups?.includes(a.id) ? 1 : 0;
    const bPinned = currentUser?.pinnedGroups?.includes(b.id) ? 1 : 0;
    return bPinned - aPinned;
  });

  const allRecentMessages = Object.values(state.groups || {})
    .filter(g => g && g.id && !g.id.startsWith('sms-dj-help-'))
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
    const members = group.members || [];
    const isSMS = group.type === 'private' && members.length === 2 && !group.code;
    const otherUser = isSMS ? members.find(m => m !== state.currentUser) : null;
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
                <span>{(otherUser || group.name || '?')[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 leading-tight">{isSMS ? otherUser : group.name}</h3>
              <p className="text-xs text-gray-500 font-medium">{isSMS ? 'En ligne' : `${members.length} membres`}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(group.messages || []).map(msg => {
            const isMine = msg.user === state.currentUser;
            const isUnread = !isMine && !msg.isSystem && msg.timestamp > lastRead;
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
                    {(state.users && msg.user && state.users[msg.user]?.avatar) ? <img src={state.users[msg.user].avatar!} className="w-full h-full rounded-full object-cover" /> : (msg.user ? msg.user[0].toUpperCase() : '?')}
                  </div>
                )}
                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <div className="flex items-center gap-2 mb-1 mx-1">
                    <span className="text-[10px] text-gray-500 font-semibold">{msg.user}</span>
                  </div>
                  <div className={`relative px-4 py-2.5 shadow-sm rounded-2xl ${isMine ? `rounded-br-sm text-white ${djStyleBg}` : 'rounded-bl-sm bg-white border border-gray-100 text-gray-800'} ${isUnread ? 'ring-2 ring-[#0D98BA] shadow-[0_0_15px_rgba(13,152,186,0.3)]' : ''}`}>
                    <p className="text-sm break-words leading-relaxed">{msg.text}</p>
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
              placeholder="Écris un message (Simulation)..." 
              className="flex-1 px-5 py-3 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-[#0D98BA] outline-none transition-all" 
            />
            <button type="submit" disabled={!messageInput.trim()} className={`p-3.5 rounded-full text-white shadow-md hover:scale-105 transition active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0 ${djStyleBg}`}>
              <Send size={20} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-6 pb-0">
        <h2 className={`text-2xl font-bold mb-6 ${djStyleText}`}>Discussions (Simulation)</h2>
        <div className="flex gap-1.5 p-1 bg-gray-200/50 backdrop-blur-sm rounded-2xl mb-6 shadow-inner">
          {['public', 'private', 'recent', 'sms'].map(tab => (
            <button 
              key={tab}
              onClick={() => handleTabChange(tab as any)} 
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'public' ? 'Publics' : tab === 'private' ? 'Privés' : tab === 'recent' ? 'Récents' : 'SMS'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === 'recent' ? (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Discussions récentes (Simulation)</h3>
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
                    {(state.users && state.users[item.lastMessage.user]?.avatar) ? <img src={state.users[item.lastMessage.user].avatar!} className="w-full h-full rounded-xl object-cover" /> : (item.lastMessage.user ? item.lastMessage.user[0].toUpperCase() : '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700 mb-0.5">@{item.lastMessage.user}</p>
                    <p className={`text-sm truncate ${item.newCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{item.lastMessage.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {allRecentMessages.length === 0 && <p className="text-center text-gray-500 py-8">Aucune discussion récente.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleGroups.map(g => {
              const isSMS = activeTab === 'sms';
              const otherUser = isSMS ? (g.members || []).find(m => m !== state.currentUser) : null;
              const otherUserData = (otherUser && state.users) ? state.users[otherUser] : null;

              return (
                <div key={g.id} onClick={() => setActiveGroup(g.id)} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group relative">
                  {state.newMessages?.includes(g.id) && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse z-10" />
                  )}
                  <div className={`w-14 h-14 rounded-2xl ${isSMS ? 'bg-gray-100' : 'bg-gradient-to-br from-[#007FFF] to-[#32CD32]'} flex items-center justify-center text-white font-bold text-xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden`}>
                    {isSMS && otherUserData?.avatar ? (
                      <img src={otherUserData.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(otherUser || g.name || '?')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900 truncate pr-2">{isSMS ? otherUser : g.name}</h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{(g.messages || [])[(g.messages || []).length - 1]?.time || ''}</span>
                    </div>
                    <p className={`text-sm truncate ${state.newMessages?.includes(g.id) ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                      {(g.messages || [])[(g.messages || []).length - 1]?.text || 'Aucun message'}
                    </p>
                  </div>
                </div>
              );
            })}
            {visibleGroups.length === 0 && <p className="text-center text-gray-500 py-8">Aucun groupe trouvé.</p>}
          </div>
        )}
      </div>

      <div className="p-6 pt-0 mt-auto">
        <button onClick={() => showToast("Action non disponible en simulation.")} className={`w-full py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 flex items-center justify-center gap-2 ${djStyleBg}`}>
          <Plus size={20} /> Nouveau Groupe (Simulation)
        </button>
      </div>
      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
    </div>
  );
}
