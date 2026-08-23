import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { proyectosIA } from '../../data/proyectos';
import IA from './IA';

describe('IA', () => {
  it('renderiza la sección con el posicionamiento Frontend + IA', () => {
    render(<IA />);
    expect(screen.getByText(/frontend \+ ia/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /ia integrada en productos reales/i }),
    ).toBeInTheDocument();
  });

  it('muestra los tres tipos de experiencia con IA', () => {
    render(<IA />);
    expect(screen.getByText(/producto con ia/i)).toBeInTheDocument();
    expect(screen.getByText(/chatbot llm/i)).toBeInTheDocument();
    expect(screen.getByText(/workflow de agentes/i)).toBeInTheDocument();
  });

  it('renderiza cada proyecto de la sección', () => {
    render(<IA />);
    for (const proyecto of proyectosIA) {
      expect(
        screen.getByRole('heading', { name: new RegExp(proyecto.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }),
      ).toBeInTheDocument();
    }
  });

  it('solo muestra enlaces en las entradas con enlace público', () => {
    render(<IA />);
    const conEnlace = proyectosIA.filter(proyecto => Boolean(proyecto.enlace));
    const demos = screen.getAllByRole('link', { name: /^abrir /i });
    expect(demos).toHaveLength(conEnlace.length);
    for (const enlace of demos) {
      expect(enlace).toHaveAttribute('target', '_blank');
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('Mandarino enlaza al sitio del estudio', () => {
    render(<IA />);
    const mandarino = proyectosIA.find(proyecto => proyecto.id === 'mandarino');
    expect(mandarino?.enlace).toBe('https://gatorojolab.com');
    expect(screen.getByRole('link', { name: /abrir mandarino/i })).toHaveAttribute(
      'href',
      'https://gatorojolab.com',
    );
  });

  it('los productos privados no tienen botones de demo ni código', () => {
    render(<IA />);
    expect(screen.queryByRole('link', { name: /monthly cat friend/i })).not.toBeInTheDocument();
  });
});
