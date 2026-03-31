import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { djStyleBg, djStyleText } from '../lib/utils';
import { User, Key, ImagePlus, Trash2 } from 'lucide-react';

export function Profile({ state, updateState }: { state: AppState, updateState: any }) {
  const isTest = state.currentUser === 'test';
  const user = isTest ? { username: 'Test User', password: '••••••••', avatar: null } : state.users[state.currentUser as string];
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState(user?.password || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    if (isTest) return showToast("Connecte-toi pour modifier ton profil.");
    if (!username.trim() || !password.trim()) {
      return showToast("Les champs ne peuvent pas être vides.");
    }
    
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      if (username !== prev.currentUser && newUsers[username]) {
        showToast("Ce nom d'utilisateur est déjà pris.");
        return prev;
      }
      
      const oldUser = newUsers[prev.currentUser as string];
      delete newUsers[prev.currentUser as string];
      
      newUsers[username] = { ...oldUser, username, password, avatar };
      
      return { users: newUsers, currentUser: username };
    });
    showToast("Profil mis à jour !");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto animate-in fade-in duration-300 pb-20">
      <h2 className={`text-2xl font-bold mb-6 ${djStyleText}`}>Mon Profil</h2>
      
      <div className="flex flex-col items-center mb-8">
        <label className="relative cursor-pointer group">
          <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden group-hover:ring-4 ring-[#0D98BA]/30 transition-all">
            {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={48} className="text-gray-400" />}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ImagePlus className="text-white" />
            </div>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </label>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nom d'utilisateur</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none transition bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none transition bg-gray-50" />
        </div>
        <button onClick={handleSave} className={`w-full py-3 mt-4 rounded-xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 ${djStyleBg}`}>
          Enregistrer les modifications
        </button>
      </div>

      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
    </div>
  );
}

export function Friends({ state, updateState }: { state: AppState, updateState: any }) {
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  
  const isTest = state.currentUser === 'test';
  const currentUser = isTest ? { friends: [] } : state.users[state.currentUser as string];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddFriend = (friendName: string) => {
    if (isTest) return showToast("Connecte-toi pour ajouter des amis.");
    if (currentUser.friends.includes(friendName)) return showToast("Déjà dans tes amis.");
    
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      newUsers[prev.currentUser as string].friends.push(friendName);
      newUsers[friendName].friends.push(prev.currentUser as string);
      return { users: newUsers };
    });
    showToast(`${friendName} ajouté aux amis !`);
  };

  const searchResults = Object.keys(state.users).filter(u => 
    u !== state.currentUser && 
    u.toLowerCase().includes(search.toLowerCase()) &&
    !currentUser.friends.includes(u)
  );

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      <h2 className={`text-2xl font-bold mb-6 ${djStyleText}`}>Amis</h2>
      
      <div className="mb-8">
        <input type="text" placeholder="Rechercher un utilisateur..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm focus:ring-2 focus:ring-[#0D98BA] outline-none transition" />
        
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
            {search ? 'Résultats' : 'Tous les utilisateurs'}
          </div>
          {searchResults.length > 0 ? searchResults.map(u => (
            <div key={u} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                  {state.users[u].avatar ? <img src={state.users[u].avatar!} className="w-full h-full rounded-full object-cover" /> : u[0].toUpperCase()}
                </div>
                <span className="font-semibold">{u}</span>
              </div>
              <button onClick={() => handleAddFriend(u)} className={`px-4 py-2 rounded-full text-sm font-bold shadow-md hover:opacity-90 transition active:scale-95 text-white ${djStyleBg}`}>
                Ajouter
              </button>
            </div>
          )) : <div className="p-4 text-center text-gray-500">Aucun utilisateur trouvé.</div>}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Mes amis ({currentUser.friends.length})</h3>
        <div className="grid gap-3">
          {currentUser.friends.map(f => (
            <div key={f} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                {state.users[f]?.avatar ? <img src={state.users[f].avatar!} className="w-full h-full rounded-full object-cover" /> : f[0].toUpperCase()}
              </div>
              <span className="font-semibold text-lg">{f}</span>
            </div>
          ))}
          {currentUser.friends.length === 0 && <p className="text-gray-500 italic">Tu n'as pas encore d'amis.</p>}
        </div>
      </div>
      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
    </div>
  );
}

export function DJSociety({ state, updateState }: { state: AppState, updateState: any }) {
  const [text, setText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const isTest = state.currentUser === 'test';
  const currentUser = isTest ? { isAdmin: false, proposalsToday: 0, lastProposalDate: '' } : state.users[state.currentUser as string];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = () => {
    if (isTest) return showToast("Connecte-toi pour proposer.");
    if (!text.trim()) return;
    
    const today = new Date().toDateString();
    if (!currentUser.isAdmin && currentUser.lastProposalDate === today && (currentUser.proposalsToday || 0) >= 3) {
      return showToast("Limite de 3 propositions par jour atteinte.");
    }

    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      const user = newUsers[prev.currentUser as string];
      user.lastProposalDate = today;
      if (!user.isAdmin) {
        user.proposalsToday = (user.proposalsToday || 0) + 1;
      }

      return {
        users: newUsers,
        proposals: [...prev.proposals, {
          id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user: prev.currentUser as string,
          text,
          date: new Date().toLocaleString(),
          status: user.isAdmin ? 'accepted' : 'pending',
          isAdminAnnouncement: user.isAdmin
        }]
      };
    });
    setText('');
    showToast(currentUser.isAdmin ? "Annonce publiée !" : "Proposition envoyée !");
  };

  const handleReply = (id: string, status: 'accepted' | 'rejected', reply: string) => {
    updateState((prev: AppState) => ({
      proposals: prev.proposals.map(p => p.id === id ? { ...p, status, adminReply: reply } : p)
    }));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${djStyleText}`}>DJ Society</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 mb-8 shadow-sm">
        <p className="text-blue-900 font-medium leading-relaxed">
          « Bienvenue dans DJ messenger. Nous sommes les propriétaires de la société DJ Society et vous pouvez nous proposer quelque chose pour que l'on puisse vous aider. C'est à vous de dire vos idées et nous vous répondrons. »
        </p>
      </div>

      {!isTest && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <h3 className="font-bold text-gray-800 mb-2">{currentUser?.isAdmin ? 'Faire une annonce' : 'Nouvelle proposition'}</h3>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={currentUser?.isAdmin ? "Écris une annonce pour tous les utilisateurs..." : "Décris ton idée pour l'application..."} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none resize-none h-24 mb-3 bg-gray-50" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{!currentUser?.isAdmin ? `${(currentUser?.proposalsToday || 0)}/3 aujourd'hui` : 'Annonce Admin'}</span>
            <button onClick={handleSubmit} className={`px-6 py-2 rounded-xl font-bold text-white shadow-md hover:opacity-90 transition active:scale-95 ${djStyleBg}`}>
              {currentUser?.isAdmin ? 'Publier' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-gray-800">Propositions et Annonces</h3>
        {state.proposals.slice().reverse().map(p => (
          <div key={p.id} className={`p-5 rounded-2xl shadow-sm border ${p.isAdminAnnouncement ? 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-100' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`font-bold ${p.isAdminAnnouncement ? djStyleText : 'text-gray-800'}`}>
                @{p.user} {p.isAdminAnnouncement && ' (Admin)'}
              </span>
              {!p.isAdminAnnouncement && (
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : p.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {p.status === 'pending' ? 'En attente' : p.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                </span>
              )}
            </div>
            <p className={`${p.isAdminAnnouncement ? 'text-gray-800 font-medium' : 'text-gray-600'} mb-3`}>{p.text}</p>
            <div className="text-xs text-gray-400 mb-3">{p.date}</div>
            
            {p.adminReply && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mt-3">
                <span className="font-bold text-blue-800 text-xs uppercase">Réponse Admin:</span>
                <p className="text-sm text-blue-900 mt-1">{p.adminReply}</p>
              </div>
            )}

            {currentUser?.isAdmin && p.status === 'pending' && !p.isAdminAnnouncement && (
              <div className="mt-4 pt-4 border-t flex gap-2">
                <button onClick={() => handleReply(p.id, 'accepted', prompt('Message d\'acceptation:') || 'Excellente idée !')} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-bold">Accepter</button>
                <button onClick={() => handleReply(p.id, 'rejected', prompt('Raison du refus:') || 'Pas possible pour le moment.')} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold">Refuser</button>
              </div>
            )}
          </div>
        ))}
        {state.proposals.length === 0 && <p className="text-gray-500 italic text-center py-8">Aucune proposition pour le moment.</p>}
      </div>
      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
    </div>
  );
}

export function Updates() {
  const updates = [
    { version: '1.2.0', date: '29/03/2026', desc: 'Ajout des notifications, installation PWA, épinglage de groupes, tutoriel interactif, et refonte des paramètres.' },
    { version: '1.1.0', date: '28/03/2026', desc: 'Ajout des groupes privés, profils, amis et DJ Society.' },
    { version: '1.0.0', date: '28/03/2026', desc: 'Création de DJ Messenger. Chat public et authentification de base.' }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      <h2 className={`text-2xl font-bold mb-8 ${djStyleText}`}>Mises à jour</h2>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
        {updates.map((u, i) => (
          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#0D98BA] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-800 text-lg">v{u.version}</h3>
                <time className="text-xs font-medium text-gray-400">{u.date}</time>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{u.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Settings({ state, updateState, handleLogout }: { state: AppState, updateState: any, handleLogout: () => void }) {
  const isTest = state.currentUser === 'test';
  const user = state.users[state.currentUser as string];
  const [bgColor, setBgColor] = useState(user?.bgColor || '#f0f2f5');
  const [notifications, setNotifications] = useState(user?.notificationsEnabled || false);
  const [autoHideSidebar, setAutoHideSidebar] = useState(user?.autoHideSidebar ?? false);
  const [adminCode, setAdminCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const frenchColors: Record<string, string> = {
    "vert lime": "#32CD32",
    "vert citron": "#CCFF00",
    "rose": "#FFC0CB",
    "bleu d'azur": "#007FFF",
    "bleu azur": "#007FFF",
    "rouge": "#FF0000",
    "bleu": "#0000FF",
    "vert": "#008000",
    "jaune": "#FFFF00",
    "noir": "#000000",
    "blanc": "#FFFFFF",
    "gris": "#808080",
    "orange": "#FFA500",
    "violet": "#EE82EE",
    "marron": "#A52A2A",
    "cyan": "#00FFFF",
    "magenta": "#FF00FF",
    "or": "#FFD700",
    "argent": "#C0C0C0",
    "turquoise": "#40E0D0",
    "indigo": "#4B0082",
    "beige": "#F5F5DC",
    "lilas": "#B666D2",
    "saumon": "#FA8072",
    "corail": "#FF7F50",
    "kaki": "#F0E68C",
    "lavande": "#E6E6FA",
    "prune": "#DDA0DD",
    "chocolat": "#D2691E",
    "tomate": "#FF6347",
    "émeraude": "#50C878",
    "saphir": "#0F52BA",
    "rubis": "#E0115F",
    "jade": "#00A86B",
    "ambre": "#FFBF00",
    "bordeaux": "#800000",
    "bleu marine": "#000080",
    "bleu ciel": "#87CEEB",
    "vert olive": "#808000",
    "jaune moutarde": "#FFDB58",
    "rose poudré": "#FFD1DC",
    "vert d'eau": "#B0F2B6",
    "rouge brique": "#B22222",
    "vert menthe": "#98FF98",
    "bleu roi": "#4169E1",
    "bleu nuit": "#191970",
    "jaune citron": "#FFF700",
    "vert sapin": "#095228",
    "rose fuchsia": "#FD3F92",
    "gris anthracite": "#303030",
    "blanc cassé": "#FEFEE2"
  };

  const colorNameToHex = (color: string) => {
    const lowerColor = color.toLowerCase().trim();
    if (frenchColors[lowerColor]) return frenchColors[lowerColor];
    if (color.startsWith('#')) return color;
    
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return color;
    ctx.fillStyle = color;
    return ctx.fillStyle;
  };

  const saveSettings = () => {
    if (isTest) return showToast("Non disponible en mode test.");
    const hexColor = colorNameToHex(bgColor);
    
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      newUsers[prev.currentUser as string].bgColor = hexColor;
      newUsers[prev.currentUser as string].notificationsEnabled = notifications;
      newUsers[prev.currentUser as string].autoHideSidebar = autoHideSidebar;
      return { users: newUsers };
    });
    
    document.documentElement.style.setProperty('--bg-color', hexColor);
    setBgColor(hexColor);
    
    if (notifications && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
             showToast("Notifications activées !");
          } else {
             setNotifications(false);
             showToast("Permission refusée.");
          }
        });
      }
    }
    
    showToast("Paramètres sauvegardés !");
  };

  const handleAdminAuth = () => {
    if (isTest) return showToast("Non disponible en mode test.");
    if (adminCode === 'Dj2024in') {
      updateState((prev: AppState) => {
        const newUsers = { ...prev.users };
        newUsers[prev.currentUser as string].isAdmin = true;
        return { users: newUsers };
      });
      showToast("Mode Admin activé !");
    } else {
      showToast("Code incorrect.");
    }
    setAdminCode('');
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      showToast("L'installation n'est pas disponible ou déjà installée.");
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteAccount = () => {
    if (isTest) return handleLogout();
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = () => {
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      delete newUsers[prev.currentUser as string];
      return { users: newUsers, currentUser: null };
    });
  };

  return (
    <div className="p-6 max-w-lg mx-auto animate-in fade-in duration-300 pb-20">
      <h2 className={`text-2xl font-bold mb-6 ${djStyleText}`}>Paramètres</h2>
      
      <button onClick={saveSettings} className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg hover:opacity-90 transition active:scale-95 mb-8 text-lg ${djStyleBg}`}>
        Sauvegarder tout
      </button>

      <div className="space-y-8">
        {/* Section Apparence */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Apparence</h3>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Couleur d'arrière-plan</label>
            <div className="flex gap-3">
              <input type="color" value={colorNameToHex(bgColor)} onChange={e => setBgColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0" />
              <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} placeholder="Nom (ex: red) ou #HEX" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none bg-gray-50" />
            </div>
          </div>
          <button onClick={saveSettings} className={`w-full py-3 rounded-xl font-bold text-white shadow-md hover:opacity-90 transition active:scale-95 ${djStyleBg}`}>
            Sauvegarder le style
          </button>
        </section>

        {/* Section Notifications */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Notifications</h3>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-semibold text-gray-700">Activer les notifications</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={notifications} onChange={e => setNotifications(e.target.checked)} />
              <div className={`block w-14 h-8 rounded-full transition-colors ${notifications ? 'bg-[#32CD32]' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${notifications ? 'transform translate-x-6' : ''}`}></div>
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-2">Reçois des alertes comme sur WhatsApp.</p>
        </section>

        {/* Section Application */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Application</h3>
          <div className="mb-6">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-gray-700">Masquer le menu automatiquement</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={autoHideSidebar} onChange={e => setAutoHideSidebar(e.target.checked)} />
                <div className={`block w-14 h-8 rounded-full transition-colors ${autoHideSidebar ? 'bg-[#32CD32]' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${autoHideSidebar ? 'transform translate-x-6' : ''}`}></div>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2">Ferme le menu après avoir cliqué sur un onglet.</p>
          </div>
          <button onClick={handleInstall} className={`w-full py-3 rounded-xl font-bold text-white shadow-md hover:opacity-90 transition active:scale-95 ${djStyleBg}`}>
            Installer l'application (PWA)
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">Ajoute DJ Messenger à ton écran d'accueil.</p>
        </section>

        {/* Section Compte */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Compte</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Code Administrateur</label>
            <div className="flex gap-2">
              <input type="password" placeholder="Entrer le code..." value={adminCode} onChange={e => setAdminCode(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0D98BA] outline-none bg-gray-50" />
              <button onClick={handleAdminAuth} className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition">OK</button>
            </div>
          </div>

          <button onClick={saveSettings} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition active:scale-95 mb-4 ${djStyleBg}`}>
            Sauvegarder les paramètres
          </button>
          <button onClick={handleLogout} className="w-full py-3 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition active:scale-95 mb-4">
            Se déconnecter
          </button>
          <button onClick={deleteAccount} className="w-full py-3 rounded-xl text-red-600 font-bold bg-red-50 hover:bg-red-100 transition active:scale-95 flex items-center justify-center gap-2">
            <Trash2 size={18} /> Supprimer le compte
          </button>
        </section>
      </div>
      
      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
      
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Supprimer le compte</h3>
            <p className="text-gray-600 mb-6">Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                Annuler
              </button>
              <button onClick={confirmDeleteAccount} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
