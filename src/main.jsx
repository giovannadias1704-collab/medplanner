import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initTheme } from './utils/themeManager.js';
import { AppProvider } from './context/AppContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { CouponProvider } from './context/CouponContext';
import { ThemeProvider } from './components/PageLayout';
import './sentry';

// Inicializar tema
initTheme();

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('✅ Service Worker registrado'))
      .catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppProvider>
        <CouponProvider>
          <SubscriptionProvider>
            <App />
          </SubscriptionProvider>
        </CouponProvider>
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>
);