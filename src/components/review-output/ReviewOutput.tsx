import type { ReviewResponse } from '../../hooks/useReviewStream/useReviewStream';
import FindingCard from './FindingCard';

interface ReviewOutputProps {
  review: ReviewResponse;
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
 * FASE 1: estructura visual. FASE 4+: animación de streaming mientras llegan los tokens.
 */
export default function ReviewOutput({ review }: ReviewOutputProps) {
  return (
    <section aria-label="Resultado del review" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold">Resumen</h2>
        <span
          className={`border px-3 py-1 text-xs font-bold uppercase tracking-wider ${VERDICT_STYLE[review.verdict]}`}
        >
          {VERDICT_LABEL[review.verdict]}
        </span>
      </div>
      <p className="text-gris-claro">{review.summary}</p>

      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold">
          Findings ({review.findings.length})
        </h3>
        {review.findings.length === 0 ? (
          <p className="text-gris-claro">No se encontraron hallazgos.</p>
        ) : (
          review.findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))
        )}
      </div>
    </section>
  );
}
