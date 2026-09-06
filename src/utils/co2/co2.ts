/**
 * Rango proxy para inferencia de LLM con infraestructura completa, en gCO2e
 * por mil tokens. No es una medición de OpenAI ni del modelo desplegado.
 *
 * El extremo alto (2.85 gCO2e/1k tokens) se redondea de la estimación de
 * ciclo de vida publicada por Mistral para una respuesta de 400 tokens
 * (1.14 gCO2e): https://mistral.ai/news/our-contribution-to-a-global-environmental-standard-for-ai/
 * El extremo bajo conserva un escenario de serving eficiente, pero incluye
 * infraestructura; debe revisarse si OpenAI publica factores propios.
 */
const MIN_GCO2E_PER_THOUSAND_TOKENS = 0.15;
const MAX_GCO2E_PER_THOUSAND_TOKENS = 2.85;

function formatGrams(grams: number): string {
  return grams < 0.1 ? grams.toFixed(2) : grams.toFixed(1);
}

/**
 * Calcula un rango de impacto climático a partir de los tokens totales que
 * reporta la Responses API. `totalTokens` ya incluye entrada, salida y los
 * tokens de razonamiento que el proveedor contabiliza dentro de la salida.
 */
export function calculateReviewCO2Range(totalTokens: number): string {
  const safeTokens = Math.max(0, totalTokens);
  const minGrams = (safeTokens / 1000) * MIN_GCO2E_PER_THOUSAND_TOKENS;
  const maxGrams = (safeTokens / 1000) * MAX_GCO2E_PER_THOUSAND_TOKENS;

  return `${formatGrams(minGrams)}–${formatGrams(maxGrams)}g CO₂e`;
}
