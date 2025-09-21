import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

interface AuthValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // phone auth
  startPhone: (phone: string) => Promise<void>;
  confirmCode: (code: string) => Promise<void>;
  phoneVerificationId: string | null;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneVerifier, setPhoneVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [phoneVerificationId, setPhoneVerificationId] = useState<string | null>(null);
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

  const ensureVerifier = () => {
    if (phoneVerifier) return phoneVerifier;
    const v = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    setPhoneVerifier(v);
    return v;
  };

  const startPhone = useCallback(async (phone: string) => {
    setError(null);
    try {
      const v = ensureVerifier();
      const conf = await signInWithPhoneNumber(auth, phone, v);
      setConfirmation(conf);
      setPhoneVerificationId(conf.verificationId);
    } catch (e:any) {
      setError(e.message || 'Failed to send code');
    }
  }, [phoneVerifier]);

  const confirmCode = useCallback(async (code: string) => {
    if (!confirmation) { setError('No verification in progress'); return; }
    try {
      await confirmation.confirm(code);
      setConfirmation(null);
      setPhoneVerificationId(null);
    } catch (e:any) {
      setError(e.message || 'Invalid code');
    }
  }, [confirmation]);

  const clearError = () => setError(null);
  const value: AuthValue = useMemo(() => ({
    user,
    loading,
    signInWithGoogle,
    logout,
    startPhone,
    confirmCode,
    phoneVerificationId,
    error,
    clearError
  }), [user, loading, startPhone, confirmCode, phoneVerificationId, error]);

  return (
    <AuthContext.Provider value={value}>
      <div id="recaptcha-container" style={{ display: 'none' }} />
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
