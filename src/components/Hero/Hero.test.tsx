import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Hero from './Hero';

describe('Hero', () => {
  it('muestra el nombre de Ariel como heading principal', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1, name: /ariel gonzagüer/i })).toBeInTheDocument();
  });

  it('muestra el posicionamiento Frontend + IA', () => {
    render(<Hero />);
    expect(screen.getByText(/frontend \/ product engineer \+ ia/i)).toBeInTheDocument();
  });

  it('tiene llamados a la acción hacia proyectos y contacto', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: /ver proyectos/i })).toHaveAttribute(
      'href',
      '#proyectos',
    );
    expect(screen.getByRole('link', { name: /contactarme/i })).toHaveAttribute('href', '#contacto');
  });
});
