import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
          dim: 'var(--accent-dim)',
          glow: 'var(--accent-glow)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        status: {
          active: 'var(--status-active)',
          review: 'var(--status-review)',
          planning: 'var(--status-planning)',
          done: 'var(--status-done)',
          danger: 'var(--status-danger)',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['Montserrat', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '80px': '5rem',
      },
      width: {
        sidebar: '290px',
      },
      height: {
        topbar: '64px',
      },
      borderRadius: {
        none: '0',
      },
      animation: {
        'fade-in': 'fadeIn 1s ease forwards',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
