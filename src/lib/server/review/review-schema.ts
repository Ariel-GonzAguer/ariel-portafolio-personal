/**
 * JSON Schema estricto para la respuesta de OpenAI.
 *
 * El modelo DEBE devolver un JSON conforme a este schema.
 * `strict: true` en Responses API garantiza que el modelo lo respeta
 * o devuelve un error.
 */
export const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'findings', 'verdict'],
  properties: {
    summary: {
      type: 'string',
      description: 'Resumen ejecutivo del review en 2-3 oraciones.',
    },
    verdict: {
      enum: ['approve', 'request_changes', 'comment'],
      description: 'Veredicto estilo GitHub PR review.',
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'severity', 'category', 'line', 'title', 'explanation', 'fix'],
        properties: {
          id: {
            type: 'string',
            description: 'Identificador único del hallazgo, ej: SEC-1, PERF-2, A11Y-1.',
          },
          severity: {
            enum: ['critical', 'high', 'medium', 'low', 'info'],
          },
          category: {
            enum: [
              'security',
              'performance',
              'type_safety',
              'accessibility',
              'correctness',
              'maintainability',
            ],
          },
          line: {
            type: 'string',
            description: 'Línea(s) en formato L42 o L42-L47 según los hunks del diff.',
          },
          title: {
            type: 'string',
            maxLength: 80,
            description: 'Título corto (≤80 chars) que resume el problema.',
          },
          explanation: {
            type: 'string',
            maxLength: 1500,
            description: 'Por qué importa este problema y qué falla concretamente.',
          },
          fix: {
            type: 'string',
            maxLength: 4000,
            description:
              'Código corregido (no pseudocódigo). Si es vacío, string "" para hallazgos puramente informativos.',
          },
        },
      },
    },
  },
} as const;
