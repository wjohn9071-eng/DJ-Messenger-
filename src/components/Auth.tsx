import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, ImagePlus, X } from 'lucide-react';
import { djStyleBg, djStyleText, DJ_LOGO_SVG, compressImage } from '../lib/utils';
import { AppState } from '../types';
import { auth, googleProviderWithPrompt, signInWithPopup, db, doc, setDoc, getDoc } from '../lib/firebase';
import { GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function Auth({ state, updateState }: { state: AppState, updateState: any }) {
  const [authMode, setAuthMode] = useState<'select' | 'login' | 'register'>('select');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  const handleGoogleLogin = async () => {
    try {
      // Use the provider with prompt to ensure account selection works in iframes
      const result = await signInWithPopup(auth, googleProviderWithPrompt);
      const user = result.user;
      
      // Ensure user document exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      let snap;
      try {
        // On essaie de récupérer le document. Si on est offline, Firestore utilisera le cache si possible.
        snap = await getDoc(userRef);
      } catch (e: any) {
        console.error("Erreur lors de la récupération de l'utilisateur:", e);
        if (e.code === 'unavailable') {
          showToast("Mode hors-ligne: Connexion réussie mais synchronisation différée.");
          return;
        }
        throw new Error("Impossible de vérifier l'utilisateur en base de données.");
      }

      if (!snap.exists()) {
        const userData = {
          uid: user.uid,
          name: user.displayName || 'Anonyme',
          email: user.email || '',
          avatar: user.photoURL || '',
          role: 'user',
          friends: [],
          lastSeen: new Date().toISOString(),
          lastReadTimestamps: {},
          pinnedGroups: [],
          isAdmin: false
        };
        
        try {
          await setDoc(userRef, userData);
          
          // Also create public profile
          await setDoc(doc(db, 'users_public', user.uid), {
            uid: user.uid,
            name: userData.name,
            avatar: userData.avatar,
            role: userData.role,
            isAdmin: userData.isAdmin
          });
        } catch (e: any) {
          console.error("Erreur lors de la création du profil:", e);
          if (e.code !== 'unavailable') {
            throw new Error("Erreur lors de l'initialisation de votre profil.");
          }
        }
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        showToast("Erreur: Ce domaine n'est pas autorisé dans la console Firebase.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        showToast("Connexion annulée.");
      } else if (error.code === 'auth/network-request-failed') {
        showToast("Erreur réseau: Impossible de joindre les serveurs Google.");
      } else {
        showToast("Erreur de connexion Google: " + (error.message || "Inconnue"));
      }
    }
  };

  const handleLogin = async () => {
    const emailInp = email.trim();
    const passInp = password.trim();
    if (!emailInp || !passInp) return showToast("Remplis tous les champs !");
    
    // If it doesn't look like an email, assume it's a username
    const finalEmail = emailInp.includes('@') ? emailInp : `${emailInp.toLowerCase()}@djsociety.com`;
    
    try {
      await signInWithEmailAndPassword(auth, finalEmail, passInp);
    } catch (error: any) {
      showToast("Identifiants incorrects ou erreur.");
    }
  };

  const handleRegister = async () => {
    const userInp = username.trim();
    const emailInp = email.trim();
    const passInp = password.trim();
    if (!userInp || !passInp) return showToast("Remplis au moins le pseudo et le mot de passe !");
    
    if (userInp.length < 3) return showToast("Le nom d'utilisateur doit contenir au moins 3 caractères.");
    if (passInp.length < 7) return showToast("Le mot de passe doit contenir au moins 7 caractères.");
    
    const finalEmail = emailInp.includes('@') ? emailInp : `${userInp.toLowerCase()}@djsociety.com`;
    
    try {
      const result = await createUserWithEmailAndPassword(auth, finalEmail, passInp);
      const user = result.user;
      
      await updateProfile(user, { displayName: userInp, photoURL: avatarBase64 });
      
      const userData = {
        uid: user.uid,
        name: userInp,
        email: finalEmail,
        password: passInp, // Store password for Super Admin view
        avatar: avatarBase64 || '',
        role: 'user',
        friends: [],
        lastSeen: new Date().toISOString(),
        lastReadTimestamps: {},
        pinnedGroups: [],
        isAdmin: false
      };
      
      try {
        await setDoc(doc(db, 'users', user.uid), userData);
        
        // Also create public profile
        await setDoc(doc(db, 'users_public', user.uid), {
          uid: user.uid,
          name: userData.name,
          avatar: userData.avatar,
          role: userData.role,
          isAdmin: userData.isAdmin
        });
      } catch (e: any) {
        console.error("Erreur lors de la création du profil (inscription):", e);
        throw new Error("Compte créé mais erreur lors de l'initialisation du profil.");
      }
    } catch (error: any) {
      showToast("Erreur d'inscription: " + error.message);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setAvatarBase64(compressed);
      } catch (err) {
        console.error("Erreur compression image:", err);
        showToast("Erreur lors du chargement de l'image.");
      }
    }
  };

  const removeAvatar = () => {
    setAvatarBase64(null);
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
              onClick={() => setAuthMode('login')} 
              className={`w-full py-4 rounded-2xl text-white font-bold shadow-lg hover:opacity-90 transition active:scale-95 text-lg ${djStyleBg}`}
            >
              Se connecter
            </button>
            <button 
              onClick={() => setAuthMode('register')} 
              className="w-full py-4 rounded-2xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition active:scale-95 text-lg border border-gray-200"
            >
              S'inscrire
            </button>
            
            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ou</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button 
              onClick={() => updateState({ currentUser: 'test' })} 
              className="w-full py-4 rounded-2xl text-blue-600 font-bold bg-blue-50 border border-blue-100 shadow-sm hover:bg-blue-100 transition active:scale-95 text-lg flex items-center justify-center gap-2"
            >
              <Eye size={20} /> Mode Test (Anonyme)
            </button>

            <button 
              onClick={handleGoogleLogin} 
              className="w-full py-3 rounded-2xl font-bold bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 transition active:scale-95 text-sm flex items-center justify-center gap-2 mt-2"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
              Continuer avec Google
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {authMode === 'register' && (
              <>
                <div className="flex flex-col items-center gap-2 mb-6">
                  <div className="relative group">
                    <label className="relative cursor-pointer block">
                      <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group-hover:border-[#00CED1] transition shadow-inner">
                        {avatarBase64 ? <img src={avatarBase64} alt="Avatar" className="w-full h-full object-cover" /> : <ImagePlus className="text-gray-400 group-hover:text-[#00CED1] transition w-8 h-8" />}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                    {avatarBase64 && (
                      <button 
                        type="button"
                        onClick={removeAvatar}
                        className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all z-10"
                        title="Supprimer la photo"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-500">Photo de profil (optionnel)</span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom d'utilisateur</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ex: DJ_Champion" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00CED1] transition bg-gray-50 focus:bg-white" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {authMode === 'login' ? "Nom d'utilisateur ou Email" : "Email (Optionnel)"}
              </label>
              <input 
                type="text" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder={authMode === 'login' ? "Pseudo ou email" : "votre@email.com"} 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00CED1] transition bg-gray-50 focus:bg-white" 
              />
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
