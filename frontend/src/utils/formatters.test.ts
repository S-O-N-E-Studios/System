import { describe, expect, it } from 'vitest';
import { formatCurrency, formatRands, formatFileSize, formatDate } from './formatters';

describe('formatCurrency', () => {
  it('formats cents as ZAR without decimals', () => {
    const value = formatCurrency(123456789);
    expect(value.startsWith('R ')).toBe(true);
  });

  it('handles zero correctly', () => {
    expect(formatCurrency(0)).toBe('R 0');
  });
});

describe('formatRands', () => {
  it('formats rands as ZAR without decimals', () => {
    const value = formatRands(1234567);
    expect(value.startsWith('R ')).toBe(true);
  });

  it('handles zero correctly', () => {
    expect(formatRands(0)).toBe('R 0');
  });
});

describe('formatFileSize', () => {
  it('formats bytes into human readable units', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('formatDate', () => {
  it('formats ISO string as DD MMM YYYY', () => {
    expect(formatDate('2026-03-05T00:00:00.000Z')).toMatch(/05 Mar 2026|04 Mar 2026/);
  });
});

