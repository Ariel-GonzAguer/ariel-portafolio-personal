/**
 * Preflight CORS (OPTIONS) para /api/review (H4 del pentest 2026-11-03).
 *
 * Antes de este módulo, `OPTIONS /api/review` no estaba exportado en la
 * route de Waku y terminaba en 500. Ahora responde preflight bajo la MISMA
 * allowlist de Origin que POST: un origen no permitido recibe 403, igual
 * que un POST malicioso. El preflight no consume rate limit ni toca OpenAI.
 */

import { isOriginAllowed } from './validate-origin';
import { jsonError, withSecurityHeaders } from './security-headers';

const PREFLIGHT_MAX_AGE_SECONDS = 86_400;

/**
 * Maneja una request OPTIONS de /api/review.
 *
 * @example
 * // src/pages/_api/api/review.ts
 * export async function OPTIONS(request: Request) {
 *   return handlePreflight(request);
 * }
 */
export function handlePreflight(request: Request): Response {
  if (!isOriginAllowed(request)) {
    return jsonError('Origin not allowed', 403);
  }

  return new Response(null, {
    status: 204,
    headers: withSecurityHeaders({
      'Access-Control-Allow-Origin': request.headers.get('origin') ?? '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': String(PREFLIGHT_MAX_AGE_SECONDS),
    }),
  });
}
