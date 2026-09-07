# Diagrama de flujo de datos clave

## Resumen de flujos

| Flujo                   | Origen                    | Destino                        | Tecnología                         |
| ----------------------- | ------------------------- | ------------------------------ | ---------------------------------- |
| Página de inicio        | `src/data/proyectos.ts`   | HTML estático (SSG)            | Waku build (`render: 'static'`)    |
| AI Code Reviewer        | `ReviewForm` (cliente)    | `POST /api/review` (Netlify)   | fetch + SSE (ReadableStream)       |
| Stream del modelo       | OpenAI Responses API      | Cliente (`useReviewStream`)    | SSE: `delta` → `usage` → `done`    |
| Métricas de costo/clima | `usage` (evento SSE)      | `ReviewOutput` (UI)            | `review-cost.ts` + `co2.ts`        |
| Cooldown de seguridad   | Server (`injection_detected`) | `localStorage` (cliente)   | `review:injectionCooldownUntil`    |

## Flujo: Página de inicio (`/`)

```
Usuario → CDN/Netlify (HTML estático) → Browser
     ↓ (SSG: todo se genera en build)
Browser renderiza: Hero + Badge + Proyectos + IA + OpenSource + SobreMi + Certificados + Contacto
     ↓
Datos injectados en build desde src/data/proyectos.ts
     ↓
Componentes renderizan (única fuente de verdad)
```

## Flujo: AI Code Reviewer (`/review`)

```
1. Usuario visita /review (página estática, getConfig({ render: 'static' }))
   │
   ▼
2. Usuario pega unified diff en textarea y envía form
   │   (validación real: ≤ 50 KB, headers --- a/ y +++ b/)
   │
   ▼
3. POST /api/review desde el cliente (fetch, Content-Type: application/json)
   │
   ▼
4. Handler: src/lib/server/review/reviewRoute.ts — flujo de seguridad:
   │   a. Validar origen (CSRF allowlist via validate-origin.ts)
   │      │                       │
   │       allowlist default   env ALLOWED_ORIGINS (CSV opcional)
   │
   │   b. Honeypot check
   │      │   Si checkbox oculto "website" está marcado → bot → 200 silencioso
   │
   │   c. Rate limit EN MEMORIA (in-memory-rate-limit.ts)
   │      │   10 requests/min por IP → 429 con Retry-After (corre primero)
   │
   │   d. Rate limit PRINCIPAL (rate-limit.ts, Netlify Blobs)
   │      │   3 requests/día por IP → 429 con Retry-After
   │      │   key: rl:${ip}:yyyy-mm-dd  value: { count }
   │      │   (tolerante a errores de Blobs: no bloquea si falla)
   │
   │   e. Validar estructura del diff (validate-diff.ts)
   │      │   - No vacío
   │      │   - ≤ 50 KB (MAX_DIFF_BYTES = 50_000)
   │      │   - Headers --- a/ y +++ b/ presentes
   │      │   - No binario (/^Binary files /m)
   │
   │   f. Detectar prompt injection (detect-injection.ts) → RECHAZA
   │      │   7 patrones flex() tolerantes a snake/kebab-case:
   │      │   ignore-previous, system-tag, role-override, dan-jailbreak,
   │      │   developer-mode, reveal-prompt, disregard-rules
   │      │   → 400 con code: injection_detected + log (labels, IP, diffLength)
   │
   │   g. Sanitizar input (sanitize.ts)
   │      │   - Escape triple backticks ``` → ʼʼʼ (Unicode)
   │      │   - Quitar chars de control (ej: NUL, BEL)
   │      │   - Truncar líneas a 2000 chars (anti token-stuffing)
   │
   │   h. Llamar a OpenAI Responses API (createStream)
   │      │   - modelo: gpt-5.6-luna (REVIEW_MODEL_ID)
   │      │   - instructions: SYSTEM_PROMPT
   │      │   - text.format: json_schema con REVIEW_SCHEMA, strict: true
   │      │   - timeout: 60_000 ms (STREAM_TIMEOUT_MS)
   │
   │   i. Devolver SSE response (createSSEResponse)
   │      │   - Eventos: {type:'delta', text} → {type:'usage', usage} → {type:'done'}
   │      │   - usage viene de response.completed: inputTokens, cachedInputTokens,
   │      │     cacheWriteInputTokens, outputTokens, reasoningTokens, totalTokens
   │      │   - Headers: SSE_HEADERS + SECURITY_HEADERS
   │
   ▼
5. Cliente: useReviewStream hook lee SSE vía ReadableStream.getReader()
   │   - Buffer de eventos: buffer.split('\n\n'), pop() último incompleto
   │   - Parsea JSON: delta | usage | done | error
   │   - Estado acumulado: rawText, status, result, usage, error, code, cooldownUntil
   │   - isReviewUsage() valida tokens finitos y ≥ 0
   │   - Cooldown de injection (6 min) persistido en localStorage
   │     (key: review:injectionCooldownUntil)
   │
   ▼
6. UI muestra resultado:
   │   - Verdict: Aprobar / Solicitar cambios / Solo comentarios
   │   - Summary: resumen ejecutivo (2-3 oraciones)
   │   - Findings: cards con severity (critical/high/medium/low/info), category, line, title, explanation, fix
   │   - Impacto climático estimado: calculateReviewCO2Range(totalTokens) → rango gCO₂e
   │   - Costo API estimado: formatReviewApiCostUSD(usage) → USD (tarifas públicas)
   │   - Botón copy-to-clipboard del review como JSON
   │   - Countdown cooldown si code === 'injection_detected' (6 min)
   │
   ▼
7. Browser renderiza ReviewOutput con findings, verdict badges, syntax highlighting (shiki + DOMPurify)
```

## Diagrama ASCII: Flujo completo AI Code Reviewer

```
┌─────────────────────┐              ┌─────────────────────┐
│       Cliente       │              │   Netlify Function  │
│  (browser)          │              │  (POST /api/review) │
│  + ReviewForm       │              │  + validate-origin  │
│  + ReviewWorkspace  │              │  + honeypot         │
│  + useReviewStream  │              │  + in-memory-limit  │
│                     │────────────→│  + rate-limit (Blobs)│
│ 1. Pegar diff       │              │  + validate-diff    │
│ 2. Submit form      │              │  + detect-injection │
│   │                 │              │  + sanitize         │
│   │ 3. fetch POST   │              │  + createStream     │
│   │                 │              │  + createSSEResponse│
│   │                 │              │  + OpenAI API       │
│   ▼                 │              │  ▼                  │
│ 4. Leer SSE events  │◄─────────────│ 5. Stream response  │
│    delta/usage/done │              │    + security hdrs  │
│ 5. Parsear JSON     │              │                     │
│ 6. Mostrar UI       │              │                     │
│    (verdict,        │              │                     │
│     findings,       │              │                     │
│     CO₂ + costo)    │              │                     │
└─────────────────────┘              └─────────────────────┘
```

## Referencias

- [Arquitectura general](overview.md)
- [AI Code Reviewer](../features/ai-code-reviewer.md)
- [Capas de seguridad](../backend/auth.md)
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
