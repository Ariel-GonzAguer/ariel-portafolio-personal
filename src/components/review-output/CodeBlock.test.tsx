import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CodeBlock from './CodeBlock';

// Mock de shiki: devuelve HTML con un span que marca el código.
vi.mock('shiki', () => ({
  createHighlighter: vi.fn().mockResolvedValue({
    codeToHtml: (code: string) =>
      `<pre><code><span class="hl">${code}</span></code></pre>`,
  }),
}));

describe('CodeBlock', () => {
  it('muestra el código como fallback mientras carga shiki', () => {
    render(<CodeBlock code="const x = 1;" />);
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('aplica syntax highlighting después de cargar', async () => {
    render(<CodeBlock code="const x = 1;" />);
    await waitFor(() => {
      const container = document.querySelector('.hl');
      expect(container).toBeInTheDocument();
      expect(container?.textContent).toBe('const x = 1;');
    });
  });

  it('pasa el lang a shiki', async () => {
    const shiki = await import('shiki');
    const highlighter = await (shiki.createHighlighter as ReturnType<typeof vi.fn>)();
    const spy = vi.spyOn(highlighter, 'codeToHtml');

    render(<CodeBlock code="print('hi')" lang="python" />);
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("print('hi')", {
        lang: 'python',
        theme: 'github-dark',
      });
    });
  });
});
