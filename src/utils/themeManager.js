import { THEME_PALETTES } from '../components/PageLayout';

export const applyTheme = (themeId) => {
  const palette = THEME_PALETTES[themeId];
  if (!palette) return;

  const root = document.documentElement;

  if (themeId === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.style.setProperty('--theme-bg',      palette.bg);
  root.style.setProperty('--theme-text',    palette.text);
  root.style.setProperty('--theme-primary', palette.accent);
  root.setAttribute('data-theme', themeId);
  localStorage.setItem('medplanner_theme', themeId);
};

export const getStoredTheme = () => {
  return localStorage.getItem('medplanner_theme') || 'light';
};

export const initTheme = () => {
  const storedTheme = getStoredTheme();
  applyTheme(storedTheme);
  return storedTheme;
};