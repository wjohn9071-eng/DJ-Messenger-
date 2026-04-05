import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp, Timestamp, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCKITVldKjMdPY4PvJWORy-79TAxVeJagg",
  authDomain: "gen-lang-client-0241237641.firebaseapp.com",
  projectId: "gen-lang-client-0241237641",
  storageBucket: "gen-lang-client-0241237641.firebasestorage.app",
  messagingSenderId: "914168217742",
  appId: "1:914168217742:web:d0f775dcbbdba4b9ac09df"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-5df211c0-97ca-437b-9459-24e04efe73d4");

// Connection test as per critical instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'test'));
  } catch (error: any) {
    if (error.message && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const googleProviderWithPrompt = new GoogleAuthProvider();
googleProviderWithPrompt.setCustomParameters({ prompt: 'select_account' });

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
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
  ref,
  uploadBytesResumable,
  getDownloadURL
};
