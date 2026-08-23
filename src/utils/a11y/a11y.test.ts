import { describe, expect, it } from 'vitest';
import { focusClassName } from './a11y';

describe('focusClassName', () => {
  it('devuelve clases de foco esmeralda por defecto', () => {
    expect(focusClassName()).toContain('outline-red-400');
  });

  it('acepta color blanco explícito', () => {
    expect(focusClassName('white')).toContain('outline-white');
    expect(focusClassName('white')).not.toContain('red');
  });

  it('siempre incluye outline visible y offset para WCAG 2.4.7', () => {
    for (const resultado of [focusClassName(), focusClassName('white')]) {
      expect(resultado).toContain('focus-visible:outline-2');
      expect(resultado).toContain('focus-visible:outline-offset-2');
    }
  });
});
