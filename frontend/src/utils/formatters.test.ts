import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  formatCurrency,
  formatRands,
  formatFileSize,
  formatDate,
  parseCurrencyInput,
  generateSlug,
  truncate,
  formatPercent,
  getGreeting,
  EMPTY_PLACEHOLDER,
} from './formatters';

describe('EMPTY_PLACEHOLDER', () => {
  it('is N/A for empty values in UI', () => {
    expect(EMPTY_PLACEHOLDER).toBe('N/A');
  });
});

describe('formatCurrency', () => {
  it('formats cents as ZAR without decimals', () => {
    expect(formatCurrency(123456789)).toMatch(/^R /);
  });

  it('handles zero correctly', () => {
    expect(formatCurrency(0)).toBe('R 0');
  });

  it('formats small amounts', () => {
    const result = formatCurrency(100);
    expect(result).toMatch(/R\s+1$/);
  });

  it('formats negative values', () => {
    const result = formatCurrency(-50000);
    expect(result).toMatch(/R\s+-500$/);
  });
});

describe('formatRands', () => {
  it('formats rands as ZAR without decimals', () => {
    expect(formatRands(1234567)).toMatch(/^R /);
  });

  it('handles zero correctly', () => {
    expect(formatRands(0)).toBe('R 0');
  });

  it('formats large numbers with grouping', () => {
    const result = formatRands(1_500_000);
    expect(result).toContain('R');
    expect(result).toContain('500');
  });
});

describe('parseCurrencyInput', () => {
  it('parses a clean number string', () => {
    expect(parseCurrencyInput('1500')).toBe(150000);
  });

  it('strips currency symbol and spaces', () => {
    expect(parseCurrencyInput('R 1,500,000')).toBe(150000000);
  });

  it('handles decimal values', () => {
    expect(parseCurrencyInput('250.50')).toBe(25050);
  });

  it('returns 0 for non-numeric input', () => {
    expect(parseCurrencyInput('abc')).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(parseCurrencyInput('')).toBe(0);
  });
});

describe('formatDate', () => {
  it('formats ISO string as DD MMM YYYY', () => {
    expect(formatDate('2026-03-05T00:00:00.000Z')).toMatch(/05 Mar 2026|04 Mar 2026/);
  });

  it('formats another date correctly', () => {
    expect(formatDate('2026-01-15T12:00:00.000Z')).toMatch(/15 Jan 2026/);
  });
});

describe('getGreeting', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "Good morning" before noon', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(8);
    expect(getGreeting()).toBe('Good morning');
  });

  it('returns "Good afternoon" between noon and 6pm', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(14);
    expect(getGreeting()).toBe('Good afternoon');
  });

  it('returns "Good evening" after 6pm', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(20);
    expect(getGreeting()).toBe('Good evening');
  });

  it('returns "Good morning" at exactly midnight', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(0);
    expect(getGreeting()).toBe('Good morning');
  });

  it('returns "Good afternoon" at exactly noon', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(12);
    expect(getGreeting()).toBe('Good afternoon');
  });

  it('returns "Good evening" at exactly 6pm', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
    expect(getGreeting()).toBe('Good evening');
  });
});

describe('generateSlug', () => {
  it('converts to lowercase and replaces spaces with hyphens', () => {
    expect(generateSlug('My Company')).toBe('my-company');
  });

  it('removes special characters', () => {
    expect(generateSlug('Test & Co.')).toBe('test-co');
  });

  it('collapses multiple hyphens', () => {
    expect(generateSlug('a   b   c')).toBe('a-b-c');
  });

  it('trims whitespace', () => {
    expect(generateSlug('  hello world  ')).toBe('hello-world');
  });

  it('truncates to 30 characters', () => {
    const long = 'a very long organisation name that exceeds thirty characters';
    expect(generateSlug(long).length).toBeLessThanOrEqual(30);
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('preserves numbers', () => {
    expect(generateSlug('Project 123')).toBe('project-123');
  });
});

describe('truncate', () => {
  it('returns full text when shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns full text when exactly at max', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates and adds ellipsis when over max', () => {
    expect(truncate('hello world', 5)).toBe('hello…');
  });

  it('trims trailing whitespace before ellipsis', () => {
    expect(truncate('hello world again', 6)).toBe('hello…');
  });

  it('handles single character max', () => {
    expect(truncate('abc', 1)).toBe('a…');
  });
});

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2.0 GB');
  });
});

describe('formatPercent', () => {
  it('formats integer values', () => {
    expect(formatPercent(75)).toBe('75%');
  });

  it('rounds decimal values', () => {
    expect(formatPercent(33.7)).toBe('34%');
  });

  it('handles zero', () => {
    expect(formatPercent(0)).toBe('0%');
  });

  it('handles 100', () => {
    expect(formatPercent(100)).toBe('100%');
  });

  it('rounds down when below .5', () => {
    expect(formatPercent(49.2)).toBe('49%');
  });
});
