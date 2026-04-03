import * as XLSX from 'xlsx';
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

export function exportXlsx<T extends Record<string, unknown>>({
  filename,
  sheetName = 'Export',
  columns,
  rows,
}: {
  filename: string;
  sheetName?: string;
  columns: ExportColumn<T>[];
  rows: T[];
}) {
  const formatted = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const col of columns) {
      out[col.header] = col.formatter ? col.formatter(row[col.key], row) : (row[col.key] as unknown);
    }
    return out;
  });

  const ws = XLSX.utils.json_to_sheet(formatted);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, ws, sheetName);

  const arrayBuffer = XLSX.write(book, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([arrayBuffer], {
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

