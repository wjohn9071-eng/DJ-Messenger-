import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
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
  getDocs 
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, reauthenticateWithPopup } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialisation Auth standard
export const auth = getAuth(app);

// Optimisation Firestore pour éviter les erreurs "Offline" et "Network Request Failed"
// Utilisation de la nouvelle API de cache pour éviter les warnings de dépréciation
// Et activation du support multi-onglets
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);

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
