import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';

interface AuthValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    await signInWithPopup(auth, googleProvider).catch(e => setError(e.message));
  };

  const logout = async () => {
    await signOut(auth);
  };

  const clearError = () => setError(null);
  const value: AuthValue = useMemo(() => ({
    user,
    loading,
    signInWithGoogle,
    logout,
    error,
    clearError
  }), [user, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
