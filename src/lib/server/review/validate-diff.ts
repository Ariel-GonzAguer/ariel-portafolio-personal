/**
 * Validador estructural de unified diff.
 *
 * FASE 5: refactorizado. Ya NO detecta prompt injection (eso lo hace
 * detect-injection.ts y se loguea sin rechazar). Solo valida la
 * estructura mínima de un diff.
 *
 * Reglas (todas rechazo con 400):
 * - No vacío
 * - ≤ 50 KB (reducido de 100 KB para limitar superficie de ataque)
 * - Headers --- a/ y +++ b/ presentes
 * - No es binario
 *
 * El sanitize posterior neutraliza backticks, control chars y líneas
 * largas. Si el input no pasa esta validación, se rechaza antes de
 * gastar tokens en OpenAI.
 */

const MAX_DIFF_BYTES = 50_000;

const FORBIDDEN_PATTERNS: { re: RegExp; reason: string }[] = [
  // Binarios: se rechazan siempre (un diff binario no es revisable).
  { re: /^Binary files /m, reason: 'Binary diffs are not supported.' },
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
