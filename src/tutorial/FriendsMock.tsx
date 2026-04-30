import React, { useState } from 'react';
import { AppState } from '../types';
import { djStyleText, djStyleBg } from '../lib/utils';
import { Search, UserPlus, UserCheck, MessageSquare, Shield, Zap } from 'lucide-react';

export function FriendsMock({ 
  state, 
  updateState 
}: { 
  state: AppState, 
  updateState: any 
}) {
  const [search, setSearch] = useState('');
  
  const currentUser = state.users[state.currentUser as string];
  const friends = currentUser?.friends || [];

  const handleAddFriend = () => {
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      const me = { ...newUsers[prev.currentUser as string] };
      if (!me.friends.includes('fake-friend')) {
        me.friends = [...me.friends, 'fake-friend'];
        newUsers[prev.currentUser as string] = me;
        newUsers['fake-friend'] = {
          id: 'fake-friend',
          uid: 'fake-friend',
          name: 'DJ Simulation',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fake',
          friends: [prev.currentUser as string],
          email: 'fake@dj.com',
          isAdmin: false
        };
      }
      return { ...prev, users: newUsers };
    });
  };

  return (
    <div className="h-full overflow-y-auto p-8 md:p-12 space-y-12 bg-gray-50/30 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-12">
        <header>
          <h1 className="text-5xl font-black text-black uppercase tracking-tighter mb-4">Ma <span className={djStyleText}>Communauté</span></h1>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Simulation d'amis v3.0</p>
        </header>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-zinc-100">
          <div className="relative mb-8">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un pseudo..."
              className="w-full bg-zinc-50 border border-zinc-100 py-5 pl-16 pr-8 rounded-2xl font-bold focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-zinc-50/50 rounded-2xl border border-zinc-100 hover:bg-white hover:shadow-lg transition-all group">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg ${djStyleBg}`}>
                  S
                </div>
                <div>
                  <h4 className="font-black text-black text-sm uppercase tracking-tight">DJ Simulation</h4>
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mt-0.5">En ligne</p>
                </div>
              </div>
              
              <button 
                onClick={handleAddFriend}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${friends.includes('fake-friend') ? 'bg-green-50 text-green-600' : `${djStyleBg} text-white shadow-lg hover:scale-105 active:scale-95 shadow-blue-500/20`}`}
              >
                {friends.includes('fake-friend') ? <UserCheck size={16} /> : <UserPlus size={16} />}
                {friends.includes('fake-friend') ? 'Amis' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-zinc-100">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare size={18} className="text-[#0D98BA]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Demandes reçues</h3>
            </div>
            <p className="text-zinc-500 font-medium italic text-xs">Aucune demande en attente.</p>
          </div>
          
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-zinc-100">
            <div className="flex items-center gap-3 mb-6">
              <Shield size={18} className="text-purple-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Blocages</h3>
            </div>
            <p className="text-zinc-500 font-medium italic text-xs">Utilisateurs bloqués : 0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
