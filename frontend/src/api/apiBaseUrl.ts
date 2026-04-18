/**
 * Backend mounts all routes under `/api/v1`. Accepts either form in env:
 * - `http://localhost:5000/api` → normalized to `.../api/v1`
 * - `http://localhost:5000/api/v1` → unchanged
 * Empty / missing → `/api/v1` (works with Vite dev proxy to port 5000)
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  const trimmed = typeof raw === 'string' ? raw.trim().replace(/\/+$/, '') : '';
  if (!trimmed) return '/api/v1';
  if (/\/v1$/i.test(trimmed)) return trimmed;
  if (/\/api$/i.test(trimmed)) return `${trimmed}/v1`;
  return trimmed;
}
