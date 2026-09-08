# CI/CD — GitHub Actions y pipelines

## Estado actual: **No hay GitHub Actions configuradas**

El repositorio **no tiene directorio `.github/workflows/`**. No existen workflows de CI/CD automáticos configurados.

### Flujo de deploy manual (documentado en `deployment/platform.md`)

El deploy se realiza manualmente mediante la línea de comando:

```bash
# Desde la raíz del proyecto
pnpm install               # instalar dependencias
pnpm build                 # build estático (SSG) con Waku → dist/public
pnpm test                  # ejecutar tests (181/181 deben pasar)
pnpm format:fix            # Prettier auto-fix
pnpm lint                  # ESLint con autofix
pnpm deploy:netlify        # audit + test + format:fix + lint + deploy
```

### Pasos implicados (según `package.json` y `scripts/deploy-netlify.sh`)

| Step    | Comando                        | Propósito                                                  |
| ------- | ------------------------------ | ---------------------------------------------------------- |
| Install | `pnpm install`                 | Dependencias (openai, @netlify/blobs, dompurify…)          |
| Build   | `pnpm build` (con `NETLIFY=1`) | Generar HTML/CSS/JS estático + server de Waku              |
| Test    | `pnpm test`                    | Suite de tests Vitest (181 tests, 27 archivos)             |
| Lint    | `pnpm lint`                    | ESLint + autofix                                           |
| Format  | `pnpm format:fix`              | Prettier                                                   |
| Deploy  | `netlify deploy --prod`        | CLI de Netlify (usa `NETLIFY_SITE_ID` de `.env` si existe) |

### Consideraciones para agregar GitHub Actions en el futuro

Si en el futuro se desean agregar workflows de CI/CD a `.github/workflows/`:

1. **Workflow de pruebas y lint**: trigger en push a `main` y pull_request.
2. **Workflow de deploy**: trigger manual o en merge a `main`.
3. **Secretos requeridos** en Netlify UI (no en repo):
   - `OPENAI_API_KEY`
   - `ALLOWED_ORIGINS` (opcional)
4. **Artefactos**: ninguno generado actualmente (es un sitio estático).
5. **Cache**: `~/.pnpm` podría cachearse para acelerar `pnpm install` en workflows futuros.

### Documentación recomendada (a crear cuando existan workflows)

- `ci-cd/overview.md` — resumen de todos los workflows (actualmente documenta la ausencia).
- `ci-cd/{workflow}.md` — un archivo por workflow relevante.
- Cada archivo incluiría: triggers, jobs, steps, secretos, artefactos, diagrama de ejecución.

---

## Referencias

- [Flujo de deploy manual](../deployment/platform.md)
- [Arquitectura general](../architecture/overview.md)
- [Netlify Docs — Deploying site changes](https://docs.netlify.com/continuous-deployment/)
