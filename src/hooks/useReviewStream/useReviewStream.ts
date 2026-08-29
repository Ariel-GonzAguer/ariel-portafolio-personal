'use client';

import { useCallback, useRef, useState } from 'react';
import type { ReviewResponse, ReviewState } from './types';

/**
 * Hook que maneja el streaming de un review desde /api/review.
 *
 * FASE 4: implementa la lectura de Server-Sent Events con
 * ReadableStream.getReader(), parseo incremental del JSON del schema,
 * y cancelación vía AbortController.
 */
export function useReviewStream() {
  const [state, setState] = useState<ReviewState>({
    status: 'idle',
    rawText: '',
    result: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (diff: string, botTrap = false) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({ status: 'loading', rawText: '', result: null, error: null });

    let response: Response;
    try {
      response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff, website: botTrap }),
        signal: ac.signal,
      });
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'AbortError'
          ? 'Cancelado'
          : err instanceof Error
            ? err.message
            : 'Error de red';
      setState({ status: 'error', rawText: '', result: null, error: message });
      return;
    }

    if (!response.ok || !response.body) {
      setState({
        status: 'error',
        rawText: '',
        result: null,
        error: `HTTP ${response.status}`,
      });
      return;
    }

    setState((s) => ({ ...s, status: 'streaming' }));

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let rawText = '';
    let hadError = false;

    const processEvent = (rawEvent: string) => {
      if (!rawEvent.startsWith('data:')) return;
      const payload = rawEvent.slice(5).trim();
      if (!payload) return;
      if (payload === '[DONE]') return;
      try {
        const parsed = JSON.parse(payload) as
          { type: 'delta'; text: string } | { type: 'done' } | { type: 'error'; message: string };
        if (parsed.type === 'delta') {
          rawText += parsed.text;
          setState((s) => ({ ...s, rawText, status: 'streaming' }));
        } else if (parsed.type === 'error') {
          hadError = true;
          setState({
            status: 'error',
            rawText,
            result: null,
            error: parsed.message,
          });
        }
      } catch {
        // Payload malformado: ignorar y continuar.
      }
    };

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) {
          processEvent(event);
        }
      }
      if (buffer.trim()) processEvent(buffer);

      // Si el hook ya marcó error durante el streaming, no pisamos el estado.
      if (hadError) {
        return;
      }

      let result: ReviewResponse | null = null;
      try {
        result = JSON.parse(rawText) as ReviewResponse;
      } catch {
        setState({
          status: 'error',
          rawText,
          result: null,
          error: 'El modelo no devolvió JSON válido.',
        });
        return;
      }

      setState({ status: 'done', rawText, result, error: null });
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'AbortError'
          ? 'Cancelado'
          : err instanceof Error
            ? err.message
            : 'Error leyendo el stream';
      setState((s) => ({
        ...s,
        status: 'error',
        error: message,
        rawText: s.rawText,
      }));
    } finally {
      reader.releaseLock();
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: 'idle', rawText: '', result: null, error: null });
  }, []);

  return { state, start, abort, reset };
}
