import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('exceljs', () => ({
  default: {
    Workbook: class MockWorkbook {
      addWorksheet() {
        return { addRow: vi.fn() };
      }

      xlsx = {
        writeBuffer: vi.fn(async () => new Uint8Array([80, 75, 3, 4]).buffer),
      };
    },
  },
}));

import { exportPdf, exportXlsx } from './clientExports';

describe('clientExports', () => {
  const filenameXlsx = 'test.xlsx';
  const filenamePdf = 'test.pdf';

  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    clickSpy = vi.fn();

    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        return {
          href: '',
          download: '',
          click: clickSpy,
        } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it('exportXlsx triggers a download', async () => {
    await exportXlsx({
      filename: filenameXlsx,
      sheetName: 'Export',
      columns: [{ key: 'name', header: 'Name' }],
      rows: [{ name: 'Alpha', id: 1 }],
    });

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    vi.runOnlyPendingTimers();
  });

  it('exportPdf triggers a download', () => {
    exportPdf({
      filename: filenamePdf,
      title: 'Test Export',
      columns: [{ key: 'name', header: 'Name' }],
      rows: [{ name: 'Alpha', id: 1 }],
    });

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    vi.runOnlyPendingTimers();
  });
});

