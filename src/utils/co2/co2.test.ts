import { describe, expect, it } from 'vitest';
import { estimateTokens, estimateCO2Grams, formatCO2, calculateReviewCO2 } from './co2';

describe('co2', () => {
  it('estimateTokens: 4 chars ≈ 1 token', () => {
    expect(estimateTokens(400)).toBe(100);
    expect(estimateTokens(1)).toBe(1);
    expect(estimateTokens(0)).toBe(0);
  });

  it('estimateCO2Grams: 1000 tokens produce some CO2', () => {
    const grams = estimateCO2Grams(1000);
    expect(grams).toBeGreaterThan(0);
    expect(grams).toBeLessThan(1); // menos de 1 gramo
  });

  it('formatCO2: menos de 1g muestra 2 decimales', () => {
    expect(formatCO2(0.075)).toBe('0.07 g');
  });

  it('formatCO2: más de 1g muestra 1 decimal', () => {
    expect(formatCO2(1.5)).toBe('1.5 g');
  });

  it('calculateReviewCO2: devuelve string formateado', () => {
    const result = calculateReviewCO2(1000, 2000);
    expect(typeof result).toBe('string');
    expect(result).toMatch(/g$/);
  });
});
