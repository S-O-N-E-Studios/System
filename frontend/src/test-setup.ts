import '@testing-library/jest-dom';

// Polyfill ResizeObserver for components that rely on it (e.g. Recharts ResponsiveContainer)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', { value: ResizeObserver, writable: true });

