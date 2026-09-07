# Plataforma de despliegue

## Netlify

El proyecto se despliega en **Netlify**. La función serverless del reviewer se sirve a través del wrapper de Waku (`netlify-functions/serve.js`) que delega en el server de Waku; las rutas de API (`/api/review`) viven como API routes de Waku (`src/pages/_api/`).

### `netlify.toml`

Contenido real del archivo:

```toml
[build]
  command = "pnpm build"
  publish = "dist/public"

# Deshabilitar trailing slashes para evitar errores en rutas dinámicas
[build.processing]
  skip_processing = false

[build.processing.html]
  pretty_urls = false

[functions]
  included_files = ["private/**"]
  directory = "netlify-functions"

[[edge_functions]]
  function = "csp-nonce"
  path = "/*"

[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "SAMEORIGIN"
X-Content-Type-Options = "nosniff"
Referrer-Policy = "strict-origin-when-cross-origin"
Permissions-Policy = "camera=(self)"
Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"
```

**Notas importantes**:

- **Build**: `pnpm build` (Waku SSG) y `publish = "dist/public"`.
- **`pretty_urls = false`**: deshabilita trailing slashes en el procesamiento HTML.
- **Functions**: `directory = "netlify-functions"` con `included_files = ["private/**"]`.
- **Edge function**: `netlify/edge-functions/csp-nonce.ts` corre en `/*` y genera nonces dinámicos para Content Security Policy, inyectándolos en los scripts inline del HTML.
- **Headers estáticos** en `/*` (a nivel CDN): `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy: camera=(self)`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.

### `netlify-functions/serve.js` (wrapper de Waku)

```javascript
const { INTERNAL_runFetch } = await import("../dist/server/index.js");

export default async (request, context) =>
  INTERNAL_runFetch(process.env, request, { context });

export const config = {
  preferStatic: true,
  path: ['/', '/*', "/RSC/**/*"],
};
```

- El endpoint `/api/review` se alcanza a través de este wrapper: `src/pages/_api/api/review.ts` (API route de Waku) → `handleReview`.
- `preferStatic: true` prioriza servir contenido estático y solo delega al server para rutas dinámicas.

### Edge function `csp-nonce.ts`

- Genera un nonce criptográficamente seguro (`crypto.getRandomValues` + `btoa`) por request.
- Solo procesa respuestas `text/html`.
- CSP resultante: `default-src 'none'`, `script-src 'self' 'nonce-...'`, `connect-src 'self'`, `img-src 'self'`, `style-src 'self' 'unsafe-inline'`, `font-src 'self'`, `frame-ancestors 'self'`, `object-src 'none'`, `base-uri 'self'`, `manifest-src 'self'`.
- Inyecta el nonce en todos los `<script>` inline sin `src` (respeta los que ya tienen nonce).
- `connect-src 'self'` cubre el fetch del cliente a `/api/review`.

### Variables de entorno

Todas las variables deben configurarse en **Netlify UI** (Site settings > Environment variables), **no** en el repo (`.env` está en `.gitignore`).

| Variable                | Requerido    | Descripción                                                       | Default      |
| ----------------------- | ------------ | ----------------------------------------------------------------- | ------------ |
| `OPENAI_API_KEY`        | **Sí**       | API key de OpenAI (solo server-side, vía `getServerEnv`)          | —            |
| `ALLOWED_ORIGINS`       | No (aditivo) | CSV de orígenes adicionales (los por defecto siempre se permiten) | `''` (vacío) |
| `NODE_ENV`              | No           | Entorno de ejecución (la allowlist localhost solo aplica en `development`) | `production` |
| `NETLIFY_BLOBS_CONTEXT` | No (auto)    | Contexto de Netlify Blobs (se inicializa automáticamente)         | —            |

### Flujo de deploy manual

```bash
pnpm install                # dependencias
pnpm build                  # build estático (SSG) con Waku
pnpm deploy:netlify         # audit + test + format:fix + lint + scripts/deploy-netlify.sh
```

`scripts/deploy-netlify.sh`:

1. Carga variables de `.env` si existe (allexport).
2. Valida que `pnpm` y `netlify` CLI existan.
3. Ejecuta `NETLIFY=1 pnpm run build`.
4. Ejecuta `netlify deploy --prod` (con `--site $NETLIFY_SITE_ID` si la variable está definida).

`pnpm deploy:netlify` = `pnpm audit && pnpm test && pnpm format:fix && pnpm lint && bash scripts/deploy-netlify.sh`.

### Dominios configurados

- `https://arielgonzaguer.gatorojolab.com` — dominio principal (producción)
- `https://arielgonzaguer.dev` — dominio adicional (en allowlist por default en validate-origin.ts)

### HTTPS y seguridad

- Netlify emite certificados HTTPS automáticos vía Let's Encrypt.
- **Security headers** aplicados en cada response de la function (ver `backend/auth.md`):
  - Strict-Transport-Security: `max-age=31536000; includeSubDomains`
  - X-Content-Type-Options: `nosniff`
  - X-Frame-Options: `DENY`
  - Referrer-Policy: `strict-origin-when-cross-origin`
  - Permissions-Policy: `geolocation=(), microphone=(), camera=()`
- **Headers estáticos** en `netlify.toml` (CDN): `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: SAMEORIGIN`, etc.

### PWA (Progressive Web App)

- El portafolio principal **no tiene manifest PWA ni service worker**.
- `styles.css` incluye media query `prefers-reduced-motion: reduce`.
- No hay íconos de PWA en `public/` para el portafolio (la PWA `Monthly Cat Friend` es un proyecto privado separado).

### Estructura de despliegue

```
┌──────────────────────────────────────────┐
│  GitHub (rama main)                      │
│         │ git push                       │
│         ▼                                │
│  Netlify Build                           │
│   ├─ pnpm build (Waku SSG)               │
│   │   └─ dist/public (HTML estático)     │
│   ├─ dist/server (wrapper de Waku)       │
│   └─ netlify-functions/serve.js          │
│         │                                │
│         ▼                                │
│  Netlify Edge (csp-nonce en /*)          │
│         │                                │
│         ▼                                │
│  CDN (headers estáticos de netlify.toml) │
│         │                                │
│         ▼                                │
│  Usuario final                           │
└──────────────────────────────────────────┘
```

---

## Referencias

- [Netlify Docs — Plataforma](https://docs.netlify.com/)
- [Variables de entorno](https://docs.netlify.com/site-build/environment-variables/)
- [Backend - Seguridad](../backend/auth.md)
- [Troubleshooting](troubleshooting.md)
