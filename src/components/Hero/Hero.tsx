import { focusClassName } from '../../utils/a11y/a11y';

const stackRapido = ['React', 'TypeScript', 'OpenCode', 'Waku', 'Firebase', 'CommandCode'];

/**
 * Sección de apertura: nombre, rol y llamados a la acción.
 *
 * @example
 * <Hero />
 */
export default function Hero() {
  return (
    <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="mt-4 text-[clamp(2.5rem,8vw,6rem)] font-bold leading-none">Ariel GonzAgüer</h1>
      <p className="mt-4 text-xl font-semibold text-gris-claro md:text-2xl">
        Frontend / Product Engineer + IA
      </p>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gris-claro">
        Construyo productos web claros, accesibles y rápidos con React, TypeScript y arquitecturas
        Jamstack. Integro IA/LLMs en productos reales y dirijo agentes de código en mi flujo de
        trabajo diario.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <a
          href="#proyectos"
          className={`bg-red-400 px-5 py-3 font-bold text-black transition hover:bg-white ${focusClassName('red')}  cursor-pointer!`}
        >
          Ver proyectos
        </a>
        <a
          href="#contacto"
          className={`border border-white px-5 py-3 font-bold transition hover:bg-white hover:text-black ${focusClassName('white')} cursor-pointer!`}
        >
          Contactarme
        </a>
      </div>
      <ul className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gris-claro">
        {stackRapido.map((tech) => (
          <li key={tech} className="border border-white/15 px-3 py-1">
            {tech}
          </li>
        ))}
      </ul>
    </section>
  );
}
