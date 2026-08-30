/**
 * Rate limit secundario en memoria.
 *
 * Funciona como red de seguridad si el rate limit principal (Netlify Blobs)
 * falla o se omite. Ventana corta (1 minuto) para absorber picos de abuso
 * sin afectar el rate limit diario de 3/IP.
 *
 * Limitaciones:
 * - Es por instancia del proceso. En Netlify con funciones serverless cada
 *   invocación puede ser una instancia distinta, así que en producción
 *   este límite se vuelve soft. Sigue siendo útil para dev y como
 *   mitigación local contra loops accidentales.
 * - El Map puede crecer si hay muchas IPs distintas. Se poda al
 *   insertar (descartamos entries viejas en la misma IP).
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface InMemoryRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export function checkInMemoryRateLimit(ip: string): InMemoryRateLimitResult {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(ip, bucket);
  }

  // Podar timestamps viejos (más allá de la ventana).
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = bucket.timestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, oldest + WINDOW_MS - now),
    };
  }

  bucket.timestamps.push(now);
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - bucket.timestamps.length,
    resetInMs: WINDOW_MS,
  };
}

/**
 * Helper para tests: limpia el estado entre tests.
 */
export function _resetInMemoryRateLimit(): void {
  buckets.clear();
}
