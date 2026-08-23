import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { openSource } from '../../data/proyectos';
import OpenSource from './OpenSource';

describe('OpenSource', () => {
  it('renderiza la sección con heading', () => {
    render(<OpenSource />);
    expect(screen.getByRole('heading', { level: 2, name: /open source/i })).toBeInTheDocument();
  });

  it('explica por qué solo hay código público acá', () => {
    render(<OpenSource />);
    expect(screen.getByText(/la mayoría de mi trabajo de producto es privado/i)).toBeInTheDocument();
  });

  it('muestra los tres repos públicos', () => {
    render(<OpenSource />);
    expect(screen.getByRole('heading', { name: /michi-router/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /comidaemergencia/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /comparación de modelos/i })).toBeInTheDocument();
  });

  it('cada repo tiene enlace a GitHub específico, no al perfil', () => {
    render(<OpenSource />);
    const enlaces = screen.getAllByRole('link', { name: /^ver código/i });
    expect(enlaces).toHaveLength(openSource.length);
    for (const enlace of enlaces) {
      const href = enlace.getAttribute('href');
      expect(href).toMatch(/^https:\/\/github\.com\/Ariel-GonzAguer\/[\w.-]+$/);
      expect(href).not.toBe('https://github.com/Ariel-GonzAguer');
      expect(enlace).toHaveAttribute('target', '_blank');
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('ComidaEmergencia muestra su licencia', () => {
    render(<OpenSource />);
    expect(screen.getByText(/licencia: mit \+ commons clause/i)).toBeInTheDocument();
  });
});
