/**
 * Rate limit por IP usando Netlify Blobs.
 *
 * Política: 3 requests por día por IP (ventana UTC).
 * Key: `rl:${ip}:${yyyy-mm-dd}` (date en UTC).
 * Value: JSON `{ count: number }`.
 *
 * Si el contador >= 3 → `allowed = false`, `resetAt` = próximo `00:00:00 UTC`.
 * Si el contador < 3 → incrementar, `remaining = 3 - nuevo contador`.
 *
 * En producción, Netlify Blobs se inicializa automáticamente desde el
 * entorno (NETLIFY_BLOBS_CONTEXT). En tests, se inyecta un store mock.
 *
 * Referencia: patrón de michi-cards (transfer-limits.ts) que ya usa
 * `getStore` + `store.setJSON` / `store.get(key, { type: "json" })`.
 */

import { getStore } from '@netlify/blobs';

const MAX_REQUESTS_PER_DAY = 3;
const STORE_NAME = 'rate-limits';

interface RateLimitEntry {
  count: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Calcula el próximo `00:00:00 UTC` a partir de ahora.
 */
function getNextMidnightUTC(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next;
}

/**
 * Calcula los segundos desde ahora hasta el próximo medianoche UTC.
 */
function getSecondsUntilReset(): number {
  const now = Date.now();
  const resetAt = getNextMidnightUTC().getTime();
  return Math.ceil((resetAt - now) / 1000);
}

/**
 * Genera la key del rate limit para una IP y fecha UTC.
 * La fecha va en la key (no en el value) para que las keys viejas
 * expiren naturalmente sin necesidad de limpieza manual.
 */
export function buildRateLimitKey(ip: string): string {
  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  return `rl:${ip}:${today}`;
}

/**
 * Verifica y actualiza el rate limit para una IP.
 *
 * @param ip - IP del cliente (de `x-nf-client-connection-ip` o `context.ip`).
 * @returns `{ allowed, remaining, resetAt }`.
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const store = getStore(STORE_NAME);
  const key = buildRateLimitKey(ip);
  const resetAt = getNextMidnightUTC();

  const raw = (await store.get(key, { type: 'json' })) as RateLimitEntry | null;
  const count = raw?.count ?? 0;

  if (count >= MAX_REQUESTS_PER_DAY) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Incrementar el contador.
  await store.setJSON(key, { count: count + 1 });

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_DAY - (count + 1),
    resetAt,
  };
}

/**
 * Helper para construir el header `Retry-After` en segundos.
 */
export function getRetryAfterHeader(): string {
  return String(getSecondsUntilReset());
}
