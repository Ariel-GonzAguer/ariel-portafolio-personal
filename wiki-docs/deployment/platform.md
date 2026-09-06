# Plataforma de despliegue

## Netlify

El proyecto se despliega en **Netlify** usando las siguientes configuraciones:

### `netlify.toml`

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[functions]
  # Las functions viven como API routes de Waku, NO como netlify/functions/
  # No se requiere redirect para /api/review

[redirects]
  # Redirecciones básicas del portfolio (si son necesarias)
  /* /:200
```

**Notas importantes**:

- **Endpoint `/api/review` vive como API route de Waku** (`src/pages/_api/api/review.ts`), **no** como Netlify Function (`netlify/functions/`).
- **No hay redirect** en `netlify.toml` para `/api/review` — el endpoint se alcanza directamente vía fetch desde el cliente.
- **Functions de edge**: `netlify/edge-functions/csp-nonce.ts` genera nonces dinámicos para Content Security Policy y los inyecta en HTML inline.

### Variables de entorno

Todas las variables deben configurarse en **Netlify UI** (Site settings > Environment variables), **no** en el repo (`.env` está en `.gitignore`).

| Variable | Requerido | Descripción | Default |
| -------- | --------- | ----------- | ------- |
| `OPENAI_API_KEY` | **Sí** | API key de OpenAI (solo server-side) | — |
| `ALLOWED_ORIGINS` | No (aditivo) | CSV de orígenes adicionales (los por defecto siempre se permiten) | `''` (vacío) |
| `NODE_ENV` | No | Entorno de ejecución | `production` |
| `NETLIFY_BLOBS_CONTEXT` | No (auto) | Contexto de Netlify Blobs (se inicializa automáticamente) | — |

### Flujo de deploy manual

1. `pnpm install` — instala dependencias (incluye `openai`, `@netlify/blobs`)
2. `pnpm build` — build estático (SSG) con Waku
3. `pnpm deploy:netlify` — ejecuta el script completo:
   - `pnpm audit` — auditoría de dependencias (0 vulnerabilidades)
   - `pnpm test` — ejecuta todos los tests (151/151 deben pasar)
   - `pnpm format:fix` — Prettier auto-fix
   - `pnpm lint` — ESLint con autofix (ignora `.netlify/**`)
   - Deploy a Netlify

### Dominios configurados

- `https://arielgonzaguer.gatorojolab.com` — dominio principal (producción)
- `https://arielgonzaguer.dev` — dominio de desarrollo (en allowlist por default en validate-origin.ts)

### HTTPS y seguridad

- Netlify emite certificados HTTPS automáticos vía Let's Encrypt.
- **Security headers** aplicados en cada response de la function (ver `backend/auth.md`):
  - Strict-Transport-Security: `max-age=31536000; includeSubDomains`
  - X-Content-Type-Options: `nosniff`
  - X-Frame-Options: `DENY`
  - Referrer-Policy: `strict-origin-when-cross-origin`
  - Permissions-Policy: `geolocation=(), microphone=(), camera=()`

### PWA (Progressive Web App)

- El proyecto tiene una PWA privada (`Monthly Cat Friend`), pero **no hay manifest PWA ni service worker** en el portfolio principal.
- `styles.css` incluye media query `prefers-reduced-motion: reduce` que respeta la preferencia del usuario.
- No se incluyen íconos de PWA en `public/` para el portfolio principal (solo en proyectos individuales como `pasaporte.app`).

### Scripts de deploy

```bash
# En package.json
"deploy:netlify": "pnpm audit && pnpm test && pnpm format:fix && pnpm lint && bash scripts/deploy-netlify.sh"
```

El script `scripts/deploy-netlify.sh` maneja el deploy efectivo a Netlify (puede incluir variables de entorno o triggers adicionales).
  ---
  
  ## Referencias
  
  - [Netlify Docs — Plataforma](https://docs.netlify.com/)
  - [Variables de entorno](https://docs.netlify.com/site-build/environment-variables/)
  - [Backend - Seguridad](backend/auth.md)