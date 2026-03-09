import { useEffect } from 'react';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';

// Componente de botão de sincronização com Google Calendar
export function GoogleCalendarButton({ onSyncComplete }) {
  const {
    isSignedIn,
    isLoading,
    isReady,
    signIn,
    signOut,
    syncFromGoogle,
  } = useGoogleCalendar();

  // Carregar scripts do Google
  useEffect(() => {
    // Carregar GAPI
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    document.body.appendChild(gapiScript);

    // Carregar GIS
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    document.body.appendChild(gisScript);

    return () => {
      document.body.removeChild(gapiScript);
      document.body.removeChild(gisScript);
    };
  }, []);

  const handleSync = async () => {
    if (!isSignedIn) {
      signIn();
      return;
    }

    try {
      // Sincronizar próximos 3 meses
      const today = new Date();
      const futureDate = new Date();
      futureDate.setMonth(today.getMonth() + 3);

      const events = await syncFromGoogle(
        today.toISOString().split('T')[0],
        futureDate.toISOString().split('T')[0]
      );

      if (onSyncComplete) {
        onSyncComplete(events);
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro ao sincronizar com Google Calendar');
    }
  };

  if (!isReady) {
    return (
      <button disabled className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-xl text-sm font-semibold cursor-not-allowed">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Carregando...
        </div>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isSignedIn ? (
        <>
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                </svg>
                Sincronizar Google
              </>
            )}
          </button>
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl transition-all"
            title="Desconectar Google Calendar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </>
      ) : (
        <button
          onClick={signIn}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Conectar Google Calendar
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Badge de status de sincronização
export function SyncStatusBadge({ isSignedIn, lastSync }) {
  if (!isSignedIn) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl text-xs font-semibold">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      Google Calendar conectado
      {lastSync && (
        <span className="text-green-600/70 dark:text-green-400/70">
          • Última sync: {new Date(lastSync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}