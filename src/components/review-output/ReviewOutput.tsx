import { useState } from 'react';
import type { ReviewResponse } from '../../hooks/useReviewStream/types';
import { focusClassName } from '../../utils/a11y/a11y';
import { calculateReviewCO2 } from '../../utils/co2/co2';
import FindingCard from './FindingCard';

interface ReviewOutputProps {
  review: ReviewResponse;
  outputLength?: number;
  inputLength?: number;
}

const VERDICT_LABEL: Record<ReviewResponse['verdict'], string> = {
  approve: 'Aprobar',
  request_changes: 'Solicitar cambios',
  comment: 'Solo comentarios',
};

const VERDICT_STYLE: Record<ReviewResponse['verdict'], string> = {
  approve: 'border-green-400 text-green-300',
  request_changes: 'border-red-400 text-red-300',
  comment: 'border-white/30 text-white/80',
};

/**
 * Render del resultado completo del reviewer: summary, verdict y findings.
 *
 * Incluye botón para copiar el review como JSON al clipboard.
 */
export default function ReviewOutput({
  review,
  outputLength = 0,
  inputLength = 0,
}: ReviewOutputProps) {
  const [copied, setCopied] = useState(false);
  const co2 = calculateReviewCO2(inputLength, outputLength);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(review, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silencioso: el usuario puede copiar manualmente.
    }
  };

  return (
    <section aria-label="Resultado del review" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold">Resumen</h2>
        <span
          className={`border px-3 py-1 text-xs font-bold uppercase tracking-wider ${VERDICT_STYLE[review.verdict]}`}
        >
          {VERDICT_LABEL[review.verdict]}
        </span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className={`ml-auto border border-white/15 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10 ${focusClassName('white')} cursor-pointer!`}
          aria-label="Copiar review como JSON"
        >
          {copied ? 'Copiado ✓' : 'Copiar JSON'}
        </button>
      </div>
      <p className="text-gris-claro">{review.summary}</p>
      <p className="text-xs text-white/40" aria-label="Huella de carbono estimada">
        CO₂ estimado: {co2}
      </p>

      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold">Findings ({review.findings.length})</h3>
        {review.findings.length === 0 ? (
          <p className="text-gris-claro">No se encontraron hallazgos.</p>
        ) : (
          review.findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)
        )}
      </div>
    </section>
  );
}
