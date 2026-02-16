import { THEMES } from '../components/ThemeSelector';

export const applyTheme = (themeId) => {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return;

  const root = document.documentElement;

  // Remover tema escuro se não for dark
  if (themeId === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Aplicar cores do tema
  root.style.setProperty('--theme-bg', theme.colors.bg);
  root.style.setProperty('--theme-text', theme.colors.text);
  root.style.setProperty('--theme-primary', theme.colors.primary);

  // Aplicar classes de tema personalizadas
  root.setAttribute('data-theme', themeId);

  // Salvar no localStorage
  localStorage.setItem('app-theme', themeId);
};

export const getStoredTheme = () => {
  return localStorage.getItem('app-theme') || 'light';
};

export const initTheme = () => {
  const storedTheme = getStoredTheme();
  applyTheme(storedTheme);
  return storedTheme;
};