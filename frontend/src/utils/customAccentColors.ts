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

export function applyCustomAccentColors(params: { periwinkleHex: string; sandHex: string }) {
  if (typeof document === 'undefined') return;

  const { periwinkleHex, sandHex } = params;
  const periwinkleGlow = rgbaFromHex(periwinkleHex, 0.22) ?? `rgba(0,0,0,0.22)`;
  const periwinkleLight = rgbaFromHex(periwinkleHex, 0.12) ?? `rgba(0,0,0,0.12)`;
  const periwinkleSelection = rgbaFromHex(periwinkleHex, 0.3) ?? `rgba(0,0,0,0.3)`;
  const sandGlow = rgbaFromHex(sandHex, 0.09) ?? `rgba(0,0,0,0.09)`;

  document.documentElement.style.setProperty('--accent-periwinkle', periwinkleHex);
  document.documentElement.style.setProperty('--accent-sand', sandHex);
  document.documentElement.style.setProperty('--accent-glow', periwinkleGlow);
  document.documentElement.style.setProperty('--accent-light', periwinkleLight);
  document.documentElement.style.setProperty('--accent-dim', periwinkleHex);
  document.documentElement.style.setProperty('--selection-bg', periwinkleSelection);
  document.documentElement.style.setProperty('--accent-sand-glow', sandGlow);
}

