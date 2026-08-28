import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockParse = vi.fn();

vi.mock('openai', () => {
  class FakeOpenAI {
    responses = { parse: mockParse };
  }
  return { default: FakeOpenAI };
});

import handler from './review';

const validDiff = `--- a/src/utils.ts
+++ b/src/utils.ts
@@ -1,3 +1,4 @@
 export const sum = (a, b) => a + b;
+export const diff = (a, b) => a - b;
 export const PI = 3.14;`;

const makeRequest = (
  method: string,
  body?: unknown,
  origin = 'http://localhost:3000',
): Request =>
  new Request('http://localhost/api/review', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const fakeReview = {
  summary: 'Cambio sólido.',
  verdict: 'approve',
  findings: [],
};

describe('api-review handler (fase 2 — OpenAI real)', () => {
  beforeEach(() => {
    mockParse.mockReset();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('rechaza GET con 405', async () => {
    const res = await handler(
      makeRequest('GET'),
      {} as never,
    );
    expect(res.status).toBe(405);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it('rechaza origen no permitido con 403', async () => {
    const res = await handler(
      makeRequest('POST', { diff: validDiff }, 'https://evil.com'),
      {} as never,
    );
    expect(res.status).toBe(403);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it('rechaza request sin diff con 400', async () => {
    const res = await handler(
      makeRequest('POST', {}),
      {} as never,
    );
    expect(res.status).toBe(400);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it('rechaza diff inválido (no unified) con 400', async () => {
    const res = await handler(
      makeRequest('POST', { diff: 'esto no es un diff' }),
      {} as never,
    );
    expect(res.status).toBe(400);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it('devuelve el review parseado de OpenAI con 200', async () => {
    mockParse.mockResolvedValue({ output_parsed: fakeReview });

    const res = await handler(
      makeRequest('POST', { diff: validDiff }),
      {} as never,
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as typeof fakeReview;
    expect(data.verdict).toBe('approve');
    expect(data.findings).toEqual([]);
    expect(mockParse).toHaveBeenCalledOnce();
  });

  it('devuelve 502 si OpenAI no devuelve output_parsed', async () => {
    mockParse.mockResolvedValue({ output_parsed: null });

    const res = await handler(
      makeRequest('POST', { diff: validDiff }),
      {} as never,
    );
    expect(res.status).toBe(502);
  });

  it('devuelve 502 si OpenAI lanza un error', async () => {
    mockParse.mockRejectedValue(new Error('rate limit exceeded'));

    const res = await handler(
      makeRequest('POST', { diff: validDiff }),
      {} as never,
    );
    expect(res.status).toBe(502);
  });

  it('devuelve 500 si OPENAI_API_KEY no está seteada', async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await handler(
      makeRequest('POST', { diff: validDiff }),
      {} as never,
    );
    expect(res.status).toBe(500);
    expect(mockParse).not.toHaveBeenCalled();
  });
});
