import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

const THEMES = [
  {
    id: 'light',
    name: 'Claro',
    emoji: '☀️',
    preview: 'bg-white border-gray-200',
    primary: 'bg-blue-500',
    colors: {
      bg: '#ffffff',
      text: '#000000',
      primary: '#3b82f6'
    }
  },
  {
    id: 'dark',
    name: 'Escuro',
    emoji: '🌙',
    preview: 'bg-gray-900 border-gray-700',
    primary: 'bg-blue-500',
    colors: {
      bg: '#111827',
      text: '#ffffff',
      primary: '#3b82f6'
    }
  },
  {
    id: 'purple',
    name: 'Roxo',
    emoji: '💜',
    preview: 'bg-purple-50 border-purple-200',
    primary: 'bg-purple-600',
    colors: {
      bg: '#faf5ff',
      text: '#1f2937',
      primary: '#9333ea'
    }
  },
  {
    id: 'green',
    name: 'Verde',
    emoji: '🌿',
    preview: 'bg-green-50 border-green-200',
    primary: 'bg-green-600',
    colors: {
      bg: '#f0fdf4',
      text: '#1f2937',
      primary: '#16a34a'
    }
  },
  {
    id: 'rose',
    name: 'Rosa',
    emoji: '🌸',
    preview: 'bg-rose-50 border-rose-200',
    primary: 'bg-rose-600',
    colors: {
      bg: '#fff1f2',
      text: '#1f2937',
      primary: '#e11d48'
    }
  },
  {
    id: 'ocean',
    name: 'Oceano',
    emoji: '🌊',
    preview: 'bg-cyan-50 border-cyan-200',
    primary: 'bg-cyan-600',
    colors: {
      bg: '#ecfeff',
      text: '#1f2937',
      primary: '#0891b2'
    }
  },
  {
    id: 'sunset',
    name: 'Pôr do Sol',
    emoji: '🌅',
    preview: 'bg-orange-50 border-orange-200',
    primary: 'bg-orange-600',
    colors: {
      bg: '#fff7ed',
      text: '#1f2937',
      primary: '#ea580c'
    }
  },
  {
    id: 'lavender',
    name: 'Lavanda',
    emoji: '🪻',
    preview: 'bg-indigo-50 border-indigo-200',
    primary: 'bg-indigo-600',
    colors: {
      bg: '#eef2ff',
      text: '#1f2937',
      primary: '#4f46e5'
    }
  }
];

export default function ThemeSelector({ currentTheme, onThemeChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onThemeChange(theme.id)}
          className={`relative p-4 rounded-2xl border-2 transition-all hover-lift ${
            currentTheme === theme.id
              ? 'border-primary-600 shadow-lg scale-105'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          {/* Preview do tema */}
          <div className={`w-full h-20 ${theme.preview} rounded-xl mb-3 flex items-center justify-center relative overflow-hidden`}>
            <div className={`absolute inset-0 ${theme.primary} opacity-10`}></div>
            <span className="text-3xl">{theme.emoji}</span>
          </div>
          
          {/* Nome */}
          <p className="text-sm font-bold text-gray-900 dark:text-white text-center">
            {theme.name}
          </p>
          
          {/* Check se selecionado */}
          {currentTheme === theme.id && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
              <CheckIcon className="w-4 h-4 text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export { THEMES };