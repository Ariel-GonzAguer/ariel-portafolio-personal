import ReviewWorkspace from '../../components/review-form/ReviewWorkspace';

/**
 * Página estática del AI Code Reviewer.
 *
 * Server component: prerenderiza el shell (heading, copy).
 * El workspace interactivo es un client component separado (ReviewWorkspace).
 *
 * FASE 1: UI completa con mock de respuesta. Aún no llama a OpenAI.
 * FASE 2: el handler real en /api/review llamará a Responses API.
 * FASE 4: streaming con useReviewStream.
 */
export default function ReviewPage() {
  return (
    <>
      <>
        <title>AI Code Reviewer | Ariel GonzAgüer</title>
        <meta
          name="description"
          content="Pega un unified diff y recibe review técnico estructurado con severidad, categoría y fix sugerido, generado con la Responses API de OpenAI."
        />
      </>
      <main id="main" className="px-6 py-20">
        <section aria-labelledby="review-hero" className="mx-auto max-w-3xl text-center">
          <p className="font-semibold uppercase tracking-[0.18em] text-red-400">Frontend + IA</p>
          <h1 id="review-hero" className="mt-3 text-3xl font-bold md:text-5xl">
            AI Code Reviewer
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gris-claro">
            Pega un diff y recibe feedback técnico estructurado: severidad, categoría, explicación y
            fix concreto. Streaming en vivo desde la Responses API de OpenAI con JSON Schema
            estricto.
          </p>
          <aside
            aria-label="Aviso de seguridad y privacidad"
            className="mx-auto mt-6 max-w-2xl border border-white/15 bg-white/3 p-4 text-left text-sm text-gris-claro"
          >
            <p className="font-semibold text-white/90">Aviso de seguridad y privacidad</p>
            <p className="mt-2">
              Por seguridad, los intentos de abuso (prompt injection, rate limit excedido, requests
              sin origen permitido) se registran en logs de servidor. Cada entrada puede incluir: IP
              de origen, longitud del diff, etiqueta del patrón detectado y timestamp. El contenido
              literal del diff no se loguea.
            </p>
            <p className="mt-2 text-xs text-white/50">
              El diff completo se envía a OpenAI únicamente para generar el review y no se conserva
              en este servicio más allá de la respuesta.
            </p>
          </aside>
          <details className="mx-auto mt-6 max-w-2xl text-center">
            <summary className="mt-4 cursor-pointer text-center">
              Click acá para saber más de esta herramienta
            </summary>

            <p className="mt-2 text-center text-gris-claro">
              Este AI Code Reviewer utiliza el modelo GPT 5.6 Luna de OpenAI. Podés usarla un máximo de 3 veces por día. Te dará retroalimentación enfocada en cinco categorías: seguridad, performance, type-safety, mantenibilidad y accesibilidad, y te dirá si hay riesgos, catalogándolos como <code>critical</code>, <code>high</code>, <code>medium</code>, <code>low</code>, <code>info</code>.
            </p>
            <p className="mt-2 text-center text-gris-claro">
              Para poder usarla, necesitás marcar la casilla que dice `Los gatos son geniales`.
            </p>

          </details>
        </section>
        <ReviewWorkspace />
      </main>
    </>
  );
}

export const getConfig = async () => {
  return {
    render: 'static',
  } as const;
};
