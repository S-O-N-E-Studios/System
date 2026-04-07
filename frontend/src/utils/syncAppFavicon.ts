/**
 * Sets the tab favicon to the same 32×32 IQ mark as the sidebar, using live
 * computed --bg-surface and --accent-sand (theme + org accent overrides).
 */
export function syncAppFavicon(): void {
  if (typeof document === 'undefined') return;

  const cs = getComputedStyle(document.documentElement);
  const surface = (cs.getPropertyValue('--bg-surface').trim() || '#ffffff').replace(/"/g, "'");
  const accent = (cs.getPropertyValue('--accent').trim() || '#c0642c').replace(/"/g, "'");

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
    `<rect width="32" height="32" fill="${surface}"/>`,
    `<rect x="0.5" y="0.5" width="31" height="31" fill="none" stroke="${accent}" stroke-width="1"/>`,
    `<text x="16" y="16" dominant-baseline="central" text-anchor="middle" `,
    `font-family="'DM Serif Display', Georgia, serif" font-size="14" font-weight="600" `,
    `fill="${accent}">IQ</text>`,
    '</svg>',
  ].join('');

  const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const link =
    (document.getElementById('app-favicon') as HTMLLinkElement | null) ??
    document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link) link.href = href;
}
