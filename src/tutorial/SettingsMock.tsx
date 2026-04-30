import React, { useState } from 'react';
import { AppState } from '../types';
import { djStyleText, djStyleBg } from '../lib/utils';
import { Palette, Shield, User, Bell, ChevronRight, Moon, Sun, Smartphone } from 'lucide-react';

export function SettingsMock({ 
  state, 
  updateState 
}: { 
  state: AppState, 
  updateState: any 
}) {
  const [color, setColor] = useState('#0D98BA');

  const handleColorChange = (c: string) => {
    setColor(c);
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      newUsers[prev.currentUser as string] = {
        ...newUsers[prev.currentUser as string],
        bgColor: c
      };
      return { ...prev, users: newUsers };
    });
  };

  return (
    <div className="h-full overflow-y-auto p-8 md:p-12 space-y-12 bg-gray-50/30 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-12">
        <header>
          <h1 className="text-5xl font-black text-black uppercase tracking-tighter mb-4">Mes <span className={djStyleText}>Réglages</span></h1>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Personnalisation v3.0 • Simulation</p>
        </header>

        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="text-[#0D98BA]" size={18} />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Design de l'application</h3>
          </div>
          
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-zinc-100">
            <p className="text-sm font-bold text-zinc-600 mb-8 uppercase tracking-tight">Couleur principale du thème</p>
            <div className="flex flex-wrap gap-4">
              {['#0D98BA', '#FF4B2B', '#8E2DE2', '#2193b0', '#11998e', '#000000'].map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className={`w-14 h-14 rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-lg border-4 ${color === c ? 'border-white ring-4 ring-[#0D98BA]/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-zinc-100 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform">
                <Moon size={24} />
              </div>
              <span className="font-black text-[10px] uppercase tracking-widest">Mode Sombre</span>
            </div>
            <div className="w-12 h-6 bg-zinc-200 rounded-full relative">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-zinc-100 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform">
                <Shield size={24} />
              </div>
              <span className="font-black text-[10px] uppercase tracking-widest">Sécurité</span>
            </div>
            <ChevronRight className="text-zinc-300" />
          </div>
        </section>
      </div>
    </div>
  );
}
