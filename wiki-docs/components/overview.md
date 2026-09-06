# Sistema de componentes UI

Convención del portafolio: **un componente por carpeta** con su archivo `.tsx` y test `.test.tsx` al lado (patrón consistente en `IA/`, `Proyectos/`, `SobreMi/`, `Hero/`, `OpenSource/`, `Certificados/`, `Contacto/`).

## Catálogo de componentes

| Componente        | Archivo                                               | Props principales                                                                   | Estado de test                                                            |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Hero`            | `src/components/Hero/Hero.tsx`                        | Ninguna (data inline)                                                               | `Hero.test.tsx`                                                           |
| `Proyectos`       | `src/components/Proyectos/Proyectos.tsx`              | `proyectos` de `src/data/proyectos.ts`                                              | `Proyectos.test.tsx`                                                      |
| `IA`              | `src/components/IA/IA.tsx`                            | `proyectosIA` de `src/data/proyectos.ts`                                            | `IA.test.tsx`                                                             |
| `SobreMi`         | `src/components/SobreMi/SobreMi.tsx`                  | Ninguna (data inline)                                                               | `SobreMi.test.tsx`                                                        |
| `OpenSource`      | `src/components/OpenSource/OpenSource.tsx`            | `openSource` de `src/data/proyectos.ts`                                             | `OpenSource.test.tsx`                                                     |
| `Certificados`    | `src/components/Certificados/Certificados.tsx`        | Ninguna (data inline)                                                               | `Certificados.test.tsx`                                                   |
| `Contacto`        | `src/components/Contacto/Contacto.tsx`                | Ninguna (data inline)                                                               | `Contacto.test.tsx`                                                       |
| `ReviewForm`      | `src/components/review-form/ReviewForm.tsx`           | `diff`, `onDiffChange`, `onSubmit`, `onExampleSelect`, `isLoading`, `cooldownUntil` | `ReviewForm.test.tsx`, `ReviewWorkspace.test.tsx`, `ExampleDiffs.test.ts` |
| `ReviewOutput`    | `src/components/review-output/ReviewOutput.tsx`       | `review` (`ReviewResponse`), `outputLength`, `inputLength`                          | `ReviewOutput.test.tsx`                                                   |
| `FindingCard`     | `src/components/review-output/FindingCard.tsx`        | `finding` (Finding)                                                                 | `FindingCard.test.tsx` (implícita en ReviewOutput)                        |
| `SeverityBadge`   | `src/components/review-output/SeverityBadge.tsx`      | `severity` (`critical`/`high/medium/low/info`), `title`                             | `SeverityBadge.test.tsx`                                                  |
| `CodeBlock`       | `src/components/review-output/CodeBlock.tsx`          | `code` (string), `language` (string)                                                | `CodeBlock.test.tsx`                                                      |
| `IACard`          | `src/components/IA/IA.tsx` (interno)                  | `proyecto` (`ProyectoIA`)                                                           | Parte de `IA.test.tsx`                                                    |
| `ExampleSelector` | `src/components/review-form/ReviewForm.tsx` (interno) | `onSelect`, `disabled`                                                              | `ReviewForm.test.tsx`                                                     |

## Patrones de diseño

### 1. Componente único por carpeta

Cada sección tiene su propio directorio:

- `src/components/Hero/` → `Hero.tsx` + `Hero.test.tsx`
- `src/components/Proyectos/` → `Proyectos.tsx` + `Proyectos.test.tsx`
- `src/components/review-form/` → `ReviewForm.tsx` + test + `ExampleDiffs.ts` + tests
- `src/components/review-output/` → `ReviewOutput.tsx` + test + `FindingCard.tsx` + test + `SeverityBadge.tsx` + test + `CodeBlock.tsx` + test
- `src/components/IA/` → `IA.tsx` + `IA.test.tsx`

### 2. Datos inline vs data-driven

- **Data inline**: `Hero`, `SobreMi`, `Certificados` — los datos vienen definidos directamente en el componente (usando interfaces locales).
- **Data-driven**: `Proyectos`, `IA`, `OpenSource` — consumen de `src/data/proyectos.ts` (import directo).

### 3. Accesibilidad base

Todos los componentes comparten estas características mínimas:

- `focus-visible:outline-2 focus-visible:outline-offset-2 outline-red-400` (WCAG 2.4.7) vía `focusClassName()` utility.
- `aria-label` descriptivos en inputs, buttons, selects.
- Contraste AA+ (Tailwind colores: `text-white/90` sobre `bg-white/3`).
- `prefers-reduced-motion` respetado a nivel global (`styles.css` media query).
- Skip link en `_layout.tsx` (`<a href="#main" className="sr-only focus:not-in-visible">`).

### 4. Honeypot pattern (solo en ReviewForm)

Checkbox doble:

- **Visible**: "Los gatos son geniales" — requiere selección del usuario para habilitar el submit.
- **Oculto** (`position: absolute; left: -9999px`): checkbox `name="website"` — si el backend recibe `website: true`, es un bot y devuelve 200 silencioso.

### 5. Streaming SSE (solo en ReviewOutput + useReviewStream)

- Hook `useReviewStream` usa `ReadableStream.getReader()` — **NUNCA** `res.json()` con SSE.
- Buffer de eventos: `buffer.split('\n\n')`, `pop()` el último incompleto.
- Eventos parseados: `{type: 'delta', text}`, `{type: 'done'}`, `{type: 'error'}`.
- Countdown cooldown: vive en el hook y se persiste en localStorage para sobrevivir refresh; no depende de un useEffect del componente.

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

Usado en: `ReviewForm`, `ReviewOutput`, `ExampleSelector`, `CodeBlock`, `FindingCard`, `SeverityBadge`, inputs, buttons, selects.

### `Lexend_Mega` — tipografía display

**Archivo**: `src/styles.css`

- `@font-face` con `Lexend_Mega.woff2` pública en `public/tipografias/Lexend_Mega/`.
- `@theme`: `--font-lexend-mega: 'Lexend_Mega', sans-serif`.
- Aplicado solo a `h1, h2, h3` (never al body).

- Body usa `system-ui, -apple-system, Segoe UI, Roboto, sans-serif` (fuente nativa del sistema).
- **Objetivo**: Lexend solo en lugares estratégicos (headings/brand), cuerpo nativo para mejor performance y legibilidad.

## Diagrama ASCII: Catálogo de componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                      Página Principal (/ )                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │     Hero    │  │   Proyectos │  │     IA      │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ OpenSource  │  │  SobreMi    │  │ Certificados│              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  └─────────────┘                              └──────────────┘ │
│                    Contacto (fondo separado)                   │
└─────────────────────────────────────────────────────────────────┘
  ---

  ## Referencias

  - [Arquitectura general](architecture/overview.md)
  - [Backend - Seguridad](backend/auth.md)
  - [Componentes UI](components/overview.md)
                                                  │
                                          ┌─────────────────────┐
                                          │   /review page      │
                                          │  + ReviewForm       │
                                          │  + ReviewOutput     │
                                          │  + useReviewStream  │
                                          └─────────────────────┘
```
