import React, { createContext, useCallback, useContext, useState } from 'react';

export interface ToastItem { id: string; type: 'success' | 'error' | 'info'; message: string; timeout?: number; }

interface ToastContextValue { push: (t: Omit<ToastItem, 'id'>) => void; }

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const toast: ToastItem = { id, timeout: 3500, ...t };
    setToasts(ts => [...ts, toast]);
    if (toast.timeout) {
      setTimeout(() => remove(id), toast.timeout);
    }
  }, [remove]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`rounded-lg shadow-lg border px-4 py-3 text-sm flex items-start gap-3 backdrop-blur-sm transition-all bg-slate-900/90 border-slate-700 ${t.type==='success' ? 'text-emerald-300' : t.type==='error' ? 'text-rose-300' : 'text-sky-300'}`}> 
            <span className="flex-1">{t.message}</span>
            <button onClick={()=>remove(t.id)} className="text-xs opacity-60 hover:opacity-100">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
