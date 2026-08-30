/**
 * Security headers para todas las responses de la function.
 *
 * Aplican a responses JSON (errores) y SSE (stream). Son el cinturón
 * de seguridad contra XSS, clickjacking, MIME sniffing, downgrade
 * attacks y exfiltración de features del navegador.
 *
 * Referencia: plan 5.6 y OWASP Secure Headers Project.
 */

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const;

/**
 * Headers específicos para Server-Sent Events.
 * No entran en conflicto con los security headers (no se duplican claves).
 * CSP no se incluye acá: el edge de Netlify / la CSP del sitio se encarga.
 * Si en algún momento se quiere endurecer desde la function, agregar acá
 * con `connect-src 'self'` para cubrir el fetch del cliente al endpoint.
 */
export const SSE_HEADERS: Readonly<Record<string, string>> = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
} as const;

/**
 * Combina security headers + headers específicos (JSON, SSE, etc.).
 * Si una clave se repite, gana el valor de `specific` (útil para
 * sobreescribir Content-Type en respuestas de error JSON).
 */
export function withSecurityHeaders(specific: Record<string, string>): Record<string, string> {
  return { ...SECURITY_HEADERS, ...specific };
}

/**
 * Helper para construir responses JSON de error con los security headers
 * ya aplicados. Evita repetir la lista en cada return del handler.
 *
 * El `code` opcional permite al cliente distinguir tipos de error sin
 * parsear el mensaje (útil para mostrar UI distinta: alert de seguridad
 * vs error genérico). Los códigos siguen snake_case y son estables.
 */
export function jsonError(
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {},
  code?: string,
): Response {
  const body: { error: string; code?: string } = { error: message };
  if (code) body.code = code;
  return new Response(JSON.stringify(body), {
    status,
    headers: withSecurityHeaders({
      'Content-Type': 'application/json',
      ...extraHeaders,
    }),
  });
}
