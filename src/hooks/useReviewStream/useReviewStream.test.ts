import { describe, expect, it } from 'vitest';
import type { ReviewResponse, Severity, Category, Verdict } from './types';

/**
 * Tests del módulo de tipos del reviewer.
 * Validamos que los tipos compilan y los union literals
 * cubren los valores esperados. En fases siguientes se testea el hook real.
 */
describe('useReviewStream (tipos)', () => {
  it('Severity cubre los 5 niveles', () => {
    const valid: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
    expect(valid).toHaveLength(5);
  });

  it('Category cubre las 6 categorías del plan', () => {
    const valid: Category[] = [
      'security',
      'performance',
      'type_safety',
      'accessibility',
      'correctness',
      'maintainability',
    ];
    expect(valid).toHaveLength(6);
  });

  it('Verdict cubre los 3 valores estilo GitHub', () => {
    const valid: Verdict[] = ['approve', 'request_changes', 'comment'];
    expect(valid).toHaveLength(3);
  });

  it('ReviewResponse tiene los 3 campos obligatorios', () => {
    const sample: ReviewResponse = {
      summary: 'Resumen ejecutivo.',
      verdict: 'request_changes',
      findings: [
        {
          id: 'SEC-1',
          severity: 'high',
          category: 'security',
          line: 'L42',
          title: 'SQL injection',
          explanation: 'Concatenación de strings en query.',
          fix: 'Usar query parametrizada.',
        },
      ],
    };
    expect(sample.findings[0]?.id).toBe('SEC-1');
  });
});
