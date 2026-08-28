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
        <section
          aria-labelledby="review-hero"
          className="mx-auto max-w-3xl text-center"
        >
          <p className="font-semibold uppercase tracking-[0.18em] text-red-400">
            Frontend + IA
          </p>
          <h1
            id="review-hero"
            className="mt-3 text-3xl font-bold md:text-5xl"
          >
            AI Code Reviewer
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gris-claro">
            Pega un diff y recibe feedback técnico estructurado: severidad,
            categoría, explicación y fix concreto. Streaming en vivo desde la
            Responses API de OpenAI con JSON Schema estricto.
          </p>
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
