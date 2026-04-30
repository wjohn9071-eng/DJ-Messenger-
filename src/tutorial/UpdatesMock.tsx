import React, { useState } from 'react';
import { AppState } from '../types';
import { djStyleBg, djStyleText } from '../lib/utils';
import { Bell, ChevronRight, X, History } from 'lucide-react';
import { APP_UPDATES } from '../constants';

export function UpdatesMock({ state }: { state: AppState }) {
  const [selectedUpdate, setSelectedUpdate] = useState<number | null>(null);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-in fade-in duration-300 pb-24 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-4 mb-10">
        <div className={`p-4 rounded-[1.5rem] ${djStyleBg} shadow-xl ring-8 ring-[#0D98BA]/10`}>
          <Bell className="text-white" size={28} />
        </div>
        <div>
          <h2 className={`text-4xl font-black uppercase tracking-tighter ${djStyleText}`}>Mises à jour</h2>
          <p className="text-xs font-black uppercase tracking-widest text-[#0D98BA] opacity-60">Simulation du flux réel</p>
        </div>
      </div>

      <div className="space-y-4">
        {APP_UPDATES.map((update, i) => (
          <div key={i} className="animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
            <button 
              onClick={() => setSelectedUpdate(selectedUpdate === i ? null : i)}
              className={`w-full text-left p-6 rounded-[2.5rem] border transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden ${selectedUpdate === i ? 'bg-white shadow-2xl border-white ring-4 ring-[#0D98BA]/10' : 'bg-white/40 border-white/60 hover:bg-white hover:shadow-xl'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${i === 0 ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-500'}`}>
                      {i === 0 ? 'Dernière Version' : 'Ancienne Version'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{update.date}</span>
                  </div>
                  <h3 className="text-xl font-black text-black">v{update.version}</h3>
                </div>
                <div className={`p-2 rounded-xl transition-all ${selectedUpdate === i ? 'bg-[#0D98BA] text-white rotate-90' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                  <ChevronRight size={20} />
                </div>
              </div>

              {selectedUpdate === i && (
                <div className="mt-4 pt-4 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-zinc-600 font-medium leading-relaxed whitespace-pre-wrap">{update.desc}</p>
                  <div className="mt-5 flex gap-2">
                    <div className="px-4 py-2 rounded-xl bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <History size={12} /> Historique Simulation
                    </div>
                  </div>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 rounded-[3rem] bg-gradient-to-br from-[#0D98BA]/5 to-transparent border border-[#0D98BA]/10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-[#0D98BA]">
          <History size={32} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-tighter text-black">Fin de l'historique</h4>
          <p className="text-xs font-medium text-zinc-500 mt-1 italic">Cette liste est synchronisée avec la vraie application.</p>
        </div>
      </div>
    </div>
  );
}
