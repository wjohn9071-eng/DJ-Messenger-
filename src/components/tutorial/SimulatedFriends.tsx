import React, { useState } from 'react';
import { AppState } from '../../types';
import { djStyleBg } from '../../lib/utils';
import { Search, UserPlus } from 'lucide-react';

export function SimulatedFriends({ state, updateState }: { state: AppState, updateState: any }) {
  const [search, setSearch] = useState('');
  const user = (state.users && state.currentUser) ? state.users[state.currentUser as string] : null;
  const friends = user?.friends || [];

  const handleAddFriend = (username: string) => {
    if (!state.currentUser || !state.users) return;
    updateState((prev: AppState) => {
      if (!prev.currentUser || !prev.users || !prev.users[prev.currentUser as string]) return prev;
      const newUsers = { ...prev.users };
      const currentUser = { ...newUsers[prev.currentUser as string] };
      const currentFriends = currentUser.friends || [];
      if (!currentFriends.includes(username)) {
        currentUser.friends = [...currentFriends, username];
      }
      newUsers[prev.currentUser as string] = currentUser;
      return { users: newUsers };
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher un DJ..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-[#0D98BA] outline-none transition"
        />
      </div>

      {search && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
              {search[0]?.toUpperCase()}
            </div>
            <span className="font-bold text-gray-800">{search}</span>
          </div>
          <button onClick={() => handleAddFriend(search)} className={`p-2 rounded-xl text-white shadow-md ${djStyleBg}`}>
            <UserPlus size={20} />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Mes Amis (Simulation)</h3>
        {friends.map(f => (
          <div key={f} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
              {f[0].toUpperCase()}
            </div>
            <span className="font-bold text-gray-800">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
