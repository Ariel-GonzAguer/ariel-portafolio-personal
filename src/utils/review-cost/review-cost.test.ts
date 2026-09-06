import { describe, expect, it } from 'vitest';
import { calculateReviewApiCostUSD, formatReviewApiCostUSD } from './review-cost';

describe('review-cost', () => {
  it('calcula costo con tokens de entrada y salida de gpt-5.6-luna', () => {
    expect(
      calculateReviewApiCostUSD({
        inputTokens: 1000,
        outputTokens: 1000,
      }),
    ).toBeCloseTo(0.0014);
  });

  it('usa tarifa reducida para input cacheado y multiplicador para cache writes', () => {
    expect(
      calculateReviewApiCostUSD({
        inputTokens: 3000,
        cachedInputTokens: 1000,
        cacheWriteInputTokens: 1000,
        outputTokens: 1000,
      }),
    ).toBeCloseTo(0.00167);
  });

  it('formatea costos pequeños sin redondearlos a cero', () => {
    expect(formatReviewApiCostUSD({ inputTokens: 120, outputTokens: 80 })).toBe('$0.00012 USD');
  });
});
