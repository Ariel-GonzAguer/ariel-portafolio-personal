# Plan: Documentación del proyecto ariel-personal

> **Estado**: documentación inicial completa (17 archivos, 7 directorios)
> **Propósito**: que un desarrollador senior externo pueda entender el proyecto y hacer un deploy a producción usando solo esta wiki.
> **Stack**: Waku 1 beta + React 19 + TypeScript estricto + Tailwind CSS v4 + Netlify + OpenAI Responses API

---

## Estructura planeada

| Directorio | Contenido |
| ---------- | --------- |
| `architecture/` | Visión general,rutos, flujo de datos |
| `backend/` | Autenticación, base de datos, seguridad |
| `components/` | Sistema de componentes, accesibilidad |
| `features/` | Funcionalidades destacadas (AI Code Reviewer, QR, etc.) |
| `deployment/` | Plataforma, troubleshooting, PWA |
| `ci-cd/` | Pipelines CI/CD |
| `utils/` | Librerías y utilidades |

---

## Documentos por crear (checklist de 17 items)

- [ ] `architecture/overview.md` — Visión general del stack y arquitectura
- [ ] `architecture/data-flow.md` — Diagramas de flujo de datos clave
- [ ] `backend/auth.md` — Capas de seguridad (honeypot, rate limit, injection, sanitization, headers, origin)
- [ ] `backend/database.md` — Modelos de datos, `src/data/proyectos.ts`, ProyectoIA
- [ ] `components/overview.md` — Catálogo de componentes UI, props, patrones
- [ ] `features/ai-code-reviewer.md` — Funcionalidad destacada: AI Code Reviewer completo
- [ ] `deployment/platform.md` — Plataforma Netlify, variables de entorno, edge functions
- [ ] `deployment/troubleshooting.md` — Errores comunes (rate limit, streaming, CSP, API key)
- [ ] `ci-cd/overview.md` — Nota: no hay GitHub Actions; flujo de deploy manual
- [ ] `utils/overview.md` — Utilidades (a11y, CO2, focusClassName)
- [ ] `quickstart.md` — Punto de entrada, stack resumido, mapa rápido, features destacadas
- [ ] `.last-update.json` — Metadata de actualización
- [ ] Cross-link validation — verificar que todos los links internos funcionan
- [ ] Diagramas ASCII en documentos de flujo/arquitectura (obligatorio)
- [ ] Ejemplos de código son del proyecto real (no inventados)
- [ ] Referencias cruzadas son correctas (0 links rotos)
- [ ] Cada archivo tiene contenido relevante (no plantillas vacías)

---

## Variables de configuración

| Variable | Descripción | Default |
| -------- | ----------- | ------- |
| `wiki_dir` | Directorio de documentación | `wiki-docs/` |
| `language` | Idioma de la documentación | Español |
| `include_code_examples` | Incluir ejemplos de código | `true` |
| `include_diagrams` | Incluir diagramas ASCII | `true` |
| `detail_level` | Nivel de detalle | `intermedio` |

---

## Adaptación por framework

Sin importar el framework, la documentación debe cubrir:

- Stack tecnológico (Waku 1 beta, React 19, TypeScript estricto, Tailwind CSS v4)
- Render estático (SSG): todo el sitio se genera en build; AI Code Reviewer es una página estática que llama a una Netlify Function
- Routing: `src/pages/` con `_layout.tsx` y `_root.tsx` como shell
- Documentar Server Components y RSC donde aplican
- Explicar endpoints de API (`/api/review`) y actions
- Documentar plugins y configuración (Tailwind v4 `@theme`)
- Seguridad y validaciones (7 capas: honeypot → rate limit → validate → detect injection → sanitize → OpenAI → headers)
- Base de datos: `src/data/proyectos.ts` como única fuente de verdad para proyectos y repos
- `deployment/troubleshooting.md` con errores comunes del stack usado (obligatorio)
- `ci-cd/overview.md` con todos los workflows de GitHub Actions (si existen)
- `features/` con una entrada por funcionalidad destacada encontrada en el codigo

---

## Preguntas al usuario

1. ¿Qué directorio usar para la documentación? (default: `wiki-docs/`)
2. ¿Qué nivel de detalle necesitas? (básico/intermedio/avanzado; default: intermedio)
3. ¿Hay secciones específicas que quieras incluir/excluir?
4. ¿El proyecto tiene documentación existente que respetar? (README.md con 50%+ de info)
5. ¿En qué idioma debe estar la documentación? (default: Español)
  ---
  
  ## Referencias
  
  - [Plan de documentación completa](_plan.md)
  - [Arquitectura general](architecture/overview.md)
  - [Guía rápida](quickstart.md)