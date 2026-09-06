import { describe, expect, it } from 'vitest';
import { calculateReviewCO2Range } from './co2';

describe('co2', () => {
  it('calcula un rango conservador con los tokens reales de la API', () => {
    expect(calculateReviewCO2Range(1000)).toBe('0.1–2.9g CO₂e');
  });

  it('no genera emisiones negativas', () => {
    expect(calculateReviewCO2Range(-100)).toBe('0.00–0.00g CO₂e');
  });
});
