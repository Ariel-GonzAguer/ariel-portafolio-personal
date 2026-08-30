#!/usr/bin/env bash
set -euo pipefail

# Usar `NETLIFY_SITE_ID` en .env permitirá pasar implicitamente el site id al comando de deploy.
if [ -f ".env" ]; then
  echo "Cargando variables de entorno desde .env"
  # exporta todas las variables definidas en el archivo .env
  set -o allexport
  # shellcheck disable=SC1091
  source ".env"
  set +o allexport
fi

# Validaciones básicas
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm no está instalado. Instala pnpm y vuelve a intentar."
  exit 1
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "Error: Netlify CLI (netlify) no está instalado. Instala netlify-cli y vuelve a intentar."
  exit 1
fi

echo "Ejecutando: NETLIFY=1 pnpm run build"
NETLIFY=1 pnpm run build

if [[ -z "${NETLIFY_SITE_ID:-}" ]]; then
  echo "Ejecutando: netlify deploy --prod"
  netlify deploy --prod
else
  echo "Ejecutando: netlify deploy --prod --site $NETLIFY_SITE_ID"
  netlify deploy --prod --site "$NETLIFY_SITE_ID"
fi
