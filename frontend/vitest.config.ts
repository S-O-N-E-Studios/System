import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/animations': path.resolve(__dirname, './animations'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 15_000,
    setupFiles: './src/test-setup.ts',
    exclude: ['**/node_modules/**', '**/e2e/**', 'playwright.config.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      exclude: ['src/main.tsx', 'src/router/**', '**/*.d.ts'],
      thresholds: {
        lines: 35,
        functions: 35,
        branches: 25,
        statements: 35,
      },
    },
  },
});

