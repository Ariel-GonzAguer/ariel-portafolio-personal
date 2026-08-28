import type { Context } from '@netlify/functions';
import OpenAI from 'openai';
import { REVIEW_SCHEMA } from './_lib/review-schema';
import { SYSTEM_PROMPT } from './_lib/system-prompt';
import { validateDiff } from './_lib/validate-diff';
import { sanitizeDiff } from './_lib/sanitize';
import { detectInjection, logInjectionAttempt } from './_lib/detect-injection';
import { isOriginAllowed } from './_lib/validate-origin';

/**
 * Netlify Function: /api/review
 *
 * Sanitiza el input antes de enviarlo a OpenAI.
 * Streaming con Responses API + ReadableStream + SSE.
 *
 * Flujo de seguridad:
 * 1. Validar método (POST) y origen (CSRF allowlist).
 * 2. Validar estructura del diff (vacío, binario, headers, tamaño).
 * 3. Detectar intentos de prompt injection y loguearlos (sin rechazar).
 * 4. Sanitizar el diff (escapar backticks, quitar control chars, truncar líneas).
 * 5. Llamar a openai.responses.stream() con el diff sanitizado.
 * 6. Reenviar cada evento como Server-Sent Event al cliente.
 * 7. Al cerrar el stream upstream, enviar `data: [DONE]\n\n`.
 *
 * Headers SSE críticos:
 * - Content-Type: text/event-stream
 * - Cache-Control: no-cache, no-transform
 * - X-Accel-Buffering: no  (sin esto, Netlify/proxies bufferean)
 *
 * Convenciones:
 * - path = "/api/review" (definido en netlify.toml via redirect)
 * - body: { diff: string }
 * - eventos: data: {"type":"delta","text":"..."}\n\n
 *           data: {"type":"done"}\n\n
 *           data: {"type":"error","message":"..."}\n\n
 */
export default async function handler(
  request: Request,
  _context: Context,
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isOriginAllowed(request)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = (await request.json().catch(() => null)) as {
    diff?: string;
  } | null;

  if (!body?.diff) {
    return new Response(JSON.stringify({ error: 'Diff is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const diffValidation = validateDiff(body.diff);
  if (!diffValidation.ok) {
    return new Response(JSON.stringify({ error: diffValidation.reason }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sanitizar el input antes de enviarlo al LLM.
  // Orden: validate (rechaza) → detect (loguea) → sanitize (neutraliza).
  const injectionMatches = detectInjection(body.diff);
  if (injectionMatches.length > 0) {
    logInjectionAttempt(injectionMatches, {
      ip: request.headers.get('x-nf-client-connection-ip') ?? undefined,
      diffLength: body.diff.length,
    });
  }
  const safeDiff = sanitizeDiff(body.diff);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    return new Response(JSON.stringify({ error: 'Service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const client = new OpenAI({ apiKey });

  let upstream: Awaited<ReturnType<typeof createStream>>;
  try {
    upstream = await createStream(client, safeDiff);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('OpenAI error:', message);
    return new Response(
      JSON.stringify({ error: 'Failed to start review stream' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return createSSEResponse(upstream);
}

async function createStream(client: OpenAI, diff: string) {
  return client.responses.stream({
    model: 'gpt-5.6-luna',
    instructions: SYSTEM_PROMPT,
    input: [
      {
        role: 'user',
        content: `Analiza el siguiente unified diff y devuelve un review técnico estructurado conforme al schema.\n\nDiff:\n\`\`\`\n${diff}\n\`\`\``,
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'CodeReview',
        schema: REVIEW_SCHEMA,
        strict: true,
      },
    },
  });
}

function createSSEResponse(
  upstream: Awaited<ReturnType<typeof createStream>>,
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        for await (const event of upstream) {
          // Solo nos interesa el delta de texto: el modelo emite el JSON
          // completo del schema pieza por pieza, y el cliente lo concatena.
          if (event.type === 'response.output_text.delta') {
            send({ type: 'delta', text: event.delta });
          }
        }
        send({ type: 'done' });
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Stream error:', message);
        try {
          send({ type: 'error', message });
          controller.close();
        } catch {
          // El controller ya estaba cerrado; ignoramos.
        }
      }
    },
    cancel() {
      // El cliente cortó la conexión (cerró la pestaña, navegó, etc.).
      // Cerramos el stream upstream para no gastar tokens.
      void upstream.controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export const config = {
  path: '/api/review',
};
