import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, getAuth, GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut } from 'firebase/auth';
import * as AuthSession from 'expo-auth-session';
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

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const provider = new GoogleAuthProvider();
      // Use Expo AuthSession + Google Identity if needed (placeholder simplified)
      // In production: implement proper PKCE/OAuth flow; here we assume credential retrieval.
      // This is a placeholder stub for rapid scaffold.
      throw new Error('Google sign-in flow needs implementation with AuthSession');
    } catch (e) {
      console.warn(e);
    } finally {
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
