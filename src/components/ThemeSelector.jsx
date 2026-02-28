// components/ThemeSelector.jsx
import { useContext } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { ThemeContext, THEME_PALETTES } from './PageLayout';

const THEMES = [
  { id: 'light',    name: 'Claro',      emoji: '☀️'  },
  { id: 'dark',     name: 'Escuro',     emoji: '🌙'  },
  { id: 'purple',   name: 'Roxo',       emoji: '💜'  },
  { id: 'green',    name: 'Verde',      emoji: '🌿'  },
  { id: 'rose',     name: 'Rosa',       emoji: '🌸'  },
  { id: 'ocean',    name: 'Oceano',     emoji: '🌊'  },
  { id: 'sunset',   name: 'Pôr do Sol', emoji: '🌅'  },
  { id: 'lavender', name: 'Lavanda',    emoji: '🪻'  },
];

export default function ThemeSelector() {
  // useContext direto — evita problemas de importação circular com useTheme
  const { themeId, setThemeId, T } = useContext(ThemeContext);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
      gap: 12,
      padding: 16,
      background: T?.card || '#fff',
    }}>
      {THEMES.map((theme) => {
        const palette  = THEME_PALETTES[theme.id];
        const isActive = themeId === theme.id;

        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => setThemeId(theme.id)}
            style={{
              position: 'relative',
              padding: 14,
              borderRadius: 16,
              border: `2px solid ${isActive ? (T?.accent || '#C48E6B') : (T?.border || '#E8DFD3')}`,
              background: T?.card || '#fff',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              transform: isActive ? 'scale(1.04)' : 'scale(1)',
              boxShadow: isActive
                ? `0 4px 16px ${palette?.accent || '#C48E6B'}44`
                : '0 2px 6px rgba(0,0,0,0.06)',
              fontFamily: "'Poppins',sans-serif",
              outline: 'none',
            }}
          >
            {/* Preview */}
            <div style={{
              width: '100%', height: 64, borderRadius: 10, marginBottom: 10,
              background: palette?.bg || '#F4EFE6',
              border: `1px solid ${palette?.border || '#E8DFD3'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Mini sidebar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 20,
                background: palette?.card || '#fff',
                borderRight: `1px solid ${palette?.border || '#E8DFD3'}`,
              }} />
              {/* Accent bar */}
              <div style={{
                position: 'absolute', left: 4, top: '30%', bottom: '30%',
                width: 3, borderRadius: 2, background: palette?.accent || '#C48E6B',
              }} />
              <span style={{ fontSize: 26, zIndex: 1 }}>{theme.emoji}</span>
            </div>

            {/* Nome */}
            <p style={{
              margin: 0, fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: T?.text || '#3E3A36',
              textAlign: 'center',
            }}>
              {theme.name}
            </p>

            {/* Check ativo */}
            {isActive && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                width: 22, height: 22, borderRadius: '50%',
                background: T?.accent || '#C48E6B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckIcon style={{ width: 13, height: 13, color: '#fff' }} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { THEMES };