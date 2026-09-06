# Modelos de datos y base de datos

## `src/data/proyectos.ts` — Single source of truth

Este archivo es la **única fuente de verdad** para los datos del portafolio. Los componentes solo consumen e renderizan; la lógica de negocio o persistencia no reside aquí.

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
| `superkeg`    | SUPER KEG        | React, Zustand, Waka, Firebase    | SaaS, Estado global, UX operativa | Producto SaaS real en uso diario: dominio operativo complejo, inventario en tiempo real y flujos de estado avanzados.     |
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

#### `openSource` (3 repositorios públicos verificables)

| ID                       | Nombre                 | Tipo                   | Tecnologías                              | Licencia                                             |
| ------------------------ | ---------------------- | ---------------------- | ---------------------------------------- | ---------------------------------------------------- |
| `michi-router`           | michi-router           | Librería npm           | TypeScript, React, npm, Vitest           | Ver repo                                             |
| `comida-emergencia`      | ComidaEmergencia       | Aplicación open source | React, Zustand, Firebase, OpenAI, Vitest | MIT + Commons Clause                                 |
| `comparacion-de-modelos` | Comparación de modelos | Laboratorio de IA      | LLMs, OpenCode, MCP, Waku                | Ver repo                                             |
| `skills-and-agents`      | Skills & Agents        | Skills y agentes       | OpenCode, LLMs, Skills, Agentes, MCP     | https://github.com/Ariel-GonzAguer/skills-and-agents |

### Flujo de datos en la aplicación

1. **Build time**: `proyectos.ts` se lee y los datos se injectan en los componentes.
2. **Runtime**: Los componentes leen de `proyectos.ts` (es un módulo ESM estático).
3. **Página de inicio** (`/`): `index.tsx` compone todas las secciones pasando los datos como props.
4. **Sección IA** (`/ia`): `IA.tsx` mapea `proyectosIA` y renderiza `IACard` por cada uno.
5. **Sección Open Source**: `OpenSource.tsx` mapea `openSource` y renderiza cards de cada repositorio.

## Flujo de datos del AI Code Reviewer (estado del cliente)

El estado del hook `useReviewStream` tiene esta estructura:

```typescript
interface ReviewState {
  status: 'idle' | 'loading' | 'streaming' | 'done' | 'error';
  rawText: string; // Texto completo recibido del stream (JSON parseado al final)
  result: ReviewResponse | null; // Objeto JSON final (summary, findings, verdict)
  error: string | null; // Mensaje de error si falló
  code: string | null; // Código de error especial (ej: 'injection_detected')
  cooldownUntil: number | null; // Timestamp (ms) hasta que el botón queda deshabilitado; se restaura desde localStorage si sigue activo
}
```

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

La métrica de impacto climático se calcula en el cliente con el uso final que la Responses API transmite por SSE:

```typescript
const calculateReviewCO2Range = (totalTokens: number) => {
  const min = (totalTokens / 1000) * 0.15;
  const max = (totalTokens / 1000) * 2.85;
  return `${min}–${max} gCO₂e`;
};
```

`totalTokens` incluye el prompt de sistema, el diff, el wrapper de la solicitud, el schema, la salida y los tokens de razonamiento que el proveedor contabiliza. Es un rango proxy conservador, no una medición específica de OpenAI.

### Flujo de costo API

El costo API estimado se calcula en el cliente con el mismo evento `usage`, separando entrada, entrada cacheada, cache writes y salida. Para `gpt-5.6-luna`, las tarifas usadas son:

- Input: `$0.20 / 1M tokens`
- Cached input: `$0.02 / 1M tokens`
- Cache writes: `1.25x` sobre input normal
- Output: `$1.20 / 1M tokens`

La UI lo muestra como estimación porque usa tarifas públicas en código, no el ledger de facturación de OpenAI ni impuestos.

---

## Referencias

- [Visión general del stack](backend/auth.md)
- [Arquitectura general](architecture/overview.md)
- [Proyectos data model](https://github.com/Ariel-GonzAguer/ariel-personal/blob/main/src/data/proyectos.ts)
