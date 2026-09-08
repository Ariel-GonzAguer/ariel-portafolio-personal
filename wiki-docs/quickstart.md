# Quickstart — Punto de entrada

## Stack resumido

| Tecnología       | Versión                                | Propósito                                                   |
| ---------------- | -------------------------------------- | ----------------------------------------------------------- |
| **Waku**         | `1.0.0-beta.9`                         | React Server Components + React 19                          |
| **React**        | `19.2.8`                               | Framework UI                                                |
| **TypeScript**   | `6.0.3`                                | Tipado estricto                                             |
| **Tailwind CSS** | `4.3.3` (v4)                           | Estilizado utility-first                                    |
| **OpenAI**       | `openai@^7.7.0`, modelo `gpt-5.6-luna` | Responses API para AI Code Reviewer                         |
| **Netlify**      | —                                      | Despliegue + Functions + Blobs + Edge Functions (CSP nonce) |
| **Vitest**       | `4.1.11`                               | Suite de tests (181 tests, 27 archivos)                     |

## Mapa rápido de documentos

| Dominio                        | Documento                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Arquitectura**               | [architecture/overview.md](architecture/overview.md), [architecture/data-flow.md](architecture/data-flow.md)     |
| **Backend / Seguridad**        | [backend/auth.md](backend/auth.md), [backend/database.md](backend/database.md)                                   |
| **Componentes**                | [components/overview.md](components/overview.md)                                                                 |
| **Funcionalidades destacadas** | [features/ai-code-reviewer.md](features/ai-code-reviewer.md)                                                     |
| **Despliegue**                 | [deployment/platform.md](deployment/platform.md), [deployment/troubleshooting.md](deployment/troubleshooting.md) |
| **CI/CD**                      | [ci-cd/overview.md](ci-cd/overview.md)                                                                           |
| **Utilidades**                 | [utils/overview.md](utils/overview.md)                                                                           |
| **Plan de documentación**      | [_plan.md](_plan.md)                                                                                             |

## Inicio rápido

### Paso 1: Instalar dependencias

```bash
pnpm install
```

### Paso 2: Desarrollo local

```bash
pnpm dev
```

- La app corre en `http://localhost:3000` (puerto configurado en `waku.config.ts`).
- El AI Code Reviewer está disponible en `/review` (`pnpm dev` levanta el server de Waku con las API routes; para simular Netlify completo usar `pnpm dev:netlify`).
- Los tests se corren con `pnpm test`.

### Paso 3: Build y deploy

```bash
pnpm build            # build estático (SSG) → dist/public
pnpm deploy:netlify   # audit + test + format:fix + lint + deploy a Netlify
```

## Stack técnico en detalle

- **Render estático**: todo el sitio se genera en build (`pnpm build`). El AI Code Reviewer es una página estática que llama a la Netlify Function `/api/review` (API route de Waku servida vía `netlify-functions/serve.js`).
- **Rutas**: `src/pages/` con `_layout.tsx` (skip link, nav sticky, footer) y `_root.tsx` (shell HTML, meta tags, JSON-LD Person). `getConfig({ render: 'static' })` en las páginas.
- **Data-driven**: los proyectos y repos vienen de `src/data/proyectos.ts` (single source of truth).
- **Security in layers**: origin check → honeypot → rate limit (memoria 10/min + Blobs 3/día) → validate diff → detect injection (rechaza) → sanitize → OpenAI Responses API → security headers.
- **Transparencia de costo/clima**: el reviewer muestra costo API estimado (USD, tarifas públicas de `gpt-5.6-luna`) e impacto climático estimado (rango gCO₂e por tokens), calculados con el `usage` real del stream.
- **Accesibilidad**: skip link, foco visible (`focus-visible:outline-red-400`), `aria-label` descriptivos, contraste AA+, `prefers-reduced-motion` respetado.
- **Tipografía**: `Lexend_Mega` solo en headings/brand; cuerpo usa fuente nativa del sistema.
- **Sostenibilidad visible**: `Badge` de WebSiteCarbon en la home.

## Funcionalidades destacadas

- **AI Code Reviewer** ([features/ai-code-reviewer.md](features/ai-code-reviewer.md)): pega un unified diff y recibe un review técnico estructurado con severidad, categoría y fix sugerido. Construido sobre la Responses API de OpenAI con JSON Schema estricto, streaming en vivo, 7 capas de seguridad, costo API y CO₂ estimados.

## Variables de entorno

Todas las variables deben configurarse en **Netlify UI** (Site settings > Environment variables), **no** en el repo (`.env` está en `.gitignore`):

| Variable          | Requerido    | Descripción                          |
| ----------------- | ------------ | ------------------------------------ |
| `OPENAI_API_KEY`  | **Sí**       | API key de OpenAI (solo server-side) |
| `ALLOWED_ORIGINS` | No (aditivo) | CSV de orígenes adicionales          |

## Scripts disponibles

| Script                | Comando                                                                                     | Cuándo ejecutarlo                    |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| `pnpm install`        | —                                                                                           | Instalar dependencias                |
| `pnpm dev`            | `waku dev`                                                                                  | Desarrollo en http://localhost:3000  |
| `pnpm dev:netlify`    | `netlify dev`                                                                               | Simular entorno Netlify localmente   |
| `pnpm build`          | `waku build`                                                                                | Build estático (SSG) → `dist/public` |
| `pnpm start`          | `waku start`                                                                                | Servir build localmente              |
| `pnpm test`           | `vitest --run`                                                                              | Tests (181 tests, 27 archivos)       |
| `pnpm lint`           | `eslint . --ext .ts,.tsx --fix`                                                             | ESLint con autofix                   |
| `pnpm format:fix`     | `prettier --write .`                                                                        | Prettier auto-fix                    |
| `pnpm deploy:netlify` | `pnpm audit && pnpm test && pnpm format:fix && pnpm lint && bash scripts/deploy-netlify.sh` | Deploy a Netlify                     |

---

## Referencias

- [Arquitectura general](architecture/overview.md)
- [Capas de seguridad](backend/auth.md)
- [Plataforma de despliegue](deployment/platform.md)
- [Troubleshooting](deployment/troubleshooting.md)
- [Plan de documentación](_plan.md)
