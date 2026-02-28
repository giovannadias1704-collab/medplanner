// components/ThemeSelector.jsx
// Integrado com ThemeContext do PageLayout — aplica paletas pastéis em tempo real
import { CheckIcon } from '@heroicons/react/24/outline';
import { useTheme, THEME_PALETTES } from './PageLayout';

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
  const { themeId, setThemeId, T } = useTheme();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
      gap: 12,
    }}>
      {THEMES.map((theme) => {
        const palette  = THEME_PALETTES[theme.id];
        const isActive = themeId === theme.id;

        return (
          <button
            key={theme.id}
            onClick={() => setThemeId(theme.id)}
            style={{
              position: 'relative',
              padding: 14,
              borderRadius: 16,
              border: `2px solid ${isActive ? T.accent : T.border}`,
              background: T.card,
              cursor: 'pointer',
              transition: 'all 150ms ease',
              transform: isActive ? 'scale(1.04)' : 'scale(1)',
              boxShadow: isActive ? T.shadowMd : T.shadow,
              fontFamily: "'Poppins',sans-serif",
            }}
          >
            {/* Preview — fundo do tema selecionado */}
            <div style={{
              width: '100%',
              height: 64,
              borderRadius: 10,
              marginBottom: 10,
              background: palette.bg,
              border: `1px solid ${palette.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Barra lateral mini */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: 22, background: palette.card,
                borderRight: `1px solid ${palette.border}`,
              }} />
              {/* Accent stripe */}
              <div style={{
                position: 'absolute', left: 4, top: '30%', bottom: '30%',
                width: 3, borderRadius: 2,
                background: palette.accent,
              }} />
              <span style={{ fontSize: 26, zIndex: 1 }}>{theme.emoji}</span>
            </div>

            {/* Nome */}
            <p style={{
              margin: 0,
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: T.text,
              textAlign: 'center',
            }}>
              {theme.name}
            </p>

            {/* Check */}
            {isActive && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                width: 22, height: 22, borderRadius: '50%',
                background: T.accent,
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