import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReviewResponse } from '../../hooks/useReviewStream/useReviewStream';
import ReviewOutput from './ReviewOutput';

const sampleReview: ReviewResponse = {
  summary: 'Cambio sólido con dos mejoras recomendadas.',
  verdict: 'request_changes',
  findings: [
    {
      id: 'SEC-1',
      severity: 'high',
      category: 'security',
      line: 'L42',
      title: 'SQL injection',
      explanation: 'Concatenación directa.',
      fix: 'Usar query parametrizada.',
    },
    {
      id: 'PERF-1',
      severity: 'medium',
      category: 'performance',
      line: 'L18',
      title: 'N+1 en loop',
      explanation: 'Query por iteración.',
      fix: 'Batch fetch antes del loop.',
    },
  ],
};

describe('ReviewOutput', () => {
  it('muestra el summary y el verdict', () => {
    render(<ReviewOutput review={sampleReview} />);
    expect(screen.getByText(/cambio sólido/i)).toBeInTheDocument();
    expect(screen.getByText(/solicitar cambios/i)).toBeInTheDocument();
  });

  it('muestra el conteo de findings correcto', () => {
    render(<ReviewOutput review={sampleReview} />);
    expect(screen.getByRole('heading', { name: /findings \(2\)/i })).toBeInTheDocument();
  });

  it('renderiza un FindingCard por cada finding', () => {
    render(<ReviewOutput review={sampleReview} />);
    expect(screen.getByRole('heading', { name: /sql injection/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /n\+1 en loop/i })).toBeInTheDocument();
  });

  it('muestra mensaje vacío cuando no hay findings', () => {
    const empty: ReviewResponse = { ...sampleReview, findings: [], verdict: 'approve' };
    render(<ReviewOutput review={empty} />);
    expect(screen.getByText(/no se encontraron hallazgos/i)).toBeInTheDocument();
  });
});
