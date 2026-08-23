# ariel-personal

Portafolio personal de Ariel GonzAgüer: Frontend/Product Engineer + IA.

Sitio de una sola página, estático y accesible, con secciones de proyectos destacados, experiencia con IA/LLMs, código abierto, certificaciones y contacto.

> Producción: pendiente de dominio propio. Mientras tanto, el estudio está en [gatorojolab.com](https://gatorojolab.com).

## Stack

- [Waku](https://waku.gg) 1 beta (React Server Components) + React 19 + TypeScript
- Tailwind CSS v4
- Vitest + Testing Library (44 tests)
- Despliegue pensado para Netlify

## Secciones

| Sección | Contenido |
|---------|-----------|
| Hero | Nombre, posicionamiento y stack rápido |
| Proyectos | 4 productos reales (SaaS, ecommerce, SEO local, QR para eventos) |
| IA | Chatbot con OpenAI, producto con predicciones por LLM y workflows de agentes |
| Open Source | Repos públicos verificables: michi-router, ComidaEmergencia, comparación de modelos, skills-and-agents |
| Sobre mí | Bio, fortalezas y stack diario |
| Certificaciones y cursos | Certificados de IA, seguridad, UX y sostenibilidad con PDF verificable |

## Scripts

```bash
pnpm install        # dependencias
pnpm dev            # desarrollo en http://localhost:3000
pnpm build          # build estático (SSG)
pnpm test           # tests una vez
pnpm lint           # ESLint con autofix
```

## Estructura

```
src/
├── components/     # un componente por sección, con su test al lado
├── data/
│   └── proyectos.ts   # única fuente de verdad para proyectos y repos
├── pages/
│   ├── _root.tsx      # shell HTML, meta tags y JSON-LD (Person)
│   ├── _layout.tsx    # nav, skip link y footer
│   └── index.tsx      # composición de secciones
├── utils/a11y/     # helpers de accesibilidad (foco visible WCAG 2.4.7)
└── styles.css      # Tailwind v4 + tema (colores, tipografía estratégica)
public/
├── imagenes/       # screenshots de proyectos
└── certificados/   # PDFs de certificaciones
```

## Decisiones técnicas

- **Render estático**: todo el sitio se genera en build; sin backend ni formularios.
- **Tipografía estratégica**: Lexend Mega solo en headings y marca; el cuerpo usa la fuente nativa del sistema.
- **Accesibilidad como base**: skip link, foco visible, `aria-label` descriptivos, contraste AA+, `prefers-reduced-motion` respetado.
- **Datos desacoplados**: los proyectos viven en `src/data/proyectos.ts`; los componentes solo renderizan.
- **Links honestos**: los productos privados no muestran botones de código; solo se enlaza repositorio público.

## Autor

Ariel GonzAgüer — [GitHub](https://github.com/Ariel-GonzAguer) · [Gato Rojo Lab](https://gatorojolab.com)
