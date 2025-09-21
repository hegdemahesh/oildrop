import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link, Navigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { user, signInWithGoogle, loading } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', padding: '2.5rem', borderRadius: 16, width: 360, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h1 style={{ marginTop: 0 }}>OilDrop Portal</h1>
        <p style={{ color: '#555', marginTop: 0 }}>Sign in to manage inventory and customers.</p>
        <button disabled={loading} onClick={signInWithGoogle} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, background: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
        <div style={{ marginTop: 24, fontSize: 12, color: '#666' }}>
          <span>Need help? </span>
          <Link to="#" style={{ color: '#2563eb' }}>Contact support</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
