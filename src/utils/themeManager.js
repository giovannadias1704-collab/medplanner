import { THEMES } from '../components/ThemeSelector';

export const applyTheme = (themeId) => {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return;

  const root = document.documentElement;

  if (themeId === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.style.setProperty('--theme-bg', theme.colors.bg);
  root.style.setProperty('--theme-text', theme.colors.text);
  root.style.setProperty('--theme-primary', theme.colors.primary);
  root.setAttribute('data-theme', themeId);
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