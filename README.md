# ariel-personal

Bienvenidas, bienvenidos a mi portafolio personal.  
Soy Ariel GonzAgüer, Frontend/Product Engineer + IA. Me enfoco en accesibilidad, sostenibilidad y en poner a la persona usuaria en el centro de la experiencia.  

Creo que la internet es parte esencial del futuro, y quiero ayudar a construirla de forma clara, accesible y sostenible.

Mi portafolio es un sitio estático, con secciones de proyectos destacados, experiencia con IA/LLMs, código abierto, certificaciones y contacto.

Vea el sitio desplegado acá → [arielgonzaguer.gatorojolab.com](https://arielgonzaguer.gatorojolab.com)  

Para ver el sitio de mi estudio de Desarrollo web visite → [gatorojolab.com](https://gatorojolab.com)

## Stack

- [Waku](https://waku.gg) + React 19 + TypeScript
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

## Features

### AI Code Reviewer

Producto público en [/review](https://arielgonzaguer.gatorojolab.com/review): pega un unified diff y recibe review técnico estructurado con severidad, categoría y fix sugerido.

**Stack**: OpenAI Responses API (`gpt-5.6-luna`) + JSON Schema estricto + streaming SSE.

**Seguridad**:

- Rate limit: 3 requests/día por IP (Netlify Blobs)
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

## Autor

Ariel GonzAgüer — [GitHub](https://github.com/Ariel-GonzAguer) · [Gato Rojo Lab](https://gatorojolab.com)
