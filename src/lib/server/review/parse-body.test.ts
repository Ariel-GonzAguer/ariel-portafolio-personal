import { describe, expect, it } from 'vitest';
import { parseBody } from './parse-body';

const jsonRequest = (body: unknown, contentType = 'application/json', raw = false): Request =>
  new Request('http://localhost/api/review', {
    method: 'POST',
    headers: contentType === '' ? {} : { 'Content-Type': contentType },
    body: raw ? body : JSON.stringify(body),
  });

const validDiff = '--- a/src/x.ts\n+++ b/src/x.ts\n@@ -1 +1 @@\n-const a = 1;\n+const a = 2;';

describe('parseBody (H1 + H5)', () => {
  it('acepta un body válido y devuelve website crudo', async () => {
    const parsed = await parseBody(jsonRequest({ diff: validDiff, website: false }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.body.diff).toBe(validDiff);
      expect(parsed.body.website).toBe(false);
    }
  });

  it('rechaza Content-Type text/plain con 415 (H5)', async () => {
    const parsed = await parseBody(jsonRequest({ diff: validDiff }, 'text/plain'));
    expect(parsed).toMatchObject({ ok: false, status: 415 });
  });

  it('rechaza Content-Type ausente con 415', async () => {
    const parsed = await parseBody(jsonRequest({ diff: validDiff }, ''));
    expect(parsed).toMatchObject({ ok: false, status: 415 });
  });

  it('acepta application/json con parámetros (charset)', async () => {
    const parsed = await parseBody(
      jsonRequest({ diff: validDiff }, 'application/json; charset=utf-8'),
    );
    expect(parsed.ok).toBe(true);
  });

  it('rechaza JSON malformado con 400', async () => {
    const parsed = await parseBody(jsonRequest('{"diff": no-json', 'application/json', true));
    expect(parsed).toMatchObject({ ok: false, status: 400, error: 'Invalid JSON' });
  });

  it('rechaza body vacío con 400', async () => {
    const parsed = await parseBody(jsonRequest('', 'application/json', true));
    expect(parsed).toMatchObject({ ok: false, status: 400 });
  });

  it.each([
    ['número', 123],
    ['string', 'hola'],
    ['array', ['x']],
    ['null', null],
  ])('rechaza body que no es objeto (%s) con 400', async (_label, raw) => {
    const parsed = await parseBody(jsonRequest(raw));
    expect(parsed).toMatchObject({ ok: false, status: 400, error: 'Body must be a JSON object' });
  });

  it('rechaza {"diff": 12345} con 400 en vez de 500 (PoC H1)', async () => {
    const parsed = await parseBody(jsonRequest({ diff: 12345, website: 0 }));
    expect(parsed).toMatchObject({ ok: false, status: 400, error: 'diff must be a string' });
  });

  it.each([undefined, null, 123, ['x']])('rechaza diff no string (%#) con 400', async (bad) => {
    const parsed = await parseBody(jsonRequest({ diff: bad }));
    expect(parsed).toMatchObject({ ok: false, status: 400, error: 'diff must be a string' });
  });

  it('rechaza diff vacío o solo espacios con 400', async () => {
    const empty = await parseBody(jsonRequest({ diff: '' }));
    expect(empty).toMatchObject({ ok: false, status: 400, error: 'Diff is required' });

    const spaces = await parseBody(jsonRequest({ diff: '   \n  ' }));
    expect(spaces).toMatchObject({ ok: false, status: 400, error: 'Diff is required' });
  });

  it('preserva el valor crudo de website para el honeypot truthy', async () => {
    const parsed = await parseBody(jsonRequest({ diff: validDiff, website: 'x' }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      // NO se normaliza: el honeypot decide por truthiness.
      expect(parsed.body.website).toBe('x');
    }
  });
});
