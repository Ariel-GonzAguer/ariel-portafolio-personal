# Roadmap

## Phase 1 — Correcciones del pentest 2026-11-03

- [ ] Endurecer `/api/review`: validación estricta de entrada (tipos, Content-Type 415, JSON malformado 400) sin romper honeypots (H1, H5).
- [ ] Manejar `OPTIONS /api/review` con preflight CORS y allowlist de Origin (H4).
- [ ] Normalizar redirecciones de rutas de directorio y URLs canónicas sin bucles (H2, H6).
- [ ] Completar rate limit de costos: 429 con `code` estable, cooldown UX en el cliente y log de abuso (H3).
- [ ] Suite de regresión del pentest en verde (tests + build local, re-test curl contra deploy).

## Phase 2 — Verificación en producción y costos

- [ ] Deploy a producción aprobado por el dueño y re-test curl de los hallazgos H1-H6 contra el sitio.
- [ ] Confirmar en logs de Netlify Functions que el rate limit de Blobs engagea (4 requests seguidas → 429).
- [ ] Monthly spending limit y alerta por email en el dashboard de OpenAI (config de cuenta).

## Phase 3 — Superficie relacionada

- [ ] Auditar rate limit / cost abuse del chatbot en gatorojolab.com (Mandarino), superficie similar a H3.
- [ ] Auditar reglas de Firebase (Firestore/Auth) si hay datos sensibles, aparte de este host.
