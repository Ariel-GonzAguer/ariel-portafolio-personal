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

export interface ReviewState {
  status: ReviewStatus;
  rawText: string;
  result: ReviewResponse | null;
  error: string | null;
}
