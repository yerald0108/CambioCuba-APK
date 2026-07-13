/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4: apunta a todos los archivos de la app
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // ─── Paleta de colores "Vault Dark" ───────────────────────────────────
      colors: {
        // Fondos
        background: '#0A0E1A',      // Fondo principal — azul noche profundo
        surface: '#111827',         // Cards y paneles
        'surface-raised': '#1C2536', // Inputs y elementos elevados

        // Acento dorado — valor, dinero, confianza
        accent: {
          DEFAULT: '#F59E0B',       // Dorado principal — CTAs, activo
          soft: '#FDE68A',          // Dorado suave — textos de acento
          muted: '#92400E',         // Dorado apagado — fondos de badge
        },

        // Estados semánticos
        success: {
          DEFAULT: '#10B981',       // Verde — completado, verificado
          muted: '#064E3B',         // Verde oscuro — fondo de badge
        },
        danger: {
          DEFAULT: '#EF4444',       // Rojo — error, disputa, cancelación
          muted: '#7F1D1D',         // Rojo oscuro — fondo de badge
        },
        warning: {
          DEFAULT: '#F59E0B',       // Amarillo — pendiente, timer bajo
          muted: '#78350F',         // Amarillo oscuro — fondo de badge
        },
        info: {
          DEFAULT: '#3B82F6',       // Azul — informativo, sistema
          muted: '#1E3A5F',         // Azul oscuro — fondo de badge
        },

        // Tipografía
        'text-primary': '#F9FAFB',   // Blanco cálido — texto principal
        'text-secondary': '#9CA3AF', // Gris — texto secundario
        'text-muted': '#4B5563',     // Gris oscuro — texto deshabilitado

        // Bordes
        border: '#1F2D45',           // Borde sutil
        'border-strong': '#374151',  // Borde visible
      },

      // ─── Espaciado extra ──────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },

      // ─── Tipografía ───────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'System'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },

      // ─── Border radius ────────────────────────────────────────────────────
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
