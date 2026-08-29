/**
 * Validador de origen (CSRF mínimo).
 *
 * Compara el header `Origin` de la request contra una allowlist.
 * La allowlist es aditiva: los orígenes por defecto (dev + producción)
 * SIEMPRE se permiten, y la env var `ALLOWED_ORIGINS` (CSV) agrega
 * orígenes extra. Así el desarrollo local nunca queda bloqueado aunque
 * la env var esté seteada solo con el dominio de producción.
 *
 * En desarrollo se acepta cualquier puerto de localhost/127.0.0.1.
 */

import { getEnv } from 'waku';

const DEFAULT_ALLOWED = new Set([
  'https://arielgonzaguer.gatorojolab.com',
  'https://arielgonzaguer.dev',
]);

function isLocalDevOrigin(origin: string): boolean {
  const isLoopback =
    origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  const isDev = (getEnv('NODE_ENV') ?? process.env.NODE_ENV) !== 'production';
  return isDev && isLoopback;
}

function getAllowedOrigins(): Set<string> {
  const raw = getEnv('ALLOWED_ORIGINS') ?? process.env.ALLOWED_ORIGINS ?? '';
  const extra = new Set(
    raw
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  );
  return new Set([...DEFAULT_ALLOWED, ...extra]);
}

export function isOriginAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    return false;
  }
  if (isLocalDevOrigin(origin)) {
    return true;
  }
  return getAllowedOrigins().has(origin);
}
