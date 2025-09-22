import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { user, signInWithGoogle, error, clearError } = useAuth();

  if (user) return <Navigate to="/" replace />;

  const googleLogin = async () => {
    clearError();
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="card shadow-2xl bg-base-200/60 backdrop-blur border border-slate-700">
          <div className="card-body">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">OilDrop Portal</h1>
            <p className="text-sm text-slate-400 mt-1 mb-4">Sign in to manage inventory & billing</p>
            <button onClick={googleLogin} className="btn btn-primary w-full gap-2 font-semibold">
              <span className="bg-white text-slate-800 font-bold px-2 rounded">G</span>
              Continue with Google
            </button>
            {error && (
              <div className="mt-4 alert alert-error text-sm">
                <span>{error}</span>
              </div>
            )}
            <div className="mt-6 text-[10px] text-center text-slate-500">Secured by Firebase Authentication</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
