# Quickstart — Punto de entrada

## Stack resumido

| Tecnología       | Versión        | Propósito                            |
| ---------------- | -------------- | ------------------------------------ |
| **Waku**         | 1 beta         | React Server Components + React 19   |
| **TypeScript**   | 6.0.3          | Tipado estricto                      |
| **Tailwind CSS** | v4             | Estilizado utility-first             |
| **OpenAI**       | `gpt-5.6-luna` | Respuestas API para AI Code Reviewer |
| **Netlify**      | —              | Despliegue + Blobs (rate limit)      |
| **Vitest**       | 4.1.11         | Suite de tests (151 tests)           |

## Mapa rápido de documentos

| Dominio                        | Documento                                                 |
| ------------------------------ | --------------------------------------------------------- |
| **Arquitectura**               | `architecture/overview.md`, `architecture/data-flow.md`   |
| **Backend / Seguridad**        | `backend/auth.md`, `backend/database.md`                  |
| **Componentes**                | `components/overview.md`                                  |
| **Funcionalidades destacadas** | `features/ai-code-reviewer.md`                            |
| **Despliegue**                 | `deployment/platform.md`, `deployment/troubleshooting.md` |
| **CI/CD**                      | `ci-cd/overview.md`                                       |
| **Utilidades**                 | `utils/overview.md`                                       |

## Inicio rápido (3 pasos)

### Paso 1: Instalar dependencias

```bash
pnpm install
```

### Paso 2: Desarrollo local

```bash
pnpm dev
```

- La app correrá en `http://localhost:3000` (puerto configurado en `waku.config.ts`).
- El AI Code Reviewer está disponible en `/review`.
- Los tests se pueden correr con `pnpm test`.

### Paso 3: Build y deploy

```bash
pnpm build          # build estático (SSG)
pnpm deploy:netlify  # audit + test + format + lint + deploy a Netlify
```

## Stack técnico en detalle

- **Render estático**: todo el sitio se genera en build (`pnpm build`). El AI Code Reviewer es una página estática que llama a una Netlify Function mediante fetch a `/api/review`.
- **Rutas**: `src/pages/` con `_layout.tsx` (nav, skip link, footer) y `_root.tsx` (shell HTML, meta tags, JSON-LD Person). `getConfig({ render: 'static' })` en las páginas.
- **Data-driven**: los proyectos y repos vienen de `src/data/proyectos.ts` (single source of truth).
- **Security in layers**: honeypot → rate limit (3/día por IP via Netlify Blobs) → validate → detect injection → sanitize → OpenAI Responses API → security headers.
- **Accesibilidad**: skip link, foco visible (`focus-visible:outline-red-400`), `aria-label` descriptivos, contraste AA+, `prefers-reduced-motion` respetado.
- **Tipografía**: `Lexend_Mega` solo en headings/brand; cuerpo usa fuente nativa del sistema.

## Funcionalidades destacadas

Si existen features documentadas en `features/`, aparecen aquí con enlace y descripción:

- **AI Code Reviewer** (`features/ai-code-reviewer.md`):pega un unified diff y recibe un review técnico estructurado con severidad, categoría y fix sugerido. Construido sobre la Responses API de OpenAI con JSON Schema estricto y streaming en vivo.

## Variables de entorno

Todas las variables deben configurarse en **Netlify UI** (Site settings > Environment variables), **no** en el repo (`.env` está en `.gitignore`):

| Variable          | Requerido    | Descripción                          |
| ----------------- | ------------ | ------------------------------------ |
| `OPENAI_API_KEY`  | **Sí**       | API key de OpenAI (solo server-side) |
| `ALLOWED_ORIGINS` | No (aditivo) | CSV de orígenes adicionales          |

## Scripts disponibles

| Script                | Descripción                                     |
| --------------------- | ----------------------------------------------- |
| `pnpm install`        | Dependencias                                    |
| `pnpm dev`            | Desarrollo en http://localhost:3000             |
| `pnpm build`          | Build estático (SSG)                            |
| `pnpm start`          | Servir build localmente                         |
| `pnpm test`           | Ejecutar tests Vitest (151 tests, 24 archivos)  |
| `pnpm lint`           | ESLint con autofix                              |
| `pnpm format:fix`     | Prettier auto-fix                               |
| `pnpm deploy:netlify` | Audit + test + format + lint + deploy a Netlify |

---

## Referencias

- [Visión general del stack](backend/auth.md)
- [Arquitectura general](architecture/overview.md)
- [Guía rápida de inicio](quickstart.md)
