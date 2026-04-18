type LatLng = { lat: number; lng: number };

const STORAGE_KEY = 'p360_geocode_cache_v1';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

type CacheEntry = {
  lat: number;
  lng: number;
  savedAt: number;
};

function loadCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, CacheEntry>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota / private mode issues
  }
}

function normalizeKey(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function geocodeAddressCached(
  address: string,
  opts?: { ttlMs?: number; signal?: AbortSignal },
): Promise<LatLng | null> {
  const q = address.trim();
  if (!q) return null;

  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const key = normalizeKey(q);
  const now = Date.now();

  const cache = loadCache();
  const existing = cache[key];
  if (existing && now - existing.savedAt < ttlMs) {
    return { lat: existing.lat, lng: existing.lng };
  }

  // Nominatim (OpenStreetMap) geocoding. No API key required.
  // Note: keep the query narrow for reliability (address should include city/province).
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal: opts?.signal,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  const first = Array.isArray(data) ? data[0] : null;
  const lat = first?.lat != null ? Number(first.lat) : NaN;
  const lng = first?.lon != null ? Number(first.lon) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  cache[key] = { lat, lng, savedAt: now };
  saveCache(cache);
  return { lat, lng };
}

