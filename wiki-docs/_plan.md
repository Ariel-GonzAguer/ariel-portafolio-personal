# Plan: Documentación del proyecto ariel-personal

> **Estado**: documentación actualizada al commit `e423868` (2026-09-07). 12 documentos + `.last-update.json`.
> **Propósito**: que un desarrollador senior externo pueda entender el proyecto y hacer un deploy a producción usando solo esta wiki.
> **Stack**: Waku 1 beta + React 19 + TypeScript estricto + Tailwind CSS v4 + Netlify + OpenAI Responses API

---

## Estructura de la wiki

| Directorio      | Documentos                                                                               |
| --------------- | ---------------------------------------------------------------------------------------- |
| `architecture/` | `overview.md`, `data-flow.md`                                                            |
| `backend/`      | `auth.md` (7 capas de seguridad), `database.md` (modelos de datos y estado del reviewer) |
| `components/`   | `overview.md` (catálogo completo de componentes y patrones)                              |
| `features/`     | `ai-code-reviewer.md` (funcionalidad destacada, incluye costo API y CO₂)                 |
| `deployment/`   | `platform.md` (Netlify), `troubleshooting.md` (10 entradas)                              |
| `ci-cd/`        | `overview.md` (no hay GitHub Actions; flujo de deploy manual)                            |
| `utils/`        | `overview.md` (a11y, co2, review-cost, styles.css, middleware)                           |

---

## Cambios reflejados en esta actualización

Respecto a la versión anterior de la wiki (commit `371b544`), se incorporaron los cambios de los commits `61afc15`, `0c49f4b` y `e423868`:

| Cambio en el código                                        | Documentos actualizados                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Seguimiento de tokens (`ReviewUsage`) por SSE              | `features/ai-code-reviewer.md`, `backend/database.md`, `architecture/data-flow.md`, `utils/overview.md` |
| Cálculo de impacto climático (`calculateReviewCO2Range`)   | `utils/overview.md`, `features/ai-code-reviewer.md`, `backend/database.md`                              |
| Cálculo de costo API (`review-cost.ts`)                    | `utils/overview.md`, `features/ai-code-reviewer.md`                                                     |
| Cooldown de 6 min persistido en localStorage               | `features/ai-code-reviewer.md`, `backend/database.md`, `components/overview.md`                         |
| Detección de injection ahora RECHAZA (antes solo logueaba) | `backend/auth.md`, `features/ai-code-reviewer.md`, `architecture/data-flow.md`                          |
| Patrones `flex()` tolerantes a snake/kebab-case            | `backend/auth.md`                                                                                       |
| Nuevo componente `Badge` (WebSiteCarbon)                   | `components/overview.md`, `architecture/overview.md`                                                    |
| Rate limit secundario en memoria (10/min)                  | `backend/auth.md`, `architecture/overview.md`                                                           |
| `netlify.toml` real documentado                            | `deployment/platform.md`                                                                                |
| Tests: 181 en 27 archivos (antes 151 en 24)                | `quickstart.md`, `architecture/overview.md`, `ci-cd/overview.md`, `deployment/troubleshooting.md`       |

---

## Checklist de calidad (Quality Gate)

- [x] `_plan.md` existe y está actualizado.
- [x] `quickstart.md` existe y enlaza todos los documentos.
- [x] `.last-update.json` actualizado con `gitHead` real.
- [x] Cada documento tiene al menos una tabla.
- [x] Documentos de flujo/arquitectura tienen diagrama ASCII.
- [x] Cada documento tiene sección `Referencias` con links válidos.
- [x] Ejemplos de código extraídos del proyecto real.
- [x] `deployment/troubleshooting.md` tiene 10 entradas reales del proyecto.
- [x] Todos los links internos apuntan a archivos existentes.
- [x] Funcionalidad destacada (`ai-code-reviewer`) documentada en `features/`.

---

## Adaptación por framework

- Stack: Waku 1 beta, React 19, TypeScript estricto, Tailwind CSS v4.
- Render estático (SSG): todo el sitio se genera en build; el AI Code Reviewer es una página estática que llama a una Netlify Function.
- Routing: `src/pages/` con `_root.tsx` y `_layout.tsx` como shell; `/review` es página estática.
- Endpoint API: `POST /api/review` (`src/pages/_api/api/review.ts` → `handleReview`).
- Seguridad: 7 capas documentadas en `backend/auth.md`.
- Datos: `src/data/proyectos.ts` como única fuente de verdad.
- `deployment/troubleshooting.md` con errores comunes del stack.
- `ci-cd/overview.md` documenta la ausencia de GitHub Actions y el flujo manual.

---

## Referencias

- [Plan de documentación completa](_plan.md)
- [Arquitectura general](architecture/overview.md)
- [Guía rápida](quickstart.md)
