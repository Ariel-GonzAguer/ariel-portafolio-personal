import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Contacto from './Contacto';

describe('Contacto', () => {
  it('renderiza la sección con heading y mensaje de posicionamiento', () => {
    render(<Contacto />);
    expect(screen.getByRole('heading', { level: 2, name: /hablemos/i })).toBeInTheDocument();
    expect(screen.getByText(/donde la ia sume al producto/i)).toBeInTheDocument();
  });

  it('muestra los tres canales de contacto', () => {
    render(<Contacto />);
    expect(screen.getByRole('link', { name: /^github/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^linkedin/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^email/i })).toBeInTheDocument();
  });

  it('GitHub apunta al perfil correcto', () => {
    render(<Contacto />);
    expect(screen.getByRole('link', { name: /^github/i })).toHaveAttribute(
      'href',
      'https://github.com/Ariel-GonzAguer',
    );
  });
});
