import React, { useState, useRef, useEffect } from 'react';
import { db, collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, query, orderBy, getDoc, setDoc, arrayUnion, arrayRemove, storage, ref, uploadBytesResumable, getDownloadURL } from '../lib/firebase';
import { djStyleBg, djStyleText } from '../lib/utils';
import { Send, Trash2, Shield, UserX, Plus, Hash, Lock, MessageSquare, UserPlus, VolumeX, Ban, Pin, Info, ChevronRight, Globe, CheckCircle2, AlertCircle, MoreVertical, Image as ImageIcon, Paperclip, Smile, Play, X, BarChart2, Download, Menu, ChevronLeft, Settings as SettingsIcon, Users, Bot, Search, FileText, FileAudio, File as FileIcon, Globe as GlobeIcon } from 'lucide-react';
import { DJ_FRAME_STYLE, STAFF_BADGE, ADMIN_BADGE, SUPER_ADMIN_BADGE } from './Views';
import { RestrictedActionPopup } from './RestrictedActionPopup';
import { AppState, Group } from '../types';

export function Discussions({ state, updateState }: { state: AppState, updateState: any }) {
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'sms' | 'recent'>(state.discussionTab || 'public');
  const activeGroup = state.activeGroup;
  const setActiveGroup = (id: string | null) => updateState({ activeGroup: id });
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);
  const [sessionLastRead, setSessionLastRead] = useState<Record<string, string>>({});
  const [sessionEnterTime, setSessionEnterTime] = useState<Record<string, string>>({});

  const isTest = state.currentUser === 'test';
  const currentUser = (isTest || !state.currentUser) ? null : (state.currentUserData || state.users[state.currentUser as string]);

  const allRecentMessages = [
    ...Object.values(state.groups || {})
      .filter(g => {
        // Other groups can be seen by members or admins
        return (g.type === 'public' || (g.members && g.members.includes(state.currentUser as string)) || currentUser?.isAdmin || currentUser?.isGrandAdmin || currentUser?.isSuperAdmin) && !g.id.startsWith('sms-dj-help-') && (!g.id.startsWith('sms_dj_bot_') || !isTest);
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
        const isDeletedForMe = chat?.deletedForUsers?.includes(state.currentUser as string);
        return chat && chat.members && chat.members.includes(state.currentUser as string) && otherMember && !isDeletedForMe;
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
  const [deleteOptionsPrompt, setDeleteOptionsPrompt] = useState<{msgIds: string[], isMine: boolean, isCreator: boolean, isSubAdmin: boolean, isDeletedForEveryone?: boolean} | null>(null);
  const [revealedMessages, setRevealedMessages] = useState<Record<string, number>>({});
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
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
  const [staffDeletePrompt, setStaffDeletePrompt] = useState<string | null>(null);
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

  // Capture session read times when entering a group
  useEffect(() => {
    if (activeGroup && state.currentUser && !isTest) {
      const nowISO = new Date().toISOString();
      setSessionLastRead(prev => ({ ...prev, [activeGroup]: state.currentUserData?.lastReadTimestamps?.[activeGroup] || '0' }));
      setSessionEnterTime(prev => ({ ...prev, [activeGroup]: nowISO }));
    }
  }, [activeGroup]); // Only run when activeGroup changes

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Clear notification for active group and update last read timestamp
    if (activeGroup && state.currentUser && !isTest) {
      setTimeout(() => {
        const nowISO = new Date().toISOString();
        const groupMessages = state.groups?.[activeGroup]?.messages || state.privateMessages?.[activeGroup]?.messages || [];
        const lastMsgTimestamp = groupMessages.length > 0 ? groupMessages[groupMessages.length - 1].timestamp : '0';
        const readTimestamp = nowISO > lastMsgTimestamp ? nowISO : lastMsgTimestamp;
        
        // Update Firestore
        const userRef = doc(db, 'users', state.currentUser as string);
        updateDoc(userRef, {
          [`lastReadTimestamps.${activeGroup}`]: readTimestamp
        }).catch(e => console.error("Error updating last read:", e));

        updateState((prev: AppState) => {
          const newUsers = { ...prev.users };
          let newCurrentUserData = prev.currentUserData;
          if (prev.currentUser && newUsers[prev.currentUser]) {
            const user = { ...newUsers[prev.currentUser] };
            user.lastReadTimestamps = {
              ...(user.lastReadTimestamps || {}),
              [activeGroup]: readTimestamp
            };
            newUsers[prev.currentUser] = user;
            if (newCurrentUserData) {
              newCurrentUserData = { ...newCurrentUserData, lastReadTimestamps: user.lastReadTimestamps };
            }
          }
          return { users: newUsers, currentUserData: newCurrentUserData };
        });
      }, 0);
    }
  }, [state.groups?.[activeGroup || '']?.messages?.length, state.privateMessages?.[activeGroup || '']?.messages?.length, activeGroup]);

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

    // Admin/Staff Ghost Access Check: Cannot speak if not a member
    const isStaff = currentUser?.isAdmin || currentUser?.isGrandAdmin || currentUser?.isSuperAdmin;
    const isMember = group?.members?.includes(state.currentUser as string);
    if (!isSMS && isStaff && !isMember && group?.type === 'private') {
      return showToast("Mode Secret : Vous pouvez lire mais pas parler.");
    }
    
    const msgText = messageInput.trim();
    setMessageInput('');

    // Optimistic UI update
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      text: msgText,
      user: state.currentUser,
      senderId: state.currentUser,
      senderName: currentUser?.name || state.currentUser || 'Utilisateur',
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: false,
      isOptimistic: true
    };

    if (isSMS) {
      updateState((prev: AppState) => {
        const newPMs = { ...prev.privateMessages };
        if (newPMs[activeGroup]) {
          newPMs[activeGroup] = {
            ...newPMs[activeGroup],
            messages: [...(newPMs[activeGroup].messages || []), optimisticMsg]
          };
        }
        return { privateMessages: newPMs };
      });
    } else {
      updateState((prev: AppState) => {
        const newGroups = { ...prev.groups };
        if (newGroups[activeGroup]) {
          newGroups[activeGroup] = {
            ...newGroups[activeGroup],
            messages: [...(newGroups[activeGroup].messages || []), optimisticMsg]
          };
        }
        return { groups: newGroups };
      });
    }

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
        const chatRef = doc(db, 'private_messages', activeGroup);
        const snap = await getDoc(chatRef);
        if (!snap.exists()) {
          const parts = activeGroup.replace('sms_', '').split('_');
          await setDoc(chatRef, {
            id: activeGroup,
            type: 'sms',
            members: parts,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
          });
        } else {
          await setDoc(chatRef, {
            lastActivity: new Date().toISOString()
          }, { merge: true });
        }
        const msgRef = collection(db, 'private_messages', activeGroup, 'messages');
        await addDoc(msgRef, msgData);
      } else {
        // Check permissions
        if (group?.banned?.includes(state.currentUser as string)) return showToast("Tu es banni de ce groupe.");
        if (group?.muted?.includes(state.currentUser as string)) return showToast("Tu es muet dans ce groupe.");
        
        const isAdmin = group?.admins?.includes(state.currentUser as string) || currentUser?.isAdmin || currentUser?.isGrandAdmin || currentUser?.isSuperAdmin;
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
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0 || !activeGroup) return;

    const uploadedFiles: {url: string, type: string, name: string}[] = [];
    const cloudName = 'dfbhvgcbi';
    const uploadPreset = 'djmessenger_preset';
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Limit to 200MB
      if (file.size > 200 * 1024 * 1024) {
        showToast(`Le fichier ${file.name} est trop volumineux (max 200 Mo).`);
        continue;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isPdf = file.type === 'application/pdf';
      const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx') || file.name.endsWith('.doc');
      const isApp = file.name.endsWith('.apk') || file.name.endsWith('.exe') || file.name.endsWith('.ipa');
      const isZip = file.name.endsWith('.zip') || file.name.endsWith('.rar') || file.name.endsWith('.7z');
      const isCode = file.name.endsWith('.html') || file.name.endsWith('.css') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.json');

      let fileType = 'file';
      if (isImage) fileType = 'image';
      else if (isVideo) fileType = 'video';
      else if (isAudio) fileType = 'audio';
      else if (isPdf) fileType = 'pdf';
      else if (isDocx) fileType = 'docx';
      else if (isApp) fileType = 'app';
      else if (isZip) fileType = 'zip';
      else if (isCode) fileType = 'file'; // Treat code as file for now

      // Fallback pour les petits fichiers (Base64 dans Firestore) pour Firebase (Rapidité)
      if (file.size < 800 * 1024 && (isImage || isVideo || isAudio)) {
        const base64data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        uploadedFiles.push({ url: base64data, type: fileType, name: file.name });
        continue;
      }

      // Cloudinary pour les fichiers lourds (> 800KB) ou documents
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const response = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url, true);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100;
              // Show overall progress roughly
              setUploadProgress(Math.round(((i * 100) + progress) / files.length));
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(xhr.responseText);
            }
          };
          xhr.onerror = () => reject("Network error");
          xhr.send(formData);
        });

        uploadedFiles.push({ url: response.secure_url, type: fileType, name: file.name });
      } catch (error) {
        console.error(`File upload error for ${file.name}:`, error);
        showToast(`Erreur lors de l'envoi de ${file.name}.`);
      }
    }

    if (uploadedFiles.length > 0) {
      await sendMultimediaMessage(uploadedFiles);
    }
    
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMultimediaMessage = async (files: {url: string, type: string, name: string}[]) => {
    if (!activeGroup || !state.currentUser || files.length === 0) return;
    const isSMS = activeGroup.startsWith('sms_');
    
    let otherUser = '';
    if (isSMS) {
      const parts = activeGroup.replace('sms_', '').split('_');
      const otherUid = parts.find(p => p !== state.currentUser);
      otherUser = state.users[otherUid!]?.name || otherUid || 'Inconnu';
    }

    const typeIcons: Record<string, string> = {
      image: "📷 Image",
      video: "🎥 Vidéo",
      sticker: "✨ Sticker",
      audio: "🎵 Audio",
      pdf: "📄 PDF",
      docx: "📝 Document",
      app: "📱 Application",
      zip: "🗜️ Archive",
      folder: "📁 Dossier",
      file: "📁 Fichier"
    };

    try {
      const firstFileType = files[0].type;
      const text = files.length > 1 ? `📁 ${files.length} Fichiers` : (typeIcons[firstFileType] || "📁 Fichier");
      
      const msgData = {
        text: text,
        user: state.currentUser,
        files: files,
        fileUrl: files[0].url, // For backward compatibility
        fileType: firstFileType, // For backward compatibility
        fileName: files[0].name, // For backward compatibility
        senderId: state.currentUser,
        senderName: currentUser?.name || state.currentUser || 'Utilisateur',
        timestamp: new Date().toISOString(),
        isSystem: false,
        groupName: isSMS ? otherUser : (state.groups?.[activeGroup]?.name || 'Groupe'),
        groupType: isSMS ? 'SMS' : (state.groups?.[activeGroup]?.type === 'public' ? 'PUBLIC' : 'PRIVÉ')
      };

      const path = isSMS ? 'private_messages' : 'groups';

      
      if (isSMS) {
        const chatRef = doc(db, 'private_messages', activeGroup);
        const snap = await getDoc(chatRef);
        if (!snap.exists()) {
          const parts = activeGroup.replace('sms_', '').split('_');
          await setDoc(chatRef, {
            id: activeGroup,
            type: 'sms',
            members: parts,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
          });
        } else {
          await setDoc(chatRef, {
            lastActivity: new Date().toISOString()
          }, { merge: true });
        }
      }

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
    sendMultimediaMessage([{ url, type: 'sticker', name: 'Sticker' }]);
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
      
      if (isSMS) {
        const chatRef = doc(db, 'private_messages', activeGroup);
        const snap = await getDoc(chatRef);
        if (!snap.exists()) {
          const parts = activeGroup.replace('sms_', '').split('_');
          await setDoc(chatRef, {
            id: activeGroup,
            type: 'sms',
            members: parts,
            createdAt: new Date().toISOString()
          });
        }
      }

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

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRevealedMessages(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(id => {
          if (next[id] < now) {
            delete next[id];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinPrivateGroup = async () => {
    if (isTest) {
      setShowRestrictedPopup(true);
      return;
    }
    const group = Object.values(state.groups).find(g => g.type === 'private' && g.code === joinCode);
    if (!group) return showToast("Code invalide.");
    if ((group.members || []).includes(state.currentUser as string)) return showToast("Déjà membre.");
    
    // Check ban
    const banInfo = group.banHistory?.[state.currentUser as string];
    if (banInfo) {
      if (banInfo.count >= 5) return showToast("Tu es banni définitivement de ce groupe.");
      if (banInfo.until && new Date(banInfo.until) > new Date()) {
        const remaining = Math.ceil((new Date(banInfo.until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return showToast(`Tu es banni pour encore ${remaining} jours.`);
      }
    }

    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        members: arrayUnion(state.currentUser),
        banned: arrayRemove(state.currentUser) // Remove from banned list if joining (though usually they can't join if banned, but if ban expired)
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
    if (isTest) return setShowRestrictedPopup(true);
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
    if (isTest) return setShowRestrictedPopup(true);
    try {
      const isSMS = groupId.startsWith('sms_');
      await deleteDoc(doc(db, isSMS ? 'private_messages' : 'groups', groupId));
      setActiveGroup(null);
      showToast(isSMS ? "Discussion supprimée." : "Groupe supprimé.");
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

  const handleDeleteMessage = async (msgIds: string[], option: 'me' | 'everyone' | 'bubble' = 'me') => {
    if (!activeGroup) return;
    const isSMS = activeGroup.startsWith('sms_');
    const path = isSMS ? 'private_messages' : 'groups';
    const group = state.groups[activeGroup] || state.privateMessages[activeGroup];
    if (!group) return;

    try {
      for (const msgId of msgIds) {
        const msg = group.messages?.find(m => m.id === msgId);
        if (!msg) continue;

        const msgRef = doc(db, path, activeGroup, 'messages', msgId);
        
        if (option === 'me') {
          await updateDoc(msgRef, {
            deletedForUsers: arrayUnion(state.currentUser)
          });
        } else if (option === 'everyone') {
          await updateDoc(msgRef, {
            deletedForEveryone: true,
            originalText: msg.text,
            text: 'Message supprimé',
            deletedAt: new Date().toISOString()
          });
        } else if (option === 'bubble') {
          await deleteDoc(msgRef);
        }
      }
      
      const count = msgIds.length;
      if (option === 'me') {
        showToast(count > 1 ? `${count} messages supprimés pour vous.` : "Message supprimé pour vous.");
      } else if (option === 'everyone') {
        showToast(count > 1 ? `${count} messages supprimés pour tous.` : "Message supprimé pour tous.");
      } else if (option === 'bubble') {
        showToast(count > 1 ? `${count} bulles supprimées.` : "Bulle supprimée.");
      }
      
      setDeleteOptionsPrompt(null);
      setSelectionMode(false);
      setSelectedMessages(new Set());
    } catch (error) {
      console.error("Error deleting message:", error);
      showToast("Erreur lors de la suppression.");
    }
  };

  const handleRevealMessage = (msgId: string) => {
    if (!currentUser?.isSuperAdmin) return;
    const threeMinutesLater = Date.now() + 3 * 60 * 1000;
    setRevealedMessages(prev => ({ ...prev, [msgId]: threeMinutesLater }));
    showToast("Message révélé pour 3 minutes.");
  };

  const handleToggleSubAdmin = async (userId: string) => {
    if (isTest) return setShowRestrictedPopup(true);
    if (!activeGroup || !state.groups || !state.groups[activeGroup]) return;
    const group = state.groups[activeGroup];
    const isCreator = group.creator === state.currentUser;
    if (!isCreator && !currentUser?.isAdmin && !currentUser?.isGrandAdmin && !currentUser?.isSuperAdmin) return showToast("Seul l'admin du groupe ou le Staff peut nommer des sous-admins.");
    
    const isSubAdmin = (group.subAdmins || []).includes(userId);
    try {
      const groupRef = doc(db, 'groups', activeGroup);
      await updateDoc(groupRef, {
        subAdmins: isSubAdmin ? arrayRemove(userId) : arrayUnion(userId)
      });
      showToast(isSubAdmin ? "Sous-admin retiré." : "Sous-admin nommé.");
    } catch (error) {
      showToast("Erreur lors de la modification.");
    }
  };

  const confirmStaffDelete = async () => {
    if (!staffDeletePrompt || !activeGroup) return;
    const isSMS = activeGroup.startsWith('sms_');
    try {
      const msgRef = doc(db, isSMS ? 'private_messages' : 'groups', activeGroup, 'messages', staffDeletePrompt);
      await deleteDoc(msgRef);
      showToast("Message supprimé par le staff.");
    } catch (error) {
      console.error("Error staff deleting message:", error);
      showToast("Erreur lors de la suppression.");
    }
    setStaffDeletePrompt(null);
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
    if (isTest) return setShowRestrictedPopup(true);
    if (!activeGroup || !state.groups || !state.groups[activeGroup]) return;
    const group = state.groups[activeGroup];
    const isCreator = group.creator === state.currentUser;
    const isSubAdmin = (group.subAdmins || []).includes(state.currentUser as string);
    if (!isCreator && !isSubAdmin && !currentUser?.isAdmin && !currentUser?.isGrandAdmin && !currentUser?.isSuperAdmin) return showToast("Seul l'admin du groupe ou le Staff peut bannir.");
    if (userToBan === group.creator) return showToast("Impossible de bannir le créateur.");
    if ((group.subAdmins || []).includes(userToBan) && !isCreator) return showToast("Un sous-admin ne peut pas bannir un autre sous-admin.");

    try {
      const banHistory = group.banHistory || {};
      const userBanInfo = banHistory[userToBan] || { count: 0, until: '' };
      
      if (userBanInfo.count >= 5) {
        return showToast("Cet utilisateur est banni définitivement (5 renvois).");
      }

      const threeWeeksLater = new Date();
      threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);
      
      const newBanInfo = {
        count: userBanInfo.count + 1,
        until: threeWeeksLater.toISOString()
      };

      const groupRef = doc(db, 'groups', activeGroup);
      await updateDoc(groupRef, {
        banned: arrayUnion(userToBan),
        members: arrayRemove(userToBan),
        [`banHistory.${userToBan}`]: newBanInfo
      });
      showToast(`${userToBan} banni pour 3 semaines.`);
    } catch (error) {
      console.error("Error banning user:", error);
      showToast("Erreur lors du bannissement.");
    }
  };

  const handleDeleteDiscussion = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTest) return setShowRestrictedPopup(true);
    if (!window.confirm("Voulez-vous vraiment supprimer cette discussion vide ?")) return;
    try {
      await deleteDoc(doc(db, 'groups', groupId));
      showToast("Discussion supprimée.");
    } catch (err) {
      showToast("Erreur lors de la suppression.");
    }
  };

  const handleToggleMute = async (userToMute: string) => {
    if (!activeGroup || !state.groups || !state.groups[activeGroup]) return;
    const group = state.groups[activeGroup];
    if (!(group.admins || []).includes(state.currentUser as string) && !currentUser?.isAdmin && !currentUser?.isGrandAdmin && !currentUser?.isSuperAdmin) return showToast("Non autorisé.");
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
      // OR if user is Admin/Staff/SuperAdmin (Ghost access)
      const isStaff = currentUser?.isAdmin || currentUser?.isGrandAdmin || currentUser?.isSuperAdmin;
      return g.type === 'private' && 
             ((g.members || []).includes(state.currentUser as string) || g.creator === state.currentUser || isStaff) &&
             ((g.members || []).length > 2 || g.code);
    }
    return false; // Recent and SMS handled separately
  }).sort((a, b) => {
    const aPinned = currentUser?.pinnedGroups?.includes(a.id) ? 1 : 0;
    const bPinned = currentUser?.pinnedGroups?.includes(b.id) ? 1 : 0;
    return bPinned - aPinned;
  });

  const helpGroupId = `sms_${[state.currentUser, 'dj-bot'].sort().join('_')}`;
  const botGroup = state.privateMessages[helpGroupId];

  const visibleSMS = [
    ...Object.values(state.privateMessages || {}).filter(chat => {
      const isSuperAdmin = state.currentUserData?.isSuperAdmin;
      const otherMember = chat?.members?.find(m => m !== state.currentUser);
      const isDeletedForMe = chat?.deletedForUsers?.includes(state.currentUser as string);
      return chat && !isDeletedForMe && (chat.members?.includes(state.currentUser as string) || isSuperAdmin) && otherMember;
    }),
    ...(botGroup ? [botGroup] : [])
  ].sort((a, b) => {
    const timeA = new Date(a.lastActivity || a.createdAt || 0).getTime();
    const timeB = new Date(b.lastActivity || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const handleMarkAllAsRead = async () => {
    if (!state.currentUser || isTest) return;
    
    const nowISO = new Date().toISOString();
    const newTimestamps = { ...(state.currentUserData?.lastReadTimestamps || {}) };
    
    // Update for all groups and private messages
    Object.keys(state.groups || {}).forEach(id => {
      const groupMessages = state.groups?.[id]?.messages || [];
      const lastMsgTimestamp = groupMessages.length > 0 ? groupMessages[groupMessages.length - 1].timestamp : '0';
      newTimestamps[id] = nowISO > lastMsgTimestamp ? nowISO : lastMsgTimestamp;
    });
    Object.keys(state.privateMessages || {}).forEach(id => {
      const groupMessages = state.privateMessages?.[id]?.messages || [];
      const lastMsgTimestamp = groupMessages.length > 0 ? groupMessages[groupMessages.length - 1].timestamp : '0';
      newTimestamps[id] = nowISO > lastMsgTimestamp ? nowISO : lastMsgTimestamp;
    });

    try {
      const userRef = doc(db, 'users', state.currentUser as string);
      await updateDoc(userRef, { lastReadTimestamps: newTimestamps });
      
      updateState((prev: AppState) => {
        const newUsers = { ...prev.users };
        let newCurrentUserData = prev.currentUserData;
        if (prev.currentUser && newUsers[prev.currentUser]) {
          const user = { ...newUsers[prev.currentUser] };
          user.lastReadTimestamps = newTimestamps;
          newUsers[prev.currentUser] = user;
          if (newCurrentUserData) {
            newCurrentUserData = { ...newCurrentUserData, lastReadTimestamps: newTimestamps };
          }
        }
        return { users: newUsers, currentUserData: newCurrentUserData };
      });
      showToast("Tous les messages marqués comme lus");
    } catch (e) {
      console.error("Error marking all as read:", e);
    }
  };

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

    const isAdmin = !isSMS && ((group as Group).admins?.includes(state.currentUser as string) || currentUser?.isAdmin || currentUser?.isGrandAdmin || currentUser?.isSuperAdmin);
    const isSubAdmin = !isSMS && (group as Group).subAdmins?.includes(state.currentUser as string);
    const isCreator = !isSMS && (group as Group).creator === state.currentUser;
    const isMember = (group.members || []).includes(state.currentUser as string);
    const isPinned = currentUser?.pinnedGroups?.includes(activeGroup);
    const lastRead = currentUser?.lastReadTimestamps?.[activeGroup] || '0';

    const handleDeleteSMS = async (smsId: string) => {
      try {
        if (smsId.includes('dj-bot')) {
          await deleteDoc(doc(db, 'private_messages', smsId));
        } else {
          await updateDoc(doc(db, 'private_messages', smsId), {
            deletedForUsers: arrayUnion(state.currentUser)
          });
        }
        setActiveGroup(null);
        setShowDeleteSmsPrompt(null);
        showToast("Discussion supprimée.");
      } catch (error) {
        console.error("Error deleting SMS:", error);
        showToast("Erreur lors de la suppression.");
      }
    };

    return (
      <div className="fixed inset-y-0 right-0 left-0 lg:left-72 z-[2000] flex flex-col bg-[#f9fafb] animate-in slide-in-from-right-8 duration-300">
        {selectionMode ? (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between shadow-sm z-[2001] sticky top-0">
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelectionMode(false); setSelectedMessages(new Set()); }} className="p-2 hover:bg-blue-100 rounded-full transition-colors text-blue-500">
                <X size={20} />
              </button>
              <h3 className="font-bold text-blue-900">{selectedMessages.size} sélectionné(s)</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDeleteOptionsPrompt({ msgIds: Array.from(selectedMessages), isMine: true, isCreator, isSubAdmin: (group as Group).subAdmins?.includes(state.currentUser as string) || false, isDeletedForEveryone: false })}
                className="p-2 rounded-xl bg-white shadow-sm border border-blue-200 text-red-500 hover:bg-red-50 transition"
                title="Supprimer la sélection"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm z-[2001] sticky top-0">
            <div className="flex items-center gap-3">
            <button onClick={() => { setActiveGroup(null); setShowGroupSettings(false); }} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all text-gray-700 shadow-sm border border-gray-200 group">
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Retour</span>
            </button>
            <div className={`w-10 h-10 rounded-2xl ${isSMS ? 'bg-gray-100' : 'bg-gradient-to-br from-[#007FFF] to-[#32CD32]'} flex items-center justify-center text-white font-bold shadow-md overflow-hidden`}>
              {isSMS && otherUserData?.avatar ? (
                <img src={otherUserData.avatar} className="w-full h-full object-cover" />
              ) : !isSMS && group.avatar ? (
                <img src={group.avatar} className="w-full h-full object-cover" />
              ) : (
                <span>{(otherUser || group.name || '?')[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 leading-tight">{isSMS ? otherUser : group.name}</h3>
              {!isSMS && group.type === 'public' ? (
                <p className="text-xs text-gray-500 font-medium italic">Groupe Ouvert</p>
              ) : (
                <p className="text-xs text-gray-500 font-medium">{isSMS ? (otherUserData?.lastSeen ? `Vu ${otherUserData.lastSeen}` : 'En ligne') : `${(group.members || []).length} membres`}</p>
              )}
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
            {(isMember || isSMS) && (
              <button onClick={() => setShowGroupSettings(!showGroupSettings)} className={`p-2.5 rounded-2xl transition-all ${showGroupSettings ? djStyleBg + ' text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`} title={isSMS ? "Paramètres de la discussion" : "Paramètres du groupe"}>
                <SettingsIcon size={20} />
              </button>
            )}
          </div>
        </div>
        )}

        {showGroupSettings && (
          <div className="bg-white border-b p-6 space-y-6 animate-in slide-in-from-top-4 max-h-[50vh] overflow-y-auto custom-scrollbar shrink-0">
            <div className="flex justify-between items-center">
              <h4 className="font-black uppercase tracking-widest text-xs text-gray-400">Paramètres de {isSMS ? 'la discussion' : group.name}</h4>
              <div className="flex gap-2">
                {!isSMS && (isCreator || isSubAdmin) && (
                  <>
                    <button 
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e: any) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) return showToast("Image trop grande (max 5Mo)");
                          
                          showToast("Téléchargement de l'icône...");
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('upload_preset', 'djmessenger_preset');

                            const response = await fetch('https://api.cloudinary.com/v1_1/dfbhvgcbi/upload', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (!response.ok) throw new Error("Upload failed");
                            const data = await response.json();
                            
                            await setDoc(doc(db, 'groups', activeGroup), { avatar: data.secure_url }, { merge: true });
                            showToast("Icône modifiée !");
                          } catch (err) {
                            console.error(err);
                            showToast("Erreur lors de la modification.");
                          }
                        };
                        input.click();
                      }}
                      className="text-[10px] font-black uppercase text-[#0D98BA] hover:underline"
                    >
                      Icône
                    </button>
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
                  </>
                )}
                {(!isCreator && !isSubAdmin) && <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-1 rounded-full">Lecture seule</span>}
              </div>
            </div>
            
            {group.type === 'private' && (
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 block">Code du groupe</span>
                  {(isCreator || isSubAdmin) && (
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

            {!isSMS && group.type === 'private' && (isCreator || isSubAdmin) && (
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ajouter un membre</h5>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Rechercher un utilisateur..." 
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#0D98BA]"
                    onChange={(e) => setSmsSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                  {Object.values(state.users)
                    .filter(u => u.uid !== state.currentUser && u.uid !== 'dj-bot' && !group.members.includes(u.uid) && (u.name.toLowerCase().includes(smsSearch.toLowerCase()) || smsSearch === ''))
                    .map(u => (
                      <div key={u.uid} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateState({ selectedUserModal: u.uid })}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-[#0D98BA] transition-all cursor-pointer"
                          >
                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <span>{u.name[0]}</span>}
                          </button>
                          <button 
                            onClick={() => updateState({ selectedUserModal: u.uid })}
                            className="text-sm font-bold text-gray-700 hover:text-[#0D98BA] transition-colors"
                          >
                            {u.name}
                          </button>
                        </div>
                        <button 
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, 'groups', activeGroup), {
                                members: arrayUnion(u.uid),
                                banned: arrayRemove(u.uid) // Admin can re-invite even if banned
                              });
                              showToast(`${u.name} ajouté !`);
                            } catch (e) {
                              showToast("Erreur lors de l'ajout.");
                            }
                          }}
                          className="px-3 py-1 bg-[#0D98BA] text-white text-[10px] font-black uppercase rounded-lg shadow-sm"
                        >
                          Ajouter
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {!isSMS && isCreator && (
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nommer un sous-admin</h5>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Rechercher un utilisateur..." 
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#0D98BA]"
                    onChange={(e) => setSmsSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                  {Object.values(state.users)
                    .filter(u => u.uid !== state.currentUser && u.uid !== 'dj-bot' && !(group.subAdmins || []).includes(u.uid) && (u.name.toLowerCase().includes(smsSearch.toLowerCase()) || smsSearch === ''))
                    .map(u => (
                      <div key={u.uid} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateState({ selectedUserModal: u.uid })}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-[#0D98BA] transition-all cursor-pointer"
                          >
                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <span>{u.name[0]}</span>}
                          </button>
                          <button 
                            onClick={() => updateState({ selectedUserModal: u.uid })}
                            className="text-sm font-bold text-gray-700 hover:text-[#0D98BA] transition-colors"
                          >
                            {u.name}
                          </button>
                        </div>
                        <button 
                          onClick={() => handleToggleSubAdmin(u.uid)}
                          className="px-3 py-1 bg-blue-50 text-blue-500 hover:bg-blue-100 text-[10px] font-black uppercase rounded-lg shadow-sm transition-colors"
                        >
                          Nommer
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {!isSMS && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    {group.type === 'private' ? `Membres (${group.members.length})` : "Équipe d'administration"}
                  </h5>
                  {group.type === 'public' && isCreator && (
                    <button 
                      onClick={() => setShowGroupSettings(true)} // Re-trigger search view if needed
                      className="text-[10px] font-black uppercase text-[#0D98BA] hover:underline"
                    >
                      Gérer les sous-admins
                    </button>
                  )}
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                  {group.members
                    .filter(m => {
                      if (group.type === 'public') {
                        return m === group.creator || (group.subAdmins || []).includes(m);
                      }
                      return true;
                    })
                    .map((m: string) => {
                      const u = state.users[m];
                      const isMemberCreator = m === group.creator;
                      const isMemberSubAdmin = (group.subAdmins || []).includes(m);
                      
                      return (
                        <div key={m} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl group/member">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateState({ selectedUserModal: m })}
                              className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center overflow-hidden shadow-inner hover:ring-2 hover:ring-[#0D98BA] transition-all"
                            >
                              {u?.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <span className="font-bold text-gray-400">{u?.name?.[0] || '?'}</span>}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => updateState({ selectedUserModal: m })}
                                  className="text-sm font-bold text-gray-800 hover:text-[#0D98BA] transition-colors"
                                >
                                  {u?.name || 'Inconnu'}
                                </button>
                                {isMemberCreator && (
                                  <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-red-100 text-red-600 rounded-full">Admin du groupe</span>
                                )}
                                {isMemberSubAdmin && (
                                  <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">Sous-Admin</span>
                                )}
                              </div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                {isMemberCreator ? 'Fondateur' : (isMemberSubAdmin ? 'Modérateur' : 'Membre')}
                              </p>
                            </div>
                          </div>
                          
                          {(isCreator || isSubAdmin) && m !== state.currentUser && m !== group.creator && (
                            <div className="flex items-center gap-1">
                              {isCreator && (
                                <button 
                                  onClick={() => handleToggleSubAdmin(m)}
                                  className={`p-2 rounded-xl transition-colors ${isMemberSubAdmin ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500'}`}
                                  title={isMemberSubAdmin ? "Retirer sous-admin" : "Nommer sous-admin"}
                                >
                                  <Shield size={14} />
                                </button>
                              )}
                              {group.type === 'private' && (isCreator || !isMemberSubAdmin) && (
                                <button 
                                  onClick={() => handleBanUser(m)} 
                                  className="p-2 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 rounded-xl transition-colors"
                                  title="Bannir (3 semaines)"
                                >
                                  <UserX size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-bold text-gray-700">Autoriser les autres à parler</span>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      disabled={!isCreator && !isSubAdmin}
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
                    <div className={`block w-12 h-7 rounded-full transition-colors ${group.allowOthersToSpeak ?? true ? 'bg-[#32CD32]' : 'bg-gray-300'} ${(!isCreator && !isSubAdmin) ? 'opacity-50' : ''}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${group.allowOthersToSpeak ?? true ? 'transform translate-x-5' : ''}`}></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-bold text-gray-700">Autoriser les autres à ajouter des membres</span>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      disabled={!isCreator && !isSubAdmin}
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
                    <div className={`block w-12 h-7 rounded-full transition-colors ${group.allowOthersToInvite ?? true ? 'bg-[#32CD32]' : 'bg-gray-300'} ${(!isCreator && !isSubAdmin) ? 'opacity-50' : ''}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${group.allowOthersToInvite ?? true ? 'transform translate-x-5' : ''}`}></div>
                  </div>
                </label>
              </div>
            )}

            <div className="pt-4 border-t space-y-3">
              {!isSMS && isCreator && (
                <button 
                  onClick={() => handleDeleteGroup(activeGroup)}
                  className="w-full py-3 rounded-xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition"
                >
                  Supprimer le groupe
                </button>
              )}
              {isSMS && (
                <button 
                  onClick={() => setShowDeleteSmsPrompt(activeGroup)}
                  className="w-full py-3 rounded-xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition"
                >
                  Supprimer la discussion
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
        {(group.messages || []).filter(msg => msg.isSystem || msg.user === state.currentUser || (state.users && state.users[msg.user])).map((msg, idx, arr) => {
          const prevMsg = idx > 0 ? arr[idx - 1] : null;
          const isSameSender = prevMsg && prevMsg.user === msg.user && !msg.isSystem && !prevMsg.isSystem;
          const isMine = msg.user === state.currentUser;
          const sender = state.users[msg.user];
          const msgSessionLastRead = sessionLastRead[activeGroup] || '0';
          const msgSessionEnterTime = sessionEnterTime[activeGroup] || new Date().toISOString();
          const isUnread = !isMine && !msg.isSystem && msg.timestamp > msgSessionLastRead && msg.timestamp <= msgSessionEnterTime;
          const isDeletedAccount = !msg.isSystem && (!state.users || !state.users[msg.user]);
          const isStaff = sender?.isAdmin || sender?.isGrandAdmin || sender?.isSuperAdmin;
          
          const isDeletedForMe = msg.deletedForUsers?.includes(state.currentUser as string);
          const isDeletedForEveryone = msg.deletedForEveryone;
          const isRevealed = revealedMessages[msg.id] > Date.now();

          if (isDeletedForMe) return null;

          let senderName = 'Inconnu';
          if (msg.user === 'test') {
            senderName = 'Anonyme';
          } else if (msg.user === 'dj-bot' || msg.user === 'DJ Bot' || msg.user === 'system') {
            senderName = 'DJ Bot';
          } else if (sender?.name) {
            senderName = sender.name;
          }
          const senderAvatar = sender?.avatar;

          if (msg.isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="bg-gray-200/80 text-gray-600 text-[10px] px-4 py-1 rounded-full uppercase font-bold shadow-sm">{msg.text}</span>
              </div>
            );
          }
          const isSelected = selectedMessages.has(msg.id);
          
          const handleMsgClick = () => {
            if (selectionMode) {
              const newSel = new Set(selectedMessages);
              if (newSel.has(msg.id)) newSel.delete(msg.id);
              else newSel.add(msg.id);
              setSelectedMessages(newSel);
              if (newSel.size === 0) setSelectionMode(false);
            }
          };
          
          return (
            <div key={msg.id} onClick={handleMsgClick} className={`flex ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-1.5 group/msg ${isSameSender ? 'mt-0.5' : 'mt-2'} ${selectionMode ? 'cursor-pointer hover:bg-gray-100/50 p-1 rounded-xl transition-colors' : ''} ${isSelected ? 'bg-blue-50/50 outline outline-2 outline-blue-200' : ''}`}>
              {selectionMode && (
                <div className="shrink-0 mr-1 self-center">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#0D98BA] border-[#0D98BA] text-white' : 'border-gray-300'}`}>
                    {isSelected && <CheckCircle2 size={12} />}
                  </div>
                </div>
              )}
              <button 
                onClick={() => { if(!isDeletedAccount && msg.user !== 'dj-bot' && state.users?.[msg.user]) updateState({ selectedUserModal: msg.user }) }}
                disabled={isDeletedAccount || msg.user === 'dj-bot' || !state.users?.[msg.user]}
                className={`w-6 h-6 rounded-xl bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400 shadow-inner shrink-0 overflow-hidden ${isSameSender ? 'opacity-0' : 'opacity-100 cursor-pointer hover:ring-2 hover:ring-[#0D98BA] transition-all'}`}
              >
                {isDeletedAccount ? '?' : (senderAvatar ? <img src={senderAvatar} className="w-full h-full object-cover" /> : senderName[0].toUpperCase())}
              </button>
              <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                {!isSameSender && (
                  <div className="flex items-center gap-1 px-1 mb-0.5">
                    <button 
                      onClick={() => { if(!isDeletedAccount && msg.user !== 'dj-bot' && state.users?.[msg.user]) updateState({ selectedUserModal: msg.user }) }}
                      disabled={isDeletedAccount || msg.user === 'dj-bot' || !state.users?.[msg.user]}
                      className="text-[9px] font-black uppercase tracking-tighter text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {senderName}
                    </button>
                    {sender?.isSuperAdmin && SUPER_ADMIN_BADGE}
                    {sender?.isGrandAdmin && !sender?.isSuperAdmin && ADMIN_BADGE}
                    {sender?.isAdmin && !sender?.isGrandAdmin && !sender?.isSuperAdmin && STAFF_BADGE}
                    {isDeletedAccount && <span className="text-[8px] font-black uppercase text-red-500">Compte supprimé</span>}
                  </div>
                )}
                <div className={`relative px-2.5 py-1 rounded-2xl shadow-sm ${isMine ? `rounded-tr-none text-white ${djStyleBg}` : 'rounded-tl-none bg-white border border-gray-100 text-gray-800'} ${isUnread ? 'ring-2 ring-[#0D98BA] shadow-[0_0_15px_rgba(13,152,186,0.1)]' : ''} ${isStaff && !isMine ? 'border-2 border-[#0D98BA] shadow-[0_0_10px_rgba(13,152,186,0.3)] bg-blue-50/50' : ''}`}>
                  {(msg.files && msg.files.length > 0) ? (
                    <div className="mb-2 space-y-2">
                      {msg.files.map((file, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden shadow-inner bg-gray-50 relative group/file">
                          {file.type === 'image' || file.type === 'sticker' ? (
                            <img 
                              src={file.url} 
                              alt={file.name || 'Image'} 
                              className={`max-w-full h-auto object-contain ${file.type === 'sticker' ? 'w-24 h-24' : 'max-h-60'}`}
                              referrerPolicy="no-referrer"
                            />
                          ) : file.type === 'video' ? (
                            <video 
                              src={file.url} 
                              controls 
                              className="max-w-full max-h-60 rounded-xl"
                            />
                          ) : file.type === 'audio' ? (
                            <div className="p-4 flex flex-col gap-2 bg-gray-100 rounded-xl">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#0D98BA] text-white rounded-lg shadow-md">
                                  <FileAudio size={20} />
                                </div>
                                <span className="text-xs font-bold truncate max-w-[150px]">{file.name || 'Audio'}</span>
                              </div>
                              <audio src={file.url} controls className="w-full h-8" />
                            </div>
                          ) : (
                            <div className="p-4 flex items-center gap-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer" onClick={() => handleDownload(file.url, file.name || 'file')}>
                              <div className={`p-3 rounded-2xl shadow-lg text-white ${
                                file.type === 'pdf' ? 'bg-red-500' : 
                                file.type === 'docx' ? 'bg-blue-600' : 
                                file.type === 'app' ? 'bg-green-600' : 
                                file.type === 'zip' ? 'bg-yellow-600' : 'bg-gray-600'
                              }`}>
                                {file.type === 'pdf' ? <FileText size={24} /> : 
                                 file.type === 'docx' ? <FileText size={24} /> : 
                                 file.type === 'app' ? <Plus size={24} /> : 
                                 file.type === 'zip' ? <FileIcon size={24} /> : <FileIcon size={24} />}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black uppercase tracking-tight truncate">{file.name || 'Fichier'}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{file.type?.toUpperCase() || 'FILE'}</span>
                              </div>
                            </div>
                          )}
                          <button 
                            onClick={() => handleDownload(file.url, file.name || 'file')}
                            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover/file:opacity-100 transition shadow-lg backdrop-blur-sm"
                            title="Télécharger"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : msg.fileUrl && (
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
                        ) : msg.fileType === 'audio' ? (
                          <div className="p-4 flex flex-col gap-2 bg-gray-100 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#0D98BA] text-white rounded-lg shadow-md">
                                <FileAudio size={20} />
                              </div>
                              <span className="text-xs font-bold truncate max-w-[150px]">{msg.fileName || 'Audio'}</span>
                            </div>
                            <audio src={msg.fileUrl} controls className="w-full h-8" />
                          </div>
                        ) : (
                          <div className="p-4 flex items-center gap-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer" onClick={() => handleDownload(msg.fileUrl!, msg.fileName || 'file')}>
                            <div className={`p-3 rounded-2xl shadow-lg text-white ${
                              msg.fileType === 'pdf' ? 'bg-red-500' : 
                              msg.fileType === 'docx' ? 'bg-blue-600' : 
                              msg.fileType === 'app' ? 'bg-green-600' : 
                              msg.fileType === 'zip' ? 'bg-yellow-600' : 'bg-gray-600'
                            }`}>
                              {msg.fileType === 'pdf' ? <FileText size={24} /> : 
                               msg.fileType === 'docx' ? <FileText size={24} /> : 
                               msg.fileType === 'app' ? <Plus size={24} /> : 
                               msg.fileType === 'zip' ? <FileIcon size={24} /> : <FileIcon size={24} />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-black uppercase tracking-tight truncate">{msg.fileName || 'Fichier'}</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.fileType?.toUpperCase() || 'FILE'}</span>
                            </div>
                          </div>
                        )}
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
                    <p className={`text-sm break-words leading-tight ${isDeletedForEveryone && !isRevealed ? 'italic text-gray-400' : ''}`}>
                      {isDeletedForEveryone && !isRevealed ? (
                        <span 
                          className={currentUser?.isSuperAdmin ? 'cursor-pointer hover:underline' : ''}
                          onClick={() => currentUser?.isSuperAdmin && handleRevealMessage(msg.id)}
                        >
                          Message supprimé
                        </span>
                      ) : (
                        renderMessageText(isRevealed ? msg.originalText || msg.text : msg.text)
                      )}
                    </p>
                    {(isMine || isAdmin || isCreator || isSubAdmin || isDeletedForEveryone) && !isDeletedAccount && !selectionMode && (
                      <div className={`absolute ${isMine ? '-left-11' : '-right-11'} top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10`}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteOptionsPrompt({ msgIds: [msg.id], isMine, isCreator, isSubAdmin, isDeletedForEveryone }); }} 
                          className="p-2 bg-white shadow-lg border border-gray-100 text-gray-600 hover:text-red-500 rounded-full transition-all active:scale-90 relative group/btn"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[8px] font-black uppercase rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Supprimer</div>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectionMode(true); setSelectedMessages(new Set([msg.id])); }}
                          className="p-2 bg-white shadow-lg border border-gray-100 text-gray-600 hover:text-[#0D98BA] rounded-full transition-all active:scale-90 relative group/btn"
                          title="Sélectionner"
                        >
                          <CheckCircle2 size={16} />
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[8px] font-black uppercase rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Sélectionner</div>
                        </button>
                        {isAdmin && !isMine && msg.user !== group.creator && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleMute(msg.user); }} 
                            className="p-2 bg-white shadow-lg border border-gray-100 text-orange-500 rounded-full transition-all active:scale-90 relative group/btn"
                            title="Muter"
                          >
                            <VolumeX size={14} />
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[8px] font-black uppercase rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Muter</div>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400 mx-1 font-medium">{msg.time}</span>
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
                <div className="bg-[#32CD32] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
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
          ) : (!isMember && group.type === 'private' && !isSMS) ? (
            <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Mode Secret</p>
              <p className="text-xs text-gray-400 italic">Vous êtes en lecture seule sur ce groupe privé.</p>
            </div>
          ) : (
            <form className="flex gap-2 items-center max-w-3xl mx-auto relative" onSubmit={handleSendMessage}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple
                accept="image/*,video/*,audio/*,.pdf,.docx,.doc,.apk,.exe,.ipa,.zip,.rar,.7z,.html,.css,.js,.ts,.json"
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
          {uploadProgress !== null && (
            <div className="px-6 pb-4">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full transition-all duration-300 bg-[#32CD32]" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[8px] font-black uppercase text-gray-400 mt-1 text-center tracking-widest">Transfert en cours : {Math.round(uploadProgress)}%</p>
            </div>
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
        {deleteOptionsPrompt && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl">
              <div className={`p-6 ${djStyleBg} text-white text-center`}>
                <Trash2 size={32} className="mx-auto mb-2" />
                <h3 className="text-lg font-black uppercase tracking-tighter">Supprimer le message</h3>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={() => handleDeleteMessage(deleteOptionsPrompt.msgIds, 'me')}
                  className="w-full py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                >
                  {deleteOptionsPrompt.isDeletedForEveryone ? "Supprimer la bulle pour moi" : "Supprimer pour moi uniquement"}
                </button>
                {!deleteOptionsPrompt.isDeletedForEveryone && (deleteOptionsPrompt.isMine || currentUser?.isAdmin || currentUser?.isGrandAdmin || currentUser?.isSuperAdmin || deleteOptionsPrompt.isCreator || deleteOptionsPrompt.isSubAdmin) && (
                  <button 
                    onClick={() => handleDeleteMessage(deleteOptionsPrompt.msgIds, 'everyone')}
                    className="w-full py-4 rounded-2xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition"
                  >
                    Supprimer pour tout le monde
                  </button>
                )}
                {(currentUser?.isAdmin || currentUser?.isGrandAdmin || currentUser?.isSuperAdmin) && (
                  <button 
                    onClick={() => handleDeleteMessage(deleteOptionsPrompt.msgIds, 'bubble')}
                    className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition"
                  >
                    Supprimer la bulle (Staff)
                  </button>
                )}
                <button 
                  onClick={() => setDeleteOptionsPrompt(null)}
                  className="w-full py-4 rounded-2xl text-gray-400 font-bold hover:text-gray-600 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
        {deletePrompt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in">
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
        {staffDeletePrompt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Supprimer pour tout le monde</h3>
              <p className="text-gray-600 mb-6">En tant que membre du staff, voulez-vous supprimer ce message pour TOUS les utilisateurs ? Cette action est irréversible.</p>
              <div className="flex gap-3">
                <button onClick={() => setStaffDeletePrompt(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                  Annuler
                </button>
                <button onClick={confirmStaffDelete} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-6 pb-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${djStyleText}`}>Discussions</h2>
          {state.newMessages && state.newMessages.length > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-[10px] font-black uppercase tracking-widest text-[#0D98BA] bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
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
              onClick={() => handleTabChange('sms')} 
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sms' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              SMS
            </button>
            <button 
              onClick={() => handleTabChange('recent')} 
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'recent' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Récents
            </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === 'sms' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-gray-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">SMS</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-50 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Rechercher un utilisateur</h4>
                <button 
                  onClick={() => handleStartSMS('dj-bot')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-white font-black uppercase tracking-tighter text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all ${djStyleBg}`}
                >
                  <Bot size={14} />
                  Parler à DJ Bot
                </button>
              </div>
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
              
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {Object.keys(state.users)
                  .filter(u => u !== state.currentUser && state.users[u]?.uid !== state.currentUser && u !== 'dj-bot' && (state.users[u]?.name?.toLowerCase().includes(smsSearch.toLowerCase()) || u.toLowerCase().includes(smsSearch.toLowerCase())))
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
                  {Object.keys(state.users).filter(u => u !== state.currentUser && u !== 'dj-bot' && (state.users[u].name?.toLowerCase().includes(smsSearch.toLowerCase()) || u.toLowerCase().includes(smsSearch.toLowerCase()))).length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-4 italic">Aucun utilisateur trouvé.</p>
                  )}
                </div>
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Discussions récentes</h3>
              {state.newMessages && state.newMessages.length > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-black uppercase tracking-widest text-[#0D98BA] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
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
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Groupes publics</h3>
                  </div>
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
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-gray-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Groupes privés</h3>
                  </div>
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
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{g.name}</h3>
                          {activeTab === 'private' && !g.members?.includes(state.currentUser) && (
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full shrink-0">Ghost</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1]?.time : ''}</span>
                        {(!g.members || g.members.length === 0) && (
                          <button 
                            onClick={(e) => handleDeleteDiscussion(g.id, e)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                            title="Supprimer la discussion vide"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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

      {deleteOptionsPrompt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl">
            <div className={`p-6 ${djStyleBg} text-white text-center`}>
              <Trash2 size={32} className="mx-auto mb-2" />
              <h3 className="text-lg font-black uppercase tracking-tighter">Supprimer le message</h3>
            </div>
            <div className="p-6 space-y-3">
              <button 
                onClick={() => handleDeleteMessage(deleteOptionsPrompt.msgIds, 'me')}
                className="w-full py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
              >
                {deleteOptionsPrompt.isDeletedForEveryone ? "Supprimer la bulle pour moi" : "Supprimer pour moi uniquement"}
              </button>
              {!deleteOptionsPrompt.isDeletedForEveryone && (deleteOptionsPrompt.isMine || currentUser?.isAdmin || currentUser?.isGrandAdmin || currentUser?.isSuperAdmin || deleteOptionsPrompt.isCreator || deleteOptionsPrompt.isSubAdmin) && (
                <button 
                  onClick={() => handleDeleteMessage(deleteOptionsPrompt.msgIds, 'everyone')}
                  className="w-full py-4 rounded-2xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition"
                >
                  Supprimer pour tout le monde
                </button>
              )}
              {(currentUser?.isAdmin || currentUser?.isGrandAdmin || currentUser?.isSuperAdmin) && (
                <button 
                  onClick={() => handleDeleteMessage(deleteOptionsPrompt.msgIds, 'bubble')}
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition"
                >
                  Supprimer la bulle (Staff)
                </button>
              )}
              <button 
                onClick={() => setDeleteOptionsPrompt(null)}
                className="w-full py-4 rounded-2xl text-gray-400 font-bold hover:text-gray-600 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 animate-in fade-in">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in">
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

      {staffDeletePrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Supprimer pour tout le monde</h3>
            <p className="text-gray-600 mb-6">En tant que membre du staff, voulez-vous supprimer ce message pour TOUS les utilisateurs ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setStaffDeletePrompt(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                Annuler
              </button>
              <button onClick={confirmStaffDelete} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
