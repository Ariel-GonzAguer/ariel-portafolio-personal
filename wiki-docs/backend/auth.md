# Capas de seguridad

El AI Code Reviewer implementa **7 capas de seguridad en orden**, cada una actúa como filtro antes de pasar al siguiente paso. Si cualquier capa rechaza la request, el proceso se detiene y no se gasta un token de OpenAI.

## Portada: Capa 0 - Origin check (CSRF)

**Archivo**: `src/lib/server/review/validate-origin.ts`

- Compara el header `Origin` de la request contra una allowlist.
- Allowlist **aditiva**: los orígenes por defecto (dev + producción) **SIEMPRE** se permiten.
- `ALLOWED_ORIGINS` (env var CSV) agrega orígenes extra.
- Si no hay header `origin` → rechazar (403).
- Orígenes locales (`localhost:3000`, `127.0.0.1`) en modo `development` → permitir.
- Dominios de producción por defecto: `https://arielgonzaguer.gatorojolab.com`, `https://arielgonzaguer.dev`.

**Headers de respuesta asociados**: `withSecurityHeaders` (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy).

---

## Capa 1: Honeypot anti-bot

**Archivo**: `reviewRoute.ts` (líneas 48-53)

- Checkbox oculto `<input type="checkbox" name="website">` que los bots marcan pero los humanos no ven.
- Si el backend recibe `website: true` → devolver `200` silencioso sin gastar tokens de OpenAI.
- **Propósito**: disuadir iteración rápida de bots sin el overhead de reCAPTCHA.

---

## Capa 2: Rate limit por IP

**Archivo**: `src/lib/server/review/rate-limit.ts`

- Política: **3 requests por día por IP** (ventana UTC).
- Key: `rl:${ip}:${yyyy-mm-dd}` (fecha en UTC, expira naturalmente).
- Usa [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).
- Si el contador ≥ 3 → devolver `429` con header `Retry-After` (segundos hasta el próximo `00:00:00 UTC`).
- **Red de seguridad**: rate limit secundario en memoria (`in-memory-rate-limit.ts`): 10 requests/min como respaldo si Blobs falla (ej. dev local sin contexto Netlify).

**Headers asociados**: `Retry-After` en segundos.

---

## Capa 3: Validación de estructura del diff

**Archivo**: `src/lib/server/review/validate-diff.ts`

- Reglas (todas rechazan con 400):
  1. No vacío
  2. ≤ 50 KB (reduzco de 100 KB para limitar superficie de ataque)
  3. Headers `--- a/` y `+++ b/` presentes
  4. No es binario (patrón `^Binary files `)
- **Propósito**: rechazar antes de gastar tokens en OpenIA input inválido.

---

## Capa 4: Detección de prompt injection

**Archivo**: `src/lib/server/review/detect-injection.ts`

- **No rechaza la request** — solo **loga** el intento para auditoría y métricas.
- 7 patrones de detección (bandera `i`):
  1. `ignore-previous` (y variantes: `ignore all previous instructions`)
  2. `<system>` (tags `<system>`)
  3. `role-override` (`you are now`)
  4. `dan-jailbreak` (patrón `\bDAN\b`)
  5. `developer-mode` (`developer mode` / `system mode`)
  6. `reveal-prompt` (`reveal the prompt` / `reveal initial prompt`)
  7. `disregard-rules` (`disregard all previous rules`)
- Cada match incluye: `label`, `index`, `match`.
- Se hace `console.warn` con labels, IP, y preview del match (máx 200 chars).
- **Flujo en reviewRoute.ts**: tras sanitize, se llama `detectInjection(body.diff)`; si hay matches → devolver 400 con mensaje `"Se detectó un intento de inyección de prompt. Tu solicitud no será procesada."` y `code: injection_detected`.

**Importante**: El sanitizer (`sanitize.ts`) ya neutraliza la mayoría de vectores (backticks, control chars, líneas largas). Este detector captura los intentos obvios para logs.

---

## Capa 5: Sanitización del input al LLM

**Archivo**: `src/lib/server/review/sanitize.ts`

Neutraliza vectores obvios sin romper diffs legítimos:

| Regla                                       | Implementación                                                 |
| ------------------------------------------- | -------------------------------------------------------------- |
| Escape triple backticks ``` → ʼʼʼ (Unicode) | `escapeTripleBackticks()`                                      |
| Quitar chars de control excepto `\n \t \r`  | `stripControlChars()` regex `[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]` |
| Truncar líneas a 2000 chars                 | `truncateLongLines()` (previene token stuffing)                |

**Limitación conocida**: variantes con `snake_case` o `kebab-case` (ej: `ignore_previous_instructions`) NO son detectadas por las regex actuales de `detect-injection`. Mejora pendiente.

---

## Capa 6: OpenAI Responses API con JSON Schema estricto

**Archivo**: `src/lib/server/review/reviewRoute.ts` (líneas 140-165)

- Modelo: `gpt-5.6-luna`
- System prompt: `SYSTEM_PROMPT` (define 6 categorías, 5 severidades, reglas anti-genéricas)
- Input: `text.format: { type: "json_schema", name: "CodeReview", schema: REVIEW_SCHEMA, strict: true }`
- Timeout: 60 000 ms (evita colgar request serverless)
- **API key nunca en bundle**: solo `process.env.OPENAI_API_KEY` server-side (Netlify env variables).

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
| Permissions-Policy        | `geolocation=(), microphone=(), camera=()` | Bloquea acceso afeatures del navegador |

**SSE headers** (adicionales):

- Content-Type: `text/event-stream`
- Cache-Control: `no-cache, no-transform`
- Connection: `keep-alive`
- X-Accel-Buffering: `no` (evita que Netlify/proxies buffereen el stream)

**Función helper**: `withSecurityHeaders(specific)` combina headers de seguridad + headers específicos (JSON, SSE, etc.). Si hay clave repetida, gana el valor de `specific`.

---

## Referencias

- [Documento relacionado](backend/database.md)
- [Plan original](_plan.md)
- [OpenAI Docs — Responses API](https://platform.openai.com/docs/api-reference/responses)
- [OWASP Secure Headers Project](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Headers_Cheat_Sheet.html)

---

## Resumen de flujo completo

```
Solicitud entrante
    │
    ├──► Validador de origen (Capa 0) → 403 si no autorizado
    │
    ├──► Honeypot (Capa 1) → 200 silencioso si bot
    │
    ├──► Rate limit (Capa 2) → 429 si >3/día IP
    │
    ├──► Validación diff (Capa 3) → 400 si inválido
    │
    ├──► Detect injection (Capa 4) → 400 + log si patrón detectado
    │
    ├──► Sanitize input (Capa 5) → neutraliza vectores ocultos
    │
    ├──► OpenAI Responses API (Capa 6) → streaming SSE
    │
    └──► Security headers (Capa 7) → todas las responses
```
