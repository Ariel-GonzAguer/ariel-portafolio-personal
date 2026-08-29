import type { Finding } from '../../hooks/useReviewStream/types';
import CodeBlock from './CodeBlock';
import SeverityBadge from './SeverityBadge';

interface FindingCardProps {
  finding: Finding;
}

/**
 * Tarjeta para un hallazgo individual del reviewer.
 *
 * El fix se renderiza con syntax highlighting (shiki).
 */
export default function FindingCard({ finding }: FindingCardProps) {
  return (
    <article className="border border-white/12 bg-white/3 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <SeverityBadge severity={finding.severity} />
        <span className="border border-white/15 px-2 py-0.5 text-xs uppercase tracking-wider text-white/70">
          {finding.category.replace('_', ' ')}
        </span>
        <span className="font-mono text-xs text-gris-claro">{finding.line}</span>
        <span className="ml-auto text-xs text-gris-claro">{finding.id}</span>
      </div>
      <h4 className="mt-3 text-lg font-bold">{finding.title}</h4>
      <p className="mt-2 text-sm text-gris-claro">{finding.explanation}</p>
      {finding.fix && <CodeBlock code={finding.fix} />}
    </article>
  );
}
