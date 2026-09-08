# AI Code Reviewer

Pega un unified diff y recibe un review técnico estructurado con severidad, categoría y fix sugerido, construido sobre la Responses API de OpenAI con JSON Schema estricto y streaming en vivo. Es el producto prioritario #1 del portafolio y demuestra criterio de ingeniería real, no "llamar a ChatGPT".

## ¿Qué es y por qué está aquí?

**Contexto de negocio**: El AI Code Reviewer es el proyecto prioritario #1 del portafolio personal de Ariel GonzAgüer. Fue implementado para demostrar criterio de ingeniería real al revisar código — no simplemente "llamar a ChatGPT", sino construir un sistema completo con patrones de seguridad adecuados, validación de input, streaming SSE y manejo de edge cases. Es 100% nuevo en el portafolio: no hay nada similar en la sección IA actual. Reutiliza los patrones de seguridad ya establecidos en el proyecto (honeypot, rate limit, injection detection, sanitization, origin check, security headers). El output visualmente impactante (findings con badges de color, verdict estilo GitHub) lo hace ideal para demos en vivo.

**Además de la transparencia de costo y clima**: desde los commits `61afc15`–`e423868`, la UI muestra el **costo API estimado en USD** (tarifas públicas del modelo) y el **impacto climático estimado en gCO₂e** (rango proxy por tokens), calculados con el uso real que la Responses API reporta al final del stream. Esto alinea la demo con el posicionamiento de sostenibilidad del portafolio.

## Cómo funciona (flujo técnico)

Diagrama ASCII del flujo completo, desde el trigger hasta el resultado:

```
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
   │   b. security anti-bot step
   │      │   paso que indentifica bots para evitar abuso
   │
   │   c. Rate limit secundario EN MEMORIA (10/min por IP) → 429 con Retry-After
   │      │   (corre primero; en serverless es soft, útil en dev)
   │      │
   │   d. Rate limit principal (3/día por IP via Netlify Blobs) → 429 con Retry-After
   │      │   (tolerante a errores: si Blobs falla, no bloquea la request)
   │
   │   e. Validar estructura del diff (validate-diff.ts): ≤50 KB, headers presentes, no binario
   │
   │   f. Detectar prompt injection (detect-injection.ts): RECHAZA con 400 + code: injection_detected
   │      │   (patrones flex() toleran snake_case, kebab-case y separadores variables)
   │
   │   g. Sanitizar input (sanitize.ts): escape triple backticks, quitar chars de control, truncar líneas a 2000 chars
   │
   │   h. Llamar a OpenAI Responses API: gpt-5.6-luna, SYSTEM_PROMPT, REVIEW_SCHEMA (json_schema, strict: true)
   │
   │   i. Devolver SSE: eventos delta → usage (tokens) → done, con security headers
   │
   ▼
5. Cliente: useReviewStream hook lee SSE vía ReadableStream.getReader()
   │   - Buffer de eventos: buffer.split('\n\n'), pop() último incompleto
   │   - Parsea JSON: {type: 'delta', text} | {type: 'usage', usage} | {type: 'done'} | {type: 'error'}
   │   - Estado acumulado: rawText, status, result, usage, error, code, cooldownUntil
   │   - Cooldown de prompt injection (6 min) persistido en localStorage para sobrevivir refresh
   │   - Cancelación: AbortController en abortRef; un request reemplazado por otro start() o anulado por reset() no toca el state
   │
   ▼
6. UI muestra resultado:
   │   - Verdict: Aprobar / Solicitar cambios / Solo comentarios (badges de color: green/red/white)
   │   - Summary: resumen ejecutivo (2-3 oraciones)
   │   - Findings: cards con severity (critical/high/medium/low/info), category, línea, título, explicación, fix
   │   - Impacto climático estimado: rango gCO₂e basado en totalTokens de la API
   │   - Costo API estimado: USD basado en input/output/cached/cache-write tokens reportados
   │   - Botón copy-to-clipboard del review como JSON
   │   - Countdown cooldown si code === 'injection_detected' o hay cooldown persistido activo (6 minutos)
   │
   ▼
7. Browser renderiza ReviewOutput con findings, verdict, syntax highlighting (shiki + DOMPurify), copy feedback
```

## Archivos involucrados

| Archivo                                          | Rol en esta funcionalidad                                                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/server/review/reviewRoute.ts`           | Handler principal (`handleReview`) con SSE y 7 capas de seguridad; emite evento `usage` desde `response.completed`                  |
| `src/lib/server/review/system-prompt.ts`         | System prompt del revisor (6 categorías, 5 severidades, reglas anti-genéricas)                                                      |
| `src/lib/server/review/review-schema.ts`         | JSON Schema estricto (CodeReview: summary, findings, verdict)                                                                       |
| `src/lib/server/review/validate-diff.ts`         | Valida estructura del diff: vacío, ≤50 KB, headers `--- a/` / `+++ b/`, no binario                                                  |
| `src/lib/server/review/sanitize.ts`              | Neutraliza vectores: escape ```, quita chars de control, trunca líneas a 2000 chars                                                 |
| `src/lib/server/review/detect-injection.ts`      | Detecta 7 patrones de prompt injection con `flex()` tolerante a separadores; el handler RECHAZA con 400 + `injection_detected`      |
| `src/lib/server/review/rate-limit.ts`            | Rate limit 3/día por IP via Netlify Blobs (tolerante a errores)                                                                     |
| `src/lib/server/review/in-memory-rate-limit.ts`  | Rate limit secundario en memoria: 10/min por IP                                                                                     |
| `src/lib/server/review/validate-origin.ts`       | Validador de origen CSRF (allowlist aditiva: dev + producción)                                                                      |
| `src/lib/server/review/security-headers.ts`      | Security headers + SSE headers + `jsonError` con `code` opcional                                                                    |
| `src/hooks/useReviewStream/useReviewStream.ts`   | Hook cliente: lectura incremental de SSE, parseo de `usage`, state management, cooldown persistido, cancelación con guard anti-race |
| `src/hooks/useReviewStream/types.ts`             | Tipos compartidos: `ReviewState`, `ReviewUsage`, `ReviewErrorCode`, `Finding`, etc.                                                 |
| `src/components/review-form/ReviewForm.tsx`      | Formulario: textarea, 3 ejemplos precargados, honeypot doble checkbox, countdown cooldown                                           |
| `src/components/review-form/ReviewWorkspace.tsx` | Orquesta form + hook + output; alert nativo y vaciado de textarea en injection                                                      |
| `src/components/review-output/ReviewOutput.tsx`  | Render del resultado: verdict, summary, findings cards, CO₂, costo API, copy-to-clipboard                                           |
| `src/components/review-output/CodeBlock.tsx`     | Syntax highlighting (shiki) + sanitización (DOMPurify) del fix                                                                      |
| `src/components/review-output/FindingCard.tsx`   | Tarjeta por finding: severity badge, category, línea, título, explicación, fix                                                      |
| `src/utils/co2/co2.ts`                           | `calculateReviewCO2Range(totalTokens)`: rango proxy gCO₂e                                                                           |
| `src/utils/review-cost/review-cost.ts`           | `REVIEW_MODEL_ID`, `formatReviewApiCostUSD(usage)`: costo estimado USD                                                              |
| `src/components/IA/IA.tsx`                       | Sección del portafolio: integra `IACard` con la entrada ai-code-reviewer de `proyectosIA`                                           |
| `src/data/proyectos.ts`                          | Datos: entrada `proyectosIA` (incluye ai-code-reviewer con tecnologías y enlace)                                                    |
| `src/pages/_api/api/review.ts`                   | API route fina: `POST` llama a `handleReview`; `GET` devuelve 405                                                                   |

## API / Interfaz pública

### `useReviewStream()` — Hook cliente

```typescript
// Retorna: { state, start, abort, reset }
interface ReviewState {
  status: 'idle' | 'loading' | 'streaming' | 'done' | 'error';
  rawText: string;
  result: ReviewResponse | null;
  usage: ReviewUsage | null;
  error: string | null;
  code: ReviewErrorCode | null;
  cooldownUntil: number | null;
}

start(diff: string, botTrap?: boolean): Promise<void>
// Inicia el fetch POST /api/review con AbortController
// Maneja: loading → streaming → done/error
// Features: cooldown 6 min en injection_detected persistido en localStorage, cancelación vía AbortController
// Antes de arrancar aborta el request previo: solo el más reciente es dueño del state

abort(): void
// Aborta la request en curso (cancelación manual); el state queda en error con "Cancelado"

reset(): void
// Reinicia el state a idle; anula el ref del controller para que el catch
// del stream abortado no pise el estado con "Cancelado"
```

**Cancelación y carreras**: `abortRef` guarda el `AbortController` del request vigente. Las continuaciones asíncronas de un request que ya no es vigente (reemplazado por otro `start()` o anulado por `reset()`) retornan sin tocar el state. Los puntos de guard son: catch del fetch, handler del error HTTP, antes del setState `streaming`, cada iteración del loop de lectura y catch del stream. El `abort()` manual sí escribe "Cancelado" porque el ref sigue apuntando al controller abortado. Los tests cubren los tres escenarios: doble `start()`, `reset()` durante un stream y `abort()` manual (`src/hooks/useReviewStream/useReviewStream.test.ts`).

### `ReviewUsage` — Uso de tokens reportado por la API

```typescript
interface ReviewUsage {
  inputTokens: number;
  cachedInputTokens?: number;
  cacheWriteInputTokens?: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
}
```

- `reasoningTokens` es un desglose de `outputTokens` (`usage.output_tokens_details.reasoning_tokens`), por lo que NO se suma de nuevo a `totalTokens`.
- El evento SSE `usage` llega desde `response.completed` en `reviewRoute.ts`.
- El hook valida con `isReviewUsage()` que todos los campos sean finitos y ≥ 0.

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

| Prop     | Tipo                  | Descripción                                                     | Requerido           |
| -------- | --------------------- | --------------------------------------------------------------- | ------------------- |
| `review` | `ReviewResponse`      | Objeto JSON con summary, verdict, findings                      | Sí                  |
| `usage`  | `ReviewUsage \| null` | Tokens reales reportados por la API para cálculo de CO₂ y costo | No (default `null`) |

### `Finding` (finding individual del review)

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

### Veredictos

| Verdict           | Etiqueta          | Estilo CSS                        |
| ----------------- | ----------------- | --------------------------------- |
| `approve`         | Aprobar           | `border-green-400 text-green-300` |
| `request_changes` | Solicitar cambios | `border-red-400 text-red-300`     |
| `comment`         | Solo comentarios  | `border-white/30 text-white/80`   |

## Dependencias externas

| Librería         | Versión        | Propósito                                                         |
| ---------------- | -------------- | ----------------------------------------------------------------- |
| `openai`         | `^7.7.0`       | Cliente oficial OpenAI (Responses API, streaming)                 |
| `@netlify/blobs` | `^11.0.1`      | Almacenamiento para rate limit diario (rate-limit.ts)             |
| `shiki`          | `^4.4.3`       | Syntax highlighting del fix en la UI (CodeBlock)                  |
| `dompurify`      | `^3.4.14`      | Sanitización del HTML de shiki antes de `dangerouslySetInnerHTML` |
| `react`          | `19.2.8`       | Framework UI                                                      |
| `react-dom`      | `19.2.8`       | Renderizador DOM                                                  |
| `waku`           | `1.0.0-beta.9` | Framework RSC + SSR                                               |

## Limitaciones y consideraciones

- **Costo de OpenAI**: modelo `gpt-5.6-luna`; la UI muestra costo estimado con tarifas públicas y tokens reales reportados por la API. El rate limit de 3 requests/día por IP evita gastos descontrolados en demo pública.
- **Cálculo de CO₂**: rango proxy basado en tokens (`0.15–2.85` gCO₂e por mil tokens), no una medición de OpenAI. El extremo alto se redondea de la estimación de Mistral. Debe revisarse si OpenAI publica factores propios.
- **Timeout de Netlify**: el stream tiene timeout de 60_000 ms en el cliente (`STREAM_TIMEOUT_MS`). Si el review es muy largo, el modelo puede cortar antes del límite del plan de Netlify.
- **CSP**: la edge function `netlify/edge-functions/csp-nonce.ts` incluye `connect-src 'self'`, que cubre el fetch a `/api/review` desde el mismo origen.
- **Prompt injection**: las 7 patrones con `flex()` toleran `snake_case`, `kebab-case` y separadores variables. El handler ahora RECHAZA la request (400 + `injection_detected`) en vez de solo loguear. Aun así, no se puede garantizar al 100% que un usuario no intente inyectar instrucciones.
- **Rate limit en memoria**: es por instancia de proceso; en serverless cada invocación puede ser una instancia distinta, así que en producción es soft (el límite diario de Blobs es el fuerte).
- **API key nunca en bundle**: `grep -r "sk-" dist/` da vacío en producción. La key solo vive en variables de entorno de Netlify.
- **Diffs > 50 KB**: se rechazan en la validación estructural (`validate-diff.ts`). Diffs legítimos rara vez exceden este límite. Nota: el texto de ayuda del form dice "Máximo 100 KB" (remanente de una versión anterior); la validación real es 50 KB.
- **Idioma**: el system prompt obliga a responder SIEMPRE en español.
- **No hay integración con GitHub API**: el MVP usa textarea para pegar diff manualmente. Cero secretos adicionales.

## Referencias

- [OpenAI Docs — Responses API](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI Cookbook — Structured outputs](https://cookbook.openai.com/examples/structured_outputs_intro)
- [Netlify Docs — Streaming function responses](https://docs.netlify.com/build/functions/streaming-functions/)
- [Netlify Docs — Blobs storage](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
- [OWASP Input Validation Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Backend - Seguridad](../backend/auth.md)
- [Modelos de datos](../backend/database.md)
- [Componentes UI](../components/overview.md)
- [Utilidades (CO₂ y costo)](../utils/overview.md)
- [Plan AI Code Reviewer](../../planes/01-ai-code-reviewer.md) — plan detallado con 12 fases
