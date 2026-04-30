import React, { useState } from 'react';
import { AppState } from '../types';
import { djStyleBg, djStyleText } from '../lib/utils';
import { User, ImagePlus, X, CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react';

export function ProfileMock({ state, updateState }: { state: AppState, updateState: any }) {
  const user = state.users[state.currentUser as string];
  const [username, setUsername] = useState(user?.name || '');
  const [password, setPassword] = useState('simulation-pwd');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    showToast("Profil mis à jour ! (Simulation)");
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      if (newUsers[prev.currentUser as string]) {
        newUsers[prev.currentUser as string] = {
          ...newUsers[prev.currentUser as string],
          name: username,
          avatar: avatar || ''
        };
      }
      return { ...prev, users: newUsers };
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto animate-in fade-in duration-300 pb-24 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-4 mb-8">
        <div className={`p-3 rounded-2xl ${djStyleBg} shadow-lg`}>
          <User className="text-white" size={24} />
        </div>
        <h2 className={`text-3xl font-black uppercase tracking-tighter ${djStyleText}`}>Mon Profil</h2>
      </div>
      
      <div className="flex flex-col items-center mb-10">
        <div className="relative group">
          <label className="relative cursor-pointer block">
            <div className="w-40 h-40 rounded-[2.5rem] bg-white border-8 border-white shadow-2xl flex items-center justify-center overflow-hidden group-hover:ring-8 ring-[#0D98BA]/20 transition-all relative">
              {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={64} className="text-gray-200" />}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ImagePlus className="text-white mb-2" size={32} />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Changer</span>
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" disabled />
          </label>
          {avatar && (
            <button 
              type="button"
              onClick={() => setAvatar(null)}
              className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all z-10"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-8 bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white/50 mb-8">
        <div className="space-y-4">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Nom d'utilisateur</label>
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full px-6 py-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 text-zinc-800 focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all font-bold" 
              placeholder="Ton nom..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Sécurité / Mot de passe</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              readOnly
              className="w-full px-6 py-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 text-zinc-800 focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all font-bold pr-14" 
              placeholder="Nouveau mot de passe..."
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-all"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        
        <div className="pt-2">
          <button 
            onClick={handleSave}
            className={`w-full py-5 rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_30px_rgba(13,152,186,0.3)] hover:scale-[1.02] transition active:scale-95 text-white flex items-center justify-center gap-3 ${djStyleBg}`}
          >
            <Shield size={16} />
            Mettre à jour le profil complet
          </button>
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-8 mb-8 border border-white/20 shadow-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Statut de connexion</span>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Connecté</span>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.4)]"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Drapeau</span>
              <span className="text-[11px] font-bold text-gray-700">Simulation</span>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
    </div>
  );
}
