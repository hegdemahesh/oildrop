import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { User, getAuth, GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { initFirebase } from '../services/firebase';

interface AuthContextValue {
  user: User | null;
  role: 'owner' | 'admin' | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  initFirebase();
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'owner' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      // TODO: fetch role from Firestore roles collection
      setRole(u ? 'owner' : null); // placeholder
      setLoading(false);
    });
    return () => unsub();
  }, []);

  WebBrowser.maybeCompleteAuthSession();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email']
  });

  useEffect(() => {
    const doSignIn = async () => {
      if (response?.type === 'success') {
        const { authentication } = response;
        if (!authentication?.idToken) return;
        const cred = GoogleAuthProvider.credential(authentication.idToken);
        await signInWithCredential(auth, cred);
      }
    };
    doSignIn();
  }, [response]);

  const signInWithGoogle = async () => {
    if (!request) {
      console.warn('Google auth request not ready');
      return;
    }
    setLoading(true);
    try {
      await promptAsync({ useProxy: Platform.select({ web: false, default: true }) });
    } catch (e) {
      console.warn(e);
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
