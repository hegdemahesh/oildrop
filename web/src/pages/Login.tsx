import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { user, signInWithGoogle, startPhone, confirmCode, phoneVerificationId, error, clearError } = useAuth();
  const [mode, setMode] = useState<'google' | 'phone'>('google');
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resend, setResend] = useState(0);

  React.useEffect(() => {
    if (resend > 0) {
      const t = setTimeout(() => setResend(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resend]);

  if (user) return <Navigate to="/" replace />;

  const sendCode = async () => {
    if (phone.length < 8) return;
    setSending(true); clearError();
    await startPhone(phone);
    setSending(false);
    setResend(45);
  };

  const confirm = async () => {
    if (!code) return;
    setVerifying(true); clearError();
    await confirmCode(code);
    setVerifying(false);
  };

  const googleLogin = async () => {
    clearError();
    await signInWithGoogle();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#eef2f7,#f8fafc)' }}>
      <div style={{ background: '#fff', padding: '2.75rem 2.5rem', borderRadius: 20, width: 400, boxShadow: '0 8px 28px -6px rgba(0,0,0,0.15)', position: 'relative' }}>
        <h1 style={{ marginTop: 0, fontSize: 30, fontWeight: 800, letterSpacing: .5, background: 'linear-gradient(90deg,#2563eb,#1d4ed8)', WebkitBackgroundClip: 'text', color: 'transparent' }}>OilDrop Portal</h1>
        <p style={{ color: '#64748b', marginTop: 4, marginBottom: 24, fontSize: 14 }}>Access your inventory & customers dashboard</p>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 10, marginBottom: 24, gap: 4 }}>
          <button onClick={() => { setMode('google'); clearError(); }} style={{ flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', borderRadius: 8, background: mode==='google' ? '#fff' : 'transparent', fontWeight: 600, boxShadow: mode==='google' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}>Google</button>
          <button onClick={() => { setMode('phone'); clearError(); }} style={{ flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', borderRadius: 8, background: mode==='phone' ? '#fff' : 'transparent', fontWeight: 600, boxShadow: mode==='phone' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}>Phone</button>
        </div>
        {mode === 'google' && (
          <div>
            <button onClick={googleLogin} style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px 16px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Continue with Google</button>
          </div>
        )}
        {mode === 'phone' && (
          <div>
            {!phoneVerificationId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (+91...)" style={inputStyle} />
                <button disabled={sending || phone.length < 8} onClick={sendCode} style={{ ...primaryBtn, opacity: sending || phone.length < 8 ? .6 : 1 }}>{sending ? 'Sending...' : 'Send Code'}</button>
              </div>
            )}
            {phoneVerificationId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, color: '#475569' }}>Code sent to {phone}</div>
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="OTP Code" style={inputStyle} />
                <button disabled={verifying || code.length < 4} onClick={confirm} style={{ ...primaryBtn, opacity: verifying || code.length < 4 ? .6 : 1 }}>{verifying ? 'Verifying...' : 'Verify Code'}</button>
                <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                  {resend > 0 ? `Resend in ${resend}s` : <button onClick={sendCode} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>Resend</button>}
                </div>
              </div>
            )}
          </div>
        )}
        {error && <div style={{ marginTop: 24, background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>{error}</div>}
        <div style={{ marginTop: 28, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>Protected access • Firebase Auth & Firestore</div>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  outline: 'none'
};

const primaryBtn: React.CSSProperties = {
  width: '100%',
  background: 'linear-gradient(90deg,#2563eb,#1d4ed8)',
  color: '#fff',
  border: 'none',
  padding: '14px 16px',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer'
};

export default Login;
