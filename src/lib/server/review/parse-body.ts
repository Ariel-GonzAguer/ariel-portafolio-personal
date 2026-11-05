/**
 * Parser estricto del body de POST /api/review (H1 + H5 del pentest 2026-11-03).
 *
 * Rechaza antes de tocar el rate limit u OpenAI:
 * - Content-Type distinto de `application/json` → 415 (H5).
 * - JSON no parseable → 400.
 * - Body que no es objeto plano (número, string, array, null) → 400.
 * - `diff` ausente, no string o vacío → 400 (H1: antes un `{"diff": 123}`
 *   provocaba un 500 al llamar `input.trim()` sobre un número).
 *
 * `website` se devuelve CRUDO (unknown): el honeypot decide por truthiness
 * y normalizarlo (p. ej. `website === true`) rompería la trampa para bots
 * que envían strings.
 */

export interface ParsedReviewBody {
  diff: string;
  website: unknown;
}

export type ParseBodyResult =
  { ok: true; body: ParsedReviewBody } | { ok: false; status: 400 | 415; error: string };

/**
 * Valida y parsea el body de una request del reviewer.
 *
 * @example
 * const parsed = await parseBody(request);
 * if (!parsed.ok) {
 *   return jsonError(parsed.error, parsed.status);
 * }
 * // parsed.body.diff es string no vacío; parsed.body.website es el valor crudo.
 */
export async function parseBody(request: Request): Promise<ParseBodyResult> {
  const contentType =
    (request.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase() ?? '';

  // H5: forzar Content-Type JSON (devolver 415 si no).
  if (contentType !== 'application/json') {
    return { ok: false, status: 415, error: 'Content-Type must be application/json' };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await request.text());
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' };
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, status: 400, error: 'Body must be a JSON object' };
  }

  const { diff, website } = raw as Record<string, unknown>;

  // H1: validación estricta de tipos (evita el 500).
  if (typeof diff !== 'string') {
    return { ok: false, status: 400, error: 'diff must be a string' };
  }
  if (diff.trim().length === 0) {
    return { ok: false, status: 400, error: 'Diff is required' };
  }

  return { ok: true, body: { diff, website } };
}
