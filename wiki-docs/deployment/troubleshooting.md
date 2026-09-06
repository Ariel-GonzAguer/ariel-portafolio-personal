# Troubleshooting — Errores comunes del proyecto

## 1. 502 Bad Gateway en endpoints de API

**Sintoma**: La app carga pero los endpoints API devuelven 502.

**Causa**: `firebase-admin` no está incluido en el bundle de la Netlify Function, o version incompatible.

**Solución**:

1. Verificar `openai@^7.7.0` y `@netlify/blobs@^11.0.1` en `package.json`.
2. Verificar `ssr.external: ['openai', '@netlify/blobs']` en `waku.config.ts` (si aplica) o bien asegurar que estas dependencias no sean tree-shaken innecesariamente.

**Verificación**: `curl -I https://site.com/api/review` devuelve 200 (y headers SSE: `Content-Type: text/event-stream`, `X-Accel-Buffering: no`, `Cache-Control: no-cache`).

---

## 2. Rate limit bloqueando desarrollo local

**Sintoma**: En `localhost:3000` el rate limit de 3/día por IP bloquea las pruebas frecuentes.

**Causa**: El rate limit usa Netlify Blobs con key `rl:${ip}:${yyyy-mm-dd}`. En dev local, Blobs puede comportarse de forma inesperada sin contexto Netlify.

**Solución**:

1. El rate limit secundario en memoria (`in-memory-rate-limit.ts`) actúa como red de seguridad: 10 requests/min.
2. En desarrollo local, las requests suelen no contar contra el rate limit de Blobs si no hay contexto Netlify.
3. Si el problema persiste, verificar que `checkInMemoryRateLimit(ip)` en `reviewRoute.ts` no esté bloqueando.

**Verificación**: Revisar logs de Netlify después de deploy; en local, abrir consola y verificar que `console.warn` no aparezca para rate limit.

---

## 3. Streaming cortado por timeout de Netlify

**Sintoma**: El stream SSE se corta antes de terminar el review.

**Causa**: El plan free de Netlify tiene límite de 26s por función serverless. El modelo `gpt-5.6-luna` puede tardar más de 26s en generar el review para diffs largos.

**Solución**:

1. El timeout está configurado en 60_000 ms (1 minuto) en `reviewRoute.ts` (`STREAM_TIMEOUT_MS`).
2. Considerar actualizar a plan Pro de Netlify (límite 60s) si se esperan reviews largos.
3. Para diffs muy largos, el usuario puede recibir un review parcial (primeros findings) y luego solicitar otro.

**Verificación**: Revisar el campo `usage` en el evento `done` del SSE: contiene `prompt_tokens`, `completion_tokens`, `total_tokens`.

---

## 4. CSP bloqueando connect-src

**Sintoma**: El fetch desde el cliente a `/api/review` falla por política de Content Security Policy.

**Causa**: La política CSP del sitio restringe `connect-src` a orígenes permitidos.

**Solución**:

1. Ya está cubierto: la edge function `netlify/edge-functions/csp-nonce.ts` permite `connect-src 'self'`, lo cual cubre el fetch a `/api/review` desde el mismo origen.
2. Si se quiere endurecer CSP, agregar `connect-src 'self'` explícitamente.

**Verificación**: Abrir consola del navegador y verificar que no haya errores de CSP (`Refused to connect to ... because it violates the following Content Security Policy directive: connect-src 'self'`).

---

## 5. API key filtrada en el bundle de producción

**Sintoma**: `grep -r "sk-" dist/` encuentra la API key de OpenAI.

**Causa**: La API key se está incluyendo erróneamente en el bundle de cliente.

**Solución**:

1. **Nunca** poner `OPENAI_API_KEY` en variables de cliente (`process.env.OPENAI_API_KEY_CLIENT` o similar).
2. La key debe estar solo en `process.env.OPENAI_API_KEY` server-side (Netlify UI env vars).
3. Revisar `getServerEnv()` en `reviewRoute.ts` — usa `getEnv(key) ?? process.env[key]` y retorna `undefined` si está vacío.
4. Después de build, `grep -r "sk-" dist/` debe dar vacío.

**Verificación**: Hacer `grep -r "sk-" dist/` después de `pnpm build`. Si encuentra algo, revisar que ningún componente importe `openai` client-side.

---

## 6. Headers SSE no aplicándose

**Sintoma**: El stream SSE no tiene los headers esperados (`X-Accel-Buffering: no`, `Cache-Control: no-cache`).

**Causa**: El `createSSEResponse` en `reviewRoute.ts` no está usando `withSecurityHeaders` correctamente.

**Solución**:

1. Verificar que `createSSEResponse` retorne `new Response(stream, { headers: withSecurityHeaders({ ...SSE_HEADERS }) })`.
2. Los headers SSE están definidos en `security-headers.ts`:
   - `Content-Type: text/event-stream`
   - `Cache-Control: no-cache, no-transform`
   - `Connection: keep-alive`
   - `X-Accel-Buffering: no`

**Verificación**: Usar `curl -I https://site.com/api/review` y verificar los headers. O inspeccionar en pestaña Network del DevTools.

---

## 7. Honeypot no funcionando (bots pueden enviar)

**Sintoma**: Los bots están logrando enviar diffs a la API.

**Causa**: El checkbox oculto `name="website"` no está oculto correctamente o el backend no está verificando `body.website`.

**Solución**:

1. En `ReviewForm.tsx`, el checkbox oculto tiene `style={{ position: 'absolute', left: '-9999px' }}` y `aria-hidden="true"`.
2. En `reviewRoute.ts`, la verificación es: `if (body?.website) { return new Response(JSON.stringify({ ok: true }), ...); }`.
3. Asegurarse de que no hay otro input con name="website" en el form que esté visible.

**Verificación**: Inspeccionar el HTML renderizado y verificar que el input `website` tenga `type="hidden"` style position absolute o esté fuera del viewport.

---

## 8. Prompt injection no detectado

**Sintoma**: Un usuario incluye un patrón de prompt injection en el diff y no es detectado.

**Causa**: Las 7 patrones de `detect-injection.ts` cubren los casos obvios, pero variantes con `snake_case` o `kebab-case` (ej: `ignore_previous_instructions`) no son detectadas.

**Solución**:

1. El sanitizer (`sanitize.ts`) ya neutraliza la mayoría de vectores (backticks ``` → Unicode, chars de control, líneas >2000 chars).
2. Como mejora pendiente: agregar patrones `snake_case`/`kebab-case` a `detect-injection.ts`.
3. En producción, los logs de `console.warn` capturan los intentos de injection para métricas.

**Verificación**: Probar intencionalmente con `ignore previous instructions` en el diff — debería devolver 400 con mensaje "Se detectó un intento de inyección de prompt".

---

## 9. Error 403 Origin not allowed

**Sintoma**: Al enviar el form, se recibe `403 Origin not allowed`.

**Causa**: El header `Origin` de la request no está en la allowlist de `validate-origin.ts`.

**Solución**:

1. Por defecto, se permiten: `https://arielgonzaguer.gatorojolab.com` y `https://arielgonzaguer.dev`.
2. En desarrollo local, localhost y 127.0.0.1 siempre se permiten (a menos que `NODE_ENV` esté en producción).
3. Si se quiere agregar un dominio extra, configurar la env var `ALLOWED_ORIGINS` en Netlify UI (CSV: `https://dominio.com,https://otro.com`).

**Verificación**: Revisar el header `Origin` en la request de devtools y verificar que coincida con uno de los dominios permitidos.

---

## Referencias

- [Documento relacionado](deployment/platform.md)
- [Config Netlify — environment variables](https://docs.netlify.com/site-build/environment-variables/)
- [Netlify Blobs docs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)

## 10. Tests fallan después de cambiar dependencias

**Sintoma**: `pnpm test` devuelve errores después de agregar/actualizar dependencias.

**Causa**: Dependencias incompatibles o versions conflitantes.

**Solución**:

1. Ejecutar `pnpm audit` para detectar vulnerabilidades.
2. Ejecutar `pnpm install --frozen-lockfile` para asegurar versions consistentes.
3. Revisar `package.json` y `pnpm-lock.yaml` por versiones conflictantes.
4. Si se agregó una dependencia nueva, verificar que no rompa tipos TypeScript (`tsc --noEmit`).

**Verificación**: `pnpm audit` debe devolver 0 vulnerabilidades. `pnpm test` debe pasar con 151/151 tests.
