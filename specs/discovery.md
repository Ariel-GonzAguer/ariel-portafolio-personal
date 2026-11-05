# Descubrimiento del proyecto

Descubrimiento realizado el 2026-11-04 como entrada al flujo SDD, a partir del plan de correcciones del pentest del 2026-11-03 (`plan-correcciones-pentest-arielgonzaguer.md`) y la inspección del repositorio.

## Inventario observado

- **Tipo de proyecto**: portafolio personal estático con un producto interactivo (AI Code Reviewer en `/review`).
- **Stack**: Waku 1.0.0-rc.0 (React 19 + RSC) + TypeScript, Tailwind CSS v4, Vitest 5 + Testing Library + jsdom, pnpm.
- **Backend**: Netlify Functions (`netlify-functions/serve.js` delega en `INTERNAL_runFetch` de Waku con `preferStatic: true`), Netlify Edge Function `csp-nonce` (`src/middleware` + `netlify/edge-functions/csp-nonce.ts`), Netlify Blobs para rate limit.
- **API**: `src/pages/_api/api/review.ts` exporta `GET` (405 explícito) y `POST` (delega en `handleReview`).
- **Handler `/api/review`**: `src/lib/server/review/reviewRoute.ts` con cadena: origen → honeypot → rate limits → validateDiff → detectInjection → sanitize → OpenAI Responses API (streaming SSE, modelo `gatorojolab` configurado en `utils/review-cost`).
- **Módulos server-only**: `validate-origin` (allowlist + soporte dev), `rate-limit` (3 req/día por IP vía Blobs, ventana UTC), `in-memory-rate-limit` (10/min como red de seguridad), `validate-diff` (máx 50 KB, headers unified obligatorios), `sanitize`, `detect-injection` (solo loguea), `security-headers`.
- **Cliente**: `useReviewStream` (SSE por `getReader`, cancelación, cooldown persistido en `localStorage` con clave `review:injectionCooldownUntil`), `ReviewForm` (honeypots: checkbox oculta `website` + trampa semántica).
- **Config Netlify**: `netlify.toml` con `pretty_urls = false`, `included_files = ["private/**"]`, headers de seguridad globales. No existe `public/_redirects`.
- **Build**: `waku build` → `dist/public` (assets estáticos, incluye `review/`, `RSC/`, `certificados/`) + `dist/server`.

## Comportamiento y flujos actuales

- **POST /api/review**: valida origen (allowlist, 403 si no), honeypot truthy (`website`) responde `{ok:true}` sin gastar OpenAI, rate limit diario (3/día por IP vía Blobs, tolerante a fallos) + en memoria (10/min), valida diff (vacío, >50 KB, no unified, binario → 400), detecta inyección (400 + `code: 'injection_detected'`), sanitiza y streamea SSE.
- **Cooldown del cliente**: se activa SOLO con `code === 'injection_detected'` en respuestas 4xx JSON; 6 minutos, persistido en localStorage.
- **Errores JSON**: `jsonError(message, status, headers, code?)` con security headers.
- **Rutas de directorio en producción** (según pentest): `/certificados` ↔ `/certificados/` generan bucle 301 mutuo; los archivos reales (PDFs) sirven 200.
- **GET /api/review** → 405 explícito. **OPTIONS /api/review** → 500 (no exportado, confirmado por pentest y por ausencia de export en el route).

## Arquitectura y convenciones

- Módulos server-only en `src/lib/server/review/`; prohibido importarlos desde componentes o hooks cliente (documentado en JSDoc de `reviewRoute.ts`).
- Tests unitarios por módulo con el sufijo `.test.ts` junto al código; mocks de `openai`, `waku` y rate limit en `reviewRoute.test.ts`.
- Copy de UI en español; comentarios de código en español.
- Commits semánticos sin atribución de IA; deploy manual con `pnpm deploy:netlify` (audit + test + format + lint + script bash).
- Sin TypeScript `typecheck` script dedicado; la verificación de tipos corre vía `waku build`.

## Validación actual

- `pnpm test` (Vitest, 149 tests según README), `pnpm lint` (ESLint con `--fix`), `pnpm build` (Waku, hace typecheck implícito), `pnpm dev:netlify` (Netlify CLI local).
- No hay CI configurado en el repo (deploy manual por CLI).

## Riesgos y deuda

- **H1 confirmado en código**: `{"diff": 12345}` → `validateDiff` llama `input.trim()` sobre un número → excepción sin catch → 500.
- **H4 confirmado**: OPTIONS sin export en la route de Waku → 500.
- **H5 confirmado**: no hay chequeo de `Content-Type`; `text/plain` con JSON se procesa igual.
- **H2 confirmado por pentest**: bucle 301 en rutas de directorio; no existe `_redirects` que normalice.
- **H3 ya mitigado parcialmente**: el rate limit por IP (3/día vía Blobs + 10/min en memoria) YA existe y usa `x-nf-client-connection-ip`. Las 2 requests del pentest no dieron 429 porque el límite diario es 3. Quedan gaps: sin log de abuso, y el cliente no activa cooldown UX en 429.
- **Discrepancia UI/server**: el copy dice "Máximo 100 KB" pero el server rechaza >50 KB (más estricto). Un usuario con diff de 60 KB ve un rechazo que la UI no anticipa.
- **H6**: URLs canónicas `/review/` y `/REVIEW` sin normalización definida en el repo.
- **Verificación de producción limitada**: H2/H4/H5/H6 solo son re-testeables contra el sitio desplegado; el entorno local emula parcialmente (netlify dev) o exige deploy de preview.

## Preguntas abiertas

- Mecanismo de cooldown en 429: el plan propone evento SSE `cooldown` "que el cliente ya escucha", pero el cliente NO escucha ese evento (solo procesa `delta`/`usage`/`error`/`done` y el `code` de errores JSON). Ver Clarifications del feature spec.
- Confirmar en logs de Netlify (tarea del dueño) que el rate limit de Blobs engagea en producción.
