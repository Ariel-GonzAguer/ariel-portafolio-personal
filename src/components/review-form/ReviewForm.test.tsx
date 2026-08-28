import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReviewForm from './ReviewForm';

describe('ReviewForm', () => {
  it('renderiza el textarea y el botón de submit', () => {
    render(<ReviewForm onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByLabelText(/pega tu unified diff/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /revisar diff/i }),
    ).toBeInTheDocument();
  });

  it('muestra "Analizando…" cuando está cargando', () => {
    render(<ReviewForm onSubmit={vi.fn()} isLoading={true} />);
    expect(
      screen.getByRole('button', { name: /analizando/i }),
    ).toBeInTheDocument();
  });

  it('incluye el campo honeypot oculto para bots', () => {
    const { container } = render(<ReviewForm onSubmit={vi.fn()} isLoading={false} />);
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).toBeInTheDocument();
    expect(honeypot).toHaveAttribute('aria-hidden', 'true');
    expect(honeypot).toHaveAttribute('tabindex', '-1');
  });
});
