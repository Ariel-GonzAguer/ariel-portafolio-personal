import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Certificados from './Certificados';

describe('Certificados', () => {
  it('renderiza la sección con heading', () => {
    render(<Certificados />);
    expect(screen.getByRole('heading', { level: 2, name: /certificaciones/i })).toBeInTheDocument();
  });

  it('muestra todos los certificados', () => {
    render(<Certificados />);
    expect(screen.getByText(/openai api - coding with javascript/i)).toBeInTheDocument();
    expect(screen.getByText(/^prompt engineering$/i)).toBeInTheDocument();
    expect(screen.getByText(/hallucinations, inaccuracies, and bias/i)).toBeInTheDocument();
    expect(screen.queryByText(/owasp top 10/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/becoming a secure coder/i)).not.toBeInTheDocument();
    expect(screen.getByText(/frontend engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/ux designer/i)).toBeInTheDocument();
    expect(screen.getByText(/green digital certificate program/i)).toBeInTheDocument();
    expect(screen.getByText(/habilidades humanas en la era de la ia/i)).toBeInTheDocument();
    expect(screen.getByText(/tecnología sostenible/i)).toBeInTheDocument();
    expect(screen.getByText(/governing ai agents/i)).toBeInTheDocument();
    expect(screen.getByText(/carbon aware computing/i)).toBeInTheDocument();
    expect(screen.getByText(/spec-driven development/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ai code review/i).length).toBe(1);
  });

  it('cada certificado tiene enlace accesible a su PDF o URL externa', () => {
    render(<Certificados />);
    const enlaces = screen.getAllByRole('link', { name: /ver certificado/i });
    expect(enlaces).toHaveLength(12);
    for (const enlace of enlaces) {
      expect(enlace).toHaveAttribute('target', '_blank');
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    }
    const locales = enlaces.filter((e) =>
      e.getAttribute('href')?.startsWith('/certificados/'),
    );
    const externos = enlaces.filter(
      (e) => !e.getAttribute('href')?.startsWith('/certificados/'),
    );
    expect(locales).toHaveLength(8);
    expect(externos).toHaveLength(4);
  });
});
