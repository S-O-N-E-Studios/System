import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const makeMockCell = () => ({
  border: {},
  font: {},
  fill: {},
  alignment: {},
});

const makeMockRow = () => ({
  font: {},
  fill: {},
  alignment: {},
  height: undefined,
  border: {},
  eachCell: vi.fn((cb: (cell: ReturnType<typeof makeMockCell>, col: number) => void) => {
    cb(makeMockCell(), 1);
  }),
});

vi.mock('exceljs', () => ({
  default: {
    Workbook: class MockWorkbook {
      addWorksheet() {
        return {
          mergeCells: vi.fn(),
          addRow: vi.fn(() => makeMockRow()),
          getRow: vi.fn(() => makeMockRow()),
          columns: [] as unknown[],
        };
      }

      xlsx = {
        writeBuffer: vi.fn(async () => new Uint8Array([80, 75, 3, 4]).buffer),
      };
    },
  },
}));

import { exportPdf, exportXlsx, exportWorkbookXlsx } from './clientExports';

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

  it('exportWorkbookXlsx triggers a download', async () => {
    await exportWorkbookXlsx('book.xlsx', [
      {
        sheetName: 'A',
        columns: [{ key: 'x', header: 'X' }],
        rows: [{ x: 1 }],
      },
      {
        sheetName: 'B',
        columns: [{ key: 'y', header: 'Y' }],
        rows: [{ y: 2 }],
      },
    ]);

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    vi.runOnlyPendingTimers();
  });
});
