# Diagrama de flujo de datos clave

## Flujo: Página de inicio (`/`)

```
Usuario → CDN/Netlify (HTML estático) → Browser
     ↓ (SSR/SSG null)
Browser renderiza: Hero + Proyectos + IA + OpenSource + SobreMi + Certificados + Contacto
     ↓
Datos injectados en build desde src/data/proyectos.ts
     ↓
Componentes renderizan con props (única fuente de verdad)
```

## Flujo: AI Code Reviewer (`/review`)

````
1. Usuario visita /review (página estática, getConfig({ render: 'static' }))
   │
   ▼
2. Usuario pega unified diff en textarea y envía form
   │   (diff puede tener hasta 50 KB, con headers --- a/ y +++ b/)
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
   │   c. Rate limit (3/día por IP via Netlify Blobs)
   │      │                       │
   │       key: rl:${ip}:yyyy-mm-dd  count: número de requests hoy
   │
   │   d. Validar estructura del diff (validate-diff.ts)
   │      │   - No vacío
   │      │   - ≤ 50 KB
   │      │   - Headers --- a/ y +++ b/ presentes
   │      │   - No binario
   │
   │   e. Detectar prompt injection (detect-injection.ts)
   │      │   6 patrones: ignore-previous, system-tag, role-override,
   │      │   dan-jailbreak, developer-mode, reveal-prompt, disregard-rules
   │      │   → Loguea y devuelve 400 con code: injection_detected
   │
   │   f. Sanitizar input (sanitize.ts)
   │      │   - Escape triple backticks ``` → ʼʼʼ (Unicode)
   │      │   - Quitar chars de control (ej: NUL, BEL)
   │      │   - Truncar líneas a 2000 chars (anti token-stuffing)
   │
   │   g. Llamar a OpenAI Responses API
   │      │   - modelo: gpt-5.6-luna
   │      │   - instructions: SYSTEM_PROMPT
   │      │   - input: [{role: 'user', content: `Diff: ${safeDiff}`}]
   │      │   - text.format: json_schema con REVIEW_SCHEMA, strict: true
   │      │   - timeout: 60_000 ms
   │
   │   h. Devolver SSE response con security headers (SSE_HEADERS)
   │      │   - Content-Type: text/event-stream
   │      │   - Cache-Control: no-cache, no-transform
   │      │   - X-Accel-Buffering: no
   │      │   - Security headers: HSTS, X-Content-Type-Options, etc.
   │
   ▼
5. Cliente: useReviewStream hook lee SSE vía ReadableStream.getReader()
   │   - Buffer de eventos: buffer.split('\n\n'), pop() último incompleto
   │   - Parsea JSON: {type: 'delta', text: string} | {type: 'done'} | {type: 'error'}
   │   - Estado acumulado: rawText, status, result, error, code, cooldownUntil
   │
   ▼
6. UI muestra resultado:
   │   - Verdict: Aprobar / Solicitar cambios / Solo comentarios
   │   - Summary: resumen ejecutivo (2-3 oraciones)
   │   - Findings: cards con severity (critical/high/medium/low/info), category, line, title, explanation, fix
   │   - Impacto climático estimado: rango gCO₂e basado en totalTokens de la API
   │   - Botón copy-to-clipboard del review como JSON
   │   - Countdown cooldown si code === 'injection_detected' (6 min)
   │
   ▼
7. Browser renderiza ReviewOutput con findings, verdict badges, syntax highlighting (shiki)
````

## Diagrama ASCII: Flujo completo AI Code Reviewer

```
┌─────────────────────┐              ┌─────────────────────┐
│       Cliente       │              │   Netlify Function  │
│  (browser)          │              │  (POST /api/review) │
│  + ReviewForm       │              │  + rate-limit.ts    │
│  + useReviewStream  │────────────→│  + validate-diff.ts │
│                     │              │  + detect-injection│
│ 1. Pegar diff       │              │  + sanitize.ts     │
│ 2. Submit form      │              │  + detect-origin.ts│
│   │                 │              │  + reviewRoute.ts   │
│   │ 3. fetch POST   │              │  + OpenAI API       │
│   │                 │              │  + SSE + headers    │
│   │                 │              │  + createSSEResponse│
│   ▼                 │              │  ▼                 │
│ 4. Leer SSE events  │◄───────────│ 5. Stream response │
│ 5. Parsear JSON     │              │ 6. Eventos: delta  │
│ 6. Mostrar UI       │              │ 7. Eventos: done   │
│   (verdict, findings│              │ 8. Eventos: error  │
│    + CO₂)           │              │    + usage         │
 └─────────────────────┘              └─────────────────────┘
  ---

  ## Referencias

  - [Arquitectura general](architecture/overview.md)
  - [Flujo de datos](data-flow.md)
  - [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
```
