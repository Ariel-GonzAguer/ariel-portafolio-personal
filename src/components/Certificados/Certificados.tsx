interface Certificado {
  titulo: string;
  emisor: string;
  link: string;
  categorias: string[];
}

const certificados: Certificado[] = [
  {
    titulo: 'FrontEnd Engineer',
    emisor: 'CodeCademy',
    link: '/certificados/Certificado Front End Engineer.pdf',
    categorias: ['Frontend'],
  },
  {
    titulo: 'Prompt Engineering',
    emisor: 'CodeCademy',
    link: '/certificados/certificado-prompt-engineering.pdf',
    categorias: ['Inteligencia Artificial'],
  },
  {
    titulo: 'UX Designer',
    emisor: 'CodeCademy',
    link: '/certificados/Certificado UX Designer Career Path.pdf',
    categorias: ['Diseño'],
  },
  {
    titulo: 'Green Digital Certificate Program',
    emisor: 'Inco / LinkedIn',
    link: '/certificados/Certificado Green Digital Certificate Program.pdf',
    categorias: ['Sostenibilidad'],
  },
  {
    titulo: 'OpenAI API - Coding with JavaScript',
    emisor: 'CodeCademy',
    link: '/certificados/certificado-openai-api-javascript.pdf',
    categorias: ['Inteligencia Artificial'],
  },
  {
    titulo: 'Recognizing Hallucinations, Inaccuracies, and Bias in AI',
    emisor: 'CodeCademy',
    link: '/certificados/certificado-hallucinations-bias-ia.pdf',
    categorias: ['Inteligencia Artificial'],
  },
  {
    titulo: 'Habilidades humanas en la era de la IA',
    emisor: 'Microsoft / LinkedIn',
    link: '/certificados/Certificado Habilidades humanas en la era de la IA por Microsoft y LinkedIn.pdf',
    categorias: ['Inteligencia Artificial'],
  },
  {
    titulo: 'Fundamentos profesionales en tecnología sostenible',
    emisor: 'Microsoft / LinkedIn',
    link: '/certificados/certificado-tecnologia-sostenible-microsoft-linkedin.pdf',
    categorias: ['Sostenibilidad'],
  },
  {
    titulo: 'Governing AI Agents',
    emisor: 'DeepLearning.ai / Databricks',
    link: 'https://www.deeplearning.ai/accomplishments/836003d5-2594-4e1d-92ab-f772b4cc9462',
    categorias: ['Inteligencia Artificial'],
  },
  {
    titulo: 'Carbon Aware Computing for GenAI developers',
    emisor: 'DeepLearning.ai / Google Cloud',
    link: 'https://www.deeplearning.ai/accomplishments/0acc1149-c1d5-4c43-b443-ab7e0a15a33a',
    categorias: ['Sostenibilidad'],
  },
  {
    titulo: 'Spec-Driven Development with Coding Agents',
    emisor: 'DeepLearning.ai / JetBrains',
    link: 'https://www.deeplearning.ai/accomplishments/dff1a6c1-98c5-4bcc-ad7a-e59629c9bfdf',
    categorias: ['Inteligencia Artificial'],
  },
  {
    titulo: 'AI Code Review',
    emisor: 'DeepLearning.ai / Qodo',
    link: 'https://www.deeplearning.ai/accomplishments/f684711b-6060-4084-9a24-fafb8c4b4bfe',
    categorias: ['Inteligencia Artificial'],
  },
];

/**
 * Agrupa certificados por categoría.
 *
 * @returns Mapa donde la clave es la categoría y el valor es un array de certificados
 *
 * @example
 * const porCategoria = agruparPorCategoria(certificados);
 * // Map { "Frontend" => [...], "IA para Desarrollo" => [...] }
 */
function agruparPorCategoria(
  certs: Certificado[]
): Map<string, Certificado[]> {
  const mapa = new Map<string, Certificado[]>();

  for (const cert of certs) {
    for (const cat of cert.categorias) {
      const existentes = mapa.get(cat) ?? [];
      existentes.push(cert);
      mapa.set(cat, existentes);
    }
  }

  return mapa;
}

/**
 * Sección de certificaciones con enlaces a los PDF alojados en el sitio del estudio.
 * Organizadas por categoría usando <details>/<summary> nativos para expandir/colapsar.
 *
 * @example
 * <Certificados />
 */
export default function Certificados() {
  const porCategoria = agruparPorCategoria(certificados);

  return (
    <section
      className="border-t border-white/10 px-6 py-20"
      aria-labelledby="seccion-certificaciones"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-semibold uppercase tracking-[0.18em] text-red-400">Formación continua</p>
        <h2 id="seccion-certificaciones" className="mt-3 text-3xl font-bold md:text-4xl">
          Certificaciones y cursos
        </h2>
      </div>

      <div className="mx-auto mt-10 max-w-3xl space-y-4">
        {Array.from(porCategoria.entries()).map(([categoria, certs]) => (
          <details
            key={categoria}
            className="group border border-white/10 bg-white/3"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-bold text-white transition hover:bg-white/5">
              <span className="flex items-center gap-3">
                <span className="text-red-400 transition group-open:rotate-90" aria-hidden="true">
                  &#9654;
                </span>
                {categoria}
                <span className="text-sm font-normal text-gris-claro">
                  ({certs.length})
                </span>
              </span>
            </summary>

            <ul className="border-t border-white/10 px-5 py-4">
              {certs.map((cert) => (
                <li
                  key={cert.titulo}
                  className="flex flex-col gap-1 border-b border-white/8 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-white">{cert.titulo}</p>
                    <p className="text-sm text-gris-claro">{cert.emisor}</p>
                  </div>
                  <a
                    href={cert.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ver certificado de ${cert.titulo}, se abre en nueva pestaña`}
                    className="mt-2 inline-block w-fit border border-red-400 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-400 hover:text-black sm:mt-0"
                  >
                    Ver certificado
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
