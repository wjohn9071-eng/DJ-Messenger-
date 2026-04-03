import React, { useState } from 'react';
import { AppState } from '../../types';
import { djStyleBg } from '../../lib/utils';

export function SimulatedSettings({ state, updateState }: { state: AppState, updateState: any }) {
  const user = (state.users && state.currentUser) ? state.users[state.currentUser as string] : null;
  const [colorInput, setColorInput] = useState(user?.bgColor || '');

  const handleColorChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentUser || !state.users) return;
    updateState((prev: AppState) => {
      if (!prev.currentUser || !prev.users || !prev.users[prev.currentUser as string]) return prev;
      const newUsers = { ...prev.users };
      newUsers[prev.currentUser as string] = {
        ...newUsers[prev.currentUser as string],
        bgColor: colorInput
      };
      return { users: newUsers };
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-6">
        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Personnalisation (Simulation)</h3>
        <form onSubmit={handleColorChange} className="space-y-4">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Couleur de fond (HEX ou Nom)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={colorInput}
              onChange={e => setColorInput(e.target.value)}
              placeholder="#f0f2f5" 
              className="flex-1 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0D98BA] outline-none transition font-mono"
            />
            <button type="submit" className={`px-6 py-3 rounded-xl font-bold text-white shadow-md ${djStyleBg}`}>Appliquer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
