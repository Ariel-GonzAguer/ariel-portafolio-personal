# Mission

## Overview

Portafolio personal de Ariel Gonzauger, Frontend/Product Engineer + IA. Sitio estático con secciones de proyectos, experiencia con IA/LLMs, open source, certificaciones y contacto, más un producto interactivo público: AI Code Reviewer (`/review`), que recibe un unified diff y devuelve un review técnico estructurado con streaming SSE.

## Motivation

- Mostrar trabajo real y verificable (proyectos, certificados PDF, repos públicos) a reclutadores y clientes.
- Demostrar capacidad de construir productos con IA de forma segura: validación de entrada, honeypots, rate limiting, sanitización y CSP con nonce rotativa.
- Sitio accesible, sostenible y rápido, con la persona usuaria en el centro.

## Success metrics

- Sitio disponible y sin errores de navegación (sin bucles de redirección, URLs canónicas).
- AI Code Reviewer funcional end-to-end con costo de OpenAI acotado (rate limits activos, sin abuso).
- Cero regresiones de los controles de seguridad existentes (CSP + nonce, allowlist de Origin, honeypots, DOMPurify, sin secrets en bundles).
- Suite de tests en verde antes de cada deploy.

## Scope

### In scope

- Sitio estático del portafolio (contenido, certificados, SEO básico).
- AI Code Reviewer: página `/review`, API `/api/review`, streaming SSE, costos acotados.
- Seguridad de la superficie pública (CSP, headers, rate limit, honeypots).

### Out of scope

- Infraestructura de Firebase (reglas Firestore/Auth de otros proyectos).
- Otros subdominios de gatorojolab.com (p. ej. Mandarino).
- Panel de administración de Netlify o facturación de OpenAI (config de cuenta del dueño).
