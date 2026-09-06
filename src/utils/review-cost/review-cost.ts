/**
 * Tarifas públicas de OpenAI para gpt-5.6-luna, en USD por 1M tokens.
 * Revisar si cambia el modelo o la página de pricing:
 * https://developers.openai.com/api/docs/models/gpt-5.6-luna
 */
export const REVIEW_MODEL_ID = 'gpt-5.6-luna';

const INPUT_USD_PER_MILLION_TOKENS = 0.2;
const CACHED_INPUT_USD_PER_MILLION_TOKENS = 0.02;
const CACHE_WRITE_INPUT_MULTIPLIER = 1.25;
const OUTPUT_USD_PER_MILLION_TOKENS = 1.2;

interface ReviewCostUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  cacheWriteInputTokens?: number;
}

export function calculateReviewApiCostUSD(usage: ReviewCostUsage): number {
  const inputTokens = clampTokens(usage.inputTokens);
  const outputTokens = clampTokens(usage.outputTokens);
  const cachedInputTokens = Math.min(clampTokens(usage.cachedInputTokens), inputTokens);
  const cacheWriteInputTokens = Math.min(
    clampTokens(usage.cacheWriteInputTokens),
    inputTokens - cachedInputTokens,
  );
  const standardInputTokens = Math.max(0, inputTokens - cachedInputTokens - cacheWriteInputTokens);

  const standardInputCost = toMillionTokens(standardInputTokens) * INPUT_USD_PER_MILLION_TOKENS;
  const cachedInputCost = toMillionTokens(cachedInputTokens) * CACHED_INPUT_USD_PER_MILLION_TOKENS;
  const cacheWriteInputCost =
    toMillionTokens(cacheWriteInputTokens) *
    INPUT_USD_PER_MILLION_TOKENS *
    CACHE_WRITE_INPUT_MULTIPLIER;
  const outputCost = toMillionTokens(outputTokens) * OUTPUT_USD_PER_MILLION_TOKENS;

  return standardInputCost + cachedInputCost + cacheWriteInputCost + outputCost;
}

export function formatReviewApiCostUSD(usage: ReviewCostUsage): string {
  const cost = calculateReviewApiCostUSD(usage);

  if (cost === 0) return '$0.00 USD';
  if (cost < 0.00001) return '<$0.00001 USD';
  if (cost < 0.01) return `$${trimTrailingZeros(cost.toFixed(5))} USD`;
  if (cost < 1) return `$${trimTrailingZeros(cost.toFixed(4))} USD`;

  return `$${cost.toFixed(2)} USD`;
}

function clampTokens(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function toMillionTokens(tokens: number): number {
  return tokens / 1_000_000;
}

function trimTrailingZeros(value: string): string {
  return value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
