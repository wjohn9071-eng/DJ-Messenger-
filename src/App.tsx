import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "./store";
import Auth from "./components/Auth";
import Home from "./components/Home";
import { Discussions } from "./components/Discussions";
import {
  Profile,
  Friends,
  AdminUsers,
  DJSociety,
  Updates as UpdatesView,
  Settings,
  Staff,
} from "./components/Views";
import { TutorialGame } from "./components/TutorialGame";
import { PWAUpdateModal } from "./components/PWAUpdateModal";
import { NotificationToast } from "./components/NotificationToast";
import {
  Menu,
  Home as HomeIcon,
  MessageSquare,
  Users,
  Lightbulb,
  Bell,
  Settings as SettingsIcon,
  HelpCircle,
  User as UserIcon,
  Plus,
  Shield,
} from "lucide-react";
import { djStyleText, djStyleBg, DJ_LOGO_SVG } from "./lib/utils";
import { AppState, Message, Group, User } from "./types";
import {
  db,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  messaging,
  getToken,
  onMessage,
  where,
} from "./lib/firebase";
import { UserProfileModal } from "./components/UserProfileModal";

export default function App() {
  const { state, updateState } = useAppStore();
  const [view, setView] = useState("home");
  const [simulationMode, setSimulationMode] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    id: string;
    title: string;
    message: string;
    groupId: string;
    avatar?: string;
  } | null>(null);
  const notifiedMessages = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // User Presence & Activity Tracking
  useEffect(() => {
    if (!state.currentUser || state.currentUser === "test") return;

    const userRef = doc(db, "users", state.currentUser as string);
    const userPublicRef = doc(db, "users_public", state.currentUser as string);

    const markOnline = async () => {
      try {
        const timestamp = new Date().toISOString();
        const updates = {
          isOnline: true,
          lastLogin: timestamp,
          lastActivity: timestamp,
          lastSeen: Date.now(),
        };
        await setDoc(userRef, updates, { merge: true });
        await setDoc(userPublicRef, updates, { merge: true });
      } catch (e) {
        console.error("Error marking online:", e);
      }
    };

    const markOffline = async () => {
      try {
        const timestamp = new Date().toISOString();
        const updates = {
          isOnline: false,
          lastActivity: timestamp,
          lastSeen: Date.now(),
        };
        await setDoc(userRef, updates, { merge: true });
        await setDoc(userPublicRef, updates, { merge: true });
      } catch (e) {
        console.error("Error marking offline:", e);
      }
    };

    markOnline();

    const handleActivity = () => {
      const now = Date.now();
      if (
        !(window as any).lastActivityUpdate ||
        now - (window as any).lastActivityUpdate > 60000
      ) {
        (window as any).lastActivityUpdate = now;
        setDoc(
          userRef,
          { lastActivity: new Date().toISOString(), lastSeen: now },
          { merge: true },
        );
        setDoc(
          userPublicRef,
          { lastActivity: new Date().toISOString(), lastSeen: now },
          { merge: true },
        );
      }
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("beforeunload", markOffline);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("beforeunload", markOffline);
      markOffline();
    };
  }, [state.currentUser]);

  // FCM Setup
  useEffect(() => {
    if (!state.currentUser || !messaging) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const token = await getToken(messaging, {
            vapidKey: "BD8X8a_fP0U7Nn-_pYRP_Y1f_P6n9n9n9n9n9n9n9n9n9n9n", // Example key, should be user's if they have one
          });
          if (token) {
            await setDoc(
              doc(db, "users", state.currentUser as string),
              { fcmToken: token },
              { merge: true },
            );
          }
        }
      } catch (e) {
        console.error("FCM error:", e);
      }
    };

    requestPermission();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message:", payload);
      // Handled by our custom in-app notification system below for better consistency
    });

    return () => unsubscribe();
  }, [state.currentUser]);

  // Global Message Listener for In-App Notifications
  useEffect(() => {
    if (!state.currentUser || state.currentUser === "test") return;

    const unsubscribers: (() => void)[] = [];

    // We listen to all private messages and groups the user is part of
    // This is a simplified version; in a large app, we'd use a server function or a more optimized approach

    const handleNewMessage = (
      groupId: string,
      msg: Message,
      type: "sms" | "group",
      groupNameOverride?: string,
    ) => {
      if (!initialLoadDone.current) return;
      if (msg.senderId === state.currentUser) return;
      if (state.activeGroup === groupId) return;
      if (notifiedMessages.current.has(msg.id)) return;

      const lastRead =
        state.currentUserData?.lastReadTimestamps?.[groupId] || "0";
      if (msg.timestamp <= lastRead) return; // Ignore read messages

      notifiedMessages.current.add(msg.id);

      const senderName =
        msg.senderName || state.users[msg.senderId]?.name || "Inconnu";
      const senderAvatar = state.users[msg.senderId]?.avatar;

      setNotification({
        id: msg.id,
        title:
          type === "sms"
            ? `Message de ${senderName}`
            : `Nouveau message dans ${groupNameOverride || groupId}`,
        message: msg.text,
        groupId: groupId,
        avatar: senderAvatar,
      });
    };

    const roomMsgUnsubs: Record<string, () => void> = {};

    // Listen to private messages
    const pmQuery = query(
      collection(db, "private_messages"),
      where("members", "array-contains", state.currentUser),
    );
    const unsubPM = onSnapshot(pmQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const roomId = change.doc.id;

        if (change.type === "removed") {
          if (roomMsgUnsubs[roomId]) {
            roomMsgUnsubs[roomId]();
            delete roomMsgUnsubs[roomId];
          }
          return;
        }

        if (!roomMsgUnsubs[roomId]) {
          const msgQuery = query(
            collection(db, "private_messages", roomId, "messages"),
            orderBy("timestamp", "desc"),
            limit(1),
          );
          roomMsgUnsubs[roomId] = onSnapshot(msgQuery, (msgSnap) => {
            msgSnap.docs.forEach((doc) => {
              const msg = { id: doc.id, ...doc.data() } as Message;
              handleNewMessage(roomId, msg, "sms");
            });
          });
        }
      });
    });
    unsubscribers.push(unsubPM);

    // Listen to public/private groups
    const groupQuery = query(collection(db, "groups"));
    const unsubGroups = onSnapshot(groupQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const roomData = change.doc.data();
        const roomId = change.doc.id;

        if (change.type === "removed") {
          if (roomMsgUnsubs[roomId]) {
            roomMsgUnsubs[roomId]();
            delete roomMsgUnsubs[roomId];
          }
          return;
        }

        const shouldListen =
          roomData.type === "public" ||
          (roomData.members && roomData.members.includes(state.currentUser));

        if (shouldListen && !roomMsgUnsubs[roomId]) {
          const msgQuery = query(
            collection(db, "groups", roomId, "messages"),
            orderBy("timestamp", "desc"),
            limit(1),
          );
          roomMsgUnsubs[roomId] = onSnapshot(msgQuery, (msgSnap) => {
            msgSnap.docs.forEach((doc) => {
              const msg = { id: doc.id, ...doc.data() } as Message;
              // Pass the group name along
              handleNewMessage(roomId, msg, "group", roomData.name);
            });
          });
        } else if (!shouldListen && roomMsgUnsubs[roomId]) {
          roomMsgUnsubs[roomId]();
          delete roomMsgUnsubs[roomId];
        }
      });
    });
    unsubscribers.push(unsubGroups);

    // Set initial load flag after a delay to avoid noise on startup
    const timer = setTimeout(() => {
      initialLoadDone.current = true;
    }, 3000);

    // Real-time current user data listener
    const unsubUser = onSnapshot(
      doc(db, "users", state.currentUser as string),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as User;
          updateState((prev: AppState) => {
            const newUsers = { ...prev.users };
            newUsers[state.currentUser as string] = {
              ...newUsers[state.currentUser as string],
              ...data,
              uid: snapshot.id,
            };
            return {
              ...prev,
              users: newUsers,
              currentUserData: data as User,
              darkMode: ["sombre", "azur", "lime", "degrade", "gradient"].some(
                (t) => data.bgColor?.includes(t),
              )
                ? true
                : data.bgColor === "clair"
                  ? false
                  : data.darkMode !== undefined
                    ? data.darkMode
                    : prev.darkMode,
            };
          });
        }
      },
    );

    return () => {
      Object.values(roomMsgUnsubs).forEach((unsub) => unsub());
      unsubscribers.forEach((unsub) => unsub());
      unsubUser();
      clearTimeout(timer);
    };
  }, [state.currentUser, state.activeGroup]);

  // Version check logic removed in favor of Service Worker native API

  useEffect(() => {
    if (state.currentUser && state.users[state.currentUser]?.bgColor) {
      document.documentElement.style.setProperty(
        "--bg-color",
        state.users[state.currentUser].bgColor,
      );
    }
  }, [state.currentUser, state.users]);

  // PWA Install Prompt handling
  const [canInstall, setCanInstall] = useState(false);
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  useEffect(() => {
    if (showUpdateModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showUpdateModal]);

  // Service Worker Update Detection
  useEffect(() => {
    let swRegistration: ServiceWorkerRegistration | null = null;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          swRegistration = reg;

          // Immediate check on load
          reg.update();

          // Check if there is already a waiting worker
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setShowUpdateModal(true);
          }

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  setWaitingWorker(newWorker);
                  // Check if user is typing
                  if (!(window as any).hasUnsentDraft) {
                    // Aggressive: auto-update immediately without asking
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                    window.location.reload();
                  } else {
                    // Wait for user to finish drafting
                    (window as any).pendingDraftReload = true;
                    (window as any).pendingWorker = newWorker;
                  }
                }
              });
            }
          });
        })
        .catch((err) => console.error("SW registration failed:", err));

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;

        if (!(window as any).hasUnsentDraft) {
          refreshing = true;
          window.location.reload();
        } else {
          (window as any).pendingDraftReload = true;
        }
      });

      // Periodically check for updates on the worker
      const checkSWUpdate = () => {
        if (swRegistration) {
          swRegistration.update().catch(() => {
            /* silent handle */
          });
        }
      };

      // Aggressive: Periodic website refresh every 5 minutes as requested
      const refreshInterval = setInterval(
        () => {
          if (swRegistration) {
            swRegistration.update().catch(() => {});
          }
          if (!(window as any).hasUnsentDraft) {
            window.location.reload();
          } else {
            (window as any).pendingDraftReload = true;
          }
        },
        10 * 60 * 1000,
      );

      const updateCheckInterval = setInterval(checkSWUpdate, 2 * 60 * 1000); // Check SW more frequently

      // Also check and reload if visible/focused
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          if (swRegistration) swRegistration.update().catch(() => {});
        }
      };
      const handleFocus = () => {
        if (swRegistration) swRegistration.update().catch(() => {});
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleFocus);

      return () => {
        clearInterval(refreshInterval);
        clearInterval(updateCheckInterval);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, []);

  // Dark Mode and Theme Variables application
  useEffect(() => {
    const root = document.documentElement;
    if (state.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (state.currentUser) {
      const userData = state.users[state.currentUser];
      if (userData?.bgColor) {
        root.setAttribute("data-theme", userData.bgColor);
        if (userData.bgColor.includes("gradient")) {
          root.style.setProperty(
            "--bg-color",
            "linear-gradient(135deg, #0D98BA 0%, #32CD32 100%)",
          );
        } else if (userData.bgColor === "azur") {
          root.style.setProperty("--bg-color", "#0D98BA");
        } else if (userData.bgColor === "lime") {
          root.style.setProperty("--bg-color", "#32CD32");
        } else if (userData.bgColor === "clair") {
          root.style.setProperty("--bg-color", "#f8fafc");
          root.classList.remove("dark");
        } else if (userData.bgColor === "sombre") {
          root.style.setProperty("--bg-color", "#09090b");
          root.classList.add("dark");
        } else {
          root.style.setProperty("--bg-color", userData.bgColor);
        }
      } else {
        root.removeAttribute("data-theme");
        root.style.removeProperty("--bg-color");
      }
      if (userData?.btnColor) {
        root.style.setProperty("--btn-color", userData.btnColor);
      } else {
        root.style.removeProperty("--btn-color");
      }
    } else {
      root.removeAttribute("data-theme");
      root.style.removeProperty("--bg-color");
      root.style.removeProperty("--btn-color");
    }
  }, [state.darkMode, state.currentUser, state.users]);

  // Live Activity & Presence
  useEffect(() => {
    if (!state.currentUser || state.currentUser === "test") return;

    const userRef = doc(db, "users", state.currentUser);
    const publicRef = doc(db, "users_public", state.currentUser);

    const updatePresence = async (isOnline: boolean) => {
      const now = Date.now();
      const updates = {
        lastSeen: now,
        isOnline: isOnline,
      };

      try {
        await setDoc(userRef, updates, { merge: true });
        await setDoc(publicRef, updates, { merge: true });
      } catch (e) {
        console.error("Presence error:", e);
      }
    };

    // Initial online status
    updatePresence(true);

    // Heartbeat every 5 minutes
    const interval = setInterval(() => updatePresence(true), 5 * 60 * 1000);

    // Initial user data tracking (createdAt)
    const initUserData = async () => {
      const userData = state.users[state.currentUser as string];
      if (userData && !userData.createdAt) {
        const now = Date.now();
        await setDoc(userRef, { createdAt: now }, { merge: true });
        await setDoc(publicRef, { createdAt: now }, { merge: true });
      }
    };
    initUserData();

    const handleVisibilityChange = () => {
      updatePresence(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleUnload = () => updatePresence(false);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
      updatePresence(false);
    };
  }, [state.currentUser]);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  const setViewAndCloseMenu = (id: string, preserveActiveGroup = false) => {
    if (id === "tutorial") {
      startSimulation();
      return;
    }
    setView(id);

    // Clear active group when navigating, unless requested otherwise
    if (!preserveActiveGroup) {
      updateState({ activeGroup: null });
    }
  };

  // Fermeture automatique du menu lors du changement d'onglet
  useEffect(() => {
    updateState({ menuOpen: false });
  }, [view]);

  const handleLogout = () => {
    updateState({ currentUser: null });
    setViewAndCloseMenu("home");
    setSimulationMode(false);
  };

  const handleNavClick = (id: string) => {
    setViewAndCloseMenu(id);
  };

  const toggleMenu = () => {
    updateState({ menuOpen: !state.menuOpen });
  };

  const startSimulation = () => {
    setSimulationMode(true);
    setView("home");
  };

  const completeSimulation = () => {
    setSimulationMode(false);
    if (state.currentUser === "test") {
      handleLogout();
    } else {
      setView("home");
    }
  };

  // Cleanup and Initialization: Remove Bot DJ, clean messages, and setup DJ Help
  useEffect(() => {
    if (!state.currentUser) return;

    const botGroupId = `bot-private-${state.currentUser}`;
    const simulatedGroupId = "simulated-group";
    const helpGroupId = `sms_${[state.currentUser as string, "dj-bot"].sort().join("_")}`;

    // Check if any group has messages from 'Bot DJ' or 'DJ Help'
    const hasBotMessages = (Object.values(state.groups || {}) as Group[]).some(
      (g) =>
        g.messages.some(
          (m) =>
            m.user === "Bot DJ" ||
            m.user === "DJ Help" ||
            m.user === "Simulateur DJ (Faux)",
        ),
    );

    // Ensure DJ Bot SMS exists in Firestore
    const setupDJBot = async () => {
      const botRef = doc(db, "private_messages", helpGroupId);
      const botSnap = await getDoc(botRef);
      if (!botSnap.exists()) {
        await setDoc(botRef, {
          id: helpGroupId,
          members: [state.currentUser, "dj-bot"],
          type: "sms",
          lastActivity: new Date().toISOString(),
        });

        // Initial message
        await addDoc(
          collection(db, "private_messages", helpGroupId, "messages"),
          {
            text: "Salut ! Je suis DJ Bot. Je suis là pour t'aider à utiliser DJ Messenger. Pose-moi tes questions !",
            user: "dj-bot",
            senderId: "dj-bot",
            senderName: "DJ Bot",
            timestamp: new Date().toISOString(),
            isSystem: false,
          },
        );
      }
    };

    setupDJBot();

    if (
      hasBotMessages ||
      !state.users["dj-bot"] ||
      state.users["dj-bot"]?.isAdmin
    ) {
      updateState((prev: AppState) => {
        const newGroups = { ...prev.groups };
        const newUsers = { ...prev.users };

        // 0. Ensure DJ Bot user exists correctly
        newUsers["dj-bot"] = {
          ...newUsers["dj-bot"],
          id: "dj-bot",
          uid: "dj-bot",
          name: "DJ Bot",
          email: "bot@djsociety.com",
          isAdmin: false,
          isGrandAdmin: false,
          isSuperAdmin: false,
          friends: [],
          avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dj-bot",
        };

        // 1. Remove old bot groups and simulation artifacts
        if (hasBotMessages) {
          delete newGroups[botGroupId];
          delete newGroups[simulatedGroupId];

          // 2. Remove all messages from 'Bot DJ', 'DJ Help' or 'Simulateur DJ (Faux)' in all groups
          Object.keys(newGroups).forEach((id) => {
            newGroups[id] = {
              ...newGroups[id],
              messages: newGroups[id].messages.filter(
                (m) =>
                  m.user !== "Bot DJ" &&
                  m.user !== "DJ Help" &&
                  m.user !== "Simulateur DJ (Faux)",
              ),
            };
          });
        }

        return { ...prev, groups: newGroups, users: newUsers };
      });
    }
  }, [state.currentUser]);

  // DJ Bot: Auto-tips every 20 minutes and Response logic
  useEffect(() => {
    if (!state.currentUser || state.currentUser === "test") return;

    const helpGroupId = `sms_${[state.currentUser as string, "dj-bot"].sort().join("_")}`;

    const tips = [
      "Astuce : Les groupes publics sont accessibles à tous, mais les groupes privés nécessitent un code d'invitation ou une invitation directe.",
      "Astuce : Vous pouvez désormais créer des groupes en 4 étapes avec une barre de progression pour mieux définir l'utilité du groupe.",
      "Astuce : L'onglet SMS est réservé aux discussions privées en tête-à-tête avec vos amis.",
      "Astuce : Dans les paramètres, vous pouvez changer la couleur de l'application pour qu'elle corresponde à votre style DJ.",
      "Astuce : Les administrateurs de groupes privés peuvent bannir des membres ou supprimer des messages inappropriés.",
      "Astuce : Si vous êtes en mode test, vous pouvez lire les messages des groupes publics mais pas y participer.",
      "Astuce : Dans les discussions publiques, vous pouvez voir qui a envoyé un message et même bannir des utilisateurs si vous êtes admin.",
      "Astuce : Votre profil vous permet de changer votre avatar et votre mot de passe à tout moment.",
      "Astuce : Consultez l'onglet 'Mises à jour' pour découvrir les dernières nouveautés de DJ Messenger.",
      "Astuce : Si un utilisateur est supprimé, vous pouvez choisir de supprimer tous ses messages passés pour nettoyer la discussion.",
      "Astuce : Pour devenir administrateur, utilisez le code 'Dj2024in' dans la section Compte des paramètres.",
      "Astuce : Les groupes privés sont protégés par un code de 5 à 7 caractères que seul le créateur connaît au départ.",
      "Astuce : L'onglet 'Récents' dans les discussions vous montre les derniers messages de tous vos groupes en un coup d'œil.",
      "Astuce : Vous pouvez proposer jusqu'à 3 idées par jour dans la DJ Society si vous n'êtes pas admin.",
    ];

    const sendTip = async () => {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      const newMsg = {
        user: "dj-bot",
        text: randomTip,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: new Date().toISOString(),
        senderId: "dj-bot",
        senderName: "DJ Bot",
      };

      try {
        const msgRef = collection(
          db,
          "private_messages",
          helpGroupId,
          "messages",
        );
        await addDoc(msgRef, newMsg);
      } catch (e) {
        console.error("Error sending bot tip:", e);
      }
    };

    // Send a tip every 15 minutes
    const interval = setInterval(sendTip, 15 * 60 * 1000);

    // Response logic: Check for new user messages in DJ Bot group
    const helpGroup = state.privateMessages?.[helpGroupId];
    const currentUserData = state.users[state.currentUser as string];

    if (helpGroup && helpGroup.messages) {
      const lastMsg = helpGroup.messages[helpGroup.messages.length - 1];
      if (lastMsg && lastMsg.user === state.currentUser && !lastMsg.isSystem) {
        // User just sent a message, respond after 1 second
        const timer = setTimeout(async () => {
          const today = new Date().toLocaleDateString();
          const questionsToday =
            currentUserData?.lastBotQuestionDate === today
              ? currentUserData?.botQuestionsToday || 0
              : 0;

          if (questionsToday >= 5) {
            const response =
              "Désolé, vous avez atteint votre limite de 5 questions pour aujourd'hui. Revenez demain pour plus de conseils !";
            const botResponse = {
              user: "dj-bot",
              text: response,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              timestamp: new Date().toISOString(),
              senderId: "dj-bot",
              senderName: "DJ Bot",
            };
            try {
              const msgRef = collection(
                db,
                "private_messages",
                helpGroupId,
                "messages",
              );
              await addDoc(msgRef, botResponse);
            } catch (e) {
              console.error("Error sending bot limit message:", e);
            }
            return;
          }

          let response =
            "Je suis désolé, mes capteurs ne captent pas bien cette fréquence ! Mais je peux vous guider sur les groupes, les SMS privés, le transfert de fichiers, la DJ Society ou vos réglages. Posez-moi une question précise !";
          const text = (lastMsg.text || "").toLowerCase();

          if (
            text.includes("bonjour") ||
            text.includes("salut") ||
            text.includes("coucou") ||
            text.includes("hello")
          ) {
            response =
              "Salut l'artiste ! 🎧 Je suis DJ Bot, ton assistant virtuel personnel. Je suis expert en DJ Messenger. Comment puis-je t'aider à propulser ton expérience aujourd'hui ?\n\nJe peux t'expliquer :\n- Comment créer des Groupes (Publics ou Privés)\n- Comment ajouter des Amis pour des SMS secrets\n- Comment utiliser la DJ Society pour changer l'app\n- Comment personnaliser ton style dans les Paramètres";
          } else if (text.includes("groupe")) {
            response =
              "Les Groupes sont le cœur de la communauté ! 🌍\n\n1. **Publics** : Visibles par tous, parfaits pour les annonces DJ.\n2. **Privés** : Sécurisés par un code secret (5-7 caractères). On y entre par invitation ou avec le code.\n3. **SMS** : Discussions 1-à-1 avec tes amis.\n\n**Astuce PRO** : Pour créer le groupe parfait, appuie sur '+' et laisse-toi guider par l'assistant en 4 étapes !";
          } else if (text.includes("ami")) {
            response =
              "Besoin d'un crew ? 👯‍♂️\n\n1. Direction l'onglet **'AMIS'**.\n2. Tape son pseudo dans la barre de recherche.\n3. Envoie une invitation.\n\nUne fois accepté, vous pourrez échanger des messages cryptés et des fichiers en privé !";
          } else if (
            text.includes("paramètre") ||
            text.includes("couleur") ||
            text.includes("style") ||
            text.includes("theme") ||
            text.includes("thème")
          ) {
            response =
              "Exprime ton style ! 🎨 Dans l'onglet **'PARAMÈTRES'**, tu peux :\n- Changer la couleur principale de l'app (Style DJ).\n- Basculer entre le Mode Sombre et Clair.\n- Modifier ton mot de passe.\n- Devenir un **ADMIN** si tu possèdes le code secret 'Dj2024in' !";
          } else if (
            text.includes("society") ||
            text.includes("idée") ||
            text.includes("proposer") ||
            text.includes("vote")
          ) {
            response =
              "La **DJ Society** est ta tribune ! 🏛️\n\n- Propose des idées d'amélioration (3 par jour max).\n- Vote pour les suggestions des autres.\n- Les administrateurs valident les meilleures idées pour les intégrer dans la prochaine version (comme la v3.0 actuelle !).";
          } else if (text.includes("test") || text.includes("visiteur")) {
            response =
              "Le **Mode Test** est une démo. 👁️\nTu peux observer, mais pour devenir un vrai acteur, créer des groupes et avoir des amis, tu dois te connecter avec un vrai compte. C'est instantané et ça débloque toute la puissance de l'application !";
          } else if (text.includes("code")) {
            response =
              "La sécurité avant tout ! 🔒\nLes codes de groupe sont définis à la création par le créateur. Ne le donne qu'à ceux que tu veux voir dans tes discussions privées. Si tu as perdu le code d'un de tes groupes, demande à un autre admin !";
          } else if (
            text.includes("sms") ||
            text.includes("message") ||
            text.includes("privé")
          ) {
            response =
              "Les SMS sont ultra-privés. 📱\nChaque discussion est une bulle entre toi et ton contact. Tu peux y envoyer du texte stylé (*italique*, **gras**), des stickers et des fichiers lourds.";
          } else if (
            text.includes("fichier") ||
            text.includes("image") ||
            text.includes("vidéo") ||
            text.includes("photo") ||
            text.includes("partage")
          ) {
            response =
              "Partage tes créations ! 💿\nUtilise l'icône **Trombone (📎)**. Tu peux envoyer des photos HD et des vidéos jusqu'à 200 Mo. Ils s'affichent directement dans la discussion pour tous les membres !";
          } else if (
            text.includes("admin") ||
            text.includes("modérateur") ||
            text.includes("pouvoir")
          ) {
            response =
              "Les Admins règnent sur l'app ! 🛡️\nIls peuvent supprimer les messages toxiques, bannir les trolls et valider les idées. Pour les rejoindre, va dans Paramètres > Compte et entre le code admin.";
          } else if (
            text.includes("v3") ||
            text.includes("version") ||
            text.includes("nouveau") ||
            text.includes("mise à jour")
          ) {
            response =
              "La **Version 3.0** est une révolution ! 🚀\n- Notifications In-App interactives.\n- Support des notifications Background.\n- Système de présence (En Ligne).\n- Avatars de groupes et rendu Markdown amélioré.\nConsulte l'onglet **'MISES À JOUR'** pour tout savoir !";
          } else if (
            text.includes("merci") ||
            text.includes("thanks") ||
            text.includes("top")
          ) {
            response =
              "À ton service ! 🎧 N'hésite pas si tu as d'autres questions. À plus dans le mix !";
          } else if (
            text.includes("aide") ||
            text.includes("help") ||
            text.includes("comment")
          ) {
            response =
              "Je suis ton manuel d'utilisation vivant ! 📘 Dis-moi ce qui te bloque : les groupes, les SMS, les fichiers, les amis ou ton profil ?";
          } else if (
            text.includes("musique") ||
            text.includes("dj") ||
            text.includes("set")
          ) {
            response =
              "Pour le moment, je gère la messagerie, mais on murmure que des lecteurs audio pourraient un jour arriver dans DJ Messenger... Reste à l'écoute ! 🎶";
          } else if (text.includes("supprimer") || text.includes("quitter")) {
            response =
              "Tu veux faire du ménage ? 🧹\n- Tu peux quitter un groupe depuis sa barre d'options.\n- Si tu es admin, tu peux supprimer un message ou bannir un membre indélicat.";
          } else if (
            text.includes("qui es-tu") ||
            text.includes("qui est tu") ||
            text.includes("t'es qui")
          ) {
            response =
              "Je suis **DJ Bot**, le premier résident permanent de DJ Messenger ! 🤖 Mon but est de faire en sorte que personne ne soit perdu dans l'application. Je ne dors jamais, je suis là 24h/24.";
          }

          const botResponse = {
            user: "dj-bot",
            text: response,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            timestamp: new Date().toISOString(),
            senderId: "dj-bot",
            senderName: "DJ Bot",
          };

          try {
            const msgRef = collection(
              db,
              "private_messages",
              helpGroupId,
              "messages",
            );
            await addDoc(msgRef, botResponse);

            const userRef = doc(db, "users", state.currentUser as string);
            await setDoc(
              userRef,
              {
                botQuestionsToday: questionsToday + 1,
                lastBotQuestionDate: today,
              },
              { merge: true },
            );
          } catch (e) {
            console.error("Error sending bot response:", e);
          }
        }, 1000);
        return () => {
          clearTimeout(timer);
          clearInterval(interval);
        };
      }
    }

    return () => clearInterval(interval);
  }, [
    state.currentUser,
    state.groups,
    state.users,
    updateState,
    state.privateMessages,
  ]);

  if (!state.currentUser) {
    return <Auth state={state} updateState={updateState} />;
  }

  const isTest = state.currentUser === "test";
  const user = isTest ? null : state.users[state.currentUser];

  const navItems = [
    { id: "home", label: "Accueil", icon: HomeIcon },
    { id: "profile", label: "Mon Profil", icon: UserIcon },
    { id: "discussions", label: "Discussions", icon: MessageSquare },
    { id: "friends", label: "Amis", icon: Users },
    { id: "djsociety", label: "DJ Society", icon: Lightbulb },
  ];

  if (user?.isAdmin || user?.isGrandAdmin || user?.isSuperAdmin) {
    navItems.push({ id: "staff", label: "Staff", icon: Shield });
    navItems.splice(4, 0, {
      id: "admin_users",
      label: "Utilisateurs",
      icon: Shield,
    });
  }

  navItems.push(
    { id: "updates", label: "Mises à jour", icon: Bell },
    { id: "settings", label: "Paramètres", icon: SettingsIcon },
    { id: "tutorial", label: "Tutoriel", icon: HelpCircle },
  );

  const renderView = () => {
    switch (view) {
      case "home":
        return (
          <Home
            state={state}
            setView={setViewAndCloseMenu}
            updateState={updateState}
            startSimulation={startSimulation}
          />
        );
      case "discussions":
        return <Discussions state={state} updateState={updateState} />;
      case "friends":
        return (
          <Friends
            state={state}
            updateState={updateState}
            setView={setViewAndCloseMenu}
          />
        );
      case "admin_users":
        return <AdminUsers state={state} updateState={updateState} />;
      case "staff":
        return <Staff state={state} updateState={updateState} />;
      case "djsociety":
        return <DJSociety state={state} updateState={updateState} />;
      case "updates":
        return <UpdatesView state={state} />;
      case "settings":
        return (
          <Settings
            state={state}
            updateState={updateState}
            handleLogout={handleLogout}
          />
        );
      case "profile":
        return (
          <Profile
            state={state}
            updateState={updateState}
            handleLogout={handleLogout}
          />
        );
      case "tutorial":
        return (
          <TutorialGame
            state={state}
            onComplete={() => setView("home")}
            onCancel={() => setView("home")}
          />
        );
      default:
        return (
          <Home
            state={state}
            setView={setViewAndCloseMenu}
            updateState={updateState}
            startSimulation={startSimulation}
          />
        );
    }
  };

  if (simulationMode) {
    return (
      <TutorialGame
        state={state}
        onComplete={completeSimulation}
        onCancel={() => {
          setSimulationMode(false);
          setView("home");
        }}
      />
    );
  }

  return (
    <div
      className={`flex h-screen w-full overflow-hidden transition-colors duration-300`}
    >
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
        onClick={(groupId) => {
          updateState({
            activeGroup: groupId,
            discussionTab: groupId.startsWith("sms_")
              ? "sms"
              : state.groups[groupId]?.type === "public"
                ? "public"
                : "private",
          });
          setView("discussions");
          setNotification(null);
        }}
      />

      {/* Sidebar / Hamburger Menu */}
      <aside
        className={`fixed inset-y-0 left-0 lg:relative z-[9999] ${state.darkMode ? "bg-black/95 border-r border-white/10" : "bg-black shadow-[15px_0_40px_rgba(0,0,0,0.5)]"} text-white flex flex-col transition-all duration-300 ease-in-out h-full overflow-hidden shrink-0 ${state.menuOpen ? "w-full lg:w-72" : "w-0"}`}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/5 shrink-0 min-w-[100vw] lg:min-w-max">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-1.5 bg-white">
              <div
                dangerouslySetInnerHTML={{ __html: DJ_LOGO_SVG }}
                className="w-full h-full"
              />
            </div>
            <span
              className={`font-black text-xl tracking-tighter uppercase ${djStyleText}`}
            >
              Messenger
            </span>
          </div>
          <button
            onClick={toggleMenu}
            className="p-2 hover:bg-white/10 rounded-xl transition"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <button
            onClick={() => handleNavClick("profile")}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#00CED1] transition-all shadow-lg">
              {user?.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={24} className="text-gray-400" />
              )}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-black text-sm uppercase tracking-tight truncate">
                {isTest ? "Mode Test" : user?.name}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {isTest ? "Anonyme" : "En ligne"}
                </p>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold uppercase text-xs tracking-widest ${view === item.id ? "bg-white/10 text-white shadow-inner" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}
            >
              <item.icon
                size={18}
                className={view === item.id ? "text-[#00CED1]" : ""}
              />
              {item.label}
            </button>
          ))}

          {/* Install Button */}
          {((window as any).deferredPrompt || canInstall) && (
            <button
              onClick={async () => {
                const prompt = (window as any).deferredPrompt;
                if (prompt) {
                  prompt.prompt();
                  const { outcome } = await prompt.userChoice;
                  if (outcome === "accepted") {
                    (window as any).deferredPrompt = null;
                    setCanInstall(false);
                  }
                }
              }}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-green-400 hover:bg-white/5 transition-all font-bold uppercase text-xs tracking-widest mt-4 border border-green-400/20"
            >
              <Plus size={18} />
              Installer l'App
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-[8px] font-black text-center text-gray-500 uppercase tracking-[0.3em]">
            DJ Society © 2026
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300 ${state.menuOpen ? "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto" : "opacity-100"}`}
      >
        <header
          className={`p-4 border-b flex items-center shadow-sm sticky top-0 z-[1000] shrink-0 backdrop-blur-md ${state.darkMode ? "bg-black/80 border-white/10" : "bg-white/80 border-gray-200"}`}
        >
          <button
            onClick={toggleMenu}
            className={`p-2 rounded-xl transition mr-2 relative z-[10001] ${state.darkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <Menu size={24} />
          </button>
          <h1
            className={`ml-2 font-black uppercase tracking-tighter text-xl ${djStyleText}`}
          >
            {navItems.find((i) => i.id === view)?.label || "DJ Messenger"}
          </h1>
        </header>

        <div className="flex-1 relative overflow-y-auto w-full">
          {renderView()}
        </div>
      </main>

      {state.selectedUserModal && (
        <UserProfileModal
          userId={state.selectedUserModal}
          state={state}
          updateState={updateState}
          onClose={() => updateState({ selectedUserModal: null })}
          setView={setViewAndCloseMenu}
        />
      )}

      <PWAUpdateModal show={showUpdateModal} onUpdate={handleUpdate} />
    </div>
  );
}
