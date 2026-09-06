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

**Uso en componentes**: `ReviewForm`, `ReviewOutput`, `ExampleSelector`, `CodeBlock`, `FindingCard`, `SeverityBadge`.

---

## `src/utils/co2/co2.ts` — Estimación de CO₂

```typescript
export function calculateReviewCO2Range(totalTokens: number): string {
  const min = (totalTokens / 1000) * 0.15;
  const max = (totalTokens / 1000) * 2.85;
  return `${min}–${max} gCO₂e`;
}
```

**Uso en `ReviewOutput`**:

- `totalTokens`: uso final reportado por la Responses API; incluye los tokens de entrada, salida y el razonamiento que el proveedor contabiliza dentro de la salida.

**Fórmula**: `totalTokens / 1000 * 0.15–2.85 gCO₂e`.

- Es un rango conservador, no una medición de OpenAI. El extremo alto se basa en la estimación de ciclo de vida publicada por Mistral para una respuesta de 400 tokens.
- El resultado se muestra en `ReviewOutput.tsx` dentro de un `<p aria-label="Impacto climático estimado">`.

---

## `src/utils/review-cost/review-cost.ts` — Estimación de costo API

```typescript
export function formatReviewApiCostUSD(usage: ReviewCostUsage): string {
  // Calcula costo con tarifas públicas de gpt-5.6-luna.
}
```

**Uso en `ReviewOutput`**:

- `inputTokens`: tokens de entrada reportados por la Responses API.
- `cachedInputTokens`: tokens de entrada servidos desde cache, si OpenAI los reporta.
- `cacheWriteInputTokens`: tokens escritos a cache, si OpenAI los reporta.
- `outputTokens`: tokens de salida reportados por la Responses API.

**Fórmula**: `(standardInput * 0.20 + cachedInput * 0.02 + cacheWriteInput * 0.25 + output * 1.20) / 1_000_000`.

- El resultado se muestra en `ReviewOutput.tsx` dentro de un `<p aria-label="Costo API estimado">`.
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
- `--color-fondo`: color de fondo base (`bg-fondo` o similar).

### Options `<select>` en modo oscuro

```css
select option {
  background-color: #1a1a1a;
  color: #e5e5e5;
}
```

- Los navegadores ignoran inline styles en `<option>`, por esto se usa esta regla CSS.

---

## `middleware/no-trailing-slash.ts` — Middleware de trailing slash

_Nota: este middleware está configurado pero revisar su implementación actual si es necesario. Su propósito es asegurar que las URLs no tengan slash trailing innecesario._
---

## Referencias

- [Arquitectura general](architecture/overview.md)
- [Backend - Seguridad](backend/auth.md)
- [Netlify Docs — Middleware](https://docs.netlify.com/functions/edge-functions/#middleware)
