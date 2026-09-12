import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { proyectosIA } from '../../data/proyectos';
import IA from './IA';

vi.mock('waku', async () => {
  const React = await import('react');

  return {
    Link: ({
      to,
      children,
      ...props
    }: { to: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) =>
      React.createElement('a', { href: to, ...props }, children),
  };
});

describe('IA', () => {
  it('renderiza la sección con el posicionamiento Frontend + IA', () => {
    render(<IA />);
    expect(screen.getByText(/frontend \+ ia/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /ia integrada en productos reales/i }),
    ).toBeInTheDocument();
  });

  it('muestra los tipos de experiencia con IA presentes en los datos', () => {
    render(<IA />);
    // Verifica que al menos un elemento con cada tipo aparece.
    // Antes había 1 por tipo; con la entrada del AI Code Reviewer
    // ahora hay 2 de "Producto con IA", así que usamos getAllByText.
    const tiposUnicos = new Set(proyectosIA.map((p) => p.tipo));
    for (const tipo of tiposUnicos) {
      const matches = screen.getAllByText(new RegExp(tipo, 'i'));
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('renderiza cada proyecto de la sección', () => {
    render(<IA />);
    for (const proyecto of proyectosIA) {
      expect(
        screen.getByRole('heading', {
          name: new RegExp(proyecto.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        }),
      ).toBeInTheDocument();
    }
  });

  it('solo muestra enlaces en las entradas con enlace público', () => {
    render(<IA />);
    const conEnlace = proyectosIA.filter(
      (proyecto) => Boolean(proyecto.enlace) && proyecto.id !== 'ai-code-reviewer',
    );
    const demos = screen.getAllByRole('link', { name: /^abrir /i });
    expect(demos).toHaveLength(conEnlace.length);
    for (const enlace of demos) {
      expect(enlace).toHaveAttribute('target', '_blank');
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('ofrece navegación interna para AI Code Reviewer sin demo externa', () => {
    render(<IA />);
    expect(screen.getByRole('link', { name: /probar aquí/i })).toHaveAttribute('href', '/review');
    expect(screen.queryByRole('link', { name: /abrir ai code reviewer/i })).not.toBeInTheDocument();
  });

  it('Mandarino enlaza al sitio del estudio', () => {
    render(<IA />);
    const mandarino = proyectosIA.find((proyecto) => proyecto.id === 'mandarino');
    expect(mandarino?.enlace).toBe('https://gatorojolab.com');
    expect(screen.getByRole('link', { name: /abrir mandarino/i })).toHaveAttribute(
      'href',
      'https://gatorojolab.com',
    );
  });

  it('Skills y workflows de agentes enlaza al repo público', () => {
    render(<IA />);
    const repoLink = screen.getByRole('link', { name: /abrir skills y workflows de agentes/i });
    expect(repoLink).toHaveAttribute(
      'href',
      'https://github.com/Ariel-GonzAguer/skills-and-agents',
    );
    expect(repoLink).toHaveTextContent('Ver Repo');
  });

  it('los productos privados no tienen botones de demo ni código', () => {
    render(<IA />);
    expect(screen.queryByRole('link', { name: /monthly cat friend/i })).not.toBeInTheDocument();
  });
});
