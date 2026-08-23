import { describe, expect, it } from 'vitest';
import { openSource, proyectos, proyectosIA } from './proyectos';

describe('proyectos (destacados)', () => {
  it('tiene al menos 3 proyectos', () => {
    expect(proyectos.length).toBeGreaterThanOrEqual(3);
  });

  it('cada proyecto tiene los campos obligatorios completos', () => {
    for (const proyecto of proyectos) {
      expect(proyecto.id).toBeTruthy();
      expect(proyecto.nombre).toBeTruthy();
      expect(proyecto.descripcion).toBeTruthy();
      expect(proyecto.rol).toBeTruthy();
      expect(proyecto.impacto).toBeTruthy();
      expect(proyecto.enlace).toMatch(/^https?:\/\//);
      expect(proyecto.tecnologias.length).toBeGreaterThan(0);
      expect(proyecto.enfoque.length).toBeGreaterThan(0);
    }
  });

  it('si hay repositorio, apunta a un repo público específico (no al perfil)', () => {
    for (const proyecto of proyectos) {
      if (proyecto.repositorio) {
        expect(proyecto.repositorio).toMatch(/^https:\/\/github\.com\/Ariel-GonzAguer\/[\w.-]+$/);
      }
    }
  });

  it('los ids son únicos', () => {
    const ids = proyectos.map(proyecto => proyecto.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('las imágenes apuntan a rutas públicas existentes', () => {
    for (const proyecto of proyectos) {
      expect(proyecto.img).toMatch(/^\/imagenes\//);
    }
  });
});

describe('proyectosIA', () => {
  it('incluye Monthly Cat Friend, Mandarino y skills/agentes', () => {
    const ids = proyectosIA.map(proyecto => proyecto.id);
    expect(ids).toContain('monthly-cat-friend');
    expect(ids).toContain('mandarino');
    expect(ids).toContain('skills-agentes');
  });

  it('cada entrada tiene tipo y tecnologías válidas', () => {
    for (const proyecto of proyectosIA) {
      expect(['Producto con IA', 'Chatbot LLM', 'Workflow de agentes']).toContain(proyecto.tipo);
      expect(proyecto.descripcion).toBeTruthy();
      expect(proyecto.tecnologias.length).toBeGreaterThan(0);
    }
  });

  it('los enlaces, si existen, son URLs públicas', () => {
    for (const proyecto of proyectosIA) {
      if (proyecto.enlace) {
        expect(proyecto.enlace).toMatch(/^https:\/\//);
      }
    }
  });

  it('ninguna entrada enlaza al perfil de GitHub como si fuera el código del proyecto', () => {
    for (const proyecto of [...proyectosIA, ...openSource]) {
      expect(proyecto.enlace).not.toBe('https://github.com/Ariel-GonzAguer');
    }
  });
});

describe('openSource', () => {
  it('incluye michi-router, ComidaEmergencia, comparación de modelos y skills-and-agents', () => {
    const ids = openSource.map(repo => repo.id);
    expect(ids).toContain('michi-router');
    expect(ids).toContain('comida-emergencia');
    expect(ids).toContain('comparacion-de-modelos');
    expect(ids).toContain('skills-and-agents');
  });

  it('todos los repos tienen enlace público real y descripción', () => {
    for (const repo of openSource) {
      expect(repo.nombre).toBeTruthy();
      expect(repo.descripcion).toBeTruthy();
      expect(repo.enlace).toMatch(
        /^https:\/\/github\.com\/Ariel-GonzAguer\/(michi-router|comidaEmergencia|comparacion-de-modelos|skills-and-agents)$/,
      );
      expect(repo.tecnologias.length).toBeGreaterThan(0);
    }
  });

  it('los tipos corresponden a las cuatro categorías', () => {
    const tipos = openSource.map(repo => repo.tipo);
    expect(tipos).toContain('Librería npm');
    expect(tipos).toContain('Aplicación open source');
    expect(tipos).toContain('Laboratorio de IA');
    expect(tipos).toContain('Skills y agentes');
  });
});
