import type { Severity } from '../../hooks/useReviewStream/types';

const STYLES: Record<Severity, string> = {
  critical: 'border-red-500 bg-red-500/15 text-red-300',
  high: 'border-red-400 bg-red-400/10 text-red-300',
  medium: 'border-yellow-400 bg-yellow-400/10 text-yellow-200',
  low: 'border-blue-400 bg-blue-400/10 text-blue-200',
  info: 'border-white/20 bg-white/5 text-white/70',
};

const LABELS: Record<Severity, string> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
  info: 'info',
};

interface SeverityBadgeProps {
  severity: Severity;
}

/**
 * Badge de severidad para un finding del reviewer.
 *
 * FASE 1: solo se renderiza con un color por severidad. Sin interactividad aún.
 */
export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={`inline-block border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${STYLES[severity]}`}
      aria-label={`Severidad ${LABELS[severity]}`}
    >
      {LABELS[severity]}
    </span>
  );
}
