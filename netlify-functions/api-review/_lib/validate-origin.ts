/**
 * Validador de origen (CSRF mínimo).
 *
 * Compara el header `Origin` de la request contra una allowlist
 * leída de la env var `ALLOWED_ORIGINS` (CSV).
 *
 * FASE 2: implementación mínima. FASE 6 se refuerza con manejo
 * de requests sin origin (ej: curl, server-to-server).
 */

function getAllowedOrigins(): Set<string> {
  const raw = process.env.ALLOWED_ORIGINS ?? '';
  return new Set(
    raw
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  );
}

const DEFAULT_ALLOWED = new Set([
  'http://localhost:3000',
  'http://localhost:8888',
]);

export function isOriginAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    return false;
  }
  const allowed = getAllowedOrigins();
  const effective =
    allowed.size > 0 ? allowed : DEFAULT_ALLOWED;
  return effective.has(origin);
}
