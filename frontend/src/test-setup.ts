import '@testing-library/jest-dom';

// Polyfill ResizeObserver for components that rely on it (e.g. Recharts ResponsiveContainer)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserver,
  writable: true,
});

// Polyfill canvas getContext for libraries like lottie-web that expect a 2D context.
// JSDOM doesn't implement HTMLCanvasElement.prototype.getContext, so we provide a minimal stub.
const canvasContextStub: Partial<CanvasRenderingContext2D> = {
  fillStyle: null,
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: [] } as ImageData),
  putImageData: () => {},
  createLinearGradient: () => ({
    addColorStop: () => {},
  }) as unknown as CanvasGradient,
  drawImage: () => {},
  save: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  arc: () => {},
  fill: () => {},
  measureText: () => ({ width: 0 } as TextMetrics),
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => canvasContextStub,
  writable: true,
});

