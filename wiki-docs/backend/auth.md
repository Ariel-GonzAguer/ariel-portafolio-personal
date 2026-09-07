# Capas de seguridad

El AI Code Reviewer implementa **7 capas de seguridad en orden**, cada una actúa como filtro antes de pasar al siguiente paso. Si cualquier capa rechaza la request, el proceso se detiene y no se gasta un token de OpenAI.

## Portada: Capa 0 - Origin check (CSRF)

**Archivo**: `src/lib/server/review/validate-origin.ts`

- Compara el header `Origin` de la request contra una allowlist.
- Allowlist **aditiva**: los orígenes por defecto (dev + producción) **SIEMPRE** se permiten.
- `ALLOWED_ORIGINS` (env var CSV) agrega orígenes extra.
- Si no hay header `origin` → rechazar (403).
- Orígenes locales (`http://localhost:*`, `http://127.0.0.1:*`) solo se permiten si `NODE_ENV === 'development'` (comparación explícita; si `NODE_ENV` no está seteado NO se trata como dev).
- Dominios de producción por defecto: `https://arielgonzaguer.gatorojolab.com`, `https://arielgonzaguer.dev`.

---

## Capa 1: Honeypot anti-bot

**Archivo**: `reviewRoute.ts`

- Checkbox oculto `<input type="checkbox" name="website" tabIndex={-1} autoComplete="off">` (dentro de un `div` con `position: absolute; left: -9999px; aria-hidden="true"`) que los bots marcan pero los humanos no ven.
- Si el backend recibe `website: true` → devolver `200` silencioso sin gastar tokens de OpenAI.
- **Propósito**: disuadir iteración rápida de bots sin el overhead de reCAPTCHA.

---

## Capa 2: Rate limit por IP (doble)

### Rate limit secundario en memoria

**Archivo**: `src/lib/server/review/in-memory-rate-limit.ts`

- Política: **10 requests por minuto por IP** (ventana de 60 s, `WINDOW_MS = 60_000`).
- Corre ANTES que el rate limit de Blobs (en `reviewRoute.ts`); si falla, responde `429` con `Retry-After`.
- Almacena timestamps por IP en un `Map` a nivel módulo; poda entries viejas en cada check.
- **Limitación**: es por instancia de proceso. En Netlify serverless cada invocación puede ser una instancia distinta, así que en producción es soft. Sigue siendo útil para dev y como mitigación local contra loops accidentales.
- `_resetInMemoryRateLimit()` es un helper para tests.

### Rate limit principal por día

**Archivo**: `src/lib/server/review/rate-limit.ts`

- Política: **3 requests por día por IP** (ventana UTC).
- Key: `rl:${ip}:${yyyy-mm-dd}` (fecha en UTC; las keys viejas expiran naturalmente).
- Value: JSON `{ count: number }` en el store `rate-limits` de [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).
- Si el contador ≥ 3 → `allowed: false` y `429` con header `Retry-After` (segundos hasta el próximo `00:00:00 UTC`, calculado con `getSecondsUntilReset()`).
- **Tolerante a errores**: si Blobs falla (p.ej. dev local sin contexto Netlify), `handleReview` captura el error con `console.warn` y NO bloquea la request — el rate limit en memoria actúa como red de seguridad.

---

## Capa 3: Validación de estructura del diff

**Archivo**: `src/lib/server/review/validate-diff.ts`

- Reglas (todas rechazan con 400):
  1. No vacío (`input.trim().length === 0`)
  2. ≤ 50 KB (`MAX_DIFF_BYTES = 50_000`; reducido de 100 KB para limitar superficie de ataque)
  3. Headers `--- a/` y `+++ b/` presentes (`/^--- a\/.+/m`, `/^\+\+\+ b\/.+/m`)
  4. No es binario (`/^Binary files /m`)
- **Propósito**: rechazar antes de gastar tokens en OpenAI con input inválido.

---

## Capa 4: Detección de prompt injection (RECHAZA)

**Archivo**: `src/lib/server/review/detect-injection.ts`

- **Sí rechaza la request** (cambio respecto a versiones anteriores que solo logueaban): si `detectInjection(body.diff)` devuelve matches, `reviewRoute.ts` responde `400` con mensaje `"Se detectó un intento de inyección de prompt. Tu solicitud no será procesada."` y `code: 'injection_detected'`.
- 7 patrones de detección (bandera `i`):
  1. `ignore-previous` — `ignore (all)? (previous|prior|above) instructions`
  2. `system-tag` — `<\s*system\s*>`
  3. `role-override` — `you are now`
  4. `dan-jailbreak` — `\bDAN\b`
  5. `developer-mode` — `developer mode` / `system mode`
  6. `reveal-prompt` — `reveal (the)? (system|initial) prompt`
  7. `disregard-rules` — `disregard (all)? (previous|prior) (rules|instructions)`
- La helper `flex(...parts)` construye regex tolerantes a separadores variables (`[\s_-]+` entre palabras), capturando variantes como `ignore_previous_instructions`, `ignore-previous-instructions` o `ignore\nprevious\ninstructions`.
- `detectInjection` fuerza la flag `g` y avanza `lastIndex` (protección contra loop infinito por matches de longitud 0).
- `logInjectionAttempt(matches, context)` loguea con `console.warn`: labels únicos, IP, `diffLength` y preview del match (máx 200 chars). El contenido literal del diff NO se loguea.
- El cliente reacciona al `code: 'injection_detected'`: alert nativo, vaciado del textarea y cooldown de 6 minutos persistido en localStorage (`review:injectionCooldownUntil`).

---

## Capa 5: Sanitización del input al LLM

**Archivo**: `src/lib/server/review/sanitize.ts`

Neutraliza vectores obvios sin romper diffs legítimos:

| Regla                                       | Implementación                                                 |
| ------------------------------------------- | -------------------------------------------------------------- |
| Escape triple backticks ``` → ʼʼʼ (Unicode) | `escapeTripleBackticks()`                                      |
| Quitar chars de control excepto `\n \t \r`  | `stripControlChars()` regex `[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]` |
| Truncar líneas a 2000 chars                 | `truncateLongLines()` (previene token stuffing)                |

---

## Capa 6: OpenAI Responses API con JSON Schema estricto

**Archivo**: `src/lib/server/review/reviewRoute.ts` (`createStream`)

- Modelo: `gpt-5.6-luna` (`REVIEW_MODEL_ID` de `src/utils/review-cost/review-cost.ts`)
- System prompt: `SYSTEM_PROMPT` (6 categorías, 5 severidades, reglas anti-genéricas)
- Input: `text.format: { type: "json_schema", name: "CodeReview", schema: REVIEW_SCHEMA, strict: true }`
- Timeout: 60_000 ms (`STREAM_TIMEOUT_MS`) — evita colgar la request serverless
- **API key nunca en bundle**: solo `getServerEnv('OPENAI_API_KEY')` server-side (`getEnv(key) ?? process.env[key]`, con trim; error 500 si está vacía)

---

## Capa 7: Security headers en todas las responses

**Archivo**: `src/lib/server/review/security-headers.ts`

Aplican a **respuestas JSON (errores)** y **SSE (stream)**:

| Header                    | Valor                                      | Propósito                              |
| ------------------------- | ------------------------------------------ | -------------------------------------- |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains`      | HSTS — fuerza HTTPS                    |
| X-Content-Type-Options    | `nosniff`                                  | Impide MIME-type sniffing              |
| X-Frame-Options           | `DENY`                                     | Protección contra clickjacking         |
| Referrer-Policy           | `strict-origin-when-cross-origin`          | Controla info de referrer              |
| Permissions-Policy        | `geolocation=(), microphone=(), camera=()` | Bloquea acceso a features del navegador |

**SSE headers** (adicionales):

- Content-Type: `text/event-stream`
- Cache-Control: `no-cache, no-transform`
- Connection: `keep-alive`
- X-Accel-Buffering: `no` (evita que Netlify/proxies buffereen el stream)

**Helpers**:

- `withSecurityHeaders(specific)` combina security headers + headers específicos (JSON, SSE, etc.). Si hay clave repetida, gana el valor de `specific`.
- `jsonError(message, status, extraHeaders?, code?)` construye responses JSON `{ error, code? }` con los security headers ya aplicados. El `code` opcional permite al cliente distinguir tipos de error sin parsear el mensaje.

**CSP**: no se define en la function. La edge function `netlify/edge-functions/csp-nonce.ts` genera el header `Content-Security-Policy` con nonce dinámico en todas las respuestas HTML (`connect-src 'self'` cubre el fetch a `/api/review`). `netlify.toml` además aplica headers estáticos a `/*` (ver `deployment/platform.md`).

---

## Resumen de flujo completo

```
Solicitud entrante (POST /api/review)
    │
    ├──► Validador de origen (Capa 0) → 403 si no autorizado
    │
    ├──► Honeypot (Capa 1) → 200 silencioso si bot
    │
    ├──► Rate limit en memoria (Capa 2a) → 429 si >10/min por IP
    │
    ├──► Rate limit Blobs (Capa 2b) → 429 si >3/día por IP (tolerante a errores)
    │
    ├──► Validación diff (Capa 3) → 400 si inválido
    │
    ├──► Detect injection (Capa 4) → 400 + code: injection_detected + log
    │
    ├──► Sanitize input (Capa 5) → neutraliza vectores ocultos
    │
    ├──► OpenAI Responses API (Capa 6) → streaming SSE con usage
    │
    └──► Security headers (Capa 7) → todas las responses
```

## Referencias

- [Modelos de datos](database.md)
- [Plan de documentación](../_plan.md)
- [OpenAI Docs — Responses API](https://platform.openai.com/docs/api-reference/responses)
- [OWASP Secure Headers Project](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Headers_Cheat_Sheet.html)
