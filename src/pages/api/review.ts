import OpenAI from 'openai';
import { REVIEW_SCHEMA } from '../../../netlify-functions/api-review/_lib/review-schema';
import { SYSTEM_PROMPT } from '../../../netlify-functions/api-review/_lib/system-prompt';
import { validateDiff } from '../../../netlify-functions/api-review/_lib/validate-diff';
import { sanitizeDiff } from '../../../netlify-functions/api-review/_lib/sanitize';
import {
  detectInjection,
  logInjectionAttempt,
} from '../../../netlify-functions/api-review/_lib/detect-injection';
import { isOriginAllowed } from '../../../netlify-functions/api-review/_lib/validate-origin';
import {
  SSE_HEADERS,
  jsonError,
  withSecurityHeaders,
} from '../../../netlify-functions/api-review/_lib/security-headers';
import {
  checkRateLimit,
  getRetryAfterHeader,
} from '../../../netlify-functions/api-review/_lib/rate-limit';

/**
 * API Route de Waku: /api/review
 *
 * Misma lógica que la Netlify Function, pero como endpoint de Waku
 * para que funcione en desarrollo local sin depender de `netlify dev`.
 *
 * Flujo de seguridad:
 * 1. Validar método (POST) y origen (CSRF allowlist).
 * 2. Honeypot check.
 * 3. Rate limit (3/día por IP).
 * 4. Validar estructura del diff.
 * 5. Detectar prompt injection (rechaza + loguea).
 * 6. Sanitizar el diff.
 * 7. Llamar a OpenAI Responses API con streaming.
 * 8. Devolver SSE.
 */
export async function GET() {
  return jsonError('Method not allowed. Use POST.', 405);
}

export async function POST(request: Request): Promise<Response> {
  if (!isOriginAllowed(request)) {
    return jsonError('Origin not allowed', 403);
  }

  const body = (await request.json().catch(() => null)) as {
    diff?: string;
    website?: boolean;
  } | null;

  // Honeypot: si el checkbox oculto está marcado, es un bot.
  if (body?.website) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: withSecurityHeaders({ 'Content-Type': 'application/json' }),
    });
  }

  // Rate limit: 3 requests/día por IP.
  const ip =
    request.headers.get('x-nf-client-connection-ip') ??
    request.headers.get('x-forwarded-for') ??
    'unknown';
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return jsonError('Rate limit exceeded', 429, {
      'Retry-After': getRetryAfterHeader(),
    });
  }

  if (!body?.diff) {
    return jsonError('Diff is required', 400);
  }

  const diffValidation = validateDiff(body.diff);
  if (!diffValidation.ok) {
    return jsonError(diffValidation.reason, 400);
  }

  // Detectar prompt injection → rechazar con alert al usuario.
  const injectionMatches = detectInjection(body.diff);
  if (injectionMatches.length > 0) {
    logInjectionAttempt(injectionMatches, {
      ip:
        request.headers.get('x-nf-client-connection-ip') ??
        request.headers.get('x-forwarded-for') ??
        undefined,
      diffLength: body.diff.length,
    });
    return jsonError(
      'Se detectó un intento de inyección de prompt. Tu solicitud no será procesada.',
      400,
    );
  }
  const safeDiff = sanitizeDiff(body.diff);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    return jsonError('Service not configured', 500);
  }

  const client = new OpenAI({ apiKey });

  let upstream: Awaited<ReturnType<typeof createStream>>;
  try {
    upstream = await createStream(client, safeDiff);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('OpenAI error:', message);
    return jsonError('Failed to start review stream', 502);
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
      void upstream.controller.abort();
    },
  });

  return new Response(stream, {
    headers: withSecurityHeaders({ ...SSE_HEADERS }),
  });
}
