# Sistema de componentes UI

Convención del portafolio: **un componente por carpeta** con su archivo `.tsx` y test `.test.tsx` al lado (patrón consistente en `Hero/`, `Proyectos/`, `SobreMi/`, `OpenSource/`, `Certificados/`, `Contacto/`, `Badge/`, `review-form/`, `review-output/`).

## Catálogo de componentes

| Componente        | Archivo                                               | Props principales                                                                   | Estado de test             |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------- |
| `Hero`            | `src/components/Hero/Hero.tsx`                        | Ninguna (data inline)                                                               | `Hero.test.tsx`            |
| `Proyectos`       | `src/components/Proyectos/Proyectos.tsx`              | Ninguna (lee `proyectos` de `src/data/proyectos.ts`)                                | `Proyectos.test.tsx`       |
| `IA`              | `src/components/IA/IA.tsx`                            | Ninguna (lee `proyectosIA` de `src/data/proyectos.ts`)                              | `IA.test.tsx`              |
| `SobreMi`         | `src/components/SobreMi/SobreMi.tsx`                  | Ninguna (data inline)                                                               | `SobreMi.test.tsx`         |
| `OpenSource`      | `src/components/OpenSource/OpenSource.tsx`            | Ninguna (lee `openSource` de `src/data/proyectos.ts`)                               | `OpenSource.test.tsx`      |
| `Certificados`    | `src/components/Certificados/Certificados.tsx`        | Ninguna (data inline)                                                               | `Certificados.test.tsx`    |
| `Contacto`        | `src/components/Contacto/Contacto.tsx`                | Ninguna (data inline)                                                               | `Contacto.test.tsx`        |
| `Badge`           | `src/components/Badge/Badge.tsx`                      | `text: string[]`, `link: string`, `ariaLabel?: string`                              | `Badge.test.tsx`           |
| `ReviewForm`      | `src/components/review-form/ReviewForm.tsx`           | `diff`, `onDiffChange`, `onSubmit`, `onExampleSelect`, `isLoading`, `cooldownUntil` | `ReviewForm.test.tsx`      |
| `ReviewWorkspace` | `src/components/review-form/ReviewWorkspace.tsx`      | Ninguna (orquesta form + hook + output)                                             | `ReviewWorkspace.test.tsx` |
| `ReviewOutput`    | `src/components/review-output/ReviewOutput.tsx`       | `review` (`ReviewResponse`), `usage` (`ReviewUsage \| null`)                        | `ReviewOutput.test.tsx`    |
| `FindingCard`     | `src/components/review-output/FindingCard.tsx`        | `finding` (`Finding`)                                                               | `FindingCard.test.tsx`     |
| `SeverityBadge`   | `src/components/review-output/SeverityBadge.tsx`      | `severity` (`critical`/`high`/`medium`/`low`/`info`), `title`                       | `SeverityBadge.test.tsx`   |
| `CodeBlock`       | `src/components/review-output/CodeBlock.tsx`          | `code: string`, `lang?: string` (default `typescript`)                              | `CodeBlock.test.tsx`       |
| `IACard`          | `src/components/IA/IA.tsx` (interno)                  | `proyecto` (`ProyectoIA`)                                                           | Parte de `IA.test.tsx`     |
| `ExampleSelector` | `src/components/review-form/ReviewForm.tsx` (interno) | `onSelect`, `disabled`                                                              | `ReviewForm.test.tsx`      |
| `ProyectoCard`    | `src/components/Proyectos/Proyectos.tsx` (interno)    | `proyecto` (`Proyecto`)                                                             | `Proyectos.test.tsx`       |

## Patrones de diseño

### 1. Componente único por carpeta

Cada sección tiene su propio directorio:

- `src/components/Hero/` → `Hero.tsx` + `Hero.test.tsx`
- `src/components/Proyectos/` → `Proyectos.tsx` + `Proyectos.test.tsx`
- `src/components/Badge/` → `Badge.tsx` + `Badge.test.tsx`
- `src/components/review-form/` → `ReviewForm.tsx` + `ReviewWorkspace.tsx` + tests + `ExampleDiffs.ts` + tests
- `src/components/review-output/` → `ReviewOutput.tsx` + `FindingCard.tsx` + `SeverityBadge.tsx` + `CodeBlock.tsx` + tests
- `src/components/IA/` → `IA.tsx` + `IA.test.tsx`

### 2. Datos inline vs data-driven

- **Data inline**: `Hero`, `SobreMi`, `Certificados`, `Contacto` — los datos vienen definidos directamente en el componente.
- **Data-driven**: `Proyectos`, `IA`, `OpenSource` — consumen de `src/data/proyectos.ts` (import directo).

### 3. Accesibilidad base

Todos los componentes comparten estas características mínimas:

- `focus-visible:outline-2 focus-visible:outline-offset-2 outline-red-400` (WCAG 2.4.7) vía `focusClassName()` utility.
- `aria-label` descriptivos en inputs, buttons, selects y enlaces externos.
- Contraste AA+ (Tailwind colores: `text-white/90` sobre `bg-white/3`).
- `prefers-reduced-motion` respetado a nivel global (`styles.css` media query).
- Skip link en `_layout.tsx` (`<a href="#main" className="sr-only focus:not-sr-only ...">`).

### 4. Honeypot pattern (solo en ReviewForm)

Checkbox doble:

- **Visible**: "Los gatos son geniales" — requiere selección del usuario para habilitar el submit.
- **Oculto** (`style={{ position: 'absolute', left: '-9999px' }}` + `tabIndex={-1}` + `aria-hidden`): checkbox `name="website"` — si el backend recibe `website: true`, es un bot y devuelve 200 silencioso.

### 5. Streaming SSE (ReviewWorkspace + useReviewStream + ReviewOutput)

- Hook `useReviewStream` usa `ReadableStream.getReader()` — **NUNCA** `res.json()` con SSE.
- Buffer de eventos: `buffer.split('\n\n')`, `pop()` el último incompleto.
- Eventos parseados: `{type: 'delta', text}`, `{type: 'usage', usage}`, `{type: 'done'}`, `{type: 'error'}`.
- Al terminar el stream, el hook parsea `rawText` como JSON (`ReviewResponse`) y expone `usage` en el state.
- `ReviewOutput` recibe `usage` y calcula CO₂ (`calculateReviewCO2Range`) y costo API (`formatReviewApiCostUSD`).
- Cooldown de prompt injection: vive en el hook y se persiste en localStorage (`review:injectionCooldownUntil`) para sobrevivir refresh; no depende de un useEffect del componente.
- Countdown del cooldown en `ReviewForm`: `useSyncExternalStore` sobre un reloj singleton (`setInterval` 250 ms compartido) para cumplir las reglas de React 19 (`react-hooks/set-state-in-effect`).

### 6. Defensa en profundidad en CodeBlock

- `shiki` genera el HTML de syntax highlighting; el contenido viene de un LLM.
- `DOMPurify` sanitiza el HTML con allowlist (`ALLOWED_TAGS`: `pre, code, span, div, br, i, em, b, strong`; `ALLOWED_ATTR`: `class, style`) antes de `dangerouslySetInnerHTML`.
- El highlighter se carga una sola vez (singleton a nivel módulo); mientras carga, se muestra el código plano sin highlighting.

## Utilidades de estilo

### `focusClassName(color)` — anillo de foco visible

**Archivo**: `src/utils/a11y/a11y.ts`

```typescript
export function focusClassName(color: 'red' | 'white' = 'red'): string {
  const ringColor = color === 'red' ? 'outline-red-400' : 'outline-white';
  return `focus-visible:outline-2 focus-visible:outline-offset-2 ${ringColor}`;
}
```

- `focusClassName('red')` → `focus-visible:outline-2 focus-visible:outline-offset-2 outline-red-400`
- `focusClassName('white')` → `focus-visible:outline-2 focus-visible:outline-offset-2 outline-white`

Usado en: `ReviewForm`, `ReviewOutput`, `ExampleSelector`, `CodeBlock`, `FindingCard`, `SeverityBadge`, `Badge`, `Proyectos`, inputs, buttons, selects.

### `Lexend_Mega` — tipografía display

**Archivo**: `src/styles.css`

- `@font-face` con `Lexend_Mega.woff2` pública en `public/tipografias/Lexend_Mega/`.
- `@theme`: `--font-lexend-mega: 'Lexend_Mega', sans-serif`.
- Aplicado solo a `h1, h2, h3` (nunca al body).
- Body usa `system-ui, -apple-system, Segoe UI, Roboto, sans-serif` (fuente nativa del sistema).
- **Objetivo**: Lexend solo en lugares estratégicos (headings/brand), cuerpo nativo para mejor performance y legibilidad.

## Diagrama ASCII: Composición de la página principal (`/`)

```
┌───────────────────────────────────────────────────────────────┐
│                     _layout.tsx (shell)                       │
│   skip link ─ nav (Proyectos, IA, Sobre mí, Contacto) ─ ...   │
│                                                               │
│   index.tsx (HomePage)                                        │
│   ┌─────────┐                                                │
│   │  Hero   │                                                │
│   ├─────────┤                                                │
│   │  Badge  │ ← WebSiteCarbon (nuevo)                        │
│   ├─────────┤                                                │
│   │Proyectos│ ← proyectos[] de data/proyectos.ts             │
│   ├─────────┤                                                │
│   │   IA    │ ← proyectosIA[] de data/proyectos.ts           │
│   ├─────────┤                                                │
│   │OpenSource│ ← openSource[] de data/proyectos.ts           │
│   ├─────────┤                                                │
│   │SobreMi  │                                                │
│   ├─────────┤                                                │
│   │Certificados│                                             │
│   ├─────────┤                                                │
│   │Contacto │                                                │
│   └─────────┘                                                │
│                                                               │
│   /review (ReviewPage)                                        │
│   ┌─────────────────┐                                        │
│   │ ReviewWorkspace │ ← client component                      │
│   │  ├─ ReviewForm  │    (textarea, honeypot, countdown)      │
│   │  ├─ useReviewStream ──► POST /api/review (SSE)           │
│   │  └─ ReviewOutput │    (verdict, findings, CO₂, costo)     │
│   └─────────────────┘                                        │
└───────────────────────────────────────────────────────────────┘
```

## Referencias

- [Arquitectura general](../architecture/overview.md)
- [Backend - Seguridad](../backend/auth.md)
- [AI Code Reviewer](../features/ai-code-reviewer.md)
- [Utilidades](../utils/overview.md)
- Fuente: `src/components/**/*.tsx`
