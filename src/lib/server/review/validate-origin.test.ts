import { describe, expect, it, vi } from 'vitest';
import { isOriginAllowed } from './validate-origin';

// getEnv de Waku no existe en vitest (node). Devolvemos undefined para
// que getAllowedOrigins use el fallback a process.env.ALLOWED_ORIGINS.
vi.mock('waku', () => ({
  getEnv: () => undefined,
}));

describe('isOriginAllowed', () => {
  it('rechaza request sin origin (curl, server-to-server)', () => {
    const req = new Request('http://localhost/api/review', { method: 'POST' });
    expect(isOriginAllowed(req)).toBe(false);
  });

  it('acepta origin localhost:3000 por default', () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000' },
    });
    expect(isOriginAllowed(req)).toBe(true);
  });

  it('acepta origin localhost:8888 por default (Netlify CLI)', () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      headers: { Origin: 'http://localhost:8888' },
    });
    expect(isOriginAllowed(req)).toBe(true);
  });

  it('acepta origin localhost en cualquier puerto en dev', () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(isOriginAllowed(req)).toBe(true);
  });

  it('acepta origin 127.0.0.1 en cualquier puerto en dev', () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      headers: { Origin: 'http://127.0.0.1:3000' },
    });
    expect(isOriginAllowed(req)).toBe(true);
  });

  it('rechaza origin localhost en producción', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const req = new Request('http://localhost/api/review', {
        method: 'POST',
        headers: { Origin: 'http://localhost:3000' },
      });
      expect(isOriginAllowed(req)).toBe(false);
    } finally {
      if (previous === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previous;
      }
    }
  });

  it('rechaza origen externo desconocido', () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      headers: { Origin: 'https://evil.com' },
    });
    expect(isOriginAllowed(req)).toBe(false);
  });

  it('agrega ALLOWED_ORIGINS a la allowlist sin quitar los defaults', () => {
    const previous = process.env.ALLOWED_ORIGINS;
    process.env.ALLOWED_ORIGINS = 'https://arielgonzaguer.com';
    try {
      const allowed = new Request('http://localhost/api/review', {
        method: 'POST',
        headers: { Origin: 'https://arielgonzaguer.com' },
      });
      const local = new Request('http://localhost/api/review', {
        method: 'POST',
        headers: { Origin: 'http://localhost:3000' },
      });
      expect(isOriginAllowed(allowed)).toBe(true);
      expect(isOriginAllowed(local)).toBe(true);
    } finally {
      if (previous === undefined) {
        delete process.env.ALLOWED_ORIGINS;
      } else {
        process.env.ALLOWED_ORIGINS = previous;
      }
    }
  });

  it('acepta el dominio de producción por default', () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      headers: { Origin: 'https://arielgonzaguer.gatorojolab.com' },
    });
    expect(isOriginAllowed(req)).toBe(true);
  });
});
