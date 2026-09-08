# Visión general del stack y la arquitectura

## Stack tecnológico

| Componente | Tecnología                                                                               | Detalles                                                     |
| ---------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Framework  | [Waku](https://waku.gg) 1 beta (`1.0.0-beta.9`)                                          | React Server Components (RSC) + React 19                     |
| CSS        | [Tailwind CSS](https://tailwindcss.com) v4                                               | `@theme` syntax, `Lexend_Mega` solo para headings/brand      |
| Language   | [TypeScript](https://typescriptlang.org) (`6.0.3`)                                       | Modo estricto (`strict: true`), `noEmit: true`               |
| Pruebas    | [Vitest](https://vitest.dev) (`4.1.11`) + [Testing Library](https://testing-library.com) | 181 tests en 27 archivos                                     |
| Despliegue | [Netlify](https://netlify.com)                                                           | Functions + Blobs + Edge Functions (CSP nonce) + Git deploys |
| IA         | [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)         | Modelo `gpt-5.6-luna`, JSON Schema estricto, streaming SSE   |

## Arquitectura general

El sitio es **totalmente estático (SSG)**: todas las páginas se generan en build y se sirven como HTML plano. El único contenido dinámico es el **AI Code Reviewer** en `/review`, que es una página estática que llama a una Netlify Function mediante fetch a `/api/review`.

```
┌───────────────────────────────────────────┐
│         Netlify Edge (csp-nonce)          │
│   CSP con nonce dinámico en respuestas    │
└──────────────────┬────────────────────────┘
                   │ HTML estático + headers
                   ▼
┌─────────────────────┐
│   Cliente (browser) │
│  + HTML statically  │
│  + CSS (Tailwind v4)│
│  + JS (RSC + hooks) │
└───────┬──────────────┘
        │ fetch /api/review (mismo origen, connect-src 'self')
        ▼
┌─────────────────────┐
│  Netlify Function   │
│  POST /api/review   │
│  - Origin check      │
│  - Honeypot          │
│  - Rate limit (10/min mem + 3/día Blobs) │
│  - Validate diff     │
│  - Detect injection (rechaza) │
│  - Sanitize input    │
│  - OpenAI Responses API │
│  - SSE streaming (delta → usage → done) │
│  - Security headers  │
└───────┬──────────────┘
        │
        ▼
┌─────────────────────┐
│  OpenAI API         │
│  gpt-5.6-luna       │
│  JSON Schema strict │
└─────────────────────┘
```

## Decisiones técnicas clave

| Decisión                         | Justificación                                                                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Render estático**              | Todo el sitio se genera en build; el AI Code Reviewer es una página estática que llama a una Netlify Function. Esto reduce costos y mejora seguridad.                  |
| **Tipografía estratégica**       | `Lexend_Mega` solo en headings y marca; el cuerpo usa la fuente nativa del sistema para mejor performance.                                                             |
| **Accesibilidad como base**      | Skip link, foco visible (`focus-visible:outline-red-400`), `aria-label` descriptivos, contraste AA+, `prefers-reduced-motion` respetado (media query en `styles.css`). |
| **Datos desacoplados**           | Los proyectos viven en `src/data/proyectos.ts`; los componentes solo renderizan. Single source of truth.                                                               |
| **Links honestos**               | Los productos privados no muestran botones de código; solo se enlaza repositorio público.                                                                              |
| **Seguridad en capas**           | Origin → honeypot → rate limit (memoria 10/min + Blobs 3/día) → validate → detect injection (rechaza) → sanitize → OpenAI Responses API → security headers.            |
| **Transparencia de costo/clima** | La UI del reviewer muestra costo API estimado (USD) e impacto climático estimado (gCO₂e) calculados con el `usage` real de la API.                                     |
| **Sostenibilidad visible**       | `Badge` de WebSiteCarbon en la home comunica la huella de carbono del sitio.                                                                                           |
| **No barrel files**              | Un componente por carpeta con test al lado (patrón consistente en `Hero/`, `Proyectos/`, `Badge/`, etc.).                                                              |

## Componentes principales

| Componente        | Ubicación                                        | Props principales                                                                   | Propósito                                                                           |
| ----------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `Hero`            | `src/components/Hero/Hero.tsx`                   | Ninguna (data inline)                                                               | Sección hero con nombre, posicionamiento y stack rápido                             |
| `Badge`           | `src/components/Badge/Badge.tsx`                 | `text: string[]`, `link: string`, `ariaLabel?: string`                              | Sello WebSiteCarbon con huella de carbono del sitio (enlace externo)                |
| `Proyectos`       | `src/components/Proyectos/Proyectos.tsx`         | Ninguna (lee `proyectos` de `src/data/proyectos.ts`)                                | Cards de 4 productos reales (SaaS, ecommerce, SEO local, QR)                        |
| `IA`              | `src/components/IA/IA.tsx`                       | Ninguna (lee `proyectosIA` de `src/data/proyectos.ts`)                              | Tarjetas de experiencias con IA (chatbot, PWA, workflows)                           |
| `ReviewForm`      | `src/components/review-form/ReviewForm.tsx`      | `diff`, `onDiffChange`, `onSubmit`, `onExampleSelect`, `isLoading`, `cooldownUntil` | Formulario para pegar un unified diff con honeypot y 3 ejemplos precargados         |
| `ReviewWorkspace` | `src/components/review-form/ReviewWorkspace.tsx` | Ninguna (orquesta form + hook + output)                                             | Estado del reviewer: alert de injection, reset de diff, composición                 |
| `ReviewOutput`    | `src/components/review-output/ReviewOutput.tsx`  | `review` (`ReviewResponse`), `usage` (`ReviewUsage \| null`)                        | Render del resultado: verdict, summary, findings, CO₂, costo API, copy-to-clipboard |
| `IACard`          | `src/components/IA/IA.tsx`                       | `proyecto` (`ProyectoIA`)                                                           | Tarjeta individual de experiencia con IA                                            |
| `SobreMi`         | `src/components/SobreMi/SobreMi.tsx`             | Ninguna (data inline)                                                               | Bio, fortalezas y stack diario                                                      |
| `OpenSource`      | `src/components/OpenSource/OpenSource.tsx`       | Ninguna (lee `openSource` de `src/data/proyectos.ts`)                               | Repositorios públicos verificables                                                  |
| `Certificados`    | `src/components/Certificados/Certificados.tsx`   | Ninguna (data inline)                                                               | PDFs de certificaciones verificables                                                |
| `Contacto`        | `src/components/Contacto/Contacto.tsx`           | Ninguna (data inline)                                                               | Formulario de contacto                                                              |

## Flujo de datos

1. **Página de inicio** (`/`): contenido estático renderizado en SSG. Los datos vienen de `src/data/proyectos.ts` y se injectan en tiempo de build. `index.tsx` compone: Hero → Badge (WebSiteCarbon) → Proyectos → IA → OpenSource → SobreMi → Certificados → Contacto.

2. **Página de AI Code Reviewer** (`/review`):
   - El usuario visita `/review` (página estática con `getConfig({ render: 'static' })`)
   - El usuario pega un unified diff en el `ReviewForm`
   - Al submit, se hace `POST /api/review` desde el cliente
   - El handler en `src/lib/server/review/reviewRoute.ts` ejecuta el flujo de seguridad:
     1. Validar origen (CSRF allowlist)
     2. Honeypot check (checkbox oculto)
     3. Rate limit en memoria (10/min por IP) → 429
     4. Rate limit Blobs (3/día por IP, tolerante a errores) → 429
     5. Validar estructura del diff (`validate-diff.ts`: ≤50 KB, headers `--- a/` / `+++ b/`)
     6. Detectar prompt injection (`detect-injection.ts`: 7 patrones flex) → 400 + `injection_detected`
     7. Sanitizar el diff (`sanitize.ts`: escape triple backticks, quitar chars de control, truncar líneas a 2000 chars)
     8. Llamar a `openai.responses.stream()` con `gpt-5.6-luna`, `SYSTEM_PROMPT` y `REVIEW_SCHEMA`
     9. Devolver SSE: `delta` → `usage` (tokens) → `done`, con security headers
   - El cliente usa `useReviewStream` hook para leer los eventos SSE incrementalmente
   - Se muestra el verdict, summary, findings con badges de severidad, CO₂ estimado y costo API estimado

3. **Navegación y layout**:
   - `_layout.tsx`: skip link (accesibilidad), nav sticky, footer
   - `_root.tsx`: shell HTML, meta tags, JSON-LD (Person), `getConfig({ render: 'static' })`
   - `index.tsx`: composición de todas las secciones (Hero, Badge, Proyectos, IA, OpenSource, SobreMi, Certificados, Contacto)

---

## Referencias

- [Plan de documentación](../_plan.md)
- [Diagrama de flujo de datos](data-flow.md)
- [Netlify Docs — Functions](https://docs.netlify.com/functions/)
