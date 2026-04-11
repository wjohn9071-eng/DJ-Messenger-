import React, { useState, useRef, useEffect } from 'react';
import { db, collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, query, orderBy, getDoc, setDoc, arrayUnion, arrayRemove, storage, ref, uploadBytesResumable, getDownloadURL } from '../lib/firebase';
import { djStyleBg, djStyleText } from '../lib/utils';
import { Send, Trash2, Shield, UserX, Plus, Hash, Lock, MessageSquare, UserPlus, VolumeX, Ban, Pin, Info, ChevronRight, Globe, CheckCircle2, AlertCircle, MoreVertical, Image as ImageIcon, Paperclip, Smile, Play, X, BarChart2, Download, Menu } from 'lucide-react';
import { RestrictedActionPopup } from './RestrictedActionPopup';
import { AppState, Group } from '../types';

export function Discussions({ state, updateState }: { state: AppState, updateState: any }) {
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'sms' | 'recent'>(state.discussionTab || (state.newMessages && state.newMessages.length > 0 ? 'recent' : 'public'));
  const activeGroup = state.activeGroup;
  const setActiveGroup = (id: string | null) => updateState({ activeGroup: id });
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);

  const isTest = state.currentUser === 'test';
  const currentUser = (isTest || !state.currentUser) ? null : (state.currentUserData || state.users[state.currentUser as string]);

  const allRecentMessages = [
    ...Object.values(state.groups || {})
      .filter(g => {
        // Other groups can be seen by members or admins
        return (g.type === 'public' || (g.members && g.members.includes(state.currentUser as string)) || currentUser?.isAdmin) && !g.id.startsWith('sms-dj-help-') && (!g.id.startsWith('sms-dj-bot-') || !isTest);
      })
      .map(g => {
        const lastRead = currentUser?.lastReadTimestamps?.[g.id] || '0';
        const newCount = (g.messages || []).filter(m => !m.isSystem && m.timestamp > lastRead).length;
        const lastMsg = (g.messages || []).filter(m => !m.isSystem).slice(-1)[0];
        
        return {
          groupId: g.id,
          groupName: g.name,
          type: g.type,
          lastMessage: lastMsg,
          newCount,
          timestamp: lastMsg?.timestamp || '0',
          isSMS: false
        };
      }),
    ...Object.values(state.privateMessages || {})
      .filter(chat => {
        const otherMember = chat?.members?.find(m => m !== state.currentUser);
        return chat && chat.members && chat.members.includes(state.currentUser as string) && otherMember;
      })
      .map(chat => {
        const otherId = chat.members?.find((m: string) => m !== state.currentUser);
        const otherName = state.users[otherId || '']?.name || otherId || 'Inconnu';
        const lastRead = currentUser?.lastReadTimestamps?.[chat.id] || '0';
        const newCount = (chat.messages || []).filter(m => !m.isSystem && m.timestamp > lastRead).length;
        const lastMsg = (chat.messages || []).filter(m => !m.isSystem).slice(-1)[0];
        
        return {
          groupId: chat.id,
          groupName: otherName,
          type: 'sms',
          lastMessage: lastMsg,
          newCount,
          timestamp: lastMsg?.timestamp || '0',
          isSMS: true
        };
      })
  ].filter(item => item.lastMessage)
   .sort((a, b) => {
     const timeA = new Date(a.timestamp).getTime();
     const timeB = new Date(b.timestamp).getTime();
     return timeB - timeA;
   });

  // Remove auto-select first group/chat if none active

  useEffect(() => {
    if (state.discussionTab) {
      setActiveTab(state.discussionTab);
    }
  }, [state.discussionTab]);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupReason, setNewGroupReason] = useState('informer');
  const [newGroupReasonDetail, setNewGroupReasonDetail] = useState('');
  const [newGroupInvite, setNewGroupInvite] = useState<string[]>([]);
  const [newGroupCode, setNewGroupCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [smsSearch, setSmsSearch] = useState('');
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<{msgId: string, user: string} | null>(null);
  const [showDeleteSmsPrompt, setShowDeleteSmsPrompt] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stickers = [
    { id: 'cool', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=cool' },
    { id: 'love', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=love' },
    { id: 'party', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=party' },
    { id: 'rock', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=rock' },
    { id: 'wow', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=wow' },
    { id: 'laugh', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=laugh' },
    { id: 'fire', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=fire' },
    { id: 'star', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=star' },
    { id: 'dj', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=dj' },
    { id: 'music', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=music' },
    { id: 'vinyl', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=vinyl' },
    { id: 'headphones', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=headphones' },
    { id: 'speaker', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=speaker' },
    { id: 'dance', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=dance' },
  ];

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[#007FFF] drop-shadow-[0_0_8px_rgba(0,127,255,0.5)] hover:underline font-bold break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleSignUpRedirect = () => {
    updateState({ currentUser: null });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Clear notification for active group and update last read timestamp
    if (activeGroup && state.groups && state.groups[activeGroup]) {
      setTimeout(() => {
        updateState((prev: AppState) => {
          const newMessages = prev.newMessages?.filter(id => id !== activeGroup) || [];
          const newUsers = { ...prev.users };
          if (prev.currentUser && newUsers[prev.currentUser]) {
            const user = { ...newUsers[prev.currentUser] };
            user.lastReadTimestamps = {
              ...(user.lastReadTimestamps || {}),
              [activeGroup]: new Date().toISOString()
            };
            newUsers[prev.currentUser] = user;
          }
          return { newMessages, users: newUsers };
        });
      }, 0);
    }
  }, [state.groups?.[activeGroup || '']?.messages, activeGroup]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    if (!state.currentUser || !activeGroup || !messageInput.trim()) return;

    const isSMS = activeGroup.startsWith('sms_');
    const group = !isSMS ? state.groups?.[activeGroup] : null;
    if (!isSMS && !group) {
      console.error("Group not found for activeGroup:", activeGroup);
      return;
    }
    
    const msgText = messageInput.trim();
    setMessageInput('');

    let otherUser = '';
    if (isSMS) {
      const parts = activeGroup.replace('sms_', '').split('_');
      const otherUid = parts.find(p => p !== state.currentUser);
      otherUser = state.users[otherUid!]?.name || otherUid || 'Inconnu';
    }

    try {
      const msgData = {
        text: msgText,
        user: state.currentUser,
        senderId: state.currentUser,
        senderName: currentUser?.name || state.currentUser || 'Utilisateur',
        timestamp: new Date().toISOString(),
        isSystem: false,
        groupName: isSMS ? otherUser : (group?.name || 'Groupe'),
        groupType: isSMS ? 'SMS' : (group?.type === 'public' ? 'PUBLIC' : 'PRIVÉ')
      };
      
      if (isSMS) {
        const msgRef = collection(db, 'private_messages', activeGroup, 'messages');
        await addDoc(msgRef, msgData);
      } else {
        // Check permissions
        if (group?.banned?.includes(state.currentUser as string)) return showToast("Tu es banni de ce groupe.");
        if (group?.muted?.includes(state.currentUser as string)) return showToast("Tu es muet dans ce groupe.");
        
        const isAdmin = group?.admins?.includes(state.currentUser as string) || currentUser?.isAdmin;
        const isCreator = group?.creator === state.currentUser;
        if (!(group?.allowOthersToSpeak ?? true) && !isAdmin && !isCreator) {
          return showToast("Seuls les admins peuvent parler ici.");
        }

        const msgRef = collection(db, 'groups', activeGroup, 'messages');
        await addDoc(msgRef, msgData);

        // Update group last activity
        await setDoc(doc(db, 'groups', activeGroup), {
          lastActivity: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error.code === 'unavailable') {
        showToast("Mode hors-ligne: Le message sera envoyé dès le retour de la connexion.");
      } else {
        showToast("Erreur lors de l'envoi: " + (error.message || "Vérifie ta connexion."));
      }
    }
  };

  const handleFileClick = () => {
    if (isTest) return setShowRestrictedPopup(true);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    const file = e.target.files?.[0];
    if (!file || !activeGroup) return;

    // Limit to 200MB
    if (file.size > 200 * 1024 * 1024) {
      showToast("Fichier trop volumineux (max 200 Mo).");
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      showToast("Format non supporté (Images et Vidéos uniquement).");
      return;
    }

    try {
      const storageRef = ref(storage, `chats/${activeGroup}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => {
          console.error("Upload error:", error);
          showToast("Erreur lors de l'envoi du fichier.");
          setUploadProgress(null);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await sendMultimediaMessage(downloadURL, isImage ? 'image' : 'video', file.name);
          setUploadProgress(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      );
    } catch (error) {
      console.error("File upload error:", error);
      showToast("Erreur lors de l'envoi.");
    }
  };

  const sendMultimediaMessage = async (url: string, type: 'image' | 'video' | 'sticker', fileName?: string) => {
    if (!activeGroup || !state.currentUser) return;
    const isSMS = activeGroup.startsWith('sms_');
    
    let otherUser = '';
    if (isSMS) {
      const parts = activeGroup.replace('sms_', '').split('_');
      const otherUid = parts.find(p => p !== state.currentUser);
      otherUser = state.users[otherUid!]?.name || otherUid || 'Inconnu';
    }

    try {
      const msgData = {
        text: type === 'image' ? "📷 Image" : type === 'video' ? "🎥 Vidéo" : "✨ Sticker",
        user: state.currentUser,
        fileUrl: url,
        fileType: type,
        fileName: fileName || '',
        senderId: state.currentUser,
        senderName: currentUser?.name || state.currentUser || 'Utilisateur',
        timestamp: new Date().toISOString(),
        isSystem: false,
        groupName: isSMS ? otherUser : (state.groups?.[activeGroup]?.name || 'Groupe'),
        groupType: isSMS ? 'SMS' : (state.groups?.[activeGroup]?.type === 'public' ? 'PUBLIC' : 'PRIVÉ')
      };

      const path = isSMS ? 'private_messages' : 'groups';
      await addDoc(collection(db, path, activeGroup, 'messages'), msgData);

      if (!isSMS) {
        await setDoc(doc(db, 'groups', activeGroup), {
          lastActivity: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error sending multimedia message:", error);
      showToast("Erreur lors de l'envoi.");
    }
  };

  const handleSendSticker = (url: string) => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    sendMultimediaMessage(url, 'sticker');
    setShowStickers(false);
  };

  const handleCreatePoll = async () => {
    if (isTest) return setShowRestrictedPopup(true);
    if (!activeGroup || !pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;

    const isSMS = activeGroup.startsWith('sms_');
    const type = 'poll';
    
    const pollData = {
      question: pollQuestion.trim(),
      options: pollOptions.filter(o => o.trim()).map((text, i) => ({
        id: `opt-${i}-${Date.now()}`,
        text: text.trim(),
        votes: []
      }))
    };

    try {
      const msgData = {
        text: `📊 Sondage : ${pollQuestion.trim()}`,
        user: state.currentUser,
        poll: pollData,
        senderId: state.currentUser,
        senderName: currentUser?.name || state.currentUser,
        timestamp: new Date().toISOString(),
        isSystem: false,
        groupName: isSMS ? 'SMS' : state.groups[activeGroup]?.name,
        groupType: isSMS ? 'SMS' : (state.groups[activeGroup]?.type === 'public' ? 'PUBLIC' : 'PRIVÉ')
      };

      const path = isSMS ? 'private_messages' : 'groups';
      await addDoc(collection(db, path, activeGroup, 'messages'), msgData);

      if (!isSMS) {
        await updateDoc(doc(db, 'groups', activeGroup), {
          lastActivity: new Date().toISOString()
        });
      }

      setShowPollCreator(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (error) {
      console.error("Error creating poll:", error);
      showToast("Erreur lors de la création du sondage.");
    }
  };

  const handleVote = async (messageId: string, optionId: string) => {
    if (isTest) return setShowRestrictedPopup(true);
    if (!activeGroup) return;
    const isSMS = activeGroup.startsWith('sms_');
    const path = isSMS ? 'private_messages' : 'groups';
    
    try {
      const msgRef = doc(db, path, activeGroup, 'messages', messageId);
      let msgSnap;
      try {
        msgSnap = await getDoc(msgRef);
      } catch (e: any) {
        console.error("Erreur lors de la récupération du sondage:", e);
        return showToast("Impossible de voter : connexion à la base de données échouée.");
      }
      if (!msgSnap.exists()) return;
      
      const message = msgSnap.data() as any;
      if (!message.poll || message.poll.closed) return;

      const newPoll = { ...message.poll };
      newPoll.options = newPoll.options.map((opt: any) => {
        const newVotes = (opt.votes || []).filter((v: string) => v !== state.currentUser);
        if (opt.id === optionId) {
          newVotes.push(state.currentUser!);
        }
        return { ...opt, votes: newVotes };
      });

      await updateDoc(msgRef, { poll: newPoll });
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleClosePoll = async (messageId: string) => {
    if (isTest) return setShowRestrictedPopup(true);
    if (!activeGroup) return;
    const isSMS = activeGroup.startsWith('sms_');
    const path = isSMS ? 'private_messages' : 'groups';
    
    try {
      const msgRef = doc(db, path, activeGroup, 'messages', messageId);
      await updateDoc(msgRef, { 'poll.closed': true });
      showToast("Sondage clôturé.");
    } catch (error) {
      console.error("Error closing poll:", error);
      showToast("Erreur lors de la clôture du sondage.");
    }
  };

  const renderMessageText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#00FFFF] font-bold underline decoration-[#00FFFF] decoration-2 underline-offset-4 transition-all px-1.5 py-0.5 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/20 hover:bg-[#00FFFF]/20"
            style={{ 
              textShadow: '0 0 12px rgba(0, 255, 255, 0.9)',
              boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)'
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      showToast("Erreur lors du téléchargement.");
    }
  };

  const handleCreateGroup = async () => {
    if (!state.currentUser) return;
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    if (!newGroupName.trim()) return showToast("Nom du groupe requis.");

    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newGroup = {
      id: groupId,
      type: activeTab === 'public' ? 'public' : 'private',
      name: newGroupName.trim(),
      reason: newGroupReason,
      reasonDetail: newGroupReasonDetail,
      creator: state.currentUser as string,
      admins: [state.currentUser as string],
      members: [state.currentUser as string, ...newGroupInvite],
      banned: [],
      muted: [],
      code: activeTab === 'private' ? newGroupCode : null,
      allowOthersToSpeak: true,
      allowOthersToInvite: true,
      lastActivity: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'groups', groupId), newGroup);
      
      // Add initial system message
      try {
        await addDoc(collection(db, 'groups', groupId, 'messages'), {
          text: `Groupe ${newGroup.name} créé par ${currentUser?.name || state.currentUser}`,
          senderId: 'system',
          senderName: 'Système',
          timestamp: new Date().toISOString(),
          isSystem: true
        });
      } catch (msgError) {
        console.warn("Could not send initial system message:", msgError);
        // Not a fatal error, continue
      }

      setShowCreateGroup(false);
      setWizardStep(1);
      setNewGroupName('');
      setNewGroupReason('informer');
      setNewGroupReasonDetail('');
      setNewGroupInvite([]);
      setNewGroupCode('');
      setActiveGroup(groupId);
      showToast("Groupe créé avec succès !");
    } catch (error: any) {
      console.error("Error creating group:", error);
      showToast("Erreur lors de la création du groupe: " + (error.message || "Inconnue"));
    }
  };

  const renderWizard = () => {
    const progress = (wizardStep / 4) * 100;
    const reasons = [
      { id: 'informer', label: 'Pour informer' },
      { id: 'converser', label: 'Pour converser' },
      { id: 'etudier', label: 'Pour étudier' },
      { id: 'club', label: 'Pour créer un club' },
      { id: 'autre', label: 'Autres' }
    ];

    return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-8 duration-500 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-black uppercase tracking-tighter ${djStyleText}`}>Créer un groupe {activeTab === 'public' ? 'Public' : 'Privé'}</h3>
          <button onClick={() => { setShowCreateGroup(false); setWizardStep(1); }} className="text-gray-400 hover:text-gray-600">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">
            <span>Progression</span>
            <span>Étape {wizardStep}/4</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
            <div className={`${djStyleBg} h-full transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {wizardStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Nom du groupe</label>
              <input 
                type="text" 
                placeholder="Ex: Les Fans de DJ..." 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)} 
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all text-lg font-bold" 
              />
            </div>
            <button onClick={() => newGroupName.trim() ? setWizardStep(2) : showToast("Nom requis")} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-all active:scale-95 ${djStyleBg}`}>
              Continuer
            </button>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Raison de la création</label>
              <div className="grid grid-cols-1 gap-2">
                {reasons.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setNewGroupReason(r.id)}
                    className={`px-6 py-3 rounded-xl border-2 font-bold transition-all text-left flex justify-between items-center ${newGroupReason === r.id ? 'border-[#0D98BA] bg-blue-50 text-[#0D98BA]' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}
                  >
                    {r.label}
                    {newGroupReason === r.id && <div className="w-2 h-2 rounded-full bg-[#0D98BA]" />}
                  </button>
                ))}
              </div>
              {newGroupReason === 'autre' && (
                <input 
                  type="text" 
                  placeholder="Précisez l'utilité (optionnel)..." 
                  value={newGroupReasonDetail} 
                  onChange={e => setNewGroupReasonDetail(e.target.value)} 
                  className="w-full mt-3 px-6 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white outline-none transition-all font-medium" 
                />
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setWizardStep(1)} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Retour</button>
              <button 
                onClick={() => setWizardStep(3)} 
                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-all active:scale-95 ${djStyleBg}`}
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {wizardStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Inviter des membres (Optionnel)</label>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {Object.keys(state.users).filter(u => u !== state.currentUser && u !== 'DJ_Bot').map(u => (
                  <label key={u} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${newGroupInvite.includes(u) ? 'border-[#0D98BA] bg-blue-50' : 'border-gray-50 hover:border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xs">
                        {state.users[u].avatar ? <img src={state.users[u].avatar!} className="w-full h-full rounded-full object-cover" /> : (u || '?')[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-700">@{state.users[u].name || u}</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-gray-300 text-[#0D98BA] focus:ring-[#0D98BA]"
                      checked={newGroupInvite.includes(u)} 
                      onChange={e => e.target.checked ? setNewGroupInvite([...newGroupInvite, u]) : setNewGroupInvite(newGroupInvite.filter(i => i !== u))} 
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setWizardStep(2)} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Retour</button>
              <button onClick={() => activeTab === 'public' ? handleCreateGroup() : setWizardStep(4)} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-all active:scale-95 ${djStyleBg}`}>
                {activeTab === 'public' ? 'Créer le groupe' : 'Suivant'}
              </button>
            </div>
          </div>
        )}

        {wizardStep === 4 && activeTab === 'private' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Code d'entrée (5-7 caractères)</label>
              <p className="text-[10px] text-gray-400 mb-3 italic">Mélangez majuscules, minuscules, chiffres et symboles.</p>
              <input 
                type="text" 
                placeholder="Code secret" 
                minLength={5}
                maxLength={7} 
                value={newGroupCode} 
                onChange={e => setNewGroupCode(e.target.value)} 
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all text-2xl font-black text-center tracking-[0.5em] font-mono" 
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setWizardStep(3)} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Retour</button>
              <button 
                onClick={() => {
                  if (newGroupCode.length < 5 || newGroupCode.length > 7) {
                    return showToast("Le code doit faire entre 5 et 7 caractères.");
                  }
                  if (Object.values(state.groups).some(g => g.code === newGroupCode)) {
                    return showToast("Ce code est déjà utilisé.");
                  }
                  handleCreateGroup();
                }} 
                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-all active:scale-95 ${djStyleBg}`}
              >
                Créer le groupe
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleJoinPrivateGroup = async () => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    const group = Object.values(state.groups).find(g => g.type === 'private' && g.code === joinCode);
    if (!group) return showToast("Code invalide.");
    if ((group.members || []).includes(state.currentUser as string)) return showToast("Déjà membre.");
    if ((group.banned || []).includes(state.currentUser as string)) return showToast("Tu es banni de ce groupe.");

    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        members: arrayUnion(state.currentUser)
      });
      setJoinCode('');
      setActiveGroup(group.id);
      showToast(`Bienvenue dans ${group.name} !`);
    } catch (error) {
      console.error("Error joining private group:", error);
      showToast("Erreur lors de l'adhésion.");
    }
  };

  const handleJoinPublicGroup = async (groupId: string) => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(state.currentUser)
      });
      showToast("Tu as rejoint le groupe !");
      setActiveGroup(groupId);
    } catch (error) {
      console.error("Error joining group:", error);
      showToast("Erreur lors de l'adhésion.");
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(state.currentUser)
      });
      setActiveGroup(null);
      showToast("Tu as quitté le groupe.");
    } catch (error) {
      console.error("Error leaving group:", error);
      showToast("Erreur lors du départ.");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteDoc(doc(db, 'groups', groupId));
      setActiveGroup(null);
      showToast("Groupe supprimé.");
    } catch (error) {
      console.error("Error deleting group:", error);
      showToast("Erreur lors de la suppression.");
    }
  };

  const handleStartSMS = async (otherUid: string) => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    if (!state.currentUser || !otherUid || typeof otherUid !== 'string' || !otherUid.trim()) return;
    
    const chatId = [state.currentUser, otherUid.trim()].sort().join('_');
    const smsId = `sms_${chatId}`;
    
    try {
      const chatRef = doc(db, 'private_messages', smsId);
      let snap;
      try {
        snap = await getDoc(chatRef);
      } catch (e: any) {
        console.error("Erreur lors de la vérification de la discussion privée:", e);
        setActiveGroup(smsId);
        setSmsSearch('');
        return;
      }
      if (!snap.exists()) {
        try {
          await setDoc(chatRef, {
            id: smsId,
            members: [state.currentUser, otherUid],
            createdAt: new Date().toISOString()
          });
        } catch (e: any) {
          console.error("Erreur lors de la création de la discussion privée:", e);
          setActiveGroup(smsId);
          setSmsSearch('');
          return;
        }
      }
      setActiveGroup(smsId);
      setSmsSearch('');
    } catch (error) {
      console.error("Error starting SMS:", error);
      setActiveGroup(smsId);
      setSmsSearch('');
    }
  };

  const handleTabChange = (tab: 'public' | 'private' | 'sms' | 'recent') => {
    if (isTest && (tab === 'private' || tab === 'sms')) {
      setShowRestrictedPopup(true);
      return;
    }
    setActiveTab(tab);
    updateState({ discussionTab: tab });
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!activeGroup) return;
    const isSMS = activeGroup.startsWith('sms_');
    const group = state.groups[activeGroup] || state.privateMessages[activeGroup];
    if (!group) return;

    const msg = group.messages?.find(m => m.id === msgId);
    if (!msg) return;

    const isDeletedAccount = !state.users || !state.users[msg.user];
    const user = state.users && state.currentUser ? state.users[state.currentUser as string] : null;
    
    const isAdmin = !isSMS && ((group as Group).admins?.includes(state.currentUser as string) || user?.isAdmin);
    const isCreator = !isSMS && (group as Group).creator === state.currentUser;
    
    const canDelete = msg.user === state.currentUser || isAdmin || isCreator || isDeletedAccount;
    
    if (!canDelete) return showToast("Non autorisé.");

    if (isDeletedAccount) {
      setDeletePrompt({ msgId, user: msg.user });
      return;
    }

    try {
      const msgRef = doc(db, isSMS ? 'private_messages' : 'groups', activeGroup, 'messages', msgId);
      await deleteDoc(msgRef);
    } catch (error) {
      console.error("Error deleting message:", error);
      showToast("Erreur lors de la suppression.");
    }
  };

  const confirmDeleteAll = async () => {
    if (!deletePrompt || !activeGroup) return;
    const isSMS = activeGroup.startsWith('sms_');
    try {
      const messagesRef = collection(db, isSMS ? 'private_messages' : 'groups', activeGroup, 'messages');
      const group = state.groups[activeGroup] || state.privateMessages[activeGroup];
      const messagesToDelete = group.messages.filter(m => m.user === deletePrompt.user);
      
      for (const m of messagesToDelete) {
        await deleteDoc(doc(messagesRef, m.id));
      }
      showToast("Tous les messages de l'utilisateur supprimés.");
    } catch (error) {
      console.error("Error deleting all messages:", error);
      showToast("Erreur lors de la suppression massive.");
    }
    setDeletePrompt(null);
  };

  const confirmDeleteOne = async () => {
    if (!deletePrompt || !activeGroup) return;
    const isSMS = activeGroup.startsWith('sms_');
    try {
      const msgRef = doc(db, isSMS ? 'private_messages' : 'groups', activeGroup, 'messages', deletePrompt.msgId);
      await deleteDoc(msgRef);
      showToast("Message supprimé.");
    } catch (error) {
      console.error("Error deleting message:", error);
      showToast("Erreur lors de la suppression.");
    }
    setDeletePrompt(null);
  };

  const handleBanUser = async (userToBan: string) => {
    if (!activeGroup || !state.groups || !state.groups[activeGroup]) return;
    const group = state.groups[activeGroup];
    if (!(group.admins || []).includes(state.currentUser as string) && !currentUser?.isAdmin) return showToast("Non autorisé.");
    if (userToBan === group.creator) return showToast("Impossible de bannir le créateur.");

    try {
      const groupRef = doc(db, 'groups', activeGroup);
      await updateDoc(groupRef, {
        banned: arrayUnion(userToBan),
        members: arrayRemove(userToBan)
      });
      showToast(`${userToBan} banni.`);
    } catch (error) {
      console.error("Error banning user:", error);
      showToast("Erreur lors du bannissement.");
    }
  };

  const handleMuteUser = async (userToMute: string) => {
    if (!activeGroup || !state.groups || !state.groups[activeGroup]) return;
    const group = state.groups[activeGroup];
    if (!(group.admins || []).includes(state.currentUser as string) && !currentUser?.isAdmin) return showToast("Non autorisé.");
    if (userToMute === group.creator) return showToast("Impossible de couper le micro au créateur.");

    const isMuted = (group.muted || []).includes(userToMute);
    try {
      const groupRef = doc(db, 'groups', activeGroup);
      if (isMuted) {
        await updateDoc(groupRef, {
          muted: arrayRemove(userToMute)
        });
        showToast(`Micro réactivé pour ${userToMute}.`);
      } else {
        await updateDoc(groupRef, {
          muted: arrayUnion(userToMute)
        });
        showToast(`Micro coupé pour ${userToMute}.`);
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
      showToast("Erreur lors de la modification des droits.");
    }
  };

  const handlePinGroup = () => {
    if (isTest || !activeGroup) return;
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      const user = { ...newUsers[prev.currentUser as string] };
      const pinned = user.pinnedGroups ? [...user.pinnedGroups] : [];
      
      if (pinned.includes(activeGroup)) {
        user.pinnedGroups = pinned.filter(id => id !== activeGroup);
        showToast("Groupe désépinglé.");
      } else {
        user.pinnedGroups = [...pinned, activeGroup];
        showToast("Groupe épinglé !");
      }
      newUsers[prev.currentUser as string] = user;
      return { users: newUsers };
    });
  };

  const visibleGroups = Object.values(state.groups || {}).filter(g => {
    if (activeTab === 'public') return g.type === 'public';
    if (activeTab === 'private') {
      // For private tab, show groups that are NOT direct messages (more than 2 members or has a code)
      // AND only show if user is member or creator
      // AND for private groups, only show if user is already a member (entered code)
      return g.type === 'private' && 
             ((g.members || []).includes(state.currentUser as string) || g.creator === state.currentUser || currentUser?.isAdmin) &&
             ((g.members || []).length > 2 || g.code);
    }
    return false; // Recent and SMS handled separately
  }).sort((a, b) => {
    const aPinned = currentUser?.pinnedGroups?.includes(a.id) ? 1 : 0;
    const bPinned = currentUser?.pinnedGroups?.includes(b.id) ? 1 : 0;
    return bPinned - aPinned;
  });

  const helpGroupId = `sms-dj-bot-${state.currentUser}`;
  const botGroup = state.groups[helpGroupId];

  const visibleSMS = [
    ...Object.values(state.privateMessages || {}).filter(chat => {
      const otherMember = chat?.members?.find(m => m !== state.currentUser);
      return chat && chat.members && chat.members.includes(state.currentUser as string) && (!chat.members.includes('dj-bot') || !isTest) && otherMember;
    }),
    ...(botGroup && !isTest ? [botGroup] : [])
  ];

  if (activeGroup) {
    let group = state.groups?.[activeGroup] || state.privateMessages?.[activeGroup];
    
    if (!group && activeGroup.startsWith('sms_')) {
      const parts = activeGroup.replace('sms_', '').split('_');
      group = {
        id: activeGroup,
        type: 'sms',
        members: parts,
        messages: [],
        name: 'SMS',
        creator: parts[0],
        admins: parts
      } as any;
    }

    if (!group) return null;

    const isSMS = activeGroup.startsWith('sms_');
    const otherUid = isSMS ? (group as any).members?.find((m: string) => m !== state.currentUser) : null;
    const otherUserData = otherUid ? state.users[otherUid] : null;
    const otherUser = otherUserData?.name || otherUid;

    const isAdmin = !isSMS && ((group as Group).admins?.includes(state.currentUser as string) || currentUser?.isAdmin);
    const isCreator = !isSMS && (group as Group).creator === state.currentUser;
    const isMember = (group.members || []).includes(state.currentUser as string);
    const isPinned = currentUser?.pinnedGroups?.includes(activeGroup);
    const lastRead = currentUser?.lastReadTimestamps?.[activeGroup] || '0';

    const handleDeleteSMS = async (smsId: string) => {
      try {
        await deleteDoc(doc(db, 'private_messages', smsId));
        setActiveGroup(null);
        setShowDeleteSmsPrompt(null);
        if (toast !== "Discussion supprimée.") {
          setToast("Discussion supprimée.");
          setTimeout(() => setToast(null), 3000);
        }
      } catch (error) {
        console.error("Error deleting SMS:", error);
        setToast("Erreur lors de la suppression.");
        setTimeout(() => setToast(null), 3000);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-[#f9fafb] animate-in slide-in-from-right-8 duration-300">
        <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm z-[1000] pt-safe">
          <div className="flex items-center gap-3">
            <button onClick={() => { setActiveGroup(null); setShowGroupSettings(false); }} className="p-2.5 -ml-2 hover:bg-gray-100 rounded-xl transition text-gray-700 bg-gray-50 shadow-sm border border-gray-100 mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button onClick={() => updateState({ menuOpen: true })} className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-xl transition text-gray-700 relative z-[1001]">
              <Menu size={24} />
            </button>
            <div className={`w-10 h-10 rounded-full ${isSMS ? 'bg-gray-100' : 'bg-gradient-to-br from-[#007FFF] to-[#32CD32]'} flex items-center justify-center text-white font-bold shadow-md overflow-hidden`}>
              {isSMS && otherUserData?.avatar ? (
                <img src={otherUserData.avatar} className="w-full h-full object-cover" />
              ) : (
                <span>{(otherUser || group.name || '?')[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 leading-tight">{isSMS ? otherUser : group.name}</h3>
              <p className="text-xs text-gray-500 font-medium">{isSMS ? (otherUserData?.lastSeen ? `Vu ${otherUserData.lastSeen}` : 'En ligne') : `${(group.members || []).length} membres`}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isSMS && (
              <button onClick={() => setShowDeleteSmsPrompt(activeGroup)} className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition" title="Supprimer la discussion">
                <Trash2 size={20} />
              </button>
            )}
            {!isTest && (
              <button onClick={handlePinGroup} className={`p-2 rounded-full transition ${isPinned ? djStyleText + ' bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`} title={isPinned ? "Désépingler" : "Épingler"}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
              </button>
            )}
            {!isSMS && isMember && (
              <button onClick={() => handleLeaveGroup(activeGroup)} className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition" title="Quitter le groupe">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            )}
            {!isSMS && isMember && (
              <button onClick={() => setShowGroupSettings(!showGroupSettings)} className={`p-2 rounded-full transition ${showGroupSettings ? djStyleText + ' bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`} title="Paramètres du groupe">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            )}
          </div>
        </div>

        {showGroupSettings && (
          <div className="bg-white border-b p-6 space-y-6 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-center">
              <h4 className="font-black uppercase tracking-widest text-xs text-gray-400">Paramètres de {group.name}</h4>
              <div className="flex gap-2">
                {isMember && (
                  <button 
                    onClick={async () => {
                      const newName = prompt("Nouveau nom du groupe :", group.name);
                      if (newName && newName !== group.name) {
                        try {
                          await setDoc(doc(db, 'groups', activeGroup), { name: newName }, { merge: true });
                          showToast("Groupe renommé !");
                        } catch (err) {
                          showToast("Erreur lors du renommage.");
                        }
                      }
                    }}
                    className="text-[10px] font-black uppercase text-[#0D98BA] hover:underline"
                  >
                    Renommer
                  </button>
                )}
                {!isCreator && <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-1 rounded-full">Lecture seule</span>}
              </div>
            </div>
            
            {group.type === 'private' && (
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 block">Code du groupe</span>
                  {isCreator && (
                    <button 
                      onClick={async () => {
                        const newCode = prompt("Nouveau code (5-7 caractères) :", group.code);
                        if (newCode && newCode !== group.code) {
                          if (newCode.length < 5 || newCode.length > 7) return showToast("Code invalide (5-7 caractères).");
                          try {
                            await setDoc(doc(db, 'groups', activeGroup), { code: newCode }, { merge: true });
                            showToast("Code mis à jour !");
                          } catch (e) {
                            showToast("Erreur lors de la mise à jour du code.");
                          }
                        }
                      }}
                      className="text-[10px] font-black uppercase text-[#0D98BA] hover:underline"
                    >
                      Modifier
                    </button>
                  )}
                </div>
                <code className="text-xl font-black tracking-[0.3em] text-[#0D98BA]">{group.code}</code>
              </div>
            )}

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-bold text-gray-700">Autoriser les autres à parler</span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    disabled={!isCreator}
                    checked={group.allowOthersToSpeak ?? true} 
                    onChange={async e => {
                      const val = e.target.checked;
                      updateState((prev: AppState) => ({
                        groups: { ...prev.groups, [activeGroup]: { ...prev.groups[activeGroup], allowOthersToSpeak: val } }
                      }));
                      try {
                        await updateDoc(doc(db, 'groups', activeGroup), { allowOthersToSpeak: val });
                      } catch (err) {
                        console.error("Error updating group setting:", err);
                      }
                    }} 
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${group.allowOthersToSpeak ?? true ? 'bg-[#32CD32]' : 'bg-gray-300'} ${!isCreator ? 'opacity-50' : ''}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${group.allowOthersToSpeak ?? true ? 'transform translate-x-5' : ''}`}></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-bold text-gray-700">Autoriser les autres à ajouter des membres</span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    disabled={!isCreator}
                    checked={group.allowOthersToInvite ?? true} 
                    onChange={async e => {
                      const val = e.target.checked;
                      updateState((prev: AppState) => ({
                        groups: { ...prev.groups, [activeGroup]: { ...prev.groups[activeGroup], allowOthersToInvite: val } }
                      }));
                      try {
                        await updateDoc(doc(db, 'groups', activeGroup), { allowOthersToInvite: val });
                      } catch (err) {
                        console.error("Error updating group setting:", err);
                      }
                    }} 
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${group.allowOthersToInvite ?? true ? 'bg-[#32CD32]' : 'bg-gray-300'} ${!isCreator ? 'opacity-50' : ''}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${group.allowOthersToInvite ?? true ? 'transform translate-x-5' : ''}`}></div>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t space-y-3">
              {(isCreator || (group.allowOthersToInvite ?? true)) && (
                <button 
                  onClick={async () => {
                    const friend = prompt("Nom de l'ami à ajouter :");
                    if (friend && state.users[friend]) {
                      try {
                        await updateDoc(doc(db, 'groups', activeGroup), {
                          members: arrayUnion(friend)
                        });
                        showToast(`${state.users[friend].name || friend} ajouté !`);
                      } catch (err) {
                        console.error("Error adding member:", err);
                        showToast("Erreur lors de l'ajout.");
                      }
                    } else if (friend) {
                      showToast("Utilisateur introuvable.");
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-blue-50 text-[#0D98BA] font-bold text-sm hover:bg-blue-100 transition"
                >
                  Ajouter un membre
                </button>
              )}
              {isCreator && (
                <button 
                  onClick={() => handleDeleteGroup(activeGroup)}
                  className="w-full py-3 rounded-xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition"
                >
                  Supprimer le groupe
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(group.messages || []).map(msg => {
            const isMine = msg.user === state.currentUser;
            const isUnread = !isMine && !msg.isSystem && msg.timestamp > lastRead;
            const isDeletedAccount = !msg.isSystem && (!state.users || !state.users[msg.user]);
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <span className="bg-gray-200/80 text-gray-600 text-[10px] px-4 py-1.5 rounded-full uppercase font-bold shadow-sm">{msg.text}</span>
                </div>
              );
            }
            return (
              <div key={msg.id} className={`flex ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group/msg`}>
                {!isMine && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white shadow-sm mb-4 shrink-0">
                    {isDeletedAccount ? '?' : (state.users && state.users[msg.user]?.avatar ? <img src={state.users[msg.user].avatar!} className="w-full h-full rounded-full object-cover" /> : (msg.user || '?')[0].toUpperCase())}
                  </div>
                )}
                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <div className="flex items-center gap-2 mb-1 mx-1">
                    <span className="text-[10px] text-gray-500 font-semibold">
                      {msg.user === 'test' ? 'Anonyme' : (state.users[msg.user]?.name || msg.user)}
                    </span>
                    {isDeletedAccount && <span className="text-[10px] text-red-500 font-bold uppercase">Compte supprimé</span>}
                    {isAdmin && !isMine && msg.user !== group.creator && !isDeletedAccount && msg.user !== 'test' && (
                      <button onClick={() => handleBanUser(msg.user)} className="text-[10px] text-red-500 hover:underline opacity-0 group-hover/msg:opacity-100 transition">Bannir</button>
                    )}
                  </div>
                  <div className={`relative px-4 py-2.5 shadow-sm rounded-2xl ${isMine ? `rounded-br-sm text-white ${djStyleBg}` : 'rounded-bl-sm bg-white border border-gray-100 text-gray-800'} ${isDeletedAccount ? 'cursor-pointer hover:bg-red-50 transition-colors' : ''} ${isUnread ? 'ring-2 ring-[#0D98BA] shadow-[0_0_15px_rgba(13,152,186,0.3)]' : ''}`}
                    onClick={() => isDeletedAccount && handleDeleteMessage(msg.id)}
                  >
                    <div className="absolute -top-4 right-0 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-gray-100 shadow-sm z-10">
                      <span className="text-[8px] font-black uppercase tracking-tighter text-gray-500">
                        [{isSMS ? otherUser : group.name}] - [{(msg as any).groupType || (group.type === 'public' ? 'PUBLIC' : isSMS ? 'SMS' : 'PRIVÉ')}]
                      </span>
                    </div>
                    {msg.fileUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden shadow-inner bg-gray-50 relative group/file">
                        {msg.fileType === 'image' || msg.fileType === 'sticker' ? (
                          <img 
                            src={msg.fileUrl} 
                            alt={msg.fileName || 'Image'} 
                            className={`max-w-full h-auto object-contain ${msg.fileType === 'sticker' ? 'w-24 h-24' : 'max-h-60'}`}
                            referrerPolicy="no-referrer"
                          />
                        ) : msg.fileType === 'video' ? (
                          <video 
                            src={msg.fileUrl} 
                            controls 
                            className="max-w-full max-h-60 rounded-xl"
                          />
                        ) : null}
                        <button 
                          onClick={() => handleDownload(msg.fileUrl!, msg.fileName || 'file')}
                          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover/file:opacity-100 transition shadow-lg backdrop-blur-sm"
                          title="Télécharger"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    )}
                    {msg.poll && (
                      <div className="mb-3 p-5 bg-[#0a0a0a] rounded-[2rem] border border-white/5 space-y-4 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#32CD32] to-transparent opacity-50" />
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-black text-sm uppercase tracking-tighter text-white leading-tight">{msg.poll.question}</h4>
                          {msg.poll.closed && (
                            <span className="text-[8px] font-black uppercase px-2.5 py-1 bg-red-500 text-white rounded-full shadow-lg">Clôturé</span>
                          )}
                        </div>
                        <div className="space-y-2.5">
                          {msg.poll.options.map((opt: any) => {
                            const totalVotes = msg.poll!.options.reduce((acc: number, o: any) => acc + (o.votes?.length || 0), 0);
                            const votes = opt.votes?.length || 0;
                            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                            const hasVoted = opt.votes?.includes(state.currentUser);
                            
                            return (
                              <button 
                                key={opt.id}
                                onClick={() => !msg.poll?.closed && handleVote(msg.id, opt.id)}
                                disabled={msg.poll?.closed}
                                className={`w-full relative h-12 rounded-2xl overflow-hidden border transition-all duration-300 ${!msg.poll?.closed ? 'active:scale-[0.97] bg-white/5 border-white/10 hover:border-[#32CD32]/30' : 'bg-white/5 border-white/5 cursor-default'}`}
                              >
                                <div 
                                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${msg.poll?.closed ? 'bg-gray-700' : 'bg-[#32CD32] shadow-[0_0_20px_rgba(50,205,50,0.3)]'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-between px-5 z-10">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black uppercase tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                      {opt.text}
                                    </span>
                                    {hasVoted && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />}
                                  </div>
                                  <span className="text-xs font-black text-[#32CD32] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                    {percentage}%
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">
                            {msg.poll.options.reduce((acc: number, o: any) => acc + (o.votes?.length || 0), 0)} votes • DJ POLL
                          </p>
                          {(isMine || isAdmin) && !msg.poll.closed && (
                            <button 
                              onClick={() => handleClosePoll(msg.id)}
                              className="text-[9px] font-black uppercase text-red-500 hover:text-red-400 tracking-widest transition-colors bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20"
                            >
                              Clôturer
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <p className="text-sm break-words leading-relaxed">{renderMessageText(msg.text)}</p>
                    {(isMine || isAdmin || isCreator) && !isDeletedAccount && (
                      <div className={`absolute ${isMine ? '-left-12' : '-right-12'} top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/msg:opacity-100 transition`}>
                        <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full">
                          <Trash2 size={14} />
                        </button>
                        {isAdmin && !isMine && msg.user !== group.creator && (
                          <button onClick={() => handleMuteUser(msg.user)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-full">
                            <VolumeX size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 mx-1 font-medium">{msg.time}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        <div className="p-3 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          {uploadProgress !== null && (
            <div className="mb-3 px-4">
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-1">
                <span>Téléchargement en cours...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className={`${djStyleBg} h-full transition-all duration-300`} style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
          {!isMember && group.type === 'public' && group.name !== 'Général' ? (
            <div className="flex flex-col items-center gap-3 p-2">
              <p className="text-xs text-gray-500 font-medium italic">Rejoins le groupe pour participer à la discussion !</p>
              <button onClick={() => handleJoinPublicGroup(activeGroup)} className={`w-full py-3 rounded-2xl font-black uppercase tracking-widest text-white shadow-lg hover:scale-[1.02] transition-all active:scale-95 ${djStyleBg}`}>
                Être membre
              </button>
            </div>
          ) : (
            <form className="flex gap-2 items-center max-w-3xl mx-auto relative" onSubmit={handleSendMessage}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,video/mp4"
              />
              <button 
                type="button"
                onClick={handleFileClick}
                className="p-2 text-gray-400 hover:text-[#0D98BA] transition"
                title="Envoyer un fichier"
              >
                <Paperclip size={20} />
              </button>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setShowStickers(!showStickers)}
                  className={`p-2 transition ${showStickers ? 'text-[#0D98BA]' : 'text-gray-400 hover:text-[#0D98BA]'}`}
                  title="Stickers"
                >
                  <Smile size={20} />
                </button>
                {showStickers && (
                  <div className="absolute bottom-full left-0 mb-4 bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 grid grid-cols-4 gap-3 w-64 animate-in zoom-in-95 duration-200 origin-bottom-left z-50">
                    <div className="col-span-4 flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Stickers</span>
                      <button onClick={() => setShowStickers(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                    {stickers.map(s => (
                      <button 
                        key={s.id} 
                        type="button"
                        onClick={() => handleSendSticker(s.url)}
                        className="hover:scale-110 transition active:scale-95"
                      >
                        <img src={s.url} alt={s.id} className="w-10 h-10" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setShowPollCreator(!showPollCreator)}
                  className={`p-2 transition ${showPollCreator ? 'text-[#0D98BA]' : 'text-gray-400 hover:text-[#0D98BA]'}`}
                  title="Sondage"
                >
                  <BarChart2 size={20} />
                </button>
                {showPollCreator && (
                  <div className="absolute bottom-full left-0 mb-4 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 w-72 animate-in zoom-in-95 duration-200 origin-bottom-left z-50 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Créer un sondage</span>
                      <button onClick={() => setShowPollCreator(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                    <input 
                      type="text"
                      placeholder="Question du sondage..."
                      value={pollQuestion}
                      onChange={e => setPollQuestion(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#0D98BA] text-sm outline-none"
                    />
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {pollOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            type="text"
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={e => {
                              const newOpts = [...pollOptions];
                              newOpts[i] = e.target.value;
                              setPollOptions(newOpts);
                            }}
                            className="flex-1 px-4 py-2 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#0D98BA] text-xs outline-none"
                          />
                          {pollOptions.length > 2 && (
                            <button 
                              onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                              className="text-red-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="w-full py-2 rounded-xl border-2 border-dashed border-gray-200 text-[10px] font-black uppercase text-gray-400 hover:border-[#0D98BA] hover:text-[#0D98BA] transition"
                    >
                      + Ajouter une option
                    </button>
                    <button 
                      onClick={handleCreatePoll}
                      disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                      className={`w-full py-3 rounded-2xl font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${djStyleBg}`}
                    >
                      Lancer le sondage
                    </button>
                  </div>
                )}
              </div>
              <input 
                type="text" 
                value={messageInput} 
                onChange={e => setMessageInput(e.target.value)} 
                onClick={() => isTest && setShowRestrictedPopup(true)}
                disabled={!isMember && group.type === 'public' && group.name !== 'Général'}
                placeholder={
                  isTest ? "Connectez-vous pour écrire..." : 
                  (!isMember && group.type === 'public' && group.name !== 'Général') ? "Rejoins le groupe pour écrire..." :
                  (!(group.allowOthersToSpeak ?? true) && !isAdmin && !isCreator) ? "Seuls les admins peuvent parler ici." :
                  "Écris un message..."
                } 
                className="flex-1 px-5 py-3 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-[#0D98BA] outline-none transition-all disabled:opacity-50" 
                readOnly={isTest || (!(group.allowOthersToSpeak ?? true) && !isAdmin && !isCreator)}
              />
              <button 
                type="submit" 
                disabled={(!messageInput.trim() && !isTest) || (!(group.allowOthersToSpeak ?? true) && !isAdmin && !isCreator)} 
                className={`p-3.5 rounded-full text-white shadow-md hover:scale-105 transition active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0 ${djStyleBg}`}
              >
                <Send size={20} className="ml-0.5" />
              </button>
            </form>
          )}
        </div>
        {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
        {showDeleteSmsPrompt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Supprimer la discussion ?</h3>
              <p className="text-gray-600 mb-8">Cette action est irréversible. Tous les messages seront perdus.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteSmsPrompt(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition">Annuler</button>
                <button onClick={() => handleDeleteSMS(showDeleteSmsPrompt)} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition shadow-lg shadow-red-500/30">Supprimer</button>
              </div>
            </div>
          </div>
        )}
        {showRestrictedPopup && (
          <RestrictedActionPopup 
            onClose={() => setShowRestrictedPopup(false)} 
            onSignUp={handleSignUpRedirect}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-6 pb-0">
        <h2 className={`text-2xl font-bold mb-6 ${djStyleText}`}>Discussions</h2>
        <div className="flex gap-1.5 p-1 bg-gray-200/50 backdrop-blur-sm rounded-2xl mb-6 shadow-inner">
          <button 
            onClick={() => handleTabChange('public')} 
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'public' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Publics
          </button>
          <button 
            onClick={() => handleTabChange('private')} 
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'private' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Privés
          </button>
          <button 
            onClick={() => handleTabChange('recent')} 
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'recent' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Récents
          </button>
          <button 
            onClick={() => handleTabChange('sms')} 
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sms' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            SMS
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === 'sms' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-50 mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Rechercher un utilisateur</h4>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Pseudo de l'utilisateur..." 
                  value={smsSearch} 
                  onChange={e => setSmsSearch(e.target.value)} 
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all font-bold" 
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                  <UserPlus size={20} />
                </div>
              </div>
              
              {smsSearch.trim() && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(state.users)
                    .filter(u => u !== state.currentUser && state.users[u]?.uid !== state.currentUser && u !== 'DJ_Bot' && u !== 'dj-bot' && (state.users[u]?.name?.toLowerCase().includes(smsSearch.toLowerCase()) || u.toLowerCase().includes(smsSearch.toLowerCase())))
                    .map(u => (
                      <button 
                        key={u} 
                        onClick={() => handleStartSMS(u)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-50 bg-white hover:border-[#0D98BA] hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm overflow-hidden">
                            {state.users[u].avatar ? <img src={state.users[u].avatar!} className="w-full h-full object-cover" /> : (u || '?')[0].toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-800">@{state.users[u].name || u}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-black">Disponible pour SMS</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0D98BA] transition-colors" />
                      </button>
                    ))}
                  {Object.keys(state.users).filter(u => u !== state.currentUser && u !== 'DJ_Bot' && (state.users[u].name?.toLowerCase().includes(smsSearch.toLowerCase()) || u.toLowerCase().includes(smsSearch.toLowerCase()))).length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-4 italic">Aucun utilisateur trouvé.</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Vos discussions SMS</h3>
              {visibleSMS.map((chat, i) => {
                const otherId = chat.members?.find((m: string) => m !== state.currentUser);
                const otherName = state.users[otherId || '']?.name || otherId || 'Inconnu';
                const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
                
                return (
                  <div 
                    key={chat.id || `sms-${i}`} 
                    onClick={() => setActiveGroup(chat.id)}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group"
                  >
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                      {state.users[otherId || '']?.avatar ? <img src={state.users[otherId || ''].avatar!} className="w-full h-full object-cover" /> : <span>{(otherName || '?')[0].toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 truncate pr-2">{otherName}</h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{lastMsg?.time || ''}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {lastMsg ? (lastMsg.user === state.currentUser ? 'Vous: ' : '') + lastMsg.text : 'Démarrer la discussion'}
                      </p>
                    </div>
                  </div>
                );
              })}
              {visibleSMS.length === 0 && !smsSearch.trim() && (
                <div className="text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                  <MessageSquare size={40} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 text-sm font-medium">Recherchez un utilisateur pour<br/>commencer à chatter en privé.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'recent' ? (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Discussions récentes</h3>
            {allRecentMessages.map((item, i) => (
              <div 
                key={item.groupId || `recent-${i}`} 
                onClick={() => {
                  setActiveGroup(item.groupId);
                }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 transition relative overflow-hidden"
              >
                {item.newCount > 0 && (
                  <div className="absolute top-0 right-0 bg-[#0D98BA] text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-md animate-pulse">
                    {item.newCount} nouveau{item.newCount > 1 ? 'x' : ''} message{item.newCount > 1 ? 's' : ''}
                  </div>
                )}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${djStyleText}`}>{item.groupName}</span>
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-gray-100 rounded-full text-gray-400">
                      {item.type === 'public' ? 'PUBLIC' : item.isSMS ? 'SMS' : 'PRIVÉ'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">{item.lastMessage.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                    {state.users[item.lastMessage.user]?.avatar ? <img src={state.users[item.lastMessage.user].avatar!} className="w-full h-full rounded-xl object-cover" /> : (item.lastMessage.user || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700 mb-0.5">@{item.lastMessage.user === 'test' ? 'Anonyme' : (state.users[item.lastMessage.user]?.name || item.lastMessage.user)}</p>
                    <p className={`text-sm truncate ${item.newCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{item.lastMessage.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {allRecentMessages.length === 0 && <p className="text-center text-gray-500 py-8">Aucune discussion récente.</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'public' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Groupes publics</h3>
                  <button onClick={() => { setShowCreateGroup(true); setWizardStep(1); }} className={`p-2 rounded-full ${djStyleBg} shadow-lg hover:scale-110 transition-transform`}>
                    <Plus size={16} className="text-white" />
                  </button>
                </div>
                {visibleGroups.map((g, i) => {
                  const isMember = (g.members || []).includes(state.currentUser as string);
                  return (
                    <div key={g.id || `public-${i}`} onClick={() => setActiveGroup(g.id)} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group relative">
                      {state.newMessages?.includes(g.id) && (
                        <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse z-10" />
                      )}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#007FFF] to-[#32CD32] flex items-center justify-center text-white font-bold text-xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                        <span>{(g.name || '?')[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 truncate pr-2">{g.name}</h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1]?.time : ''}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${state.newMessages?.includes(g.id) ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                            {g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1]?.text : 'Aucun message'}
                          </p>
                          {!isMember && g.name !== 'Général' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleJoinPublicGroup(g.id); }} 
                              className={`ml-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-md ${djStyleBg}`}
                            >
                              Rejoindre
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'private' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Groupes privés</h3>
                  <button onClick={() => { setShowCreateGroup(true); setWizardStep(1); }} className={`p-2 rounded-full ${djStyleBg} shadow-lg hover:scale-110 transition-transform`}>
                    <Plus size={16} className="text-white" />
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-50 mb-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Intégrer un groupe via le code</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Code (ex: A1b2!)" 
                      maxLength={5}
                      value={joinCode} 
                      onChange={e => setJoinCode(e.target.value)} 
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-100 focus:ring-4 focus:ring-[#0D98BA]/20 outline-none transition-all bg-gray-50 font-mono text-center tracking-widest" 
                    />
                    <button onClick={handleJoinPrivateGroup} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:opacity-90 transition active:scale-95 text-white ${djStyleBg}`}>Rejoindre</button>
                  </div>
                </div>

                {visibleGroups.map((g, i) => (
                  <div key={g.id || `private-${i}`} onClick={() => setActiveGroup(g.id)} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group relative">
                    {state.newMessages?.includes(g.id) && (
                      <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse z-10" />
                    )}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#007FFF] to-[#32CD32] flex items-center justify-center text-white font-bold text-xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                      <span>{(g.name || '?')[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 truncate pr-2">{g.name}</h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1]?.time : ''}</span>
                      </div>
                      <p className={`text-sm truncate ${state.newMessages?.includes(g.id) ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                        {g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1]?.text : 'Aucun message'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {visibleGroups.length === 0 && activeTab !== 'recent' && activeTab !== 'sms' && (
              <div className="bg-white/50 border-2 border-dashed border-gray-200 p-12 rounded-[2.5rem] text-center">
                <p className="text-gray-400 font-bold italic">Aucun groupe trouvé dans cette catégorie.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          {renderWizard()}
        </div>
      )}
      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">{toast}</div>}
      
      {showRestrictedPopup && (
        <RestrictedActionPopup 
          onClose={() => setShowRestrictedPopup(false)} 
          onSignUp={handleSignUpRedirect}
        />
      )}

      {deletePrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Compte supprimé</h3>
            <p className="text-gray-600 mb-6">Voulez-vous supprimer tous les messages de ce compte supprimé, ou seulement ce message ?</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDeleteAll} className="w-full py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition">
                Supprimer TOUS ses messages
              </button>
              <button onClick={confirmDeleteOne} className="w-full py-3 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition">
                Supprimer uniquement ce message
              </button>
              <button onClick={() => setDeletePrompt(null)} className="w-full py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition mt-2">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
