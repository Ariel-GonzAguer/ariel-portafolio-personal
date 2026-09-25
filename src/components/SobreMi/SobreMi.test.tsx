import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SobreMi from './SobreMi';

describe('SobreMi', () => {
  it('renderiza la sección con heading', () => {
    render(<SobreMi />);
    expect(screen.getByRole('heading', { level: 2, name: /cómo trabajo/i })).toBeInTheDocument();
  });

  it('menciona la IA aplicada a producto como fortaleza', () => {
    render(<SobreMi />);
    expect(screen.getByText(/ia aplicada con criterio de producto/i)).toBeInTheDocument();
  });

  it('incluye el stack con herramientas de IA', () => {
    render(<SobreMi />);
    expect(screen.getByText('OpenAI API')).toBeInTheDocument();
    expect(screen.getByText('OpenCode')).toBeInTheDocument();
    expect(screen.getByText('CommandCode')).toBeInTheDocument();
  });
});
