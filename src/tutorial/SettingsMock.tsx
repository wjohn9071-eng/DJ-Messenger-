import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { djStyleText, djStyleBg } from '../lib/utils';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { RestrictedActionPopup } from '../components/RestrictedActionPopup';

export function SettingsMock({ 
  state, 
  updateState,
  onLogout
}: { 
  state: AppState, 
  updateState: any,
  onLogout: () => void
}) {
  const user = state.users[state.currentUser as string];
  const [bgColor, setBgColor] = useState(user?.bgColor || '#f0f2f5');
  const [notifications, setNotifications] = useState(user?.notificationsEnabled || false);
  const [autoHideSidebar, setAutoHideSidebar] = useState(user?.autoHideSidebar ?? true);
  const [adminCode, setAdminCode] = useState('');
  const [superAdminCode, setSuperAdminCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Focus only on the visual changes, as it is a mock
  
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleColorChange = (newColor: string) => {
    setBgColor(newColor);
    // Auto-save in mock for better tutorial experience
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      if (newUsers[prev.currentUser as string]) {
        newUsers[prev.currentUser as string] = {
          ...newUsers[prev.currentUser as string],
          bgColor: newColor
        };
      }
      return { users: newUsers };
    });
    document.documentElement.style.setProperty('--bg-color', newColor);
  };

  const saveSettings = () => {
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      if (newUsers[prev.currentUser as string]) {
        newUsers[prev.currentUser as string] = {
          ...newUsers[prev.currentUser as string],
          bgColor: bgColor,
          notificationsEnabled: notifications,
          autoHideSidebar: autoHideSidebar,
          darkMode: state.darkMode
        };
      }
      return { users: newUsers };
    });
    
    document.documentElement.style.setProperty('--bg-color', bgColor);
    showToast("Paramètres sauvegardés (Simulation) !");
  };

  const handleAdminAuth = () => {
    if (adminCode === 'Dj2024in') {
      updateState((prev: AppState) => {
        const newUsers = { ...prev.users };
        newUsers[prev.currentUser as string].isAdmin = true;
        return { users: newUsers };
      });
      showToast("Mode Staff activé (Simulation) !");
    } else {
      showToast("Code incorrect.");
    }
    setAdminCode('');
  };

  const handleSuperAdminAuth = () => {
    if (superAdminCode === 'DJ24026IN') {
      updateState((prev: AppState) => {
        const newUsers = { ...prev.users };
        newUsers[prev.currentUser as string].isAdmin = true;
        newUsers[prev.currentUser as string].isSuperAdmin = true;
        return { users: newUsers };
      });
      showToast("Mode SUPER ADMIN activé (Simulation) !");
    } else {
      showToast("Code incorrect.");
    }
    setSuperAdminCode('');
  };

  return (
    <div className="p-6 max-w-lg mx-auto animate-in fade-in duration-300 pb-20 overflow-y-auto h-full custom-scrollbar">
      <h2 className={`text-2xl font-bold mb-6 ${state.darkMode ? 'text-white' : djStyleText}`}>Paramètres</h2>
      
      <div className="flex flex-col gap-4 mb-8">
        <button onClick={saveSettings} className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg hover:opacity-90 transition active:scale-95 text-lg ${djStyleBg}`}>
          Sauvegarder tout
        </button>
        
        <button 
          onClick={() => {
            const newMode = !state.darkMode;
            updateState({ darkMode: newMode });
          }}
          className={`w-full py-4 rounded-2xl font-bold shadow-lg transition active:scale-95 text-lg flex items-center justify-center gap-3 ${state.darkMode ? 'bg-zinc-800 text-white border border-white/10' : 'bg-white text-gray-800 border border-gray-100'}`}
        >
          {state.darkMode ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
          {state.darkMode ? 'Désactiver Mode Sombre' : 'Activer Mode Sombre'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Section Apparence */}
        <section className={`p-6 rounded-3xl shadow-sm border ${state.darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${state.darkMode ? 'text-white' : 'text-gray-800'}`}>Apparence</h3>
            <button onClick={saveSettings} className="p-2 bg-green-500 text-white rounded-full shadow-lg hover:scale-110 transition active:scale-90" title="Appliquer">
              <CheckCircle2 size={16} />
            </button>
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-semibold mb-2 ${state.darkMode ? 'text-zinc-400' : 'text-gray-700'}`}>Couleur d'arrière-plan</label>
            <div className="flex items-center gap-3">
              <input type="color" value={bgColor} onChange={e => handleColorChange(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0" />
              <input type="text" value={bgColor} onChange={e => handleColorChange(e.target.value)} placeholder="Nom (ex: red) ou #HEX" className={`flex-1 px-4 py-3 rounded-xl border outline-none font-bold ${state.darkMode ? 'bg-zinc-800 border-white/10 text-white focus:ring-zinc-600' : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-[#0D98BA]'}`} />
              {bgColor !== (user?.bgColor || '#f0f2f5') && (
                <div className="p-3 bg-green-500/20 text-green-600 rounded-xl animate-in zoom-in duration-300">
                  <CheckCircle2 size={24} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section Notifications */}
        <section className={`p-6 rounded-3xl shadow-sm border ${state.darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${state.darkMode ? 'text-white' : 'text-gray-800'}`}>Notifications</h3>
            <button onClick={saveSettings} className="p-2 bg-green-500 text-white rounded-full shadow-lg hover:scale-110 transition active:scale-90" title="Appliquer">
              <CheckCircle2 size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex flex-col justify-center cursor-pointer">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${state.darkMode ? 'text-zinc-400' : 'text-gray-700'}`}>Activer les notifications</span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={notifications} 
                    onChange={e => {
                      const val = e.target.checked;
                      setNotifications(val);
                      saveSettings(); // Auto-save for tutorial
                    }} 
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${notifications ? 'bg-[#32CD32]' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${notifications ? 'transform translate-x-6' : ''}`}></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Reçois des alertes comme sur WhatsApp. (Simulation)</p>
            </label>
          </div>
        </section>

        {/* Section Application */}
        <section className={`p-6 rounded-3xl shadow-sm border ${state.darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${state.darkMode ? 'text-white' : 'text-gray-800'}`}>Application</h3>
            <button onClick={saveSettings} className="p-2 bg-green-500 text-white rounded-full shadow-lg hover:scale-110 transition active:scale-90" title="Appliquer">
              <CheckCircle2 size={16} />
            </button>
          </div>
          <div className="mb-6 flex items-center gap-3">
            <label className="flex-1 flex flex-col justify-center cursor-pointer">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${state.darkMode ? 'text-zinc-400' : 'text-gray-700'}`}>Masquer le menu automatiquement</span>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={autoHideSidebar} onChange={e => {
                    const val = e.target.checked;
                    setAutoHideSidebar(val);
                    saveSettings(); // Auto-save for tutorial
                  }} />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${autoHideSidebar ? 'bg-[#32CD32]' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${autoHideSidebar ? 'transform translate-x-6' : ''}`}></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Ferme le menu après avoir cliqué sur un onglet. (Simulation)</p>
            </label>
          </div>
          <div>
            <label className="flex items-center justify-between pointer-events-none opacity-50">
              <span className="text-sm font-semibold text-gray-700">Installer l'application (PWA)</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={false} 
                  onChange={()=>{}}
                />
                <div className="block w-14 h-8 rounded-full bg-gray-300"></div>
                <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full"></div>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2">Désactivé en mode simulation.</p>
          </div>
        </section>

        {/* Section Compte */}
        <section className={`p-6 rounded-3xl shadow-sm border ${state.darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${state.darkMode ? 'text-white' : 'text-gray-800'}`}>Compte</h3>
            <button onClick={saveSettings} className="p-2 bg-green-500 text-white rounded-full shadow-lg hover:scale-110 transition active:scale-90" title="Appliquer">
              <CheckCircle2 size={16} />
            </button>
          </div>
          
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${state.darkMode ? 'text-zinc-400' : 'text-gray-700'}`}>
              Code Administrateur (Staff / Grand Admin)
            </label>
            <div className="flex gap-2">
              <input 
                type="password" 
                placeholder="Entrer le code..." 
                value={adminCode} 
                onChange={e => setAdminCode(e.target.value)} 
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none bg-gray-50" 
              />
              <button onClick={handleAdminAuth} className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition">OK</button>
            </div>
          </div>

          {user?.isAdmin && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Code Super Admin (Temporaire)
              </label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  placeholder="Entrer le code Super Admin..." 
                  value={superAdminCode} 
                  onChange={e => setSuperAdminCode(e.target.value)} 
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none bg-gray-50" 
                />
                <button onClick={handleSuperAdminAuth} className="px-6 py-3 bg-[#0D98BA] text-white rounded-xl font-bold hover:opacity-90 transition">OK</button>
              </div>
            </div>
          )}

          {user?.isAdmin && (
            <button 
              onClick={() => showToast("Droits déclinés. (Simulation)")} 
              className="w-full py-3 rounded-xl text-white font-bold bg-red-600 hover:bg-red-700 transition active:scale-95 mb-4 shadow-lg uppercase tracking-widest text-xs"
            >
              DÉCLINER LES DROIT
            </button>
          )}

          <button onClick={saveSettings} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition active:scale-95 mb-4 ${djStyleBg}`}>
            Sauvegarder les paramètres
          </button>
          
          <button onClick={onLogout} className="w-full py-3 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition active:scale-95 mb-4">
            Quitter la simulation (Se déconnecter)
          </button>

          <button onClick={() => showToast("Impossible de supprimer en simulation.")} className="w-full py-3 rounded-xl text-red-600 font-bold bg-red-50 hover:bg-red-100 transition active:scale-95 flex items-center justify-center gap-2">
            <Trash2 size={18} /> Supprimer le compte
          </button>
        </section>
      </div>
      
      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
    </div>
  );
}
