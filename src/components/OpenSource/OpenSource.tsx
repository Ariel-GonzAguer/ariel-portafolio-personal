import type { RepoOpenSource } from '../../data/proyectos';
import { openSource } from '../../data/proyectos';
import { focusClassName } from '../../utils/a11y/a11y';

/**
 * Tarjeta de repositorio público.
 *
 * @example
 * <OpenSourceCard repo={openSource[0]} />
 */
function OpenSourceCard({ repo }: { repo: RepoOpenSource }) {
  return (
    <article className="flex h-full flex-col border border-white/12 bg-white/3 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-400">
        {repo.tipo}
      </p>
      <h3 className="mt-2 text-xl font-bold">{repo.nombre}</h3>
      <p className="mt-3 text-gris-claro">{repo.descripcion}</p>
      {repo.licencia && (
        <p className="mt-2 text-xs text-gris-claro">Licencia: {repo.licencia}</p>
      )}
      <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Tecnologías de ${repo.nombre}`}>
        {repo.tecnologias.map(tech => (
          <li key={tech} className="border border-white/15 px-2 py-1 text-xs text-white/90">
            {tech}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <a
          href={repo.enlace}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ver código de ${repo.nombre} en GitHub, se abre en nueva pestaña`}
          className={`inline-block bg-red-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-white ${focusClassName('red')} cursor-pointer!`}
        >
          Ver código
          <span className="sr-only cursor-default"> de {repo.nombre}</span>
        </a>
      </div>
    </article>
  );
}

/**
 * Sección de código público: repositorios open source inspeccionables.
 *
 * @example
 * <OpenSource />
 */
export default function OpenSource() {
  return (
    <section
      id="open-source"
      className="scroll-mt-8 border-t border-white/10 px-6 py-20"
      aria-labelledby="seccion-open-source"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-semibold uppercase tracking-[0.18em] text-red-400">Código público</p>
        <h2 id="seccion-open-source" className="mt-3 text-3xl font-bold md:text-4xl">
          Open source
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gris-claro">
          La mayoría de mi trabajo de producto es privado, así que acá podés inspeccionar código
          real: una librería publicada en npm, una app open source mantenida con colaboradores y un
          laboratorio de evaluación de LLMs.
        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
        {openSource.map(repo => (
          <OpenSourceCard key={repo.id} repo={repo} />
        ))}
      </div>
    </section>
  );
}
