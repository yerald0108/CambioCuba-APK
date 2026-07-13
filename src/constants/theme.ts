/**
 * CambioCuba — Sistema de Diseño Global "Vault Dark"
 *
 * ARCHIVO SAGRADO: Este es la única fuente de verdad para todos los tokens
 * de diseño. Nunca uses valores hardcoded de color, tipografía o espaciado
 * en los componentes. Siempre importa desde aquí.
 *
 * Los valores de color están sincronizados con tailwind.config.js.
 * Si cambias un color aquí, cámbialo también en tailwind.config.js.
 */

// ─── COLORES ──────────────────────────────────────────────────────────────────

export const Colors = {
  // Fondos
  background: '#0A0E1A',       // Fondo principal — azul noche profundo
  surface: '#111827',          // Cards y paneles
  surfaceRaised: '#1C2536',    // Inputs y elementos elevados

  // Acento dorado — evoca valor, dinero y confianza
  accent: '#F59E0B',           // Dorado principal — CTAs, estados activos
  accentSoft: '#FDE68A',       // Dorado suave — textos de acento
  accentMuted: '#92400E',      // Dorado apagado — fondos de badge

  // Estados semánticos
  success: '#10B981',          // Verde — orden completada, KYC aprobado
  successMuted: '#064E3B',     // Verde oscuro — fondo de badge
  danger: '#EF4444',           // Rojo — error, disputa, cancelación
  dangerMuted: '#7F1D1D',      // Rojo oscuro — fondo de badge
  warning: '#F59E0B',          // Amarillo — pendiente, timer crítico
  warningMuted: '#78350F',     // Amarillo oscuro — fondo de badge
  info: '#3B82F6',             // Azul — mensajes del sistema, informativo
  infoMuted: '#1E3A5F',        // Azul oscuro — fondo de badge

  // Tipografía
  textPrimary: '#F9FAFB',      // Blanco cálido — texto principal
  textSecondary: '#9CA3AF',    // Gris medio — texto secundario
  textMuted: '#4B5563',        // Gris oscuro — texto deshabilitado

  // Bordes
  border: '#1F2D45',           // Borde sutil — separadores
  borderStrong: '#374151',     // Borde visible — inputs, cards activas

  // Especiales
  overlay: 'rgba(0, 0, 0, 0.6)',       // Fondo de modales
  transparent: 'transparent',
} as const;

// ─── TIPOGRAFÍA ───────────────────────────────────────────────────────────────

export const Typography = {
  // Familias
  fontFamily: {
    sans: 'Inter',
    mono: 'monospace',
  },

  // Tamaños de fuente
  fontSize: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Pesos
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Interlineado
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ─── ESPACIADO ────────────────────────────────────────────────────────────────

export const Spacing = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
  // Específicos de la app
  screenPadding: 16,       // Padding lateral de todas las pantallas
  cardPadding: 16,         // Padding interno de cards
  sectionGap: 24,          // Espacio entre secciones
  tabBarHeight: 64,        // Altura de la tab bar
} as const;

// ─── BORDES ───────────────────────────────────────────────────────────────────

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// ─── SOMBRAS ──────────────────────────────────────────────────────────────────

export const Shadows = {
  // Sombra sutil para cards
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  // Sombra media para modales
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  // Sombra del acento dorado — para botones principales
  accentGlow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── ANIMACIONES ──────────────────────────────────────────────────────────────

export const Animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    // Valores estándar de Reanimated
    easeOut: 'easeOut',
    easeInOut: 'easeInOut',
    spring: { damping: 15, stiffness: 150 },
  },
} as const;

// ─── CLASES TAILWIND REUTILIZABLES ────────────────────────────────────────────
// Strings de clases NativeWind para patrones frecuentes.
// Úsalos directamente en className para consistencia.

export const TW = {
  // Fondos
  screenBg: 'flex-1 bg-background',
  card: 'bg-surface rounded-xl border border-border',
  cardRaised: 'bg-surface-raised rounded-xl border border-border',

  // Textos
  textPrimary: 'text-text-primary',
  textSecondary: 'text-text-secondary',
  textMuted: 'text-text-muted',
  textAccent: 'text-accent',

  // Botón primario
  btnPrimary: 'bg-accent rounded-xl py-4 items-center justify-center',
  btnPrimaryText: 'text-background font-semibold text-base',

  // Botón secundario
  btnSecondary: 'bg-surface-raised rounded-xl py-4 items-center justify-center border border-border-strong',
  btnSecondaryText: 'text-text-primary font-semibold text-base',

  // Botón peligro
  btnDanger: 'bg-danger-muted rounded-xl py-4 items-center justify-center border border-danger',
  btnDangerText: 'text-danger font-semibold text-base',

  // Input
  input: 'bg-surface-raised border border-border rounded-xl px-4 py-3 text-text-primary text-base',
  inputFocused: 'border-accent',
  inputError: 'border-danger',
  label: 'text-text-secondary text-sm font-medium mb-2',

  // Separador
  divider: 'h-px bg-border',

  // Row centrado
  row: 'flex-row items-center',
  rowBetween: 'flex-row items-center justify-between',

  // Padding de pantalla
  screen: 'flex-1 bg-background px-4',
} as const;

// ─── CONSTANTES DE NEGOCIO ────────────────────────────────────────────────────
// Aquí van las constantes de reglas de negocio para tener todo centralizado.

export const BusinessRules = {
  // Tiempo límite de una orden en minutos
  orderTimeoutMinutes: 20,

  // Métodos de pago soportados
  paymentMethods: [
    { id: 'transfermovil', label: 'Transfermóvil' },
    { id: 'enzona', label: 'EnZona' },
    { id: 'mitransfer', label: 'MiTransfer' },
  ] as const,

  // Monedas soportadas
  currencies: [
    { id: 'CUP', label: 'Peso Cubano', symbol: '$' },
    { id: 'USDT', label: 'USDT', symbol: '₮' },
  ] as const,

  // Tipos de oferta
  offerTypes: [
    { id: 'buy', label: 'Compra' },   // Trapichero quiere comprar USDT
    { id: 'sell', label: 'Venta' },   // Trapichero quiere vender USDT
  ] as const,
} as const;

// ─── TIPOS DERIVADOS ──────────────────────────────────────────────────────────

export type PaymentMethodId = typeof BusinessRules.paymentMethods[number]['id'];
export type CurrencyId = typeof BusinessRules.currencies[number]['id'];
export type OfferTypeId = typeof BusinessRules.offerTypes[number]['id'];
