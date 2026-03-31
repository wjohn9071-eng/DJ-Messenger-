import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, ImagePlus } from 'lucide-react';
import { djStyleBg, djStyleText, DJ_LOGO_SVG } from '../lib/utils';
import { AppState } from '../types';

export default function Auth({ state, updateState }: { state: AppState, updateState: any }) {
  const [authMode, setAuthMode] = useState<'select' | 'login' | 'register'>('select');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = () => {
    const userInp = username.trim();
    const passInp = password.trim();
    if (!userInp || !passInp) return showToast("Remplis tous les champs !");
    
    if (state.users[userInp] && state.users[userInp].password === passInp) {
      updateState({ currentUser: userInp });
    } else {
      showToast("Identifiants incorrects.");
    }
  };

  const handleRegister = () => {
    const userInp = username.trim();
    const passInp = password.trim();
    if (!userInp || !passInp) return showToast("Remplis tous les champs !");
    
    if (userInp.length < 3) return showToast("Le nom d'utilisateur doit contenir au moins 3 caractères.");
    if (passInp.length < 7) return showToast("Le mot de passe doit contenir au moins 7 caractères.");
    
    const hasUpper = /[A-Z]/.test(passInp);
    const hasLower = /[a-z]/.test(passInp);
    const hasNumber = /[0-9]/.test(passInp);
    const hasSpecial = /[/., ?!;:'"*@#€_&\-+()}{><\][=|%¡»«]/.test(passInp);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return showToast("Le mot de passe doit contenir majuscule, minuscule, chiffre et caractère spécial.");
    }

    if (state.users[userInp]) {
      showToast("Ce nom est déjà pris.");
    } else {
      updateState((prev: AppState) => ({
        users: {
          ...prev.users,
          [userInp]: { username: userInp, password: passInp, avatar: avatarBase64, isAdmin: false, friends: [] }
        },
        currentUser: userInp
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f0f2f5]">
      <div className="w-full max-w-md p-8 bg-white rounded-[2.5rem] shadow-2xl transition-all duration-300 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-4 flex items-center justify-center shadow-xl rounded-[2rem] overflow-hidden p-4 bg-white border border-gray-50">
            <div dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }} className="w-full h-full" />
          </div>
          <h1 className={`text-4xl font-black uppercase tracking-tighter text-center ${djStyleText}`}>DJ Messenger</h1>
          <p className="text-gray-500 mt-2 text-center font-medium">
            {authMode === 'select' && "Rejoins la discussion"}
            {authMode === 'login' && "Bon retour parmi nous"}
            {authMode === 'register' && "Crée ton compte DJ"}
          </p>
        </div>

        {authMode === 'select' ? (
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => updateState({ currentUser: 'test' })} 
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition active:scale-95 text-lg ${djStyleBg}`}
            >
              Test
            </button>
            <button 
              onClick={() => setAuthMode('login')} 
              className="w-full py-4 rounded-2xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition active:scale-95 text-lg"
            >
              Se connecter
            </button>
            <button 
              onClick={() => setAuthMode('register')} 
              className="w-full py-4 rounded-2xl text-blue-600 font-bold bg-blue-50 border border-blue-100 shadow-sm hover:bg-blue-100 transition active:scale-95 text-lg"
            >
              S'inscrire
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {authMode === 'register' && (
              <div className="flex flex-col items-center gap-2 mb-6">
                <label className="relative cursor-pointer group">
                  <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group-hover:border-[#00CED1] transition shadow-inner">
                    {avatarBase64 ? <img src={avatarBase64} alt="Avatar" className="w-full h-full object-cover" /> : <ImagePlus className="text-gray-400 group-hover:text-[#00CED1] transition w-8 h-8" />}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
                <span className="text-xs font-medium text-gray-500">Photo de profil (optionnel)</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nom d'utilisateur</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ex: DJ_Champion" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00CED1] transition bg-gray-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00CED1] transition pr-12 bg-gray-50 focus:bg-white" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 mt-8">
              <button 
                onClick={authMode === 'login' ? handleLogin : handleRegister} 
                className={`w-full py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 ${djStyleBg}`}
              >
                Valider
              </button>
              <button onClick={() => setAuthMode('select')} className="w-full py-3 rounded-xl text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 transition active:scale-95 flex items-center justify-center gap-2">
                <ArrowLeft size={18} /> Retour
              </button>
            </div>
          </div>
        )}
      </div>
      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">{toast}</div>}
    </div>
  );
}
