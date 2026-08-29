import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock de @netlify/blobs: store en memoria con soporte JSON.
const store = new Map<string, unknown>();

vi.mock('@netlify/blobs', () => ({
  getStore: () => ({
    get: async (key: string, opts?: { type?: string }) => {
      const val = store.get(key);
      if (val === undefined) return null;
      if (opts?.type === 'json') return val;
      return typeof val === 'string' ? val : JSON.stringify(val);
    },
    set: async (key: string, value: string) => {
      store.set(key, value);
    },
    setJSON: async (key: string, value: unknown) => {
      store.set(key, value);
    },
  }),
}));

import { checkRateLimit, buildRateLimitKey, getRetryAfterHeader } from './rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    store.clear();
    // Fijar fecha a 2026-08-29 10:00:00 UTC para tests determinísticos.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('permite la primera request (remaining = 2)', async () => {
    const result = await checkRateLimit('1.2.3.4');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('permite la segunda request (remaining = 1)', async () => {
    await checkRateLimit('1.2.3.4');
    const result = await checkRateLimit('1.2.3.4');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('permite la tercera request (remaining = 0)', async () => {
    await checkRateLimit('1.2.3.4');
    await checkRateLimit('1.2.3.4');
    const result = await checkRateLimit('1.2.3.4');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('bloquea la cuarta request', async () => {
    await checkRateLimit('1.2.3.4');
    await checkRateLimit('1.2.3.4');
    await checkRateLimit('1.2.3.4');
    const result = await checkRateLimit('1.2.3.4');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('las IPs están aisladas', async () => {
    await checkRateLimit('1.2.3.4');
    await checkRateLimit('1.2.3.4');
    await checkRateLimit('1.2.3.4');
    // IP diferente, no afectada por el límite de 1.2.3.4
    const result = await checkRateLimit('5.6.7.8');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('resetea al cambiar de día (UTC)', async () => {
    // Agotar límite hoy.
    await checkRateLimit('1.2.3.4');
    await checkRateLimit('1.2.3.4');
    await checkRateLimit('1.2.3.4');
    const blocked = await checkRateLimit('1.2.3.4');
    expect(blocked.allowed).toBe(false);

    // Avanzar al día siguiente.
    vi.setSystemTime(new Date('2026-08-30T00:00:01Z'));
    const result = await checkRateLimit('1.2.3.4');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('buildRateLimitKey incluye IP y fecha UTC', () => {
    const key = buildRateLimitKey('10.0.0.1');
    expect(key).toBe('rl:10.0.0.1:2026-08-29');
  });

  it('getRetryAfterHeader devuelve segundos hasta medianoche UTC', () => {
    // Estamos a las 10:00:00 UTC, faltan 14 horas = 50400 segundos.
    const seconds = parseInt(getRetryAfterHeader(), 10);
    expect(seconds).toBeGreaterThan(50000);
    expect(seconds).toBeLessThanOrEqual(50400);
  });

  it('resetAt es el próximo medianoche UTC', async () => {
    const result = await checkRateLimit('1.2.3.4');
    expect(result.resetAt.getUTCHours()).toBe(0);
    expect(result.resetAt.getUTCMinutes()).toBe(0);
    expect(result.resetAt.getUTCDate()).toBe(30); // día siguiente
  });
});
