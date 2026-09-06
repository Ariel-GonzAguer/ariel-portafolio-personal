# Visión general del stack y la arquitectura

## Stack tecnológico

| Componente | Tecnología | Detalles |
| ---------- | ---------- | -------- |
| Framework | [Waku](https://waku.gg) 1 beta | React Server Components (RSC) + React 19 |
| CSS | [Tailwind CSS](https://tailwindcss.com) v4 | `@theme` syntax, `Lexend_Mega` solo para headings/brand |
| Language | [TypeScript](https://typescriptlang.org) | Modo estricto (`strict: true`), `noEmit: true` |
| Pruebas | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) | 151 tests en 24 archivos |
| Despliegue | [Netlify](https://netlify.com) | Functions + Blobs + Git deploys |
| IA | [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses) | Modelo `gpt-5.6-luna`, JSON Schema estricto, streaming SSE |

## Arquitectura general

El sitio es **totalmente estático (SSG)**: todas las páginas se generan en build y se sirven como HTML plano. El único contenido dinámico es el **AI Code Reviewer** en `/review`, que es una página estática que llama a una Netlify Function mediante fetch a `/api/review`.

```
┌─────────────────────┐
│   Cliente (browser) │
│  + HTML statically  │
│  + CSS (Tailwind v4)│
│  + JS (RSC + hooks) │
└───────┬──────────────┘
        │ fetch /api/review
        ▼
┌─────────────────────┐
│  Netlify Function   │
│  POST /api/review   │
│  - Rate limit (3/día/IP) │
│  - Honeypot anti-bot │
│  - Validate diff      │
│  - Detect injection   │
│  - Sanitize input     │
│  - OpenAI Responses API│
│  - SSE streaming      │
│  - Security headers   │
└───────┬──────────────┘
        │
        ▼
┌─────────────────────┐
│  OpenAI API         │
│  gpt-5.6-luna       │
│  JSON Schema        │
└─────────────────────┘
```

## Decisiones técnicas clave

| Decisión | Justificación |
| -------- | ------------ |
| **Render estático** | Todo el sitio se genera en build; el AI Code Reviewer es una página estática que llama a una Netlify Function. Esto reduce costos y mejora seguridad. |
| **Tipografía estratégica** | `Lexend_Mega` solo en headings y marca; el cuerpo usa la fuente nativa del sistema para mejor performance. |
| **Accesibilidad como base** | Skip link, foco visible (`focus-visible:outline-red-400`), `aria-label` descriptivos, contraste AA+, `prefers-reduced-motion` respetado (media query en `styles.css`). |
| **Datos desacoplados** | Los proyectos viven en `src/data/proyectos.ts`; los componentes solo renderizan. Single source of truth. |
| **Links honestos** | Los productos privados no muestran botones de código; solo se enlaza repositorio público. |
| **Seguridad en capas** | Honeypot → rate limit (3/día por IP via Netlify Blobs) → validate → detect injection → sanitize → OpenAI Responses API → security headers. |
| **No barrel files** | Un componente por carpeta con test al lado (patrón consistente en `IA/`, `Proyectos/`, `SobreMi/`, etc.). |

## Componentes principales

| Componente | Ubicación | Props principales | Propósito |
| ---------- | --------- | ---------------- | --------- |
| `Hero` | `src/components/Hero/Hero.tsx` | Ninguna (data inline) | Sección hero con nombre, posicionamiento y stack rápido |
| `Proyectos` | `src/components/Proyectos/Proyectos.tsx` | `proyectos` de `src/data/proyectos.ts` | Cards de 4 productos reales (SaaS, ecommerce, SEO local, QR) |
| `IA` | `src/components/IA/IA.tsx` | `proyectosIA` de `src/data/proyectos.ts` | Tarjetas de experiencias con IA (chatbot, PWA, workflows) |
| `ReviewForm` | `src/components/review-form/ReviewForm.tsx` | `diff`, `onDiffChange`, `onSubmit`, `onExampleSelect`, `isLoading`, `cooldownUntil` | Formulario para pegar un unified diff con honeypot y 3 ejemplos precargados |
| `ReviewOutput` | `src/components/review-output/ReviewOutput.tsx` | `review` (`ReviewResponse`) | Render del resultado: verdict, summary, findings, CO₂ estimate, copy-to-clipboard |
| `IACard` | `src/components/IA/IA.tsx` | `proyecto` (`ProyectoIA`) | Tarjeta individual de experiencia con IA |
| `SobreMi` | `src/components/SobreMi/SobreMi.tsx` | Ninguna (data inline) | Bio, fortalezas y stack diario |
| `OpenSource` | `src/components/OpenSource/OpenSource.tsx` | `openSource` de `src/data/proyectos.ts` | Repositorios públicos verificables |
| `Certificados` | `src/components/Certificados/Certificados.tsx` | Ninguna (data inline) | PDFs de certificaciones verificables |
| `Contacto` | `src/components/Contacto/Contacto.tsx` | Ninguna (data inline) | Formulario de contacto |

## Flujo de datos

1. **Página de inicio** (`/`): contenido estático renderizado en SSG. Los datos vienen de `src/data/proyectos.ts` y se injectan en tiempo de build.

2. **Página de AI Code Reviewer** (`/review`): 
   - El usuario visita `/review` (página estática con `getConfig({ render: 'static' })`)
   - El usuario pega un unified diff en el `ReviewForm`
   - Al submit, se hace `POST /api/review` desde el cliente
   - El handler en `src/lib/server/review/reviewRoute.ts` ejecuta el flujo de seguridad:
     1. Validar origen (CSRF allowlist)
     2. Honeypot check (checkbox oculto)
     3. Rate limit (3/día por IP via Netlify Blobs + secondary 10/min en memoria)
     4. Validar estructura del diff (`validate-diff.ts`: ≤50 KB, headers `--- a/` / `+++ b/`)
     5. Detectar prompt injection (`detect-injection.ts`: 6 patrones)
     6. Sanitizar el diff (`sanitize.ts`: escape triple backticks, quitar chars de control, truncar líneas a 2000 chars)
     7. Llamar a `openai.responses.stream()` con `gpt-5.6-luna`, `SYSTEM_PROMPT` y `REVIEW_SCHEMA`
     8. Devolver respuesta SSE con security headers
   - El cliente usa `useReviewStream` hook para leer los eventos SSE incrementalmente
   - Se muestra el verdict, summary, findings con badges de severidad, y CO₂ estimado

3. **Navegación y layout**: 
   - `_layout.tsx`: nav, skip link (accesibilidad), footer
   - `_root.tsx`: shell HTML, meta tags, JSON-LD (Persona), getConfig({ render: 'static' })
   - `index.tsx`: composición de todas las secciones (Hero, Proyectos, IA, OpenSource, SobreMi, Certificados, Contacto)
  ---
  
  ## Referencias
  
  - [Plan original](\_plan.md)
  - [Arquitectura Waku](architecture/overview.md)
  - [Netlify Docs — Functions](https://docs.netlify.com/functions/)