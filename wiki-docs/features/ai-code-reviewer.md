# AI Code Reviewer

Una oración que explica qué hace y por qué es relevante en este proyecto:
Pega un unified diff y recibe un review técnico estructurado con severidad, categoría y fix sugerido, construido sobre la Responses API de OpenAI con JSON Schema estricto y streaming en vivo. Es el producto prioritario #1 del portafolio y demuestra criterio de ingeniería real, no "llamar a ChatGPT".

## ¿Qué es y por qué está aquí?

**Contexto de negocio**: El AI Code Reviewer es el proyecto prioritario #1 del portafolio personal de Ariel GonzAgüer. Fue implementado para demostrar criterio de ingeniería real al revisar código — no simplemente "llamar a ChatGPT", sino construir un sistema completo con patrones de seguridad adecuados, validación de input, streaming SSE y manejo de edge cases. Es 100% nuevo en el portafolio: no hay nada similar en la sección IA actual. Reutiliza los patrones de seguridad ya establecidos en el proyecto (honeypot, rate limit, injection detection, sanitization, origin check, security headers), por lo que el patrón de seguridad y la estructura de la function son conocidos. El output visualmente impactante (findings con badges de color, verdict estilo GitHub) lo hace ideal para demos en vivo.

**Por qué este primero** (de las 3 opciones consideradas):

- Demuestra criterio de ingeniería real, no "llamar a ChatGPT".
- Es 100 % nuevo en el portafolio: no hay nada similar en la sección IA actual.
- Reutiliza la skill `chatbot-openai-builder` que ya tienes registrada, así que el patrón de seguridad y la estructura de la function son conocidos.
- Output visualmente impactante para demos en vivo (findings con badges de color, verdict estilo GitHub).

## Cómo funciona (flujo técnico)

Diagrama ASCII del flujo completo, desde el trigger hasta el resultado:

````
1. Usuario visita /review (página estática, SSR/SSG)
   │
   ▼
2. Usuario pega unified diff en textarea y envía form
   │   (max 50 KB, headers --- a/ y +++ b/ obligatorios)
   │
   ▼
3. POST /api/review desde el cliente (fetch, Content-Type: application/json)
   │   - Diff en body JSON: { diff: string, website: boolean (honeypot) }
   │
   ▼
4. Handler: src/lib/server/review/reviewRoute.ts — flujo de seguridad (7 capas):
   │   a. Validar origen (CSRF allowlist via validate-origin.ts)
   │      │                       │
   │       allowlist default   env ALLOWED_ORIGINS (CSV opcional)
   │
   │   b. Honeypot check
   │      │   Si checkbox oculto "website" está marcado → bot → 200 silencioso
   │
   │   c. Rate limit (3/día por IP via Netlify Blobs + secondary 10/min en memoria)
   │
   │   d. Validar estructura del diff (validate-diff.ts): ≤50 KB, headers presentes, no binario
   │
   │   e. Detectar prompt injection (detect-injection.ts): 7 patrones → log + 400 con code: injection_detected
   │
   │   f. Sanitizar input (sanitize.ts): escape triple backticks, quitar chars de control, truncar líneas a 2000 chars
   │
   │   g. Llamar a OpenAI Responses API: gpt-5.6-luna, SYSTEM_PROMPT, REVIEW_SCHEMA (json_schema, strict: true)
   │
   │   h. Devolver SSE response con security headers (SSE_HEADERS)
   │
   ▼
5. Cliente: useReviewStream hook lee SSE vía ReadableStream.getReader()
   │   - Buffer de eventos: buffer.split('\n\n'), pop() último incompleto
   │   - Parsea JSON: {type: 'delta', text} | {type: 'done'} | {type: 'error'}
   │   - Estado acumulado: rawText, status, result, error, code, cooldownUntil
   │   - Cooldown de prompt injection persistido en localStorage para sobrevivir refresh
   │
   ▼
6. UI muestra resultado:
   │   - Verdict: Aprobar / Solicitar cambios / Solo comentarios (badges de color: green/red/white)
   │   - Summary: resumen ejecutivo (2-3 oraciones)
   │   - Findings: cards con severity (critical/high/medium/low/info), category, línea, título, explicación, fix
   │   - Impacto climático estimado: rango gCO₂e basado en totalTokens de la API
   │   - Costo API estimado: USD basado en input/output/cached tokens reportados
   │   - Botón copy-to-clipboard del review como JSON
   │   - Countdown cooldown si code === 'injection_detected' o hay cooldown persistido activo (6 minutos)
   │
   ▼
7. Browser renderiza ReviewOutput con findings, verdict, syntax highlighting (shiki), copy feedback

## Archivos involucrados

| Archivo | Rol en esta funcionalidad |
| ------- | ----------- |
| `src/lib/server/review/reviewRoute.ts` | Handler principal (handleReview) con SSE, 7 capas de seguridad |
| `src/lib/server/review/system-prompt.ts` | System prompt del revisor (6 categorías, 5 severidades, reglas anti-genéricas) |
| `src/lib/server/review/review-schema.ts` | JSON Schema estricto (CodeReview: summary, findings, verdict) |
| `src/lib/server/review/validate-diff.ts` | Valida estructura del diff: vacío, ≤50 KB, headers --- a/ / +++ b/, no binario |
| `src/lib/server/review/sanitize.ts` | Neutraliza vectores: escape ```, quita chars de control, truncar líneas a 2000 chars |
| `src/lib/server/review/detect-injection.ts` | Detecta 7 patrones de prompt injection (loguea, no rechaza) |
| `src/lib/server/review/rate-limit.ts` | Rate limit 3/día por IP via Netlify Blobs |
| `src/lib/server/review/validate-origin.ts` | Validador de origen CSRF (allowlist aditiva: dev + producción) |
| `src/lib/server/review/security-headers.ts` | Security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) + SSE headers |
| `src/hooks/useReviewStream/useReviewStream.ts` | Hook cliente: lectura incremental de SSE, parseo, state management, cooldown |
| `src/components/review-form/ReviewForm.tsx` | Formulario: textarea, 3 ejemplos precargados, honeypot doble checkbox, countdown cooldown |
| `src/components/review-output/ReviewOutput.tsx` | Render del resultado: verdict, summary, findings cards, CO₂, costo API, copy-to-clipboard |
| `src/components/IA/IA.tsx` | Sección del portafolio: integra IACard con la entrada ai-code-reviewer de proyectosIA |
| `src/data/proyectos.ts` | Datos: entrada proyectosIA (incluye ai-code-reviewer con tecnologías y enlace) |
| `src/pages/_api/api/review.ts` | API route fina: POST handler que llama a handleReview |
| `public/tipografias/Lexend_Mega/Lexend_Mega.woff2` | Fuente display para headings (Lexend_Mega) |

## API / Interfaz pública

### `useReviewStream()` — Hook cliente

```typescript
// Retorna: { state, start, abort, reset }
// State: { status: 'idle' | 'loading' | 'streaming' | 'done' | 'error', rawText, result, error, code, cooldownUntil }

start(diff: string, botTrap?: boolean): Promise<void>
// Inicia el fetch POST /api/review con AbortController
// Maneja: loading → streaming → done/error
// Features: cooldown 6 min en injection_detected persistido en localStorage, AbortController para cancelar

abort(): void
// Aborta la request en curso

reset(): void
// Reinicia el state a idle
````

### `ReviewForm` props

| Prop              | Tipo                                       | Descripción                                                                           | Requerido |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | --------- |
| `diff`            | `string`                                   | Texto del unified diff que el usuario pegó                                            | Sí        |
| `onDiffChange`    | `(diff: string) => void`                   | Callback cuando el usuario escribe en el textarea                                     | Sí        |
| `onSubmit`        | `(diff: string, botTrap: boolean) => void` | Callback al submit del formulario                                                     | Sí        |
| `onExampleSelect` | `(example: ExampleDiff) => void`           | Callback al seleccionar un ejemplo precargado                                         | Sí        |
| `isLoading`       | `boolean`                                  | Estado de loading global                                                              | Sí        |
| `cooldownUntil`   | `number \| null`                           | Timestamp (ms epoch) hasta que el botón queda deshabilitado por cooldown de seguridad | Sí        |

### `ReviewOutput` props

| Prop     | Tipo                  | Descripción                                                     | Requerido |
| -------- | --------------------- | --------------------------------------------------------------- | --------- |
| `review` | `ReviewResponse`      | Objeto JSON con summary, verdict, findings                      | Sí        |
| `usage`  | `ReviewUsage \| null` | Tokens reales reportados por la API para cálculo de CO₂ y costo | No        |

### `Finding` (individual finding del review)

```typescript
interface Finding {
  id: string; // Ej: 'SEC-1', 'PERF-2', 'A11Y-1'
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category:
    | 'security'
    | 'performance'
    | 'type_safety'
    | 'accessibility'
    | 'correctness'
    | 'maintainability';
  line: string; // Ej: 'L42' o 'L42-L47'
  title: string; // Título corto (≤80 chars)
  explanation: string; // Por qué importa concretamente
  fix: string; // Código corregido, no pseudocódigo
}
```

### Vértices de verdict

| Verdict           | Etiqueta          | Estilo CSS                        |
| ----------------- | ----------------- | --------------------------------- |
| `approve`         | Aprobar           | `border-green-400 text-green-300` |
| `request_changes` | Solicitar cambios | `border-red-400 text-red-300`     |
| `comment`         | Solo comentarios  | `border-white/30 text-white/80`   |

## Dependencias externas

| Librería         | Versión        | Propósito                                            |
| ---------------- | -------------- | ---------------------------------------------------- |
| `openai`         | `^7.7.0`       | Cliente oficial OpenAI (Responses API)               |
| `@netlify/blobs` | `^11.0.1`      | Almacenamiento para rate limit (rate-limit.ts)       |
| `shiki`          | `^4.4.3`       | Syntax highlighting del diff en la UI (ReviewOutput) |
| `react`          | `19.2.8`       | Framework UI                                         |
| `react-dom`      | `19.2.8`       | Renderizador DOM                                     |
| `waku`           | `1.0.0-beta.9` | Framework RSC + SSR                                  |

## Limitaciones y consideraciones

- **Costo de OpenAI**: modelo `gpt-5.6-luna`; la UI muestra costo estimado con tarifas públicas y tokens reales reportados por la API. El rate limit de 3 requests/día por IP evita gastos descontrolados en demo pública.
- **Timeout de Netlify**: free plan tiene límite de 26s por function; Pro plan 60s. El stream tiene timeout de 60_000 ms en el cliente. Si el review es muy largo, el modelo puede cortar antes.
- **Stream cortado a mitad**: detectar `done === true` sin evento `done` → mostrar error al usuario.
- **CSP**: el edge function `csp-nonce` permite `connect-src 'self'`, lo cual cubre el fetch a `/api/review` desde el mismo origen. No se necesita configuración adicional.
- **Prompt injection**: a pesar del sanitizer y detector, no se puede garantizar al 100% que un usuario no intente inyectar instrucciones. Las 7 patrones cubren los casos obvios; las variantes `snake_case`/`kebab-case` son una mejora pendiente.
- **API key nunca en bundle**: `grep -r "sk-" dist/` da vacío en producción. La key solo vive en variables de entorno de Netlify.
- **Diffs > 50 KB**: se rechazan en la validación estructural (`validate-diff.ts`). Diffs legítimos rara vez exceden este límite.
- **Idioma**: el system prompt obliga a responder SIEMPRE en español; el modelo `gpt-5.6-luna` sigue esta instrucción de forma fiable.
- **No hay integración con GitHub API**: el MVP usa textarea para pegar diff manualmente. Cero líneas extra de backend, cero secretos adicionales (GitHub API requiere PAT o OAuth).

## Referencias

- [OpenAI Docs — Responses API](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI Cookbook — Structured outputs](https://cookbook.openai.com/examples/structured_outputs_intro)
- [Netlify Docs — Streaming function responses](https://docs.netlify.com/build/functions/streaming-functions/)
- [Netlify Docs — Blobs storage](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
- [qodo-ai/pr-agent](https://github.com/qodo-ai/pr-agent) — referencia open source de AI PR review
- [CodeRabbit blog](https://www.coderabbit.ai/blog) — patrones de review con JSON estructurado
- [OWASP Input Validation Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Plan AI Code Reviewer - planes/01-ai-code-reviewer.md](planes/01-ai-code-reviewer.md) — plan detallado con 12 fases
