const certificados = [
  {
    titulo: 'FrontEnd Engineer',
    emisor: 'CodeCademy',
    link: 'https://gatorojolab.com/certificados/Certificado%20Front%20End%20Engineer.pdf',
  },
  {
    titulo: 'UX Designer',
    emisor: 'CodeCademy',
    link: 'https://gatorojolab.com/certificados/Certificado%20UX%20Designer%20Career%20Path.pdf',
  },
  {
    titulo: 'Green Digital Certificate Program',
    emisor: 'Inco / LinkedIn',
    link: 'https://gatorojolab.com/certificados/Certificado%20Green%20Digital%20Certificate%20Program.pdf',
  },
  {
    titulo: 'Habilidades humanas en la era de la IA',
    emisor: 'Microsoft / LinkedIn',
    link: 'https://gatorojolab.com/certificados/Certificado%20Habilidades%20humanas%20en%20la%20era%20de%20la%20IA%20por%20Microsoft%20y%20LinkedIn.pdf',
  },
];

/**
 * Sección de certificaciones con enlaces a los PDF alojados en el sitio del estudio.
 *
 * @example
 * <Certificados />
 */
export default function Certificados() {
  return (
    <section
      className="border-t border-white/10 px-6 py-20"
      aria-labelledby="seccion-certificaciones"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-semibold uppercase tracking-[0.18em] text-red-400">
          Formación continua
        </p>
        <h2 id="seccion-certificaciones" className="mt-3 text-3xl font-bold md:text-4xl">
          Certificaciones
        </h2>
      </div>
      <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 md:grid-cols-4">
        {certificados.map(certificado => (
          <article key={certificado.titulo} className="flex flex-col border border-white/10 bg-white/3 p-5">
            <h3 className="font-bold text-red-400">{certificado.titulo}</h3>
            <p className="mt-1 text-sm text-gris-claro">{certificado.emisor}</p>
            <a
              href={certificado.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver certificado de ${certificado.titulo}, se abre en nueva pestaña`}
              className="mt-auto pt-4 text-right underline hover:text-red-400"
            >
              Ver certificado
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
