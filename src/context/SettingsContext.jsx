import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'pt-BR',
    notifications: true,
    fontSize: 'medium',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('appSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
      if (settings.theme) {
        document.documentElement.setAttribute('data-theme', settings.theme);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [settings]);

  const validateSetting = useCallback((key, value) => {
    switch (key) {
      case 'theme':
        if (!['light', 'dark'].includes(value)) {
          throw new Error('Tema deve ser "light" ou "dark"');
        }
        break;
      case 'language':
        if (!['pt-BR', 'en'].includes(value)) {
          throw new Error('Idioma inválido');
        }
        break;
      case 'fontSize':
        if (!['small', 'medium', 'large'].includes(value)) {
          throw new Error('Tamanho de fonte inválido');
        }
        break;
      default:
        break;
    }
  }, []);

  const updateSetting = useCallback((key, value) => {
    validateSetting(key, value);
    setError(null);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, [validateSetting]);

  const value = {
    settings,
    updateSetting,
    validateSetting,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};