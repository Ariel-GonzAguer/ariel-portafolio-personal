import { focusClassName } from '../../utils/a11y/a11y';

const canales = [
  {
    label: 'GitHub',
    href: 'https://github.com/Ariel-GonzAguer',
    descripcion: 'Código fuente y proyectos',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ariel-gonzales-aguero-959293276/',
    descripcion: 'Perfil profesional',
  },
  {
    label: 'Email',
    href: 'mailto:ariegonzaguer@gmail.com',
    descripcion: 'Respuesta directa',
  },
];

/**
 * Sección de contacto simple con enlaces a GitHub, LinkedIn y email.
 * Sin formulario: menos fricción y sin backend.
 *
 * @example
 * <Contacto />
 */
export default function Contacto() {
  return (
    <section
      id="contacto"
      className="scroll-mt-8 border-t border-white/10 px-6 py-20"
      aria-labelledby="seccion-contacto"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-semibold uppercase tracking-[0.18em] text-red-400">Contacto</p>
        <h2 id="seccion-contacto" className="mt-3 text-3xl font-bold md:text-4xl">
          Hablemos
        </h2>
        <p className="mx-auto mt-4 text-lg text-gris-claro">
          Busco roles de Frontend/Product Engineer donde la IA sume al producto, así como puestos de
          Prompt Engineer. Si tu equipo construye eso, me interesa.
        </p>
        <ul className="mt-8 flex flex-wrap justify-center gap-4">
          {canales.map((canal) => (
            <li key={canal.label}>
              <a
                href={canal.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${canal.label}: ${canal.descripcion}, se abre en nueva pestaña`}
                className={`inline-block border border-white px-5 py-3 font-bold transition hover:bg-white hover:text-black ${focusClassName('white')}`}
              >
                {canal.label}
                <span className="sr-only"> — {canal.descripcion}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
