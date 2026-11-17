import OpenAI from 'openai';
import type { ChatCompletionCreateParamsStreaming } from 'openai/resources/chat/completions';
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
import { parseBody } from './parse-body';
import { logRateLimitExceeded } from './log-abuse';
import { REVIEW_MODEL_ID } from '../../../utils/review-cost/review-cost';

const STREAM_TIMEOUT_MS = 60_000;

/**
 * Gateway Infron: protocolo nativo de OpenAI v1 Chat Completions.
 * @example "https://llm.onerouter.pro/v1"
 */
const INFRON_BASE_URL = 'https://llm.onerouter.pro/v1';

/**
 * Handler del AI Code Reviewer para POST /api/review.
 *
 * SERVER-ONLY: este módulo accede a INFRON_API_KEY y a Netlify Blobs.
 * Solo se importa desde API routes de Waku (`src/pages/_api/...`).
 * Nunca importar desde componentes cliente (`src/components/...`)
 * o desde hooks cliente (`'use client'`).
 *
 * Sanitiza el input antes de enviarlo a Infron y responde con
 * Server-Sent Events (streaming con Chat Completions).
 *
 * Flujo de seguridad:
 * 1. Validar origen (CSRF allowlist).
 * 2. Parseo estricto del body (Content-Type 415, JSON/tipos 400, H1+H5).
 * 3. Honeypot check.
 * 4. Rate limit (3/día por IP, tolerante a errores de Blobs) +
 *    rate limit secundario en memoria (10/min) como red de seguridad.
 * 5. Validar estructura del diff.
 * 6. Detectar prompt injection (rechaza + loguea).
 * 7. Sanitizar el diff.
 * 8. Llamar a chat.completions.create() con timeout.
 * 9. Devolver SSE.
 */
export async function handleReview(request: Request): Promise<Response> {
  if (!isOriginAllowed(request)) {
    return jsonError('Origin not allowed', 403);
  }

  // H1+H5: validación estricta de Content-Type y tipos antes de usar el body.
  const parsed = await parseBody(request);
  if (!parsed.ok) {
    return jsonError(parsed.error, parsed.status);
  }
  const body = parsed.body;

  // Honeypot: si el campo trampa llega con cualquier valor truthy
  // (true, "string", etc.), es un bot. Se decide por truthiness sobre el
  // valor CRUDO: normalizarlo rompería la trampa.
  if (body.website) {
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
    logRateLimitExceeded(request, ip);
    return jsonError(
      'Too many requests',
      429,
      {
        'Retry-After': String(Math.ceil(memLimit.resetInMs / 1000)),
      },
      'rate_limit',
    );
  }

  try {
    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.allowed) {
      logRateLimitExceeded(request, ip);
      return jsonError(
        'Rate limit exceeded',
        429,
        {
          'Retry-After': getRetryAfterHeader(),
        },
        'rate_limit',
      );
    }
  } catch (err) {
    console.warn(
      '[reviewRoute] Rate limit no disponible:',
      err instanceof Error ? err.message : 'unknown',
    );
  }

  const diffValidation = validateDiff(body.diff);
  if (!diffValidation.ok) {
    return jsonError(diffValidation.reason, 400);
  }

  // Detectar prompt injection → rechazar con alert al usuario.
  // El code `injection_detected` permite al cliente mostrar UI distinta
  // (alert del navegador + vaciar textarea + cooldown del botón).
  const injectionMatches = detectInjection(body.diff);
  if (injectionMatches.length > 0) {
    logInjectionAttempt(
      injectionMatches,
      ip === 'unknown' ? { diffLength: body.diff.length } : { ip, diffLength: body.diff.length },
    );
    return jsonError(
      'Se detectó un intento de inyección de prompt. Tu solicitud no será procesada.',
      400,
      {},
      'injection_detected',
    );
  }
  const safeDiff = sanitizeDiff(body.diff);

  const apiKey = getServerEnv('INFRON_API_KEY');
  if (!apiKey) {
    console.error('INFRON_API_KEY is not set');
    return jsonError('Service not configured', 500);
  }

  const client = new OpenAI({ apiKey, baseURL: INFRON_BASE_URL });

  let upstream: Awaited<ReturnType<typeof createStream>>;
  try {
    upstream = await createStream(client, safeDiff);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Infron error:', message);
    return jsonError('Failed to start review stream', 502);
  }

  return createSSEResponse(upstream);
}

/**
 * Lee una variable de entorno del servidor usando waku primero, luego process.env.
 * @example getServerEnv("INFRON_API_KEY")
 */
function getServerEnv(key: string): string | undefined {
  const value = getEnv(key) ?? process.env[key];
  return value?.trim() || undefined;
}

/**
 * Abre el stream de Chat Completions contra Infron.
 *
 * Usa `response_format: json_schema` con `strict: true` para que el
 * modelo devuelva JSON conforme a REVIEW_SCHEMA. Para recibir el usage
 * real en el último chunk envía los dos flags que documenta Infron:
 * `stream_options.include_usage` (estándar OpenAI) y `usage.include`.
 *
 * @param client Cliente OpenAI apuntando a INFRON_BASE_URL
 * @param diff Diff ya sanitizado
 * @example await createStream(client, sanitizedDiff)
 */
async function createStream(client: OpenAI, diff: string) {
  const params: ChatCompletionCreateParamsStreaming & { usage?: { include: boolean } } = {
    model: REVIEW_MODEL_ID,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analiza el siguiente unified diff y devuelve un review técnico estructurado conforme al schema.\n\nDiff:\n\`\`\`\n${diff}\n\`\`\``,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'CodeReview',
        schema: REVIEW_SCHEMA,
        strict: true,
      },
    },
    stream: true,
    stream_options: { include_usage: true },
    usage: { include: true },
  };

  return client.chat.completions.create(params, {
    // Evita colgar la request serverless si el modelo no responde.
    timeout: STREAM_TIMEOUT_MS,
  });
}

function createSSEResponse(upstream: Awaited<ReturnType<typeof createStream>>): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        for await (const chunk of upstream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            send({ type: 'delta', text: delta });
          }
          // Con stream_options.include_usage el último chunk trae el
          // usage real y choices vacío.
          if (chunk.usage) {
            const usage = chunk.usage;
            send({
              type: 'usage',
              usage: {
                inputTokens: usage.prompt_tokens,
                cachedInputTokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
                cacheWriteInputTokens: usage.prompt_tokens_details?.cache_write_tokens ?? 0,
                outputTokens: usage.completion_tokens,
                reasoningTokens: usage.completion_tokens_details?.reasoning_tokens ?? 0,
                totalTokens: usage.total_tokens,
              },
            });
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
