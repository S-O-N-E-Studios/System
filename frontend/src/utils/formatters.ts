/** Placeholder for empty values in UI (no em dashes) */
export const EMPTY_PLACEHOLDER = 'N/A';

const ZAR_WHOLE_FORMATTER = new Intl.NumberFormat('en-ZA', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function toFiniteNumber(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

/**
 * Format integer cents as ZAR currency string: R X,XXX,XXX
 */
export function formatCurrency(amountInCents: number): string {
  const rands = toFiniteNumber(amountInCents) / 100;
  return `R ${ZAR_WHOLE_FORMATTER.format(rands)}`;
}

/**
 * Format a raw number (already in rands) as ZAR
 */
export function formatRands(amount: number): string {
  return `R ${ZAR_WHOLE_FORMATTER.format(toFiniteNumber(amount))}`;
}

/**
 * Parse a currency input string like "R 1,500,000" to integer cents
 */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  return Math.round(parseFloat(cleaned) * 100) || 0;
}

/**
 * Format date as DD MMM YYYY (e.g., "05 Mar 2026")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Time-of-day greeting based on current hour
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Generate a slug from an organisation name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * File size formatting (bytes → human-readable)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Percentage formatting
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
