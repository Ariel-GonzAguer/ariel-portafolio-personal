'use client';

import { useState } from 'react';
import ReviewForm from './ReviewForm';
import type { ExampleDiff } from './ExampleDiffs';
import ReviewOutput from '../review-output/ReviewOutput';
import type { ReviewResponse } from '../../hooks/useReviewStream/useReviewStream';

/**
 * Workspace cliente del AI Code Reviewer.
 *
 * FASE 3: el diff es estado controlado. Selector de ejemplos lo llena.
 * El submit dispara el handler real de /api/review (FASE 2).
 * FASE 4 reemplazará el fetch por useReviewStream para streaming.
 */
export default function ReviewWorkspace() {
  const [diff, setDiff] = useState('');
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (submittedDiff: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff: submittedDiff }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as ReviewResponse;
      setReview(data);
    } catch (err) {
      console.error('Review error:', err);
      setReview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleSelect = (example: ExampleDiff) => {
    setDiff(example.diff);
    setReview(null);
  };

  return (
    <div className="mx-auto mt-12 grid max-w-6xl gap-12 md:grid-cols-2">
      <ReviewForm
        diff={diff}
        onDiffChange={setDiff}
        onSubmit={handleSubmit}
        onExampleSelect={handleExampleSelect}
        isLoading={isLoading}
      />
      <div>
        {review ? (
          <ReviewOutput review={review} />
        ) : (
          <p className="text-gris-claro">
            El resultado del review aparecerá aquí cuando envíes un diff.
          </p>
        )}
      </div>
    </div>
  );
}
