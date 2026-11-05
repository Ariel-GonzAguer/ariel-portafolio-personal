import { beforeEach, describe, expect, it, vi } from 'vitest';

// getEnv de Waku no existe en el entorno de vitest (node). Devolvemos
// undefined para que validate-origin use el fallback a process.env.
vi.mock('waku', () => ({
  getEnv: () => undefined,
}));

const { handlePreflight } = await import('./preflight');

const preflight = (origin?: string): Request =>
  new Request('http://localhost/api/review', {
    method: 'OPTIONS',
    headers: origin === undefined ? {} : { Origin: origin },
  });

describe('handlePreflight (H4)', () => {
  beforeEach(() => {
    // Tests asumen entorno dev para que localhost sea un origin válido.
    process.env.NODE_ENV = 'development';
  });

  it('responde 204 con CORS headers para un origin de la allowlist', () => {
    const res = handlePreflight(preflight('http://localhost:3000'));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400');
  });

  it('aplica security headers también al preflight', () => {
    const res = handlePreflight(preflight('http://localhost:3000'));
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('permite el origin de producción', () => {
    const res = handlePreflight(preflight('https://arielgonzaguer.gatorojolab.com'));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://arielgonzaguer.gatorojolab.com',
    );
  });

  it('rechaza origin maligno con 403', () => {
    const res = handlePreflight(preflight('https://evil.com'));
    expect(res.status).toBe(403);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('rechaza un subdominio tramposo con 403', () => {
    const res = handlePreflight(preflight('https://arielgonzaguer.gatorojolab.com.evil.com'));
    expect(res.status).toBe(403);
  });

  it('rechaza Origin null con 403', () => {
    const res = handlePreflight(preflight('null'));
    expect(res.status).toBe(403);
  });

  it('rechaza requests sin Origin con 403', () => {
    const res = handlePreflight(preflight());
    expect(res.status).toBe(403);
  });
});
