/// <reference types="vite/client" />
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]; // measurement id optional

const missing = required.filter(k => !import.meta.env[k as keyof ImportMetaEnv]);
if (missing.length) {
  console.error('[Firebase] Missing env variables:', missing.join(', '));
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.apiKey) {
  console.warn('[Firebase] apiKey missing – app will not initialize. Check web/.env.');
}

if (!getApps().length && firebaseConfig.apiKey) {
  initializeApp(firebaseConfig);
}

export const auth = getAuth();
export const db = getFirestore();
export const functions = getFunctions();

// Connect emulators in development (when running locally without production host)
if (import.meta.env.MODE === 'development') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch {}
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch {}
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch {}
}

export const googleProvider = new GoogleAuthProvider();
