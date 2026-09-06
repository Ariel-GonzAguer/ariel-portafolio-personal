import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReviewResponse } from '../../hooks/useReviewStream/types';
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
    expect(screen.getByRole('heading', { name: /hallazgos \(2\)/i })).toBeInTheDocument();
  });

  it('muestra el rango climático solo con el uso real de la API', () => {
    render(
      <ReviewOutput
        review={sampleReview}
        usage={{
          inputTokens: 120,
          cachedInputTokens: 20,
          cacheWriteInputTokens: 10,
          outputTokens: 80,
          reasoningTokens: 40,
          totalTokens: 200,
        }}
      />,
    );

    expect(screen.getByText(/impacto climático estimado: 0\.03–0\.6 gco₂e/i)).toBeInTheDocument();
    expect(screen.getByText(/costo api estimado: \$0\.00012 usd/i)).toBeInTheDocument();
    expect(screen.getByText(/el costo usa tarifas públicas de openai/i)).toBeInTheDocument();
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

  it('tiene botón para copiar el review como JSON', () => {
    render(<ReviewOutput review={sampleReview} />);
    expect(screen.getByRole('button', { name: /copiar review como json/i })).toBeInTheDocument();
  });

  it('al hacer click, copia el JSON al clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<ReviewOutput review={sampleReview} />);
    fireEvent.click(screen.getByRole('button', { name: /copiar review como json/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
    });
    expect(writeText.mock.calls[0]?.[0]).toBe(JSON.stringify(sampleReview, null, 2));

    vi.unstubAllGlobals();
  });
});
