# Utilidades del proyecto

## `src/utils/a11y/a11y.ts` — Focus visible WCAG 2.4.7

```typescript
export function focusClassName(color: 'red' | 'white' = 'red'): string {
  const ringColor = color === 'red' ? 'outline-red-400' : 'outline-white';
  return `focus-visible:outline-2 focus-visible:outline-offset-2 ${ringColor}`;
}
```

- `focusClassName('red')` → `focus-visible:outline-2 focus-visible:outline-offset-2 outline-red-400`
- `focusClassName('white')` → `focus-visible:outline-2 focus-visible:outline-offset-2 outline-white`

**Uso en componentes**: `ReviewForm`, `ReviewOutput`, `ExampleSelector`, `CodeBlock`, `FindingCard`, `SeverityBadge`, `Badge`, `Proyectos`.

---

## `src/utils/co2/co2.ts` — Estimación de CO₂

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

**Detalles**:

- `totalTokens`: uso final reportado por la Responses API en el evento `usage`; incluye entrada, salida y los tokens de razonamiento que el proveedor contabiliza dentro de la salida.
- `formatGrams(grams)`: `grams < 0.1 ? grams.toFixed(2) : grams.toFixed(1)`.
- Es un **rango proxy conservador** para inferencia de LLM con infraestructura completa (gCO₂e por mil tokens), no una medición de OpenAI ni del modelo desplegado.
- El extremo alto (`2.85`) se redondea de la estimación de ciclo de vida publicada por Mistral para una respuesta de 400 tokens (`1.14` gCO₂e). El extremo bajo conserva un escenario de serving eficiente con infraestructura. Debe revisarse si OpenAI publica factores propios.
- El resultado se muestra en `ReviewOutput.tsx` dentro de `<p aria-label="Impacto climático estimado">`.

---

## `src/utils/review-cost/review-cost.ts` — Estimación de costo API

```typescript
export const REVIEW_MODEL_ID = 'gpt-5.6-luna';

const INPUT_USD_PER_MILLION_TOKENS = 0.2;
const CACHED_INPUT_USD_PER_MILLION_TOKENS = 0.02;
const CACHE_WRITE_INPUT_MULTIPLIER = 1.25;
const OUTPUT_USD_PER_MILLION_TOKENS = 1.2;

export function calculateReviewApiCostUSD(usage: ReviewCostUsage): number;
export function formatReviewApiCostUSD(usage: ReviewCostUsage): string;
```

**Interface `ReviewCostUsage`** (subconjunto de `ReviewUsage`):

| Campo                  | Tipo     | Descripción                                                        |
| ---------------------- | -------- | ------------------------------------------------------------------ |
| `inputTokens`          | `number` | Tokens de entrada reportados por la Responses API                  |
| `outputTokens`         | `number` | Tokens de salida reportados por la Responses API                   |
| `cachedInputTokens`    | `number` | Opcional. Tokens de entrada servidos desde cache                   |
| `cacheWriteInputTokens`| `number` | Opcional. Tokens de entrada escritos a cache                       |

**Cálculo** (tarifas públicas de `gpt-5.6-luna` por 1M tokens):

```
standardInput = max(0, inputTokens - cachedInput - cacheWrite)
costo = standardInput * 0.20
      + cachedInput  * 0.02
      + cacheWrite   * 0.20 * 1.25
      + output       * 1.20
```

- `cachedInputTokens` se acota a `min(cached, inputTokens)`; `cacheWriteInputTokens` a `min(cacheWrite, inputTokens - cached)`.
- `clampTokens`: valores no numéricos o negativos → `0`.
- `formatReviewApiCostUSD`: `$0.00 USD` si 0; `<$0.00001 USD`; `toFixed(5)` si `< 0.01`; `toFixed(4)` si `< 1`; `toFixed(2)` si `>= 1`. Quita ceros finales (`trimTrailingZeros`).
- El resultado se muestra en `ReviewOutput.tsx` dentro de `<p aria-label="Costo API estimado">` junto al `REVIEW_MODEL_ID`.
- Se etiqueta como estimado porque no consulta el ledger de facturación ni incluye impuestos.

---

## `src/styles.css` — Estilos globales y Tailwind v4

### `@import 'tailwindcss';`

### Media query `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- Respeta la preferencia del usuario de movimiento reducido.
- Anula todas las animaciones y transiciones del proyecto.

### Tipografía `Lexend_Mega`

```css
@font-face {
  font-family: 'Lexend_Mega';
  src:
    local('Lexend_Mega'),
    url(/tipografias/Lexend_Mega/Lexend_Mega.woff2) format('woff2');
  font-display: swap;
}

@theme {
  --font-lexend-mega: 'Lexend_Mega', sans-serif;
}

h1,
h2,
h3 {
  font-family: var(--font-lexend-mega);
  line-height: 1.15;
}
```

- `Lexend_Mega` solo en headings (`h1, h2, h3`).
- Body usa `system-ui, -apple-system, Segoe UI, Roboto, sans-serif` (fuente nativa).

### Colores personalizados

```css
@theme {
  --color-gris-claro: rgb(206, 208, 213);
  --color-fondo: rgb(10, 10, 12);
}
```

- `--color-gris-claro`: usado para texto secundario (`text-gris-claro`).
- `--color-fondo`: color de fondo base (`bg-fondo`).

### Options `<select>` en modo oscuro

```css
select option {
  background-color: #1a1a1a;
  color: #e5e5e5;
}
```

- Los navegadores ignoran inline styles en `<option>`, por esto se usa esta regla CSS.

---

## `src/middleware/no-trailing-slash.ts` — Middleware de trailing slash

```typescript
import { trimTrailingSlash } from 'hono/trailing-slash';

export default () => trimTrailingSlash({ alwaysRedirect: true });
```

- Redirige cualquier URL con trailing slash a su versión sin slash (`alwaysRedirect: true`).
- Usa `trimTrailingSlash` de `hono/trailing-slash` (Hono viene como dependencia de Waku).
- Nota: `netlify.toml` deshabilita además `pretty_urls` en el procesamiento HTML para evitar trailing slashes en rutas dinámicas.

---

## Referencias

- [Arquitectura general](../architecture/overview.md)
- [Backend - Seguridad](../backend/auth.md)
- [AI Code Reviewer](../features/ai-code-reviewer.md)
- [Componentes UI](../components/overview.md)
- Fuente Mistral (estimación gCO₂e): <https://mistral.ai/news/our-contribution-to-a-global-environmental-standard-for-ai/>
