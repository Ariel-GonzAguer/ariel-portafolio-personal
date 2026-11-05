# Tech Stack

## Language and runtime

- TypeScript estricto sobre Node.js (runtime serverless de Netlify Functions).
- Gestor de paquetes: pnpm (nunca npm ni yarn).

## Framework

- Waku 1.0.0-rc.0 (React 19 + React Server Components) como framework y SSG/SSR.
- API routes de Waku en `src/pages/_api/**` (exportan funciones por método HTTP).
- Deploy en Netlify (Functions + Edge Functions + Blobs). Nunca Vercel.

## Database and storage

- Netlify Blobs (`getStore`) para rate limiting por IP y estado efímero server-side.
- Sin base de datos relacional.

## Styling

- Tailwind CSS v4 vía plugin Vite (`@tailwindcss/vite`).

## Testing

- Vitest 5 + Testing Library + jsdom. Tests unitarios junto al módulo (`*.test.ts`).
- Mocks de `openai`, `waku` y Netlify Blobs en tests de rutas server.

## Key libraries

- `openai` (Responses API con streaming SSE y JSON Schema estricto).
- `@netlify/blobs` (persistencia serverless).
- `dompurify` (sanitización del output del LLM en cliente).
- `hono` (presente en dependencias; no agregar usos sin aprobación).

## Validation commands

- Tests: `pnpm test`
- Lint: `pnpm lint` (ejecuta ESLint con `--fix`; revisar el diff que deje)
- Build (incluye typecheck de Waku): `pnpm build`
- Deploy (solo con aprobación explícita del dueño): `pnpm deploy:netlify`

## Conventions

- Módulos server-only en `src/lib/server/**`: nunca importarlos desde componentes o hooks cliente.
- Copy de UI en español; comentarios de código en español neutro.
- Funciones declaradas con JSDoc que incluya ejemplo de uso.
- Commits semánticos (`feat:`, `fix:`, `chore:`, `docs:`) sin atribución de IA; nunca push directo a la rama principal.
- Seguridad como contrato: allowlist de Origin, honeypots intactos, `jsonError` con security headers, `code` snake_case estable para que el cliente reaccione, sanitización del diff y del output del LLM, CSP con nonce rotativa vía edge function.
- Cambios de seguridad documentados con la referencia del hallazgo (H1..H6 del pentest 2026-11-03).
