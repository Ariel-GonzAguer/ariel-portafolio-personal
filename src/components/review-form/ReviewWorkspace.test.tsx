import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReviewWorkspace from './ReviewWorkspace';
import { EXAMPLE_DIFFS } from './ExampleDiffs';

afterEach(() => {
  vi.restoreAllMocks();
});

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

    expect(
      screen.getByRole('button', { name: /revisar diff/i }),
    ).not.toBeDisabled();
  });

  it('al enviar el form, hace POST a /api/review y muestra el review', async () => {
    const fakeReview = {
      summary: 'Cambio aceptable.',
      verdict: 'approve' as const,
      findings: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(fakeReview), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<ReviewWorkspace />);
    const selector = screen.getByLabelText(
      /cargar un ejemplo/i,
    ) as HTMLSelectElement;
    const example = EXAMPLE_DIFFS[0];
    if (!example) throw new Error('No examples available');

    fireEvent.change(selector, { target: { value: example.id } });
    fireEvent.click(screen.getByRole('button', { name: /revisar diff/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/review');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.diff).toBe(example.diff);
    // honeypot debe ir aunque el form no lo llene (lo llena FormData pero el state no lo incluye)
    // verificamos que diff viene, no honeypot
    expect(body.honeypot).toBeUndefined();

    await waitFor(() => {
      expect(screen.getByText(/cambio aceptable/i)).toBeInTheDocument();
    });
  });
});
