import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetInMemoryRateLimit, checkInMemoryRateLimit } from './in-memory-rate-limit';

describe('checkInMemoryRateLimit', () => {
  beforeEach(() => {
    _resetInMemoryRateLimit();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('permite la primera request (remaining = 9)', () => {
    const result = checkInMemoryRateLimit('1.2.3.4');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('bloquea la 11va request dentro de 1 minuto', () => {
    for (let i = 0; i < 10; i++) {
      checkInMemoryRateLimit('1.2.3.4');
    }
    const result = checkInMemoryRateLimit('1.2.3.4');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('las IPs están aisladas', () => {
    for (let i = 0; i < 10; i++) {
      checkInMemoryRateLimit('1.2.3.4');
    }
    const result = checkInMemoryRateLimit('5.6.7.8');
    expect(result.allowed).toBe(true);
  });

  it('permite nuevas requests después de que pase la ventana', () => {
    for (let i = 0; i < 10; i++) {
      checkInMemoryRateLimit('1.2.3.4');
    }
    const blocked = checkInMemoryRateLimit('1.2.3.4');
    expect(blocked.allowed).toBe(false);

    vi.setSystemTime(new Date(Date.now() + 61_000));
    const result = checkInMemoryRateLimit('1.2.3.4');
    expect(result.allowed).toBe(true);
  });

  it('resetInMs decrece con el tiempo', () => {
    checkInMemoryRateLimit('1.2.3.4');
    const before = checkInMemoryRateLimit('1.2.3.4');
    vi.setSystemTime(new Date(Date.now() + 30_000));
    // Agotamos el límite para forzar resetInMs > 0.
    for (let i = 0; i < 8; i++) checkInMemoryRateLimit('1.2.3.4');
    const blocked = checkInMemoryRateLimit('1.2.3.4');
    expect(blocked.allowed).toBe(false);
    expect(blocked.resetInMs).toBeLessThanOrEqual(before.resetInMs);
  });
});
