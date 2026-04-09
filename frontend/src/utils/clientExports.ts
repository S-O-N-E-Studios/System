import jsPDF from 'jspdf';

/** Atlas Sahara “print” palette — matches light theme tokens in globals.css (readable on white paper). */
export const EXPORT_BRAND = {
  accent: { r: 192, g: 100, b: 44 },
  gold: { r: 184, g: 144, b: 64 },
  text: { r: 30, g: 20, b: 8 },
  textMuted: { r: 96, g: 72, b: 48 },
  zebra: { r: 253, g: 250, b: 245 },
  border: { r: 229, g: 216, b: 196 },
  white: { r: 255, g: 255, b: 255 },
} as const;

export type ExportColumn<T> = {
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

/** Save a generated blob (e.g. narrative PDF) with the same download behaviour as tabular exports. */
export function downloadExportedFile(blob: Blob, filename: string) {
  downloadBlob(blob, filename);
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

const THIN_BORDER_ARGB = 'FFE5D8C4';
const HEADER_FILL_ARGB = 'FFC0642C';

type ExcelWorksheet = import('exceljs').Worksheet;

function fillBrandedSheet<T extends Record<string, unknown>>(
  sheet: ExcelWorksheet,
  sheetLabel: string,
  columns: ExportColumn<T>[],
  rows: T[],
): void {
  sheet.addRow([`PROJECT 360 — ${sheetLabel}`]);
  const titleRow = sheet.getRow(1);
  titleRow.font = { bold: true, size: 12, color: { argb: HEADER_FILL_ARGB } };
  titleRow.height = 22;
  sheet.mergeCells(1, 1, 1, Math.max(columns.length, 1));

  sheet.addRow(columns.map((c) => c.header));
  const headerRow = sheet.getRow(2);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: HEADER_FILL_ARGB },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: THIN_BORDER_ARGB } },
      left: { style: 'thin', color: { argb: THIN_BORDER_ARGB } },
      bottom: { style: 'thin', color: { argb: THIN_BORDER_ARGB } },
      right: { style: 'thin', color: { argb: THIN_BORDER_ARGB } },
    };
  });

  for (const row of rows) {
    const r = sheet.addRow(columns.map((col) => cellValue(row, col)));
    r.font = { size: 10, color: { argb: 'FF1E1408' } };
    r.alignment = { vertical: 'top', horizontal: 'left' };
    r.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: THIN_BORDER_ARGB } },
        left: { style: 'thin', color: { argb: THIN_BORDER_ARGB } },
        bottom: { style: 'thin', color: { argb: THIN_BORDER_ARGB } },
        right: { style: 'thin', color: { argb: THIN_BORDER_ARGB } },
      };
    });
  }

  const weights = columns.map((c) => Math.max(c.header.length, 10));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  sheet.columns = columns.map((_, i) => ({
    width: Math.min(48, Math.max(12, (weights[i]! / sum) * 80)),
  }));
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
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 2 }],
  });
  fillBrandedSheet(sheet, sheetName, columns, rows);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
}

export async function exportWorkbookXlsx(
  filename: string,
  sheets: {
    sheetName: string;
    columns: ExportColumn<Record<string, unknown>>[];
    rows: Record<string, unknown>[];
  }[],
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  for (const { sheetName, columns, rows } of sheets) {
    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 2 }],
    });
    fillBrandedSheet(sheet, sheetName, columns, rows);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
}

function drawPdfBrandBar(doc: jsPDF, pageW: number, margin: number) {
  const { accent, white } = EXPORT_BRAND;
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(0, 0, pageW, 34, 'F');
  doc.setTextColor(white.r, white.g, white.b);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT 360', margin, 22);
  doc.setFont('helvetica', 'normal');
  const stamp = `Generated ${new Date().toLocaleString()}`;
  const tw = doc.getTextWidth(stamp);
  doc.text(stamp, pageW - margin - tw, 22);
}

function columnWidths(columns: ExportColumn<Record<string, unknown>>[], tableWidth: number): number[] {
  const weights = columns.map((c) => Math.max(c.header.length * 5, 40));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  return weights.map((w) => (w / sum) * tableWidth);
}

function drawTableHeader(
  doc: jsPDF,
  margin: number,
  y: number,
  colWidths: number[],
  headers: string[],
  padding: number,
): number {
  const { accent, white, border } = EXPORT_BRAND;
  const lineH = 11;
  const wrapped = headers.map((h, i) => doc.splitTextToSize(h, colWidths[i]! - 2 * padding));
  const maxLines = Math.max(1, ...wrapped.map((w) => w.length));
  const rowH = maxLines * lineH + padding * 2;
  let x = margin;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  for (let i = 0; i < colWidths.length; i++) {
    doc.setFillColor(accent.r, accent.g, accent.b);
    doc.setDrawColor(border.r, border.g, border.b);
    doc.rect(x, y, colWidths[i]!, rowH, 'FD');
    doc.setTextColor(white.r, white.g, white.b);
    let ty = y + padding + 8;
    for (const line of wrapped[i]!) {
      doc.text(line, x + padding, ty);
      ty += lineH;
    }
    x += colWidths[i]!;
  }
  return rowH;
}

function drawTableRow(
  doc: jsPDF,
  margin: number,
  y: number,
  colWidths: number[],
  texts: string[],
  rowIndex: number,
  padding: number,
  pageH: number,
  bottomMargin: number,
): { rowH: number; y: number; newPage: boolean } {
  const { text, zebra, border } = EXPORT_BRAND;
  const lineH = 10;
  const wrapped = texts.map((t, i) => doc.splitTextToSize(t, colWidths[i]! - 2 * padding));
  const maxLines = Math.max(1, ...wrapped.map((w) => w.length));
  const rowH = maxLines * lineH + padding * 2;

  if (y + rowH > pageH - bottomMargin) {
    return { rowH: 0, y, newPage: true };
  }

  let x = margin;
  if (rowIndex % 2 === 1) {
    doc.setFillColor(zebra.r, zebra.g, zebra.b);
    doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowH, 'F');
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(text.r, text.g, text.b);
  for (let i = 0; i < colWidths.length; i++) {
    doc.setDrawColor(border.r, border.g, border.b);
    doc.rect(x, y, colWidths[i]!, rowH, 'S');
    let ty = y + padding + 8;
    for (const line of wrapped[i]!) {
      doc.text(line, x + padding, ty);
      ty += lineH;
    }
    x += colWidths[i]!;
  }

  return { rowH, y: y + rowH, newPage: false };
}

export function buildTabularPdfBlob<T extends Record<string, unknown>>({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string;
  subtitle?: string;
  columns: ExportColumn<T>[];
  rows: T[];
}): Blob {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const bottomMargin = 36;
  const padding = 5;
  const tableWidth = pageW - 2 * margin;

  drawPdfBrandBar(doc, pageW, margin);

  const { text, textMuted } = EXPORT_BRAND;
  let y = 48;
  doc.setTextColor(text.r, text.g, text.b);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  y += 18;
  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    const subLines = doc.splitTextToSize(subtitle, tableWidth);
    for (const line of subLines) {
      doc.text(line, margin, y);
      y += 11;
    }
    y += 6;
  } else {
    y += 8;
  }

  const colWidths = columnWidths(columns as ExportColumn<Record<string, unknown>>[], tableWidth);
  const headers = columns.map((c) => c.header);

  const paintHeader = () => {
    const hh = drawTableHeader(doc, margin, y, colWidths, headers, padding);
    y += hh;
  };

  paintHeader();

  let dataRowIndex = 0;
  for (const row of rows) {
    const texts = columns.map((col) => String(cellValue(row, col)));

    // Paginate: repeat header on each new page.
    let placed = false;
    while (!placed) {
      const result = drawTableRow(
        doc,
        margin,
        y,
        colWidths,
        texts,
        dataRowIndex,
        padding,
        pageH,
        bottomMargin,
      );
      if (result.newPage) {
        doc.addPage();
        y = margin;
        drawPdfBrandBar(doc, pageW, margin);
        y = 48;
        paintHeader();
        continue;
      }
      y = result.y;
      dataRowIndex++;
      placed = true;
    }
  }

  return doc.output('blob');
}

export function exportPdf<T extends Record<string, unknown>>({
  filename,
  title,
  subtitle,
  columns,
  rows,
}: {
  filename: string;
  title: string;
  subtitle?: string;
  columns: ExportColumn<T>[];
  rows: T[];
}) {
  const blob = buildTabularPdfBlob({ title, subtitle, columns, rows });
  downloadBlob(blob, filename);
}

export interface NarrativePdfSection {
  title: string;
  lines: { label: string; value: string }[];
}

/** Key/section report layout — same brand bar and typography family as tabular exports. */
export function buildNarrativePdfBlob({
  documentTitle,
  sections,
}: {
  documentTitle: string;
  sections: NarrativePdfSection[];
}): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 44;
  const maxW = pageW - 2 * margin;
  const { text, gold, textMuted, border } = EXPORT_BRAND;

  drawPdfBrandBar(doc, pageW, margin);

  let y = 52;
  doc.setTextColor(text.r, text.g, text.b);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(documentTitle, margin, y);
  y += 28;

  for (const section of sections) {
    if (y > pageH - 80) {
      doc.addPage();
      drawPdfBrandBar(doc, pageW, margin);
      y = 52;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(gold.r, gold.g, gold.b);
    const titleLines = doc.splitTextToSize(section.title, maxW);
    for (const line of titleLines) {
      doc.text(line, margin, y);
      y += 14;
    }
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(text.r, text.g, text.b);

    for (const { label, value } of section.lines) {
      const block = `${label}: ${value}`;
      const chunks = doc.splitTextToSize(block, maxW);
      const blockH = chunks.length * 12 + 6;
      if (y + blockH > pageH - 40) {
        doc.addPage();
        drawPdfBrandBar(doc, pageW, margin);
        y = 52;
      }
      doc.setDrawColor(border.r, border.g, border.b);
      doc.setFillColor(EXPORT_BRAND.zebra.r, EXPORT_BRAND.zebra.g, EXPORT_BRAND.zebra.b);
      doc.rect(margin, y - 2, maxW, blockH, 'FD');
      let ly = y + 10;
      doc.setTextColor(text.r, text.g, text.b);
      for (const c of chunks) {
        doc.text(c, margin + 8, ly);
        ly += 12;
      }
      y = ly + 8;
    }
    y += 10;
  }

  doc.setFontSize(7);
  doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
  doc.text('PROJECT 360 · Confidential portfolio export', margin, pageH - 22);

  return doc.output('blob');
}
