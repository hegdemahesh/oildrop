import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

let initialized = false;

export function initFirebase() {
  if (initialized) return;
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  };
  if (!getApps().length) {
    initializeApp(config);
  }
  if (process.env.NODE_ENV !== 'production') {
    const auth = getAuth();
    try { connectAuthEmulator(auth, 'http://127.0.0.1:9099'); } catch {}
    try { connectFirestoreEmulator(getFirestore(), '127.0.0.1', 8080); } catch {}
    try { connectStorageEmulator(getStorage(), '127.0.0.1', 9199); } catch {}
  }
  initialized = true;
}
