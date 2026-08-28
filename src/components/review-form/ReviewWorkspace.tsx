'use client';

import { useState } from 'react';
import ReviewForm from './ReviewForm';
import ReviewOutput from '../review-output/ReviewOutput';
import type { ReviewResponse } from '../../hooks/useReviewStream/useReviewStream';

/**
 * Workspace cliente del AI Code Reviewer.
 *
 * FASE 1: contiene el estado y hace fetch a /api/review (mock).
 * FASE 2: el handler real llama a OpenAI Responses API.
 * FASE 4: conectar a useReviewStream para streaming.
 *
 * Separado del page (que es server) para mantener getConfig en server.
 */
export default function ReviewWorkspace() {
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (diff: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff }),
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

  return (
    <div className="mx-auto mt-12 grid max-w-6xl gap-12 md:grid-cols-2">
      <ReviewForm onSubmit={handleSubmit} isLoading={isLoading} />
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
