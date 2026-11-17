import { describe, expect, it } from 'vitest';
import { REVIEW_MODEL_ID, calculateReviewApiCostUSD, formatReviewApiCostUSD } from './review-cost';

describe('review-cost', () => {
  it('usa el modelo deepseek de Infron', () => {
    expect(REVIEW_MODEL_ID).toBe('deepseek/deepseek-v4.1-flash-1017');
  });

  it('calcula costo con las tarifas de Infron (0.18 input / 0.72 output)', () => {
    expect(
      calculateReviewApiCostUSD({
        inputTokens: 1000,
        outputTokens: 1000,
      }),
    ).toBeCloseTo(0.0009);
  });

  it('cobra cache read y no cobra cache writes', () => {
    expect(
      calculateReviewApiCostUSD({
        inputTokens: 3000,
        cachedInputTokens: 1000,
        cacheWriteInputTokens: 1000,
        outputTokens: 1000,
      }),
    ).toBeCloseTo(0.000906);
  });

  it('formatea costos pequeños sin redondearlos a cero', () => {
    expect(formatReviewApiCostUSD({ inputTokens: 120, outputTokens: 80 })).toBe('$0.00008 USD');
  });
});
