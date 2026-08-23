import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Certificados from './Certificados';

describe('Certificados', () => {
  it('renderiza la sección con heading', () => {
    render(<Certificados />);
    expect(
      screen.getByRole('heading', { level: 2, name: /certificaciones/i }),
    ).toBeInTheDocument();
  });

  it('muestra los cuatro certificados', () => {
    render(<Certificados />);
    expect(screen.getByText(/frontend engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/ux designer/i)).toBeInTheDocument();
    expect(screen.getByText(/green digital certificate program/i)).toBeInTheDocument();
    expect(screen.getByText(/habilidades humanas en la era de la ia/i)).toBeInTheDocument();
  });

  it('cada certificado tiene enlace accesible a su PDF', () => {
    render(<Certificados />);
    const enlaces = screen.getAllByRole('link', { name: /ver certificado/i });
    expect(enlaces).toHaveLength(4);
    for (const enlace of enlaces) {
      expect(enlace).toHaveAttribute('href', expect.stringMatching(/^https?:\/\//));
      expect(enlace).toHaveAttribute('target', '_blank');
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
});
