import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReviewWorkspace from './ReviewWorkspace';
import { EXAMPLE_DIFFS } from './ExampleDiffs';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/**
 * Crea una Response simulada que emite eventos SSE como ReadableStream.
 * Replica el contrato del handler /api/review: chunks `data: {...}\n\n`.
 */
function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

describe('ReviewWorkspace', () => {
  it('muestra el form y el placeholder inicial', () => {
    render(<ReviewWorkspace />);
    expect(screen.getByLabelText(/pega tu unified diff/i)).toBeInTheDocument();
    expect(
      screen.getByText(/el resultado del review aparecerá aquí/i),
    ).toBeInTheDocument();
  });

  it('al elegir un ejemplo, llena el textarea con su diff', () => {
    render(<ReviewWorkspace />);
    const selector = screen.getByLabelText(
      /cargar un ejemplo/i,
    ) as HTMLSelectElement;
    const example = EXAMPLE_DIFFS[0];
    expect(example).toBeDefined();
    if (!example) return;

    fireEvent.change(selector, { target: { value: example.id } });

    const textarea = screen.getByLabelText(
      /pega tu unified diff/i,
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe(example.diff);
  });

  it('después de elegir un ejemplo, el botón de submit queda habilitado', () => {
    render(<ReviewWorkspace />);
    const selector = screen.getByLabelText(
      /cargar un ejemplo/i,
    ) as HTMLSelectElement;
    const example = EXAMPLE_DIFFS[0];
    if (!example) throw new Error('No examples available');

    fireEvent.change(selector, { target: { value: example.id } });
    fireEvent.click(screen.getByRole('checkbox', { name: /los gatos son geniales/i }));

    expect(
      screen.getByRole('button', { name: /revisar diff/i }),
    ).not.toBeDisabled();
  });

  it('al enviar el form, hace POST a /api/review y muestra el review', async () => {
    const review = {
      summary: 'Cambio aceptable.',
      verdict: 'approve',
      findings: [],
    };
    const json = JSON.stringify(review);
    // Partimos el JSON en 3 chunks para simular streaming.
    const halfway = Math.floor(json.length / 2);
    const chunks = [
      JSON.stringify({ type: 'delta', text: json.slice(0, halfway) }),
      JSON.stringify({ type: 'delta', text: json.slice(halfway) }),
      JSON.stringify({ type: 'done' }),
    ];

    const fetchMock = vi.fn().mockResolvedValue(sseResponse(chunks));
    vi.stubGlobal('fetch', fetchMock);

    render(<ReviewWorkspace />);
    const selector = screen.getByLabelText(
      /cargar un ejemplo/i,
    ) as HTMLSelectElement;
    const example = EXAMPLE_DIFFS[0];
    if (!example) throw new Error('No examples available');

    fireEvent.change(selector, { target: { value: example.id } });
    fireEvent.click(screen.getByRole('checkbox', { name: /los gatos son geniales/i }));
    fireEvent.click(screen.getByRole('button', { name: /revisar diff/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/review');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.diff).toBe(example.diff);
    expect(body.website).toBe(false); // honeypot no marcado

    await waitFor(() => {
      expect(screen.getByText(/cambio aceptable/i)).toBeInTheDocument();
    });
  });

  it('muestra mensaje de error si el stream devuelve un error event', async () => {
    const chunks = [
      JSON.stringify({ type: 'error', message: 'OpenAI timeout' }),
    ];
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(chunks));
    vi.stubGlobal('fetch', fetchMock);

    render(<ReviewWorkspace />);
    const example = EXAMPLE_DIFFS[0];
    if (!example) throw new Error('No examples available');
    fireEvent.change(screen.getByLabelText(/cargar un ejemplo/i), {
      target: { value: example.id },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /los gatos son geniales/i }));
    fireEvent.click(screen.getByRole('button', { name: /revisar diff/i }));

    await waitFor(() => {
      expect(screen.getByText(/openai timeout/i)).toBeInTheDocument();
    });
  });
});
