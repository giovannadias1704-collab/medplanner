import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Verificar se já foi instalado
    const isInstalled = localStorage.getItem('pwa-installed');
    const isDismissed = localStorage.getItem('pwa-install-dismissed');

    if (isInstalled || isDismissed) {
      return;
    }

    // Capturar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar quando o app foi instalado
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa-installed', 'true');
      setShowInstallPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar o prompt de instalação
    deferredPrompt.prompt();

    // Esperar pela escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ Usuário aceitou instalar o PWA');
      localStorage.setItem('pwa-installed', 'true');
    } else {
      console.log('❌ Usuário recusou instalar o PWA');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="glass-card p-4 rounded-2xl shadow-2xl border-2 border-primary-500/20">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
            <ArrowDownTrayIcon className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              Instalar MedPlanner
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Instale o app para acesso rápido e trabalhe offline!
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="btn-primary text-sm px-4 py-2"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="btn-secondary text-sm px-4 py-2"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}