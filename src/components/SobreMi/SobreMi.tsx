import { focusClassName } from '../../utils/a11y/a11y';

const fortalezas = [
  'Frontend moderno con React, TypeScript, Waku y backend serverless',
  'Desarrollo asistido por agentes: skills propias, workflows y dirección de LLMs',
  'Accesibilidad como base: productos usables para todas las personas (WCAG 2.2)',
  'Performance como prioridad: peso, estabilidad visual y carga percibida',
  'Comunicación clara y directa con equipos multidisciplinarios',
];

const stack = [
  'React',
  'TypeScript',
  'Waku',
  'Tailwind',
  'Firebase',
  'Zustand',
  'Vitest',
  'OpenAI API',
  'OpenCode',
  'CommandCode',
  'Netlify',
];

/**
 * Sección "Sobre mí": bio corta, fortalezas y stack completo.
 *
 * @example
 * <SobreMi />
 */
export default function SobreMi() {
  return (
    <section className="border-t border-white/10 px-6 py-20" aria-labelledby="sobre-mi">
      <div className="mx-auto max-w-5xl">
        <p className="font-semibold uppercase tracking-[0.18em] text-red-400">Sobre mí</p>
        <h2 id="sobre-mi" className="mt-3 text-3xl font-bold md:text-4xl">
          Cómo trabajo
        </h2>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-lg leading-8 text-gris-claro">
              Me posiciono mejor como Desarrollador Frontend o Product Engineer, listo para mejorar
              la UX a través de la accesibilidad, performance y sostenibilidad del producto.
              Contribuyo desde el código, la arquitectura y la comunicación, conectando necesidades
              de la persona usuaria, objetivos de negocio y limitaciones técnicas.
            </p>
            <p className="mt-4 text-lg leading-8 text-red-400">
              Creo que la internet es parte esencial del futuro, y quiero ayudar a construirla de
              forma clara, accesible y sostenible.
            </p>
            <p className="mt-4 text-lg leading-8 text-gris-claro">
              Fuera del código, disfruto cocinar, ver series animadas con mi esposa,
              cultivar chiles picantes y tomar buen café.
            </p>
            <p className="mt-6 font-semibold">Stack que uso a diario:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {stack.map(tech => (
                <li key={tech} className="bg-white/5 px-3 py-1 text-sm">
                  {tech}
                </li>
              ))}
            </ul>
          </div>

          <ul className="grid content-start gap-3" aria-label="Fortalezas profesionales">
            {fortalezas.map(fortaleza => (
              <li key={fortaleza} className="border border-white/10 bg-white/3 p-4">
                {fortaleza}
              </li>
            ))}

          </ul>
        </div>
      </div>
    </section>
  );
}
