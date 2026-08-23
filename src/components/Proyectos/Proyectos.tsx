import type { Proyecto } from '../../data/proyectos';
import { proyectos } from '../../data/proyectos';
import { focusClassName } from '../../utils/a11y/a11y';

/**
 * Tarjeta individual de proyecto con enlace al sitio y (si existe) al código.
 *
 * @example
 * <ProyectoCard proyecto={proyectos[0]} />
 */
function ProyectoCard({ proyecto }: { proyecto: Proyecto }) {
  return (
    <article className="flex h-full flex-col border border-white/12 bg-white/3 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
        {proyecto.rol}
      </p>
      <h3 className="mt-2 text-2xl font-bold" lang={proyecto.lang}>
        {proyecto.nombre}
      </h3>
      <p className="mt-3 text-gris-claro">{proyecto.descripcion}</p>

      <div className="mt-4 border-l-2 border-emerald-300 pl-4">
        <p className="leading-6 text-gris-claro">{proyecto.impacto}</p>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Tecnologías de ${proyecto.nombre}`}>
        {proyecto.tecnologias.map(tech => (
          <li key={tech} className="border border-white/15 px-2 py-1 text-xs text-white/80">
            {tech}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <a
          href={proyecto.enlace}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${proyecto.nombre} en nueva pestaña`}
          className={`inline-block bg-emerald-300 px-4 py-3 text-sm font-bold text-black transition hover:bg-white ${focusClassName('emerald')} cursor-pointer!`}
        >
          Ver demo
          <span className="sr-only"> de {proyecto.nombre}</span>
        </a>
      </div>
    </article>
  );
}

/**
 * Sección de proyectos destacados.
 *
 * @example
 * <Proyectos />
 */
export default function Proyectos() {
  return (
    <section id="proyectos" className="scroll-mt-8 px-6 py-20">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Trabajo seleccionado
        </p>
        <h2 className="mt-3 text-3xl font-bold md:text-4xl">Proyectos</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gris-claro">
          Casos reales donde diseñé y desarrollé el producto completo: del flujo de usuario al
          despliegue.
        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
        {proyectos.map(proyecto => (
          <ProyectoCard key={proyecto.id} proyecto={proyecto} />
        ))}
      </div>
    </section>
  );
}
