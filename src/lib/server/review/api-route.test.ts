import { describe, expect, it } from 'vitest';
import { GET } from '../../../pages/_api/api/review';

/**
 * Tests de la route de Waku /api/review.
 *
 * NOTA: este test vive en lib/server y no junto al módulo a propósito:
 * Waku escanea `src/pages/**` como entradas del bundle SSR/SSG, y un
 * `*.test.ts` ahí termina ejecutándose durante la generación estática
 * (rompe el build). Ver reporte del validator, 2ª pasada.
 */
describe('route /api/review', () => {
  it('GET responde 405 y sugiere usar POST', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/method not allowed/i);
  });
});
