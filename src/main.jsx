import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initTheme } from './utils/themeManager.js';
import { AppProvider } from './context/AppContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { CouponProvider } from './context/CouponContext';
import './sentry'; // 
// Inicializar tema
initTheme();

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado com sucesso!');
        console.log('📍 Scope:', registration.scope);
        
        // Verificar atualizações do Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Nova versão disponível! Recarregue a página.');
            }
          });
        });
      })
      .catch((error) => {
        console.log('❌ Erro ao registrar Service Worker:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <CouponProvider>
        <SubscriptionProvider>
          <App />
        </SubscriptionProvider>
      </CouponProvider>
    </AppProvider>
  </React.StrictMode>
);