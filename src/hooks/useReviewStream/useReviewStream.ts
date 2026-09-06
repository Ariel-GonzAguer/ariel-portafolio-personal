'use client';

import { useCallback, useRef, useState } from 'react';
import type { ReviewErrorCode, ReviewResponse, ReviewState } from './types';

/**
 * Cooldown que se activa cuando el server rechaza por prompt injection.
 * 6 minutos = 360_000 ms. Suficiente para disuadir iteración rápida sin
 * bloquear al usuario legítimo que tipeó accidentalmente un patrón.
 */
const INJECTION_COOLDOWN_MS = 6 * 60 * 1000;

/**
 * Hook que maneja el streaming de un review desde /api/review.
 *
 * FASE 4: implementa la lectura de Server-Sent Events con
 * ReadableStream.getReader(), parseo incremental del JSON del schema,
 * y cancelación vía AbortController.
 *
 * FASE 5 (seguridad): cuando el server devuelve un error estructurado
 * (HTTP 4xx/5xx con `{ error, code }`), el hook expone el `code` en el
 * state para que la UI reaccione según el tipo. Caso especial:
 * `injection_detected` activa un cooldown de 6 minutos vía `cooldownUntil`.
 *
 * Decisión arquitectónica: el cooldown vive en el state del hook, no
 * en un useEffect del componente. Esto evita las reglas nuevas de
 * React 19 (`react-hooks/set-state-in-effect`) y mantiene la lógica
 * de seguridad encapsulada donde ya corre el flujo del fetch.
 */
export function useReviewStream() {
  const [state, setState] = useState<ReviewState>({
    status: 'idle',
    rawText: '',
    result: null,
    error: null,
    code: null,
    cooldownUntil: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (diff: string, botTrap = false) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({
      status: 'loading',
      rawText: '',
      result: null,
      error: null,
      code: null,
      cooldownUntil: null,
    });

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
      setState({
        status: 'error',
        rawText: '',
        result: null,
        error: message,
        code: null,
        cooldownUntil: null,
      });
      return;
    }

    if (!response.ok || !response.body) {
      let code: ReviewErrorCode | null = null;
      let message = `HTTP ${response.status}`;
      try {
        const errBody = (await response.json()) as { error?: string; code?: string };
        if (typeof errBody.error === 'string') message = errBody.error;
        if (typeof errBody.code === 'string') code = errBody.code as ReviewErrorCode;
      } catch {
        // Body no era JSON; mantener el fallback.
      }
      const isInjection = code === 'injection_detected';
      setState({
        status: 'error',
        rawText: '',
        result: null,
        error: message,
        code,
        // Activar el cooldown solo si el server rechazó por injection.
        // El timestamp se setea acá (no en un effect) porque es el
        // momento exacto del rechazo, no una reacción a un re-render.
        cooldownUntil: isInjection ? Date.now() + INJECTION_COOLDOWN_MS : null,
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
            code: null,
            cooldownUntil: null,
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
          code: null,
          cooldownUntil: null,
        });
        return;
      }

      setState({ status: 'done', rawText, result, error: null, code: null, cooldownUntil: null });
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
        code: null,
        cooldownUntil: null,
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
    setState({
      status: 'idle',
      rawText: '',
      result: null,
      error: null,
      code: null,
      cooldownUntil: null,
    });
  }, []);

  return { state, start, abort, reset };
}
