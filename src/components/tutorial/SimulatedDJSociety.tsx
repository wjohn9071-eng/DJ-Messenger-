import React, { useState } from 'react';
import { AppState, Proposal } from '../../types';
import { djStyleBg } from '../../lib/utils';
import { Plus } from 'lucide-react';

export function SimulatedDJSociety({ state, updateState }: { state: AppState, updateState: any }) {
  const [newProposal, setNewProposal] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposal.trim()) return;

    const proposal: Proposal = {
      id: `prop-${Date.now()}`,
      user: state.currentUser as string,
      text: newProposal.trim(),
      date: new Date().toISOString(),
      status: 'pending'
    };

    updateState((prev: AppState) => ({
      proposals: [proposal, ...(prev.proposals || [])]
    }));
    setNewProposal('');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4">
        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Nouvelle Proposition (Simulation)</h3>
        <textarea 
          value={newProposal}
          onChange={e => setNewProposal(e.target.value)}
          placeholder="Ton idée pour améliorer l'app..." 
          className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0D98BA] outline-none transition min-h-[120px] text-sm"
        />
        <button type="submit" className={`w-full py-4 rounded-2xl font-black text-white shadow-lg flex items-center justify-center gap-2 ${djStyleBg}`}>
          <Plus size={20} /> Envoyer
        </button>
      </form>

      <div className="space-y-4">
        {(state.proposals || []).map(p => (
          <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">@{p.user}</span>
              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${p.status === 'accepted' ? 'bg-green-100 text-green-600' : p.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {p.status}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
