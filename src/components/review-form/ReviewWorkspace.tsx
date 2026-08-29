'use client';

import { useState } from 'react';
import { useReviewStream } from '../../hooks/useReviewStream/useReviewStream';
import ReviewForm from './ReviewForm';
import type { ExampleDiff } from './ExampleDiffs';
import ReviewOutput from '../review-output/ReviewOutput';

/**
 * Workspace cliente del AI Code Reviewer.
 *
 * FASE 4: usa el hook useReviewStream que maneja el SSE end-to-end.
 * El diff es estado controlado acá; el form lo recibe y emite onChange.
 * Al elegir un ejemplo nuevo, se llena el diff y se resetea el review.
 */
export default function ReviewWorkspace() {
  const [diff, setDiff] = useState('');
  const { state, start, reset } = useReviewStream();
  const isStreaming = state.status === 'streaming' || state.status === 'loading';

  const handleSubmit = (submittedDiff: string, botTrap: boolean) => {
    void start(submittedDiff, botTrap);
  };

  const handleExampleSelect = (example: ExampleDiff) => {
    setDiff(example.diff);
    reset();
  };

  return (
    <div className="mx-auto mt-12 grid max-w-6xl gap-12 md:grid-cols-2">
      <ReviewForm
        diff={diff}
        onDiffChange={setDiff}
        onSubmit={handleSubmit}
        onExampleSelect={handleExampleSelect}
        isLoading={isStreaming}
      />
      <div>
        {state.status === 'idle' && (
          <p className="text-gris-claro">
            El resultado del review aparecerá aquí cuando envíes un diff.
          </p>
        )}
        {state.status === 'loading' && (
          <p className="text-gris-claro">Conectando con el modelo…</p>
        )}
        {state.status === 'streaming' && (
          <p
            className="text-gris-claro"
            role="status"
            aria-live="polite"
          >
            Streameando respuesta… {state.rawText.length} caracteres
            recibidos.
          </p>
        )}
        {state.status === 'error' && (
          <div
            role="alert"
            className="border border-red-400 bg-red-400/10 p-4"
          >
            <p className="font-bold text-red-300">Error</p>
            <p className="text-sm text-gris-claro">{state.error}</p>
            {state.rawText && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-gris-claro">
                  Ver respuesta parcial
                </summary>
                <pre className="mt-2 overflow-x-auto text-xs text-gris-claro">
                  <code>{state.rawText}</code>
                </pre>
              </details>
            )}
          </div>
        )}
        {state.status === 'done' && state.result && (
          <ReviewOutput review={state.result} />
        )}
      </div>
    </div>
  );
}
