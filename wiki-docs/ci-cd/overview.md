# CI/CD — GitHub Actions y pipelines

## Estado actual: **No hay GitHub Actions configuradas**

El repositorio **no tiene directorio `.github/workflows/`**. No existen workflows de CI/CD automáticos configurados.

### Flujo de deploy manual (documentado en `deployment/platform.md`)

El deploy se realiza manualmente mediante la línea de comando:

```bash
# Desde la raíz del proyecto
pnpm install       # instalar dependencias
pnpm build         # build estático (SSG) con Waku
pnpm test          # ejecutar tests (151/151 deben pasar)
pnpm format:fix    # Prettier auto-fix
pnpm lint          # ESLint con autofix (.netlify/** ignorado)
bash scripts/deploy-netlify.sh  # deploy a Netlify
```

### Pasos implicados (según `scripts/deploy-netlify.sh` y `package.json`)

| Step | Comando | Propósito |
| ---- | ------- | --------- |
| Install | `pnpm install` | Dependencias (openai, @netlify/blobs, etc.) |
| Build | `pnpm build` | Generar HTML/CSS/JS estático |
| Test | `pnpm test` | Suite de tests Vitest (151 tests, 24 archivos) |
| Lint | `pnpm lint` | ESLint + autofix |
| Format | `pnpm format:fix` | Prettier |
| Deploy | `pnpm deploy:netlify` | Audit + test + format + lint + deploy Netlify |

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

- `ci-cd/overview.md` — resumen de todos los workflows (actualmente vacío por ausencia).
- `ci-cd/{workflow}.md` — un archivo por workflow relevante.
- Cada archivo incluiría: triggers, jobs, steps, secretos, artefactos, diagrama de ejecución.
  ---
  
  ## Referencias
  
  - [Flujo de deploy manual](deployment/platform.md)
  - [Arquitectura general](architecture/overview.md)
  - [Netlify Docs — Deploying site changes](https://docs.netlify.com/continuous-deployment/)