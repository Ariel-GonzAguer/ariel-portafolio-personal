# Troubleshooting — Errores comunes del proyecto

## Índice de entradas

| # | Problema                                   | Componente involucrado                  |
| - | ------------------------------------------ | --------------------------------------- |
| 1 | 502 Bad Gateway en `/api/review`           | `reviewRoute.ts`, wrapper Waku          |
| 2 | Rate limit bloqueando desarrollo local     | `in-memory-rate-limit.ts`, Blobs        |
| 3 | Streaming cortado por timeout              | `reviewRoute.ts` (`STREAM_TIMEOUT_MS`)  |
| 4 | CSP bloqueando connect-src                 | `csp-nonce.ts` (edge function)          |
| 5 | API key filtrada en el bundle              | `getServerEnv`, bundling                |
| 6 | Headers SSE no aplicándose                 | `security-headers.ts`                   |
| 7 | Honeypot no funcionando                    | `ReviewForm.tsx`, `reviewRoute.ts`      |
| 8 | Prompt injection no detectado              | `detect-injection.ts` (`flex()`)        |
| 9 | Error 403 Origin not allowed               | `validate-origin.ts`                    |
| 10 | Tests fallan tras cambiar dependencias     | `package.json`, `pnpm-lock.yaml`        |
| 11 | Métricas de CO₂/costo no aparecen          | `useReviewStream.ts`, `ReviewOutput.tsx` |

## 1. 502 Bad Gateway en `/api/review`

**Síntoma**: La app carga pero `POST /api/review` devuelve 502.

**Causa**: El stream de OpenAI falló al iniciarse (`createStream` lanzó error), o el wrapper de Waku no está sirviendo la API route.

**Solución**:

1. Verificar `openai@^7.7.0` y `@netlify/blobs@^11.0.1` en `package.json`.
2. Verificar que `OPENAI_API_KEY` esté configurada en Netlify UI (Site settings > Environment variables). Si falta, el handler responde 500 (`Service not configured`).
3. Verificar que `netlify-functions/serve.js` importe `dist/server/index.js` correctamente (el build debe generar `dist/server`).
4. Revisar los logs de la function: `console.error('OpenAI error:', message)` aparece cuando `createStream` falla (responde 502).

**Verificación**: `curl -X POST https://site.com/api/review` con un diff válido devuelve un stream SSE (`Content-Type: text/event-stream`, `X-Accel-Buffering: no`).

---

## 2. Rate limit bloqueando desarrollo local

**Síntoma**: En `localhost:3000` las pruebas frecuentes devuelven 429.

**Causa**: Doble rate limit: `in-memory-rate-limit.ts` (10/min por IP, ventana 60 s) corre primero y responde 429 con `Retry-After`. El rate limit principal de Blobs (3/día) puede comportarse de forma inesperada sin contexto Netlify.

**Solución**:

1. El rate limit en memoria se reinicia solo; para tests se usa `_resetInMemoryRateLimit()`.
2. El rate limit de Blobs es tolerante a errores: si `getStore` falla en dev, `handleReview` loguea `console.warn('[reviewRoute] Rate limit no disponible: ...')` y NO bloquea la request.
3. Esperar a que pase la ventana de 60 s, o reiniciar el proceso de dev para limpiar el `Map` de buckets.

**Verificación**: En consola del servidor, `console.warn` solo debe aparecer cuando Blobs no está disponible. Un 429 con `Retry-After` pequeño (≤60 s) indica el límite en memoria.

---

## 3. Streaming cortado por timeout

**Síntoma**: El stream SSE se corta antes de terminar el review.

**Causa**: El timeout del stream está fijado en 60_000 ms (`STREAM_TIMEOUT_MS` en `reviewRoute.ts`) y el plan de Netlify puede cortar la function antes según el límite del plan.

**Solución**:

1. Para diffs muy largos, el usuario puede recibir un review parcial y solicitar otro.
2. El límite de 50 KB en `validate-diff.ts` acota el tamaño del diff para que el modelo responda dentro del timeout.
3. Si el stream se corta, el hook cliente muestra error solo si hubo evento `error`; si el JSON final no parsea, muestra "El modelo no devolvió JSON válido."

**Verificación**: Revisar los eventos del SSE en DevTools (pestaña Network → EventStream): `delta` → `usage` → `done`. El evento `usage` contiene `inputTokens`, `outputTokens`, `reasoningTokens`, `totalTokens`.

---

## 4. CSP bloqueando connect-src

**Síntoma**: El fetch desde el cliente a `/api/review` falla por política de Content Security Policy.

**Causa**: La política CSP del sitio restringe `connect-src` a orígenes permitidos.

**Solución**:

1. Ya está cubierto: la edge function `netlify/edge-functions/csp-nonce.ts` incluye `connect-src 'self'`, lo cual cubre el fetch a `/api/review` desde el mismo origen.
2. La CSP solo se aplica a respuestas `text/html` (el SSE de la API no la lleva).
3. Si se quiere endurecer CSP, editar el array `csp` en `csp-nonce.ts`.

**Verificación**: Abrir consola del navegador y verificar que no haya errores de CSP (`Refused to connect to ... because it violates the following Content Security Policy directive: connect-src 'self'`).

---

## 5. API key filtrada en el bundle de producción

**Síntoma**: `grep -r "sk-" dist/` encuentra la API key de OpenAI.

**Causa**: La API key se está incluyendo erróneamente en el bundle de cliente.

**Solución**:

1. **Nunca** poner `OPENAI_API_KEY` en variables de cliente (nada de `VITE_`/`PUBLIC_` prefijos).
2. La key debe estar solo en variables de entorno server-side de Netlify.
3. Revisar `getServerEnv()` en `reviewRoute.ts` — usa `getEnv(key) ?? process.env[key]` y retorna `undefined` si está vacío.
4. El módulo `reviewRoute.ts` es SERVER-ONLY: nunca importarlo desde componentes cliente (`'use client'`).

**Verificación**: Hacer `grep -r "sk-" dist/` después de `pnpm build`. Si encuentra algo, revisar que ningún componente importe `openai` client-side.

---

## 6. Headers SSE no aplicándose

**Síntoma**: El stream SSE no tiene los headers esperados (`X-Accel-Buffering: no`, `Cache-Control: no-cache`).

**Causa**: `createSSEResponse` no está usando `withSecurityHeaders` correctamente.

**Solución**:

1. Verificar que `createSSEResponse` retorne `new Response(stream, { headers: withSecurityHeaders({ ...SSE_HEADERS }) })`.
2. Los headers SSE están definidos en `security-headers.ts`:
   - `Content-Type: text/event-stream`
   - `Cache-Control: no-cache, no-transform`
   - `Connection: keep-alive`
   - `X-Accel-Buffering: no`
3. `withSecurityHeaders` aplica además HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.

**Verificación**: Usar `curl -X POST https://site.com/api/review` y verificar los headers. O inspeccionar en pestaña Network del DevTools.

---

## 7. Honeypot no funcionando (bots pueden enviar)

**Síntoma**: Los bots están logrando enviar diffs a la API.

**Causa**: El checkbox oculto `name="website"` no está oculto correctamente o el backend no está verificando `body.website`.

**Solución**:

1. En `ReviewForm.tsx`, el honeypot usa `style={{ position: 'absolute', left: '-9999px' }}`, `aria-hidden="true"`, `tabIndex={-1}` y `autoComplete="off"`.
2. En `reviewRoute.ts`, la verificación es: `if (body?.website) { return new Response(JSON.stringify({ ok: true }), ...); }` (200 silencioso).
3. Asegurarse de que no hay otro input con name="website" en el form que esté visible.

**Verificación**: Inspeccionar el HTML renderizado y verificar que el input `website` esté fuera del viewport y no sea enfocable.

---

## 8. Prompt injection no detectado

**Síntoma**: Un usuario incluye un patrón de prompt injection en el diff y no es detectado.

**Causa**: Los 7 patrones de `detect-injection.ts` usan la helper `flex()` que tolera separadores variables (`[\s_-]+`), capturando `snake_case`, `kebab-case` y newlines. Aun así, variantes no cubiertas pueden pasar.

**Solución**:

1. El handler RECHAZA la request cuando `detectInjection` devuelve matches: 400 con `code: 'injection_detected'`.
2. El sanitizer (`sanitize.ts`) neutraliza la mayoría de vectores (backticks → Unicode, chars de control, líneas >2000 chars).
3. `logInjectionAttempt` loguea labels, IP y diffLength (no el contenido del diff) para auditoría.
4. Como mejora: agregar nuevos patrones a `INJECTION_PATTERNS` usando `flex()`.

**Verificación**: Probar intencionalmente con `ignore previous instructions` o `ignore_previous_instructions` en el diff — debería devolver 400 con `code: injection_detected`.

---

## 9. Error 403 Origin not allowed

**Síntoma**: Al enviar el form, se recibe `403 Origin not allowed`.

**Causa**: El header `Origin` de la request no está en la allowlist de `validate-origin.ts`.

**Solución**:

1. Por defecto, se permiten: `https://arielgonzaguer.gatorojolab.com` y `https://arielgonzaguer.dev`.
2. En desarrollo, `localhost` y `127.0.0.1` (cualquier puerto) se permiten SOLO si `NODE_ENV === 'development'` (comparación explícita, sin default-to-dev).
3. Si se quiere agregar un dominio extra, configurar la env var `ALLOWED_ORIGINS` en Netlify UI (CSV: `https://dominio.com,https://otro.com`).

**Verificación**: Revisar el header `Origin` en la request de DevTools y verificar que coincida con uno de los dominios permitidos.

---

## 10. Tests fallan después de cambiar dependencias

**Síntoma**: `pnpm test` devuelve errores después de agregar/actualizar dependencias.

**Causa**: Dependencias incompatibles o versiones conflictivas.

**Solución**:

1. Ejecutar `pnpm audit` para detectar vulnerabilidades.
2. Ejecutar `pnpm install --frozen-lockfile` para asegurar versiones consistentes.
3. Revisar `package.json` y `pnpm-lock.yaml` por versiones conflictivas.
4. Si se agregó una dependencia nueva, verificar que no rompa tipos TypeScript (`tsc --noEmit`).

**Verificación**: `pnpm audit` debe devolver 0 vulnerabilidades. `pnpm test` debe pasar con 181/181 tests (27 archivos).

---

## 11. Métricas de CO₂ o costo no aparecen en ReviewOutput

**Síntoma**: El review se muestra correctamente pero no aparecen "Impacto climático estimado" ni "Costo API estimado".

**Causa**: `usage` es `null` en `ReviewState` — el evento `usage` del SSE no llegó o no pasó la validación `isReviewUsage()`.

**Solución**:

1. Verificar en DevTools (EventStream) que el servidor emite `{type: 'usage', usage: {...}}` después del último `delta`.
2. `isReviewUsage` exige que `inputTokens`, `cachedInputTokens ?? 0`, `cacheWriteInputTokens ?? 0`, `outputTokens`, `reasoningTokens` y `totalTokens` sean finitos y ≥ 0.
3. Si el stream se corta antes de `response.completed`, el evento `usage` nunca se emite (el hook deja `usage: null`).

**Verificación**: En `ReviewOutput.tsx`, `co2Range` y `apiCost` son `null` cuando `usage` es `null`; el bloque condicional `{co2Range && ...}` oculta ambas métricas.

---

## Referencias

- [Plataforma de despliegue](platform.md)
- [Backend - Seguridad](../backend/auth.md)
- [Config Netlify — environment variables](https://docs.netlify.com/site-build/environment-variables/)
- [Netlify Blobs docs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
