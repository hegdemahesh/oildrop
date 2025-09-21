import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, getAuth, GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut, signInWithPhoneNumber, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { initFirebase } from '../services/firebase';

interface AuthContextValue {
  user: User | null;
  role: 'owner' | 'admin' | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  startPhoneVerification: (phone: string) => Promise<void>;
  confirmPhoneCode: (code: string) => Promise<void>;
  phoneSessionId: string | null;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  initFirebase();
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'owner' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneSessionId, setPhoneSessionId] = useState<string | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
  // Future: fetch role from Firestore roles collection
  setRole(u ? 'owner' : null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  WebBrowser.maybeCompleteAuthSession();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['profile', 'email']
  });

  useEffect(() => {
    const doSignIn = async () => {
      if (response?.type === 'success') {
        try {
          const { authentication } = response;
            if (!authentication?.idToken) return;
            const cred = GoogleAuthProvider.credential(authentication.idToken);
            await signInWithCredential(auth, cred);
        } catch (e:any) {
          setError(e.message || 'Google sign-in failed');
        }
      } else if (response?.type === 'error') {
        setError('Google auth canceled or failed');
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
  await promptAsync();
    } catch (e) {
      console.warn(e);
      setLoading(false);
    }
  };

  // --- Phone Auth (OTP) ---
  const ensureRecaptcha = () => {
    if (recaptchaVerifier) return recaptchaVerifier;
    const verifier = new RecaptchaVerifier(auth, 'phone-recaptcha-container', { size: 'invisible' });
    setRecaptchaVerifier(verifier);
    return verifier;
  };

  const startPhoneVerification = async (phone: string) => {
    setError(null);
    setLoading(true);
    try {
      const verifier = ensureRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setPhoneSessionId(result.verificationId || null);
    } catch (e:any) {
      setError(e.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const confirmPhoneCode = async (code: string) => {
    if (!confirmationResult) {
      setError('No verification in progress');
      return;
    }
    setLoading(true);
    try {
      await confirmationResult.confirm(code);
      setError(null);
      setConfirmationResult(null);
    } catch (e:any) {
      setError(e.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role,
    loading,
    signInWithGoogle,
    startPhoneVerification,
    confirmPhoneCode,
    phoneSessionId,
    logout,
    error
  }), [user, role, loading, phoneSessionId, error]);

  return (
    <>
      {/* Invisible container for Recaptcha (web) */}
      <div id="phone-recaptcha-container" style={{ display: 'none' }} />
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
