export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  tecnologias: string[];
  enlace: string;
  repositorio?: string;
  rol: string;
  impacto: string;
  enfoque: string[];
  img: string;
  lang: 'es' | 'en';
}

/**
 * Proyectos destacados del portafolio personal.
 * El campo `repositorio` se completa solo cuando el código es público.
 */
export const proyectos: Proyecto[] = [
  {
    id: 'superkeg',
    nombre: 'SUPER KEG',
    descripcion:
      'Aplicación web para gestión inteligente de barriles, inventario y operación diaria de cervecerías artesanales.',
    tecnologias: ['React', 'Zustand', 'Waku', 'Firebase'],
    enlace: 'https://superkeg.beer',
    rol: 'Product Engineer',
    impacto:
      'Producto SaaS real en uso diario: dominio operativo complejo, inventario en tiempo real y flujos de estado avanzados.',
    enfoque: ['SaaS', 'Estado global', 'UX operativa'],
    img: '/imagenes/proyectos/sk-laptop.webp',
    lang: 'en',
  },
  {
    id: 'gluten-corp',
    nombre: 'Gluten Corp',
    descripcion:
      'Ecommerce con tienda, carrito y flujo de tickets para validar una experiencia de compra de punta a punta.',
    tecnologias: ['React', 'Zustand', 'Sonner', 'Firebase'],
    enlace: 'https://gluten-corp.netlify.app/',
    rol: 'Frontend/Product Engineer',
    impacto:
      'Arquitectura de estado compleja con flujo de compra completo e integración bidireccional con panel administrativo propio.',
    enfoque: ['Flujo de compra', 'Estado global'],
    img: '/imagenes/proyectos/gluten-corp.webp',
    lang: 'es',
  },
  {
    id: 'shuttle506',
    nombre: 'Shuttle 506 Jaco',
    descripcion:
      'Sitio web para un negocio de transporte turístico privado en Costa Rica, con SEO local e internacional.',
    tecnologias: ['Astro', 'React', 'EmailJS'],
    enlace: 'https://shuttle506jaco.com/',
    rol: 'Frontend/Product Engineer',
    impacto:
      'Alta performance y flujo de conversión directo que genera contactos reales para el negocio.',
    enfoque: ['SEO', 'Conversión', 'Performance'],
    img: '/imagenes/proyectos/shuttle.webp',
    lang: 'en',
  },
  {
    id: 'pasaporte',
    nombre: 'Pasaporte.app',
    descripcion:
      'Pasaporte digital para eventos y ferias, con experiencia QR orientada al uso en sitio.',
    tecnologias: ['Waku', 'TailwindCSS', 'QRCode', 'Motion'],
    enlace: 'https://pasaporte.app/',
    rol: 'Product Engineer',
    impacto:
      'Producto físico-digital: integración QR y UX mobile-first pensada para miles de asistentes por evento.',
    enfoque: ['QR', 'Mobile-first', 'Eventos'],
    img: '/imagenes/proyectos/pasaporteapp.webp',
    lang: 'es',
  },
];

export interface ProyectoIA {
  id: string;
  nombre: string;
  tipo: 'Producto con IA' | 'Chatbot LLM' | 'Workflow de agentes';
  descripcion: string;
  tecnologias: string[];
  enlace?: string;
} /**
 * Experiencia con IA/LLMs para la sección dedicada.
 * Incluye productos privados: solo se enlaza lo que es público.
 */
export const proyectosIA: ProyectoIA[] = [
  {
    id: 'monthly-cat-friend',
    nombre: 'Monthly Cat Friend',
    tipo: 'Producto con IA',
    descripcion:
      'PWA privada para registrar el ciclo menstrual con predicciones generadas por IA: próximos días, siguiente periodo y patrones personalizados a partir del historial registrado.',
    tecnologias: ['OpenAI SDK', 'Waku', 'Firebase', 'PWA'],
  },
  {
    id: 'mandarino',
    nombre: 'Mandarino',
    tipo: 'Chatbot LLM',
    descripcion:
      'Asistente virtual con streaming de respuestas integrado en gatorojolab.com: responde preguntas sobre servicios y proyectos usando la API de OpenAI con historial conversacional.',
    tecnologias: ['OpenAI API', 'Netlify Functions', 'React'],
    enlace: 'https://gatorojolab.com',
  },
  {
    id: 'skills-agentes',
    nombre: 'Skills y workflows de agentes',
    tipo: 'Workflow de agentes',
    descripcion:
      'Creación de skills propias para agentes de código (OpenCode, CommandCode), configuración de entornos multi-agente y desarrollo asistido por LLMs en proyectos reales de producción.',
    tecnologias: ['OpenCode', 'CommandCode', 'Skills', 'MCP'],
    enlace: 'https://github.com/Ariel-GonzAguer/skills-and-agents',
  },
];

export interface RepoOpenSource {
  id: string;
  nombre: string;
  tipo: 'Librería npm' | 'Aplicación open source' | 'Laboratorio de IA' | 'Skills y agentes';
  descripcion: string;
  tecnologias: string[];
  enlace: string;
  licencia?: string;
}

/**
 * Repositorios públicos que cualquier persona puede inspeccionar: código real verificable.
 */
export const openSource: RepoOpenSource[] = [
  {
    id: 'michi-router',
    nombre: 'michi-router',
    tipo: 'Librería npm',
    descripcion:
      'Router Client-side minimalista para React publicado en npm (@arielgonzaguer/michi-router): TypeScript first, cero dependencias de runtime, rutas dinámicas y navegación interna segura.',
    tecnologias: ['TypeScript', 'React', 'npm', 'Vitest'],
    enlace: 'https://github.com/Ariel-GonzAguer/michi-router',
    licencia: 'Ver repo',
  },
  {
    id: 'comida-emergencia',
    nombre: 'ComidaEmergencia',
    tipo: 'Aplicación open source',
    descripcion:
      'Aplicación offline para gestionar alimentos, medicamentos y recursos en emergencias. Proyecto mantenido con colaboradores, issues y pull requests abiertos.',
    tecnologias: ['React', 'Zustand', 'Firebase', 'OpenAI', 'Vitest'],
    enlace: 'https://github.com/Ariel-GonzAguer/comidaEmergencia',
    licencia: 'MIT + Commons Clause',
  },
  {
    id: 'comparacion-de-modelos',
    nombre: 'Comparación de modelos',
    tipo: 'Laboratorio de IA',
    descripcion:
      'Evaluación sistemática de modelos de lenguaje generando código real: misma feature, mismo prompt, criterios objetivos de puntuación y resultados documentados y comparables.',
    tecnologias: ['LLMs', 'OpenCode', 'MCP', 'Waku'],
    enlace: 'https://github.com/Ariel-GonzAguer/comparacion-de-modelos',
  },
  {
    id: 'skills-and-agents',
    nombre: 'Skills & Agents',
    tipo: 'Skills y agentes',
    descripcion:
      'Colección pública de mis skills, agentes y comandos para OpenCode: evaluación multi-agente de viabilidad de productos con red team, auditorías de seguridad OWASP, deploy de Waku en Netlify y más.',
    tecnologias: ['OpenCode', 'LLMs', 'Skills', 'Agentes', 'MCP'],
    enlace: 'https://github.com/Ariel-GonzAguer/skills-and-agents',
  },
];
