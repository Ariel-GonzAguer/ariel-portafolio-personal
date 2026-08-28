/**
 * Validador de unified diff.
 *
 * Reglas:
 * - No vacío
 * - ≤ 100 KB
 * - Headers --- a/ y +++ b/ presentes
 * - No es binario
 * - No contiene patrones de prompt injection
 *
 * FASE 2: validación básica. FASE 6 se refuerza con sanitización completa.
 */

const MAX_DIFF_BYTES = 100_000;

const FORBIDDEN_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /^Binary files /m, reason: 'Binary diffs are not supported.' },
  {
    re: /ignore (all )?(previous|prior|above) instructions/i,
    reason: 'Potential prompt injection detected.',
  },
  { re: /<\s*system\s*>/i, reason: 'Potential prompt injection detected.' },
  { re: /you are now/i, reason: 'Potential prompt injection detected.' },
  { re: /\bDAN\b/i, reason: 'Potential prompt injection detected.' },
];

const REQUIRED_HEADERS = [/^--- a\/.+/m, /^\+\+\+ b\/.+/m];

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateDiff(input: string): ValidationResult {
  if (!input || input.trim().length === 0) {
    return { ok: false, reason: 'Diff is empty.' };
  }

  if (input.length > MAX_DIFF_BYTES) {
    return {
      ok: false,
      reason: `Diff is too large (${input.length} bytes). Max is ${MAX_DIFF_BYTES}.`,
    };
  }

  for (const headerRe of REQUIRED_HEADERS) {
    if (!headerRe.test(input)) {
      return {
        ok: false,
        reason: 'Not a unified diff (missing --- a/ or +++ b/ headers).',
      };
    }
  }

  for (const { re, reason } of FORBIDDEN_PATTERNS) {
    if (re.test(input)) {
      return { ok: false, reason };
    }
  }

  return { ok: true };
}
