import { describe, expect, it } from 'vitest';
import handler from './review';

/**
 * Tests del handler /api/review.
 *
 * FASE 1: solo validamos el contrato del mock (status codes, método, shape).
 * FASE 2: agregar tests con mock de OpenAI client.
 */
describe('api-review handler (fase 1 mock)', () => {
  const makeRequest = (
    method: string,
    body?: unknown,
  ): Request =>
    new Request('http://localhost/api/review', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

  it('rechaza GET con 405', async () => {
    const res = await handler(makeRequest('GET'), {} as never);
    expect(res.status).toBe(405);
  });

  it('rechaza POST sin diff con 400', async () => {
    const res = await handler(makeRequest('POST', {}), {} as never);
    expect(res.status).toBe(400);
  });

  it('rechaza POST con diff vacío con 400', async () => {
    const res = await handler(makeRequest('POST', { diff: '   ' }), {} as never);
    expect(res.status).toBe(400);
  });

  it('devuelve un review mock con diff válido', async () => {
    const res = await handler(
      makeRequest('POST', { diff: '--- a/x\n+++ b/x\n@@ -1 +1 @@\n-hola\n+chau' }),
      {} as never,
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      summary: string;
      verdict: string;
      findings: unknown[];
    };
    expect(data.verdict).toBe('comment');
    expect(Array.isArray(data.findings)).toBe(true);
  });

  it('honeypot lleno devuelve 200 silencioso', async () => {
    const res = await handler(
      makeRequest('POST', { diff: 'algo', honeypot: 'spam' }),
      {} as never,
    );
    expect(res.status).toBe(200);
  });
});
