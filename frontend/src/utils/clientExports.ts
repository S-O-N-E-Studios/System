import jsPDF from 'jspdf';

type ExportColumn<T> = {
  key: keyof T & string;
  header: string;
  formatter?: (value: unknown, row: T) => string | number | boolean | null | undefined;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function cellValue<T extends Record<string, unknown>>(
  row: T,
  col: ExportColumn<T>,
): string | number | boolean {
  const raw = col.formatter ? col.formatter(row[col.key], row) : row[col.key];
  if (raw == null) return '';
  if (typeof raw === 'number' || typeof raw === 'boolean') return raw;
  return String(raw);
}

export async function exportXlsx<T extends Record<string, unknown>>({
  filename,
  sheetName = 'Export',
  columns,
  rows,
}: {
  filename: string;
  sheetName?: string;
  columns: ExportColumn<T>[];
  rows: T[];
}): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.addRow(columns.map((c) => c.header));

  for (const row of rows) {
    sheet.addRow(columns.map((col) => cellValue(row, col)));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
}

export function exportPdf<T extends Record<string, unknown>>({
  filename,
  title,
  columns,
  rows,
}: {
  filename: string;
  title?: string;
  columns: ExportColumn<T>[];
  rows: T[];
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const margin = 40;
  let y = 48;

  if (title) {
    doc.setFontSize(16);
    doc.text(title, margin, y);
    y += 18;
  }

  doc.setFontSize(10);

  const header = columns.map((c) => c.header).join(' | ');
  doc.setFont('helvetica', 'bold');
  doc.text(header, margin, y);
  y += 14;
  doc.setDrawColor(140);
  doc.line(margin, y, 800, y);
  y += 10;

  for (const row of rows) {
    const line = columns
      .map((col) => {
        const v = col.formatter ? col.formatter(row[col.key], row) : row[col.key];
        return v == null ? '' : String(v);
      })
      .join(' | ');

    const wrapped = doc.splitTextToSize(line, 800);
    for (const chunk of wrapped) {
      if (y > 560) {
        doc.addPage();
        y = 48;
      }
      doc.text(chunk, margin, y);
      y += 12;
    }
  }

  const blob = doc.output('blob');
  downloadBlob(blob, filename);
}
