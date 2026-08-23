import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { proyectos } from '../../data/proyectos';
import Proyectos from './Proyectos';

describe('Proyectos', () => {
  it('renderiza la sección con heading', () => {
    render(<Proyectos />);
    expect(
      screen.getByRole('heading', { level: 2, name: /^proyectos$/i }),
    ).toBeInTheDocument();
  });

  it('muestra todos los proyectos destacados', () => {
    render(<Proyectos />);
    for (const proyecto of proyectos) {
      expect(screen.getByRole('heading', { name: proyecto.nombre })).toBeInTheDocument();
    }
  });

  it('cada proyecto tiene enlace a demo que abre en nueva pestaña', () => {
    render(<Proyectos />);
    const demos = screen.getAllByRole('link', { name: /^abrir /i });
    expect(demos).toHaveLength(proyectos.length);
    for (const enlace of demos) {
      expect(enlace).toHaveAttribute('target', '_blank');
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('no muestra botones de código para proyectos privados', () => {
    render(<Proyectos />);
    expect(screen.queryByRole('link', { name: /código/i })).not.toBeInTheDocument();
  });

  it('los enlaces de demo apuntan al sitio real de cada proyecto', () => {
    render(<Proyectos />);
    for (const proyecto of proyectos) {
      expect(
        screen.getByLabelText(new RegExp(`abrir ${proyecto.nombre}`, 'i')),
      ).toHaveAttribute('href', proyecto.enlace);
    }
  });
});
