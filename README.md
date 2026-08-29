# ariel-personal

Portafolio personal de Ariel GonzAgüer: Frontend/Product Engineer + IA.

Sitio de una sola página, estático y accesible, con secciones de proyectos destacados, experiencia con IA/LLMs, código abierto, certificaciones y contacto.

> Producción: [arielgonzaguer.gatorojolab.com](https://arielgonzaguer.gatorojolab.com)

## Stack

- [Waku](https://waku.gg) 1 beta (React Server Components) + React 19 + TypeScript
- Tailwind CSS v4
- Vitest + Testing Library (149 tests)
- Netlify Functions + Netlify Blobs
- OpenAI Responses API (streaming SSE)

## Secciones

| Sección                  | Contenido                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Hero                     | Nombre, posicionamiento y stack rápido                                                                 |
| Proyectos                | 4 productos reales (SaaS, ecommerce, SEO local, QR para eventos)                                       |
| IA                       | Chatbot con OpenAI, producto con predicciones por LLM, workflows de agentes y **AI Code Reviewer**     |
| Open Source              | Repos públicos verificables: michi-router, ComidaEmergencia, comparación de modelos, skills-and-agents |
| Sobre mí                 | Bio, fortalezas y stack diario                                                                         |
| Certificaciones y cursos | Certificados de IA, seguridad, UX y sostenibilidad con PDF verificable                                 |

## AI Code Reviewer

Producto público en [/review](https://arielgonzaguer.gatorojolab.com/review): pega un unified diff y recibe review técnico estructurado con severidad, categoría y fix sugerido.

**Stack**: OpenAI Responses API (`gpt-5.6-luna`) + JSON Schema estricto + streaming SSE + Netlify Functions.

**Seguridad**:
- Rate limit: 3 requests/día por IP (Netlify Blobs)
- Honeypot: doble checkbox anti-bot
- Prompt injection: detección + rechazo con alert al usuario
- Sanitización de input (backticks, control chars, líneas largas)
- CSRF allowlist por origin
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

**UX**:
- Streaming en vivo (SSE)
- Syntax highlighting del fix (shiki)
- Copy-to-clipboard del review como JSON
- Métrica de CO₂ estimado
- 3 ejemplos precargados

## Scripts

```bash
pnpm install        # dependencias
pnpm dev            # desarrollo en http://localhost:3000
pnpm build          # build estático (SSG)
pnpm test           # tests una vez
pnpm lint           # ESLint con autofix
pnpm deploy:netlify # audit + test + format + lint + deploy
```

## Estructura

```
src/
├── components/
│   ├── review-form/    # form con honeypot, selector de ejemplos
│   ├── review-output/  # findings, severity badges, code highlighting
│   └── ...             # un componente por sección, con su test al lado
├── data/
│   └── proyectos.ts    # única fuente de verdad para proyectos y repos
├── hooks/
│   └── useReviewStream/ # hook SSE con AbortController
├── pages/
│   ├── _root.tsx       # shell HTML, meta tags y JSON-LD (Person)
│   ├── _layout.tsx     # nav, skip link y footer
│   ├── index.tsx       # composición de secciones
│   └── review/
│       └── index.tsx   # página del AI Code Reviewer
├── utils/
│   ├── a11y/           # helpers de accesibilidad (foco visible WCAG 2.4.7)
│   └── co2/            # estimación de CO₂ por tokens
└── styles.css          # Tailwind v4 + tema (colores, tipografía estratégica)
netlify-functions/
└── api-review/
    ├── review.ts       # handler principal (streaming SSE)
    └── _lib/           # validación, sanitización, rate limit, security headers
public/
├── imagenes/           # screenshots de proyectos
└── certificados/       # PDFs de certificaciones
```

## Decisiones técnicas

- **Render estático**: todo el sitio se genera en build; el AI Code Reviewer es una página estática que llama a una Netlify Function.
- **Tipografía estratégica**: Lexend Mega solo en headings y marca; el cuerpo usa la fuente nativa del sistema.
- **Accesibilidad como base**: skip link, foco visible, `aria-label` descriptivos, contraste AA+, `prefers-reduced-motion` respetado.
- **Datos desacoplados**: los proyectos viven en `src/data/proyectos.ts`; los componentes solo renderizan.
- **Links honestos**: los productos privados no muestran botones de código; solo se enlaza repositorio público.
- **Seguridad en capas**: honeypot → rate limit → validate → detect injection → sanitize → OpenAI.

## Autor

Ariel GonzAgüer — [GitHub](https://github.com/Ariel-GonzAguer) · [Gato Rojo Lab](https://gatorojolab.com)
