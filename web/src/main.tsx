import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider, useToast } from './components/Toast';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Setup PWA update prompt
const UpdateListener: React.FC = () => {
  const { push } = useToast();
  React.useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        push({ type: 'info', message: 'New version available – refresh to update', timeout: 8000 });
      },
      onRegistered(r: ServiceWorkerRegistration | undefined) {
        if (r) {
          // Periodically check updates
          setInterval(() => {
            r.update();
          }, 1000 * 60 * 2);
        }
      },
      onRegisterError(error: Error) {
        console.error('SW registration error', error);
        push({ type: 'error', message: 'Service worker registration failed' });
      }
    });
    return () => { /* nothing */ };
  }, [push]);
  return null;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <UpdateListener />
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
