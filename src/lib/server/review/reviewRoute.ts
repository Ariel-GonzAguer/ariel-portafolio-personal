import OpenAI from 'openai';
import { getEnv } from 'waku';
import { REVIEW_SCHEMA } from './review-schema';
import { SYSTEM_PROMPT } from './system-prompt';
import { validateDiff } from './validate-diff';
import { sanitizeDiff } from './sanitize';
import { detectInjection, logInjectionAttempt } from './detect-injection';
import { isOriginAllowed } from './validate-origin';
import { SSE_HEADERS, jsonError, withSecurityHeaders } from './security-headers';
import { checkRateLimit, getRetryAfterHeader } from './rate-limit';
import { checkInMemoryRateLimit } from './in-memory-rate-limit';

const STREAM_TIMEOUT_MS = 60_000;

/**
 * Handler del AI Code Reviewer para POST /api/review.
 *
 * SERVER-ONLY: este módulo accede a OPENAI_API_KEY y a Netlify Blobs.
 * Solo se importa desde API routes de Waku (`src/pages/_api/...`).
 * Nunca importar desde componentes cliente (`src/components/...`)
 * o desde hooks cliente (`'use client'`).
 *
 * Sanitiza el input antes de enviarlo a OpenAI y responde con
 * Server-Sent Events (streaming con Responses API).
 *
 * Flujo de seguridad:
 * 1. Validar origen (CSRF allowlist).
 * 2. Honeypot check.
 * 3. Rate limit (3/día por IP, tolerante a errores de Blobs) +
 *    rate limit secundario en memoria (10/min) como red de seguridad.
 * 4. Validar estructura del diff.
 * 5. Detectar prompt injection (rechaza + loguea).
 * 6. Sanitizar el diff.
 * 7. Llamar a openai.responses.stream() con timeout.
 * 8. Devolver SSE.
 */
export async function handleReview(request: Request): Promise<Response> {
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

  // Rate limit: 3 requests/día por IP. Si Blobs falla (p.ej. en dev
  // local sin contexto Netlify), no bloqueamos la request. El rate
  // limit secundario en memoria (10/min) actúa como red de seguridad.
  const ip =
    request.headers.get('x-nf-client-connection-ip') ??
    request.headers.get('x-forwarded-for') ??
    'unknown';

  const memLimit = checkInMemoryRateLimit(ip);
  if (!memLimit.allowed) {
    return jsonError('Too many requests', 429, {
      'Retry-After': String(Math.ceil(memLimit.resetInMs / 1000)),
    });
  }

  try {
    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return jsonError('Rate limit exceeded', 429, {
        'Retry-After': getRetryAfterHeader(),
      });
    }
  } catch (err) {
    console.warn(
      '[reviewRoute] Rate limit no disponible:',
      err instanceof Error ? err.message : 'unknown',
    );
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
    logInjectionAttempt(
      injectionMatches,
      ip === 'unknown' ? { diffLength: body.diff.length } : { ip, diffLength: body.diff.length },
    );
    return jsonError(
      'Se detectó un intento de inyección de prompt. Tu solicitud no será procesada.',
      400,
    );
  }
  const safeDiff = sanitizeDiff(body.diff);

  const apiKey = getServerEnv('OPENAI_API_KEY');
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

/**
 * Lee una variable de entorno del servidor usando waku primero, luego process.env.
 * @example getServerEnv("OPENAI_API_KEY")
 */
function getServerEnv(key: string): string | undefined {
  const value = getEnv(key) ?? process.env[key];
  return value?.trim() || undefined;
}

async function createStream(client: OpenAI, diff: string) {
  return client.responses.stream(
    {
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
    },
    {
      // Evita colgar la request serverless si el modelo no responde.
      timeout: STREAM_TIMEOUT_MS,
    },
  );
}

function createSSEResponse(upstream: Awaited<ReturnType<typeof createStream>>): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
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
