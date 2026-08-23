import type { ProyectoIA } from '../../data/proyectos';
import { proyectosIA } from '../../data/proyectos';
import { focusClassName } from '../../utils/a11y/a11y';

/**
 * Tarjeta de proyecto/experiencia con IA.
 *
 * @example
 * <IACard proyecto={proyectosIA[0]} />
 */
function IACard({ proyecto }: { proyecto: ProyectoIA }) {
  return (
    <article className="flex h-full flex-col border border-white/12 bg-white/3 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
        {proyecto.tipo}
      </p>
      <h3 className="mt-2 text-xl font-bold">{proyecto.nombre}</h3>
      <p className="mt-3 text-gris-claro">{proyecto.descripcion}</p>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Tecnologías de ${proyecto.nombre}`}>
        {proyecto.tecnologias.map(tech => (
          <li key={tech} className="border border-white/15 px-2 py-1 text-xs text-white/80">
            {tech}
          </li>
        ))}
      </ul>
      {proyecto.enlace && (
        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          <a
            href={proyecto.enlace}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir ${proyecto.nombre} en nueva pestaña`}
            className={`inline-block bg-emerald-300 px-4 py-3 text-sm font-bold text-black transition hover:bg-white ${focusClassName('emerald')} cursor-pointer!`}
          >
            Ver demo
            <span className="sr-only cursor-default"> de {proyecto.nombre}</span>
          </a>
        </div>
      )}
    </article>
  );
}

/**
 * Sección dedicada a IA: productos con LLMs, chatbots y workflows de agentes.
 *
 * @example
 * <IA />
 */
export default function IA() {
  return (
    <section id="ia" className="scroll-mt-8 border-t border-white/10 px-6 py-20" aria-labelledby="seccion-ia">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-semibold uppercase tracking-[0.18em] text-emerald-300">Frontend + IA</p>
        <h2 id="seccion-ia" className="mt-3 text-3xl font-bold md:text-4xl">
          IA integrada en productos reales
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gris-claro">
          No solo uso IA para trabajar más rápido: construyo productos donde la IA es parte del
          producto. Y dirijo agentes de código como parte de mi flujo de desarrollo diario.
        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
        {proyectosIA.map(proyecto => (
          <IACard key={proyecto.id} proyecto={proyecto} />
        ))}
      </div>
    </section>
  );
}
