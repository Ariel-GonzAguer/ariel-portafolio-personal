/**
 * Log de abuso para rechazos por rate limit (H3 del pentest 2026-11-03).
 *
 * La UI ya advierte que los abusos se registran. Netlify captura los
 * console.* de las functions, así que un warn estructurado cumple el
 * requisito sin crear un store Blobs nuevo. Mismo patrón que
 * `logInjectionAttempt`.
 */

/**
 * Registra un rechazo por rate limit con contexto de auditoría.
 *
 * @example
 * if (!rateLimit.allowed) {
 *   logRateLimitExceeded(request, ip);
 *   return jsonError('Rate limit exceeded', 429, headers, 'rate_limit');
 * }
 */
export function logRateLimitExceeded(request: Request, ip: string): void {
  const ua = (request.headers.get('user-agent') ?? 'unknown').slice(0, 200);
  console.warn(
    `[security] rate limit exceeded: ip=${ip} ua=${JSON.stringify(ua)} ts=${new Date().toISOString()}`,
  );
}
