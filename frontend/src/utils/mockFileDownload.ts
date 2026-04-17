/**
 * Client-side placeholder file for mock rows (no backend blob). Revokes the object URL after download.
 */
export function downloadMockPlaceholderFile(meta: { name: string; mimeType: string }) {
  const header = `EVIDENTIARY — mock placeholder download\r\nOriginal: ${meta.name}\r\nMIME: ${meta.mimeType}\r\n\r\nReplace with signed URL / API blob when backend is available.\r\n`;
  const blob = new Blob([header], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const base = meta.name.replace(/\.[^.]+$/, '') || 'document';
  const a = document.createElement('a');
  a.href = url;
  a.download = `${base}-mock-placeholder.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
