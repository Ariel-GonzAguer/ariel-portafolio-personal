import type { Context } from '@netlify/functions';
import OpenAI from 'openai';
import { REVIEW_SCHEMA } from './_lib/review-schema';
import { SYSTEM_PROMPT } from './_lib/system-prompt';
import { validateDiff } from './_lib/validate-diff';
import { isOriginAllowed } from './_lib/validate-origin';

/**
 * Netlify Function: /api/review
 *
 * FASE 2: llamada real a OpenAI Responses API con JSON schema estricto
 * y modelo gpt-4.1-mini. Respuesta no-streaming (FASE 4 agregará SSE).
 *
 * Flujo:
 * 1. Validar método (POST) y origen (CSRF allowlist).
 * 2. Honeypot: si viene lleno, simular éxito silencioso.
 * 3. Parsear body y validar el diff (vacío, binario, injection, tamaño).
 * 4. Llamar a openai.responses.parse() con el schema.
 * 5. Devolver el JSON parseado.
 *
 * Convenciones:
 * - path = "/api/review" (definido en netlify.toml via redirect)
 * - body: { diff: string, honeypot?: string }
 * - response 200: { summary, verdict, findings }
 * - response 4xx/5xx: { error: string }
 */
export default async function handler(
  request: Request,
  _context: Context,
): Promise<Response> {
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!isOriginAllowed(request)) {
    return json({ error: 'Origin not allowed' }, 403);
  }

  const body = (await request.json().catch(() => null)) as {
    diff?: string;
    honeypot?: string;
  } | null;

  // Honeypot: si viene lleno, simular éxito silencioso.
  if (body?.honeypot && body.honeypot.length > 0) {
    return json({ ok: true }, 200);
  }

  if (!body?.diff) {
    return json({ error: 'Diff is required' }, 400);
  }

  const diffValidation = validateDiff(body.diff);
  if (!diffValidation.ok) {
    return json({ error: diffValidation.reason }, 400);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    return json({ error: 'Service not configured' }, 500);
  }

  const client = new OpenAI({ apiKey });

  try {
    const response = await client.responses.parse({
      model: 'gpt-4.1-mini',
      instructions: SYSTEM_PROMPT,
      input: [
        {
          role: 'user',
          content: `Analiza el siguiente unified diff y devuelve un review técnico estructurado conforme al schema.\n\nDiff:\n\`\`\`\n${body.diff}\n\`\`\``,
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

    const parsed = response.output_parsed;
    if (!parsed) {
      console.error('OpenAI returned no output_parsed');
      return json({ error: 'Empty response from model' }, 502);
    }

    return json(parsed, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('OpenAI error:', message);
    return json({ error: 'Failed to generate review' }, 502);
  }
}

export const config = {
  path: '/api/review',
};
