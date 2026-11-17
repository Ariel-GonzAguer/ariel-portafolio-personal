# Plan: Documentación del proyecto ariel-personal

> **Estado**: documentación actualizada al commit `HEAD` (2026-11-16). 12 documentos + `.last-update.json`.
> **Propósito**: que un desarrollador senior externo pueda entender el proyecto y hacer un deploy a producción usando solo esta wiki.
> **Stack**: Waku 1 beta + React 19 + TypeScript estricto + Tailwind CSS v4 + Netlify + Infron (Chat Completions)

---

## Estructura de la wiki

| Directorio      | Documentos                                                                               |
| --------------- | ---------------------------------------------------------------------------------------- |
| `architecture/` | `overview.md`, `data-flow.md`                                                            |
| `backend/`      | `auth.md` (7 capas de seguridad), `database.md` (modelos de datos y estado del reviewer) |
| `components/`   | `overview.md` (catálogo completo de componentes y patrones)                              |
| `features/`     | `ai-code-reviewer.md` (funcionalidad destacada, incluye costo API y CO₂)                 |
| `deployment/`   | `platform.md` (Netlify), `troubleshooting.md` (12 entradas)                              |
| `ci-cd/`        | `overview.md` (no hay GitHub Actions; flujo de deploy manual)                            |
| `utils/`        | `overview.md` (a11y, co2, review-cost, styles.css, middleware)                           |

---

## Cambios reflejados en esta actualización

Respecto a la versión anterior de la wiki (commit `e423868`, 2026-09-07), se incorporó el cambio de proveedor de IA del AI Code Reviewer:

| Cambio en el código                                                     | Documentos actualizados                                                                                         |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Proveedor OpenAI → Infron (`deepseek/deepseek-v4.1-flash-1017`)        | `quickstart.md`, `_plan.md`, `architecture/overview.md`, `architecture/data-flow.md`, `backend/auth.md`, `backend/database.md`, `features/ai-code-reviewer.md`, `deployment/platform.md`, `deployment/troubleshooting.md`, `ci-cd/overview.md`, `utils/overview.md` |
| Env `OPENAI_API_KEY` → `INFRON_API_KEY`                                 | `quickstart.md`, `deployment/platform.md`, `deployment/troubleshooting.md`, `ci-cd/overview.md`                   |
| Protocolo Responses API → Chat Completions (`chat.completions.create`)  | `backend/auth.md`, `architecture/data-flow.md`, `features/ai-code-reviewer.md`                                   |
| Tarifas nuevas (`0.18` input / `0.72` output / `0.006` cache read)      | `utils/overview.md`, `backend/database.md`, `features/ai-code-reviewer.md`                                       |
| Contrato de salida de 3 claves en `SYSTEM_PROMPT` (Infron no aplica `strict`) | `backend/auth.md`, `features/ai-code-reviewer.md`, `deployment/troubleshooting.md`                        |
| Tests: 219 en 30 archivos (antes 181 en 27)                             | `quickstart.md`, `architecture/overview.md`, `ci-cd/overview.md`, `deployment/troubleshooting.md`                |

---

## Checklist de calidad (Quality Gate)

- [x] `_plan.md` existe y está actualizado.
- [x] `quickstart.md` existe y enlaza todos los documentos.
- [x] `.last-update.json` actualizado con `gitHead` real.
- [x] Cada documento tiene al menos una tabla.
- [x] Documentos de flujo/arquitectura tienen diagrama ASCII.
- [x] Cada documento tiene sección `Referencias` con links válidos.
- [x] Ejemplos de código extraídos del proyecto real.
- [x] `deployment/troubleshooting.md` tiene 12 entradas reales del proyecto.
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
