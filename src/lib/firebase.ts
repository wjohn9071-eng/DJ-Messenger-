import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp, Timestamp, getDocFromServer, where, getDocs } from 'firebase/firestore';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, reauthenticateWithPopup } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Configuration hardcodée pour une compatibilité totale Vercel & Offline
const firebaseConfig = {
  apiKey: "AIzaSyCKITVldKjMdPY4PvJWORy-79TAxVeJagg",
  authDomain: "gen-lang-client-0241237641.firebaseapp.com",
  projectId: "gen-lang-client-0241237641",
  storageBucket: "gen-lang-client-0241237641.firebasestorage.app",
  messagingSenderId: "914168217742",
  appId: "1:914168217742:web:d0f775dcbbdba4b9ac09df"
};

const app = initializeApp(firebaseConfig);

// Initialisation Auth plus robuste pour les iframes et Vercel
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

// Optimisation Firestore pour éviter les erreurs "Offline" et "Network Request Failed"
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Force le mode compatible (indispensable sur Vercel/Iframes)
  experimentalAutoDetectLongPolling: false, // Ne pas essayer de détecter, forcer direct
  ignoreUndefinedProperties: true,
}, "ai-studio-5df211c0-97ca-437b-9459-24e04efe73d4");

// Test de connexion silencieux avec gestion d'erreur améliorée
async function testConnection() {
  try {
    // On utilise getDocFromServer pour forcer un check réseau réel
    await getDocFromServer(doc(db, '_connection_test_', 'test'));
    console.log("🔥 Firebase Connecté avec succès");
  } catch (error: any) {
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      console.warn("⚠️ Mode hors-ligne détecté. L'application fonctionnera en mode dégradé.");
    } else {
      console.error("❌ Erreur de connexion Firebase:", error.code, error.message);
    }
  }
}
testConnection();

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const googleProviderWithPrompt = new GoogleAuthProvider();
googleProviderWithPrompt.setCustomParameters({ prompt: 'select_account' });

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  reauthenticateWithPopup,
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  getDocFromServer,
  where,
  getDocs,
  ref,
  uploadBytesResumable,
  getDownloadURL
};
