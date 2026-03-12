import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/files', () => ({
  filesApi: {
    list: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
    getDownloadUrl: vi.fn(),
  },
}));

import { useFiles, useUploadFile, useDeleteFile } from './useFiles';

describe('useFiles hooks', () => {
  it('exports all expected hooks', () => {
    expect(typeof useFiles).toBe('function');
    expect(typeof useUploadFile).toBe('function');
    expect(typeof useDeleteFile).toBe('function');
  });
});
