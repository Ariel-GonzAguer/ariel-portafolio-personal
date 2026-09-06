/**
 * Tipos compartidos para el AI Code Reviewer.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type Category =
  'security' | 'performance' | 'type_safety' | 'accessibility' | 'correctness' | 'maintainability';

export type Verdict = 'approve' | 'request_changes' | 'comment';

export interface Finding {
  id: string;
  severity: Severity;
  category: Category;
  line: string;
  title: string;
  explanation: string;
  fix: string;
}

export interface ReviewResponse {
  summary: string;
  verdict: Verdict;
  findings: Finding[];
}

export type ReviewStatus = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

/**
 * Codes de error estables que el server puede devolver.
 * El cliente los usa para diferenciar tipos de error sin parsear strings.
 */
export type ReviewErrorCode =
  | 'injection_detected'
  | 'rate_limit'
  | 'origin_not_allowed'
  | 'diff_invalid'
  | 'service_unavailable'
  | (string & {});

export interface ReviewState {
  status: ReviewStatus;
  rawText: string;
  result: ReviewResponse | null;
  error: string | null;
  /**
   * Code estructurado del error, si el server lo proveyó.
   * Permite al cliente reaccionar distinto según el tipo (ej. prompt
   * injection → alert + vaciar + cooldown vs error genérico).
   */
  code: ReviewErrorCode | null;
  /**
   * Timestamp (ms epoch) hasta el cual el envío queda bloqueado por
   * cooldown de seguridad tras un intento de prompt injection.
   * `null` = sin cooldown activo.
   */
  cooldownUntil: number | null;
}
