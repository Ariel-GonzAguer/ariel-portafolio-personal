import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReviewForm from './ReviewForm';
import { EXAMPLE_DIFFS } from './ExampleDiffs';

const defaultProps = {
  diff: '',
  onDiffChange: vi.fn(),
  onSubmit: vi.fn(),
  onExampleSelect: vi.fn(),
  isLoading: false,
};

describe('ReviewForm', () => {
  it('renderiza el textarea y el botón de submit', () => {
    render(<ReviewForm {...defaultProps} />);
    expect(screen.getByLabelText(/pega tu unified diff/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /revisar diff/i }),
    ).toBeInTheDocument();
  });

  it('muestra "Analizando…" cuando está cargando', () => {
    render(<ReviewForm {...defaultProps} isLoading={true} />);
    expect(
      screen.getByRole('button', { name: /analizando/i }),
    ).toBeInTheDocument();
  });

  it('el botón está deshabilitado cuando el diff está vacío', () => {
    render(<ReviewForm {...defaultProps} diff="" />);
    expect(
      screen.getByRole('button', { name: /revisar diff/i }),
    ).toBeDisabled();
  });

  it('el botón está habilitado cuando hay diff', () => {
    render(
      <ReviewForm
        {...defaultProps}
        diff={'--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b'}
      />,
    );
    expect(
      screen.getByRole('button', { name: /revisar diff/i }),
    ).not.toBeDisabled();
  });

  it('muestra el selector con los 3 ejemplos precargados', () => {
    render(<ReviewForm {...defaultProps} />);
    const selector = screen.getByLabelText(/cargar un ejemplo/i);
    expect(selector).toBeInTheDocument();
    for (const example of EXAMPLE_DIFFS) {
      expect(selector.textContent).toContain(example.label);
    }
  });
});
