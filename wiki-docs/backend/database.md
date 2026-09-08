# Modelos de datos y base de datos

## `src/data/proyectos.ts` — Single source of truth

Este archivo es la **única fuente de verdad** para los datos del portafolio. Los componentes solo consumen y renderizan; la lógica de negocio o persistencia no reside aquí.

### Interfaces definidas

#### `Proyecto` — Proyectos destacados (no IA)

```typescript
export interface Proyecto {
  id: string; // Identificador único (ej: 'superkeg', 'gluten-corp')
  nombre: string; // Nombre del proyecto
  descripcion: string; // Descripción corta
  tecnologias: string[]; // Tecnologías usadas (ej: ['React', 'Zustand', 'Firebase'])
  enlace: string; // URL de demo (siempre https://...)
  repositorio?: string; // URL del repositorio público (opcional, solo cuando código es público)
  rol: string; // Rol del autor (ej: 'Product Engineer', 'Frontend/Product Engineer')
  impacto: string; // Impacto real del proyecto
  enfoque: string[]; // Enfoques principales (ej: ['SaaS', 'Estado global', 'UX operativa'])
  img: string; // Ruta de imagen (/imagenes/proyectos/...)
  lang: 'es' | 'en'; // Idioma del proyecto
}
```

#### `ProyectoIA` — Experiencias con IA/LLM

```typescript
export interface ProyectoIA {
  id: string;
  nombre: string;
  tipo: 'Producto con IA' | 'Chatbot LLM' | 'Workflow de agentes';
  descripcion: string;
  tecnologias: string[];
  enlace?: string; // Solo si es público
}
```

#### `RepoOpenSource` — Repositorios públicos verificables

```typescript
export interface RepoOpenSource {
  id: string;
  nombre: string;
  tipo: 'Librería npm' | 'Aplicación open source' | 'Laboratorio de IA' | 'Skills y agentes';
  descripcion: string;
  tecnologias: string[];
  enlace: string;
  licencia?: string; // Ej: 'MIT + Commons Clause'
}
```

### Datos existentes

#### `proyectos` (4 productos reales)

| ID            | Nombre           | Tecnologías                       | Enfoque                           | Impacto                                                                                                                   |
| ------------- | ---------------- | --------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `superkeg`    | SUPER KEG        | React, Zustand, Waku, Firebase    | SaaS, Estado global, UX operativa | Producto SaaS real en uso diario: dominio operativo complejo, inventario en tiempo real y flujos de estado avanzados.     |
| `gluten-corp` | Gluten Corp      | React, Zustand, Sonner, Firebase  | Flujo de compra, Estado global    | Arquitectura de estado compleja con flujo de compra completo e integración bidireccional con panel administrativo propio. |
| `shuttle506`  | Shuttle 506 Jaco | Astro, React, EmailJS             | SEO, Conversión, Performance      | Alta performance y flujo de conversión directo que genera contactos reales para el negocio.                               |
| `pasaporte`   | Pasaporte.app    | Waku, TailwindCSS, QRCode, Motion | QR, Mobile-first, Eventos         | Producto físico-digital: integración QR y UX mobile-first pensada para miles de asistentes por evento.                    |

#### `proyectosIA` (5 experiencias con IA)

| ID                   | Nombre                        | Tipo                | Tecnologías                                               | Enlace                                               |
| -------------------- | ----------------------------- | ------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| `monthly-cat-friend` | Monthly Cat Friend            | Producto con IA     | OpenAI SDK, Waku, Firebase, PWA                           | (privado)                                            |
| `mandarino`          | Mandarino                     | Chatbot LLM         | OpenAI API, Netlify Functions, React                      | https://gatorojolab.com                              |
| `skills-agentes`     | Skills y workflows de agentes | Workflow de agentes | OpenCode, CommandCode, Skills, MCP                        | https://github.com/Ariel-GonzAguer/skills-and-agents |
| `ai-code-reviewer`   | AI Code Reviewer              | Producto con IA     | OpenAI Responses API, Waku, Netlify Functions, TypeScript | https://arielgonzaguer.gatorojolab.com/review        |
| `patchwork`          | Patchwork - WebMCP            | Producto con IA     | WebMCP, OpenAI, Google, Michi-Router                      | https://patchwork-webmcp-challenge.netlify.app/      |

#### `openSource` (4 repositorios públicos verificables)

| ID                       | Nombre                 | Tipo                   | Tecnologías                              | Licencia                                             |
| ------------------------ | ---------------------- | ---------------------- | ---------------------------------------- | ---------------------------------------------------- |
| `michi-router`           | michi-router           | Librería npm           | TypeScript, React, npm, Vitest           | Ver repo                                             |
| `comida-emergencia`      | ComidaEmergencia       | Aplicación open source | React, Zustand, Firebase, OpenAI, Vitest | MIT + Commons Clause                                 |
| `comparacion-de-modelos` | Comparación de modelos | Laboratorio de IA      | LLMs, OpenCode, MCP, Waku                | Ver repo                                             |
| `skills-and-agents`      | Skills & Agents        | Skills y agentes       | OpenCode, LLMs, Skills, Agentes, MCP     | https://github.com/Ariel-GonzAguer/skills-and-agents |

### Flujo de datos en la aplicación

```
Build time (SSG):
  src/data/proyectos.ts ──► index.tsx / IA.tsx / OpenSource.tsx
                                 │
                                 ▼
                        HTML estático servido por Netlify

Runtime (solo AI Code Reviewer):
  /review (estática) ──► ReviewWorkspace ──► POST /api/review (SSE)
```

1. **Build time**: `proyectos.ts` se lee y los datos se injectan en los componentes durante el build estático.
2. **Página de inicio** (`/`): `index.tsx` compone todas las secciones (Hero, Badge, Proyectos, IA, OpenSource, SobreMi, Certificados, Contacto).
3. **Sección Proyectos**: `Proyectos.tsx` mapea `proyectos` y renderiza `ProyectoCard` por cada uno.
4. **Sección IA**: `IA.tsx` mapea `proyectosIA` y renderiza `IACard` por cada uno.
5. **Sección Open Source**: `OpenSource.tsx` mapea `openSource` y renderiza cards de cada repositorio.

## Flujo de datos del AI Code Reviewer (estado del cliente)

El estado del hook `useReviewStream` (definido en `src/hooks/useReviewStream/types.ts`) tiene esta estructura:

```typescript
interface ReviewState {
  status: 'idle' | 'loading' | 'streaming' | 'done' | 'error';
  rawText: string; // Texto completo recibido del stream (JSON parseado al final)
  result: ReviewResponse | null; // Objeto JSON final (summary, findings, verdict)
  usage: ReviewUsage | null; // Tokens reportados por la API en el evento usage
  error: string | null; // Mensaje de error si falló
  code: ReviewErrorCode | null; // Código de error estable (ej: 'injection_detected')
  cooldownUntil: number | null; // Timestamp (ms) hasta el cual el envío queda bloqueado; se restaura desde localStorage si sigue activo
}
```

### `ReviewUsage` (evento `usage` del SSE)

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

- `reasoningTokens` es un desglose de `outputTokens` (`usage.output_tokens_details.reasoning_tokens`), NO se suma de nuevo a `totalTokens`.
- `cachedInputTokens` y `cacheWriteInputTokens` provienen de `usage.input_tokens_details` (pueden no existir; el server los rellena con `0`).
- El server emite este evento desde `response.completed` en `createSSEResponse` (`reviewRoute.ts`).
- El cliente valida con `isReviewUsage()` que todos los campos sean finitos y ≥ 0 antes de aceptarlos.

### `ReviewErrorCode`

```typescript
type ReviewErrorCode =
  | 'injection_detected'
  | 'rate_limit'
  | 'origin_not_allowed'
  | 'diff_invalid'
  | 'service_unavailable'
  | (string & {});
```

Codes estables que el server puede devolver en `{ error, code }`. El cliente los usa para reaccionar distinto según el tipo (ej. prompt injection → alert + vaciar textarea + cooldown vs error genérico). Actualmente solo `injection_detected` se emite explícitamente desde `reviewRoute.ts`.

### `ReviewResponse` (schema JSON devuelto por OpenAI)

```typescript
interface ReviewResponse {
  summary: string; // Resumen ejecutivo (2-3 oraciones)
  verdict: 'approve' | 'request_changes' | 'comment';
  findings: Finding[];
}

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

### Flujo de CO₂

La métrica de impacto climático se calcula en el cliente con `usage.totalTokens` (`src/utils/co2/co2.ts`):

```typescript
const MIN_GCO2E_PER_THOUSAND_TOKENS = 0.15;
const MAX_GCO2E_PER_THOUSAND_TOKENS = 2.85;

export function calculateReviewCO2Range(totalTokens: number): string {
  const safeTokens = Math.max(0, totalTokens);
  const minGrams = (safeTokens / 1000) * MIN_GCO2E_PER_THOUSAND_TOKENS;
  const maxGrams = (safeTokens / 1000) * MAX_GCO2E_PER_THOUSAND_TOKENS;
  return `${formatGrams(minGrams)}–${formatGrams(maxGrams)}g CO₂e`;
}
```

`totalTokens` incluye entrada, salida y los tokens de razonamiento que el proveedor contabiliza dentro de la salida. Es un rango proxy conservador para inferencia de LLM con infraestructura completa (el extremo alto se redondea de la estimación de Mistral), no una medición de OpenAI.

### Flujo de costo API

El costo estimado se calcula en el cliente con el mismo `usage` (`src/utils/review-cost/review-cost.ts`), separando entrada, entrada cacheada, cache writes y salida. Para `gpt-5.6-luna`, las tarifas públicas son:

| Componente   | Tarifa USD / 1M tokens |
| ------------ | ---------------------- |
| Input        | `$0.20`                |
| Cached input | `$0.02`                |
| Cache write  | `$0.20 × 1.25`         |
| Output       | `$1.20`                |

La UI lo muestra como estimación porque usa tarifas públicas en código, no el ledger de facturación de OpenAI ni impuestos.

---

## Referencias

- [Capas de seguridad](auth.md)
- [Arquitectura general](../architecture/overview.md)
- [AI Code Reviewer](../features/ai-code-reviewer.md)
- [Utilidades (CO₂ y costo)](../utils/overview.md)
- Fuente: `src/data/proyectos.ts`
