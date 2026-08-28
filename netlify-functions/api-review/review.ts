import type { Context } from '@netlify/functions';

/**
 * Netlify Function: /api/review
 *
 * FASE 1: MOCK. Devuelve un review de ejemplo sin llamar a OpenAI.
 * FASE 2: reemplazar el body con llamada real a Responses API + JSON schema.
 * FASE 4: convertir a streaming con ReadableStream + SSE.
 *
 * Convenciones:
 * - path = "/api/review" (debe coincidir con el redirect en netlify.toml)
 * - method POST únicamente
 * - body: { diff: string, honeypot?: string }
 * - response: ReviewResponse (definida en src/hooks/useReviewStream/useReviewStream)
 */
export default async function handler(
  request: Request,
  _context: Context,
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = (await request.json().catch(() => null)) as {
    diff?: string;
    honeypot?: string;
  } | null;

  // Honeypot: si viene lleno, simular éxito silencioso
  if (body?.honeypot && body.honeypot.length > 0) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (!body?.diff || body.diff.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'Diff is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // FASE 1: review mock. Reemplazar en fase 2.
  const mockReview = {
    summary:
      '[MOCK] Este es un review de ejemplo. En la fase 2 se conectará a OpenAI Responses API con JSON schema estricto y modelo gpt-4.1-mini.',
    verdict: 'comment' as const,
    findings: [
      {
        id: 'INFO-1',
        severity: 'info' as const,
        category: 'maintainability' as const,
        line: 'L1',
        title: 'Mock de la fase 1',
        explanation:
          'Esta respuesta es un placeholder para que el flujo end-to-end funcione antes de conectar la API real.',
        fix: 'Reemplazar la lógica de este handler con una llamada a openai.responses.stream() en la fase 2.',
      },
    ],
  };

  return new Response(JSON.stringify(mockReview), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  path: '/api/review',
};
