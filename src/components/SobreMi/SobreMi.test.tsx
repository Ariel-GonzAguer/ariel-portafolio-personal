import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SobreMi from './SobreMi';

describe('SobreMi', () => {
  it('renderiza la sección con heading', () => {
    render(<SobreMi />);
    expect(screen.getByRole('heading', { level: 2, name: /cómo trabajo/i })).toBeInTheDocument();
  });

  it('menciona la integración de IA/LLMs como fortaleza', () => {
    render(<SobreMi />);
    expect(screen.getByText(/integración de ia\/llms en productos/i)).toBeInTheDocument();
    expect(screen.getByText(/desarrollo asistido por agentes/i)).toBeInTheDocument();
  });

  it('incluye el stack completo con herramientas de IA', () => {
    render(<SobreMi />);
    expect(screen.getByText('OpenAI API')).toBeInTheDocument();
    expect(screen.getByText('Vercel AI SDK')).toBeInTheDocument();
    expect(screen.getByText('OpenCode')).toBeInTheDocument();
  });

  it('enlaza al estudio Gato Rojo Lab abriendo en nueva pestaña', () => {
    render(<SobreMi />);
    const enlace = screen.getByRole('link', { name: /gato rojo lab/i });
    expect(enlace).toHaveAttribute('href', 'https://gatorojolab.com');
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
