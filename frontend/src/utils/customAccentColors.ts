import { syncAppFavicon } from '@/utils/syncAppFavicon';

export const CUSTOM_ACCENT_PERIWINKLE_KEY = 'p360-accent-periwinkle';
export const CUSTOM_ACCENT_SAND_KEY = 'p360-accent-sand';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    const r = Number.parseInt(normalized[0] + normalized[0], 16);
    const g = Number.parseInt(normalized[1] + normalized[1], 16);
    const b = Number.parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }
  if (normalized.length !== 6) return null;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

function rgbaFromHex(hex: string, alpha: number): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Org accent overrides (Appearance). Primary → terracotta `--accent`; secondary → `--gold`.
 * Keys remain historical names for localStorage compatibility.
 */
export function applyCustomAccentColors(params: { periwinkleHex: string; sandHex: string }) {
  if (typeof document === 'undefined') return;

  const { periwinkleHex: accentHex, sandHex: goldHex } = params;

  const accentLight = rgbaFromHex(accentHex, 0.08) ?? 'rgba(192, 100, 44, 0.08)';
  const accentBorder = rgbaFromHex(accentHex, 0.2) ?? 'rgba(192, 100, 44, 0.2)';
  const accentGlow = rgbaFromHex(accentHex, 0.22) ?? 'rgba(192, 100, 44, 0.22)';
  const selectionBg = rgbaFromHex(accentHex, 0.25) ?? 'rgba(192, 100, 44, 0.25)';
  const goldLight = rgbaFromHex(goldHex, 0.1) ?? 'rgba(184, 144, 64, 0.1)';

  document.documentElement.style.setProperty('--accent', accentHex);
  document.documentElement.style.setProperty('--gold', goldHex);
  document.documentElement.style.setProperty('--accent-light', accentLight);
  document.documentElement.style.setProperty('--accent-border', accentBorder);
  document.documentElement.style.setProperty('--accent-glow', accentGlow);
  document.documentElement.style.setProperty('--selection-bg', selectionBg);
  document.documentElement.style.setProperty('--gold-light', goldLight);
  /* Secondary picker → chart / link-adjacent warm tone (replaces legacy periwinkle slot) */
  document.documentElement.style.setProperty('--accent-periwinkle', goldHex);
  document.documentElement.style.setProperty('--accent-dim', accentHex);

  syncAppFavicon();
}

export function clearCustomAccentCssProperties(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  [
    '--accent',
    '--gold',
    '--accent-light',
    '--accent-border',
    '--accent-glow',
    '--selection-bg',
    '--gold-light',
    '--accent-periwinkle',
    '--accent-dim',
  ].forEach((p) => root.style.removeProperty(p));
}
