import React, { useState } from 'react';
import { AppState } from '../types';
import { djStyleText, djStyleBg } from '../lib/utils';
import { Lightbulb, Send, ThumbsUp, MessageSquare, ChevronRight, Zap } from 'lucide-react';

export function SocietyMock({ 
  state, 
  updateState 
}: { 
  state: AppState, 
  updateState: any 
}) {
  const [proposal, setProposal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal.trim()) return;

    updateState((prev: AppState) => ({
      ...prev,
      proposals: [
        {
          id: `prop-${Date.now()}`,
          text: proposal,
          user: prev.currentUser as string,
          date: new Date().toISOString(),
          status: 'pending'
        },
        ...prev.proposals
      ]
    }));
    setProposal('');
  };

  return (
    <div className="h-full overflow-y-auto p-8 md:p-12 space-y-12 bg-gray-50/30 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black text-black uppercase tracking-tighter mb-4">DJ <span className={djStyleText}>Society</span></h1>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">L'avenir de l'application • Simulation</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-zinc-100/50">
              <span className="block text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1">Tes idées</span>
              <span className="text-xl font-black text-black italic">{state.proposals.filter(p => p.user === state.currentUser).length}/3</span>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-10 shadow-2xl border border-zinc-100 space-y-6 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${djStyleBg}`}>
              <Lightbulb size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Nouvelle Proposition</span>
          </div>
          
          <textarea
            value={proposal}
            onChange={e => setProposal(e.target.value)}
            placeholder="Quelle est ton idée pour améliorer DJ Messenger ?"
            className="w-full bg-zinc-50/50 border border-zinc-100 rounded-[2rem] p-8 text-sm font-bold focus:ring-8 focus:ring-[#0D98BA]/5 outline-none h-40 transition-all resize-none shadow-inner"
          />
          
          <button
            type="submit"
            disabled={!proposal.trim()}
            className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] text-white shadow-2xl transition-all ${proposal.trim() ? djStyleBg + ' hover:scale-[1.02] active:scale-95 shadow-[#0D98BA]/20' : 'bg-gray-200'}`}
          >
            SOUMETTRE MON IDÉE
          </button>
        </form>

        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-4">Propositions de la communauté</h3>
          {state.proposals.map((p) => {
            const userName = state.users[p.user]?.name || 'Utilisateur';
            return (
              <div key={p.id} className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl flex items-start justify-between gap-6 group hover:scale-[1.01] transition-all">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs font-black">
                      {(userName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-black uppercase tracking-tight">{userName}</span>
                      <span className="text-[9px] text-zinc-400 block uppercase font-bold">{new Date(p.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-zinc-600 font-medium text-sm leading-relaxed">{p.text}</p>
                  <div className="flex gap-2">
                    <span className="bg-zinc-100 text-zinc-500 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">En attente</span>
                  </div>
                </div>
                
                <button className="flex flex-col items-center gap-1 group/vote bg-zinc-50 p-4 rounded-2xl hover:bg-zinc-100 transition-colors">
                  <ThumbsUp size={24} className="text-zinc-300 group-hover:text-[#0D98BA] transition-colors" />
                  <span className="text-xs font-black text-zinc-400">1</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
