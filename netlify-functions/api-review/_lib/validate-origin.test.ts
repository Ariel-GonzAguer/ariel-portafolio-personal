import { describe, expect, it } from 'vitest';
import { isOriginAllowed } from './validate-origin';

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

  it('rechaza origen externo desconocido', () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      headers: { Origin: 'https://evil.com' },
    });
    expect(isOriginAllowed(req)).toBe(false);
  });

  it('respeta ALLOWED_ORIGINS cuando está seteado', () => {
    const previous = process.env.ALLOWED_ORIGINS;
    process.env.ALLOWED_ORIGINS = 'https://arielgonzaguer.com';
    try {
      const allowed = new Request('http://localhost/api/review', {
        method: 'POST',
        headers: { Origin: 'https://arielgonzaguer.com' },
      });
      const denied = new Request('http://localhost/api/review', {
        method: 'POST',
        headers: { Origin: 'http://localhost:3000' },
      });
      expect(isOriginAllowed(allowed)).toBe(true);
      expect(isOriginAllowed(denied)).toBe(false);
    } finally {
      if (previous === undefined) {
        delete process.env.ALLOWED_ORIGINS;
      } else {
        process.env.ALLOWED_ORIGINS = previous;
      }
    }
  });
});
