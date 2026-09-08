'use client';

import { useCallback, useRef, useState } from 'react';
import type { ReviewErrorCode, ReviewResponse, ReviewState, ReviewUsage } from './types';

/**
 * Cooldown que se activa cuando el server rechaza por prompt injection.
 * 6 minutos = 360_000 ms. Suficiente para disuadir iteración rápida sin
 * bloquear al usuario legítimo que tipeó accidentalmente un patrón.
 */
const INJECTION_COOLDOWN_MS = 6 * 60 * 1000;
const INJECTION_COOLDOWN_STORAGE_KEY = 'review:injectionCooldownUntil';

/**
 * Hook que maneja el streaming de un review desde /api/review.
 *
 * Lee Server-Sent Events con ReadableStream.getReader(), parsea
 * incrementalmente el JSON del schema y permite cancelar la request
 * vía AbortController.
 *
 * Seguridad: cuando el server devuelve un error estructurado
 * (HTTP 4xx/5xx con `{ error, code }`), el hook expone el `code` en el
 * state para que la UI reaccione según el tipo. Caso especial:
 * `injection_detected` activa un cooldown de 6 minutos vía `cooldownUntil`.
 *
 * Decisión arquitectónica: el cooldown vive en el hook y se persiste
 * en localStorage para sobrevivir refresh. No usa un useEffect del
 * componente. Mantiene la lógica de seguridad encapsulada donde ya corre
 * el flujo del fetch.
 *
 * Cancelación y carreras: `abortRef` guarda el AbortController del
 * request vigente. Cuando un request deja de ser vigente (un `start()`
 * nuevo lo reemplaza o `reset()` anula el ref), sus continuaciones
 * asíncronas retornan sin tocar el state — el request más reciente es el
 * único dueño del estado. El `abort()` manual sí escribe "Cancelado"
 * porque en ese caso el ref sigue apuntando al controller abortado.
 */
export function useReviewStream() {
  const [state, setState] = useState<ReviewState>(() => ({
    status: 'idle',
    rawText: '',
    result: null,
    usage: null,
    error: null,
    code: null,
    cooldownUntil: getStoredInjectionCooldownUntil(),
  }));

  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (diff: string, botTrap = false) => {
    const activeCooldownUntil = getStoredInjectionCooldownUntil();
    if (activeCooldownUntil !== null) {
      setState((current) => ({ ...current, cooldownUntil: activeCooldownUntil }));
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    // Un request es "stale" cuando su controller ya no es el vigente en
    // abortRef: un start() nuevo lo reemplazó o reset() anuló el ref.
    // Las continuaciones asíncronas de un request stale no deben tocar
    // el state; el request más reciente es su único dueño. El abort()
    // manual no anula el ref, así que su catch sí escribe "Cancelado".
    const isStale = () => abortRef.current !== ac;

    setState({
      status: 'loading',
      rawText: '',
      result: null,
      usage: null,
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
      if (isStale()) return;
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
        usage: null,
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
      if (isStale()) return;
      const isInjection = code === 'injection_detected';
      const cooldownUntil = isInjection ? Date.now() + INJECTION_COOLDOWN_MS : null;
      if (cooldownUntil !== null) {
        storeInjectionCooldownUntil(cooldownUntil);
      }
      setState({
        status: 'error',
        rawText: '',
        result: null,
        usage: null,
        error: message,
        code,
        // Activar el cooldown solo si el server rechazó por injection.
        // El timestamp se setea acá (no en un effect) porque es el
        // momento exacto del rechazo, no una reacción a un re-render.
        cooldownUntil,
      });
      return;
    }

    if (isStale()) return;
    setState((s) => ({ ...s, status: 'streaming' }));

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let rawText = '';
    let usage: ReviewUsage | null = null;
    let hadError = false;

    const processEvent = (rawEvent: string) => {
      if (!rawEvent.startsWith('data:')) return;
      const payload = rawEvent.slice(5).trim();
      if (!payload) return;
      if (payload === '[DONE]') return;
      try {
        const parsed = JSON.parse(payload) as
          | { type: 'delta'; text: string }
          | { type: 'usage'; usage: ReviewUsage }
          | { type: 'done' }
          | { type: 'error'; message: string };
        if (parsed.type === 'delta') {
          rawText += parsed.text;
          setState((s) => ({ ...s, rawText, status: 'streaming' }));
        } else if (parsed.type === 'usage' && isReviewUsage(parsed.usage)) {
          usage = parsed.usage;
        } else if (parsed.type === 'error') {
          hadError = true;
          setState({
            status: 'error',
            rawText,
            result: null,
            usage: null,
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
        // Un read() resuelto justo antes de que otro start()/reset()
        // aborte este stream seguiría procesando eventos viejos; el guard
        // corta acá para que no lleguen al state.
        if (isStale()) return;
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
          usage: null,
          error: 'El modelo no devolvió JSON válido.',
          code: null,
          cooldownUntil: null,
        });
        return;
      }

      setState({
        status: 'done',
        rawText,
        result,
        usage,
        error: null,
        code: null,
        cooldownUntil: null,
      });
    } catch (err) {
      if (isStale()) return;
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
    // Anular el ref marca al request en curso como stale: su catch de
    // AbortError no debe escribir "Cancelado" sobre el estado idle.
    abortRef.current = null;
    setState({
      status: 'idle',
      rawText: '',
      result: null,
      usage: null,
      error: null,
      code: null,
      cooldownUntil: getStoredInjectionCooldownUntil(),
    });
  }, []);

  return { state, start, abort, reset };
}

function isReviewUsage(value: ReviewUsage): boolean {
  return [
    value.inputTokens,
    value.cachedInputTokens ?? 0,
    value.cacheWriteInputTokens ?? 0,
    value.outputTokens,
    value.reasoningTokens,
    value.totalTokens,
  ].every((tokenCount) => Number.isFinite(tokenCount) && tokenCount >= 0);
}

function getStoredInjectionCooldownUntil(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.localStorage.getItem(INJECTION_COOLDOWN_STORAGE_KEY);
    if (rawValue === null) return null;

    const cooldownUntil = Number(rawValue);
    if (!Number.isFinite(cooldownUntil) || cooldownUntil <= Date.now()) {
      window.localStorage.removeItem(INJECTION_COOLDOWN_STORAGE_KEY);
      return null;
    }

    return cooldownUntil;
  } catch {
    return null;
  }
}

function storeInjectionCooldownUntil(cooldownUntil: number): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(INJECTION_COOLDOWN_STORAGE_KEY, String(cooldownUntil));
  } catch {
    // Si storage no está disponible, el cooldown en memoria sigue activo.
  }
}
