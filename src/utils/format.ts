/**
 * Utilidades de formateo — CambioCuba
 * Funciones puras para formatear valores en la UI.
 */

// ─── MONEDAS ──────────────────────────────────────────────────────────────────

/**
 * Formatea una cantidad de USDT con símbolo.
 * Ejemplo: 12.5 → "₮ 12.50"
 */
export function formatUSDT(amount: number): string {
  return `₮ ${amount.toLocaleString('es-CU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formatea una cantidad de CUP con símbolo.
 * Ejemplo: 3250 → "$ 3,250"
 */
export function formatCUP(amount: number): string {
  return `$ ${amount.toLocaleString('es-CU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Formatea la tasa de cambio.
 * Ejemplo: 260 → "260 CUP / USDT"
 */
export function formatRate(rate: number): string {
  return `${rate.toLocaleString('es-CU')} CUP / USDT`;
}

/**
 * Calcula y formatea el total en CUP de una operación.
 * Ejemplo: (10 USDT, tasa 260) → "$ 2,600"
 */
export function calculateCUP(amountUsdt: number, rate: number): string {
  return formatCUP(amountUsdt * rate);
}

// ─── FECHAS ───────────────────────────────────────────────────────────────────

/**
 * Formatea una fecha ISO a formato legible en español.
 * Ejemplo: "2024-01-15T10:30:00Z" → "15 ene 2024, 10:30"
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-CU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea una fecha en tiempo relativo.
 * Ejemplo: "hace 5 minutos", "hace 2 horas"
 */
export function formatRelativeTime(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'ahora mismo';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHour < 24) return `hace ${diffHour} h`;
  if (diffDay < 7) return `hace ${diffDay} días`;
  return formatDate(isoDate);
}

/**
 * Formatea un timer de cuenta regresiva en MM:SS.
 * Ejemplo: 125 segundos → "02:05"
 */
export function formatCountdown(secondsRemaining: number): string {
  const minutes = Math.floor(Math.max(0, secondsRemaining) / 60);
  const seconds = Math.max(0, secondsRemaining) % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ─── REPUTACIÓN ───────────────────────────────────────────────────────────────

/**
 * Calcula el porcentaje de éxito de un usuario.
 * Retorna 0 si no tiene trades aún.
 */
export function calculateSuccessRate(
  successfulTrades: number,
  totalTrades: number
): number {
  if (totalTrades === 0) return 0;
  return Math.round((successfulTrades / totalTrades) * 100);
}

/**
 * Formatea la reputación como string legible.
 * Ejemplo: "94% (47 trades)"
 */
export function formatReputation(
  successfulTrades: number,
  totalTrades: number
): string {
  if (totalTrades === 0) return 'Sin operaciones';
  const rate = calculateSuccessRate(successfulTrades, totalTrades);
  return `${rate}% (${totalTrades} ops)`;
}

// ─── TEXTO ────────────────────────────────────────────────────────────────────

/**
 * Trunca un texto largo con puntos suspensivos.
 * Ejemplo: ("Hola mundo cruel", 10) → "Hola mundo..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Obtiene las iniciales de un nombre completo.
 * Ejemplo: "Carlos Rodríguez" → "CR"
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}
