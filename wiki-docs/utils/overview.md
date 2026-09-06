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
export function calculateReviewCO2(inputLength: number, outputLength: number): string {
  // Estimación: ~0.0004 kg CO₂ por token (aproximación estándar de OpenAI)
  const inputTokens = Math.ceil(inputLength / 4);  // promedio 4 chars/token
  const outputTokens = Math.ceil(outputLength / 4);
  const kgCO2 = (inputTokens + outputTokens) * 0.0004;
  return `${kgCO2.toFixed(4)} kg`;
}
```

**Uso en `ReviewOutput`**:
- `inputLength`: caracteres del diff pegado por el usuario.
- `outputLength`: caracteres del review generado (aproximado por el número de tokens * 4).

**Fórmula**: `(inputTokens + outputTokens) * 0.0004 kg CO₂`.
- Promedio de 4 caracteres por token es estándar de la industria para modelos de lenguaje.
- El resultado se muestra en `ReviewOutput.tsx` dentro de un `<p aria-label="Huella de carbono estimada">`.

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
  src: local('Lexend_Mega'),
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

*Nota: este middleware está configurado pero revisar su implementación actual si es necesario. Su propósito es asegurar que las URLs no tengan slash trailing innecesario.*
  ---
  
  ## Referencias
  
  - [Arquitectura general](architecture/overview.md)
  - [Backend - Seguridad](backend/auth.md)
  - [Netlify Docs — Middleware](https://docs.netlify.com/functions/edge-functions/#middleware)