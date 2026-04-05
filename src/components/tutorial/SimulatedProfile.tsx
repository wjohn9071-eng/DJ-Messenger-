import React from 'react';
import { AppState } from '../../types';
import { User } from 'lucide-react';

export function SimulatedProfile({ state, updateState }: { state: AppState, updateState: any }) {
  const user = (state.users && state.currentUser) ? state.users[state.currentUser as string] : null;
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center">
        <div className="w-32 h-32 rounded-[2.5rem] bg-gray-100 border-4 border-white shadow-2xl mb-6 overflow-hidden relative group">
          {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User size={48} className="text-gray-300" />}
        </div>
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-1">{user?.name} (Simulation)</h2>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Membre Simulation</p>
      </div>
    </div>
  );
}
