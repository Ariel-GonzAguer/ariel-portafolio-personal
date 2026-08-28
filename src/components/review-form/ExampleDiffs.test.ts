import { describe, expect, it } from 'vitest';
import { EXAMPLE_DIFFS } from './ExampleDiffs';

describe('ExampleDiffs', () => {
  it('tiene al menos 3 ejemplos', () => {
    expect(EXAMPLE_DIFFS.length).toBeGreaterThanOrEqual(3);
  });

  it('cada ejemplo tiene id, label, description y diff', () => {
    for (const example of EXAMPLE_DIFFS) {
      expect(example.id).toBeTruthy();
      expect(example.label).toBeTruthy();
      expect(example.description).toBeTruthy();
      expect(example.diff).toBeTruthy();
    }
  });

  it('los ids son únicos', () => {
    const ids = EXAMPLE_DIFFS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada ejemplo es un unified diff válido (con headers --- a/ y +++ b/)', () => {
    for (const example of EXAMPLE_DIFFS) {
      expect(example.diff).toMatch(/^--- a\/.+/m);
      expect(example.diff).toMatch(/^\+\+\+ b\/.+/m);
    }
  });

  it('ningún ejemplo está vacío ni pasa de 100 KB', () => {
    for (const example of EXAMPLE_DIFFS) {
      expect(example.diff.length).toBeGreaterThan(0);
      expect(example.diff.length).toBeLessThan(100_000);
    }
  });
});
