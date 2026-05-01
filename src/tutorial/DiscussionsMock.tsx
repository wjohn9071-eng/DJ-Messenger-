import React, { useState, useEffect, useRef } from 'react';
import { AppState, Message, Group } from '../types';
import { djStyleBg, djStyleText } from '../lib/utils';
import { MessageSquare, Send, ArrowLeft, MoreVertical, Paperclip, Search, Hash, Lock, Smartphone } from 'lucide-react';

export function DiscussionsMock({ state, updateState }: { state: AppState, updateState: any }) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'public' | 'private' | 'sms'>('recent');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedGroup = selectedGroupId ? state.groups[selectedGroupId] : null;

  useEffect(() => {
    if (selectedGroup) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedGroup?.messages, selectedGroupId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedGroupId) return;

    const newMsg: Message = {
      id: `sim-${Date.now()}`,
      user: state.currentUser as string,
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString()
    };

    updateState((prev: AppState) => {
      const g = prev.groups[selectedGroupId];
      return {
        ...prev,
        groups: {
          ...prev.groups,
          [selectedGroupId]: { ...g, messages: [...g.messages, newMsg] }
        }
      };
    });
    setMessage('');

    // DJ Bot Response Logic
    if (selectedGroupId && selectedGroupId.startsWith('sim-')) {
      setTimeout(() => {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          user: 'dj-bot',
          text: "Mode Tutoriel : Je simule ici une réponse. Dans la vraie application, je détecte tes mots-clés pour t'aider !",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString()
        };
        updateState((prev: AppState) => {
          const g = prev.groups[selectedGroupId];
          return {
            ...prev,
            groups: {
              ...prev.groups,
              [selectedGroupId]: { ...g, messages: [...g.messages, botMsg] }
            }
          };
        });
      }, 1000);
    }
  };

  const renderGroupList = () => {
    let groups = Object.values(state.groups).filter(g => g.id.startsWith('sim-')) as Group[];
    
    if (activeTab === 'public') groups = groups.filter((g: any) => g.type === 'public' && !g.isSMS);
    else if (activeTab === 'private') groups = groups.filter((g: any) => g.type === 'private' && !g.isSMS);
    else if (activeTab === 'sms') groups = groups.filter((g: any) => g.isSMS);
    
    if (search) {
      groups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    }

    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedGroupId(group.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-[1.75rem] transition-all hover:scale-[1.02] active:scale-95 text-left border ${selectedGroupId === group.id ? 'bg-white shadow-xl border-zinc-100 ring-4 ring-[#0D98BA]/10' : 'bg-white/50 border-white hover:bg-white border-zinc-50'}`}
          >
            <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-inner ${djStyleBg}`}>
              {group.avatar ? <img src={group.avatar} alt={group.name} className="w-full h-full object-cover rounded-2xl" /> : (group.name || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-black text-black text-[11px] uppercase tracking-tight truncate">{group.name}</h4>
                <span className="text-[8px] font-black uppercase text-zinc-400">Simulation</span>
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-tight truncate italic opacity-60">
                {group.messages?.length > 0 ? group.messages[group.messages.length - 1].text : 'Commencer la simulation...'}
              </p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-white/30 backdrop-blur-md animate-in fade-in duration-500 overflow-hidden">
      {/* Group List Panel */}
      <div className={`${selectedGroupId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[400px] border-r border-white/50 bg-white/40 shadow-2xl z-10`}>
        <div className="p-6 pb-2 border-b border-white/20">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une simulation..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 border-2 border-white focus:border-[#0D98BA]/30 outline-none transition-all font-black text-xs uppercase tracking-widest placeholder:text-zinc-300"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {[
              { id: 'recent', label: 'Récents', Icon: MessageSquare },
              { id: 'public', label: 'Publics', Icon: Hash },
              { id: 'private', label: 'Privés', Icon: Lock },
              { id: 'sms', label: 'SMS', Icon: Smartphone }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${activeTab === tab.id ? `${djStyleBg} text-white border-transparent` : 'bg-white/80 text-zinc-400 border-white hover:bg-white'}`}
              >
                <tab.Icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {renderGroupList()}
      </div>

      {/* Chat Area Panel */}
      <div className={`${selectedGroupId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col relative bg-zinc-50/30 overflow-hidden`}>
        {selectedGroup ? (
          <>
            <header className="p-6 bg-white/80 backdrop-blur-xl border-b border-white flex items-center justify-between shadow-sm z-20">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedGroupId(null)} className="lg:hidden p-2 hover:bg-zinc-100 rounded-xl transition">
                  <ArrowLeft size={24} />
                </button>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg ${djStyleBg}`}>
                  {selectedGroup.avatar ? <img src={selectedGroup.avatar} alt={selectedGroup.name} className="w-full h-full object-cover rounded-2xl" /> : (selectedGroup.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-black text-xs uppercase tracking-tight">{selectedGroup.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#0D98BA]">Discussion Active</span>
                  </div>
                </div>
              </div>
              <button className="p-3 hover:bg-zinc-100 rounded-xl transition text-zinc-400">
                <MoreVertical size={24} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-zinc-50/50 custom-scrollbar relative">
              {selectedGroup.messages.map((msg, i) => {
                const isMe = msg.user === state.currentUser;
                const isBot = msg.user === 'dj-bot';
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    {!isMe && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-2">
                        {state.users[msg.user]?.name || msg.user} {isBot && '🤖'}
                      </span>
                    )}
                    <div className={`max-w-[85%] lg:max-w-[70%] p-5 rounded-[2.25rem] shadow-sm relative group transition-all hover:shadow-xl ${isMe ? `bg-[#0D98BA] text-white rounded-tr-none` : (isBot ? 'bg-zinc-800 text-white rounded-tl-none' : 'bg-white text-zinc-800 rounded-tl-none border border-white shadow-sm')}`}>
                      <p className="text-sm font-semibold leading-relaxed">{msg.text}</p>
                      <span className={`text-[8px] font-black uppercase tracking-widest mt-2 block opacity-60 ${isMe ? 'text-white' : 'text-zinc-400'}`}>
                        {msg.time} •Simulation
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSend} className="p-6 bg-white border-t border-zinc-100 shadow-[0_-15px_50px_rgba(0,0,0,0.05)] z-20">
              <div className="flex gap-4 items-center max-w-5xl mx-auto">
                <button type="button" className="p-4 rounded-2xl bg-zinc-50 text-zinc-400 hover:bg-zinc-100 transition shadow-inner">
                  <Paperclip size={24} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    placeholder="Écris ton message de simulation..." 
                    className="w-full px-8 py-5 rounded-[2.5rem] bg-zinc-50 border-2 border-zinc-50 focus:border-[#0D98BA]/30 focus:bg-white outline-none transition-all font-bold text-zinc-800 shadow-inner"
                  />
                </div>
                <button type="submit" className={`p-5 rounded-2xl text-white shadow-2xl hover:scale-110 active:scale-95 transition-all shadow-[#0D98BA]/30 ${djStyleBg}`}>
                  <Send size={24} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6 animate-in fade-in duration-1000">
             <div className="w-32 h-32 rounded-[2.5rem] bg-white border-8 border-white shadow-2xl flex items-center justify-center text-[#0D98BA] ring-8 ring-[#0D98BA]/5">
                <MessageSquare size={54} />
             </div>
             <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-black mb-2">Sélectionne une démo</h3>
                <p className="text-sm font-medium text-zinc-400 max-w-sm mx-auto leading-relaxed italic">
                  Explore les différents types de discussions comme dans la vraie application.
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
