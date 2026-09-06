import { useState } from 'react';
import type { ReviewResponse, ReviewUsage } from '../../hooks/useReviewStream/types';
import { focusClassName } from '../../utils/a11y/a11y';
import { calculateReviewCO2Range } from '../../utils/co2/co2';
import { formatReviewApiCostUSD, REVIEW_MODEL_ID } from '../../utils/review-cost/review-cost';
import FindingCard from './FindingCard';

interface ReviewOutputProps {
  review: ReviewResponse;
  usage?: ReviewUsage | null;
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
export default function ReviewOutput({ review, usage = null }: ReviewOutputProps) {
  const [copied, setCopied] = useState(false);
  const co2Range = usage ? calculateReviewCO2Range(usage.totalTokens) : null;
  const apiCost = usage ? formatReviewApiCostUSD(usage) : null;

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
      {co2Range && (
        <div className="text-green-200">
          <p aria-label="Impacto climático estimado">Impacto climático estimado: {co2Range}</p>
          {apiCost && (
            <p aria-label="Costo API estimado" className="text-orange-200">
              Costo API estimado: {apiCost} (usando {REVIEW_MODEL_ID})
            </p>
          )}
          <p>
            Rango conservador basado en los tokens procesados por la API. El costo usa tarifas
            públicas de OpenAI y no incluye impuestos.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold">Hallazgos ({review.findings.length})</h3>
        {review.findings.length === 0 ? (
          <p className="text-gris-claro">No se encontraron hallazgos.</p>
        ) : (
          review.findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)
        )}
      </div>
    </section>
  );
}
