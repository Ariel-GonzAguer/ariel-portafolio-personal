/**
 * Detector de intentos de prompt injection.
 *
 * A diferencia de validate-diff (que rechaza), este módulo SOLO loguea.
 * El sanitizer ya neutralizó la mayoría de los vectores (backticks,
 * control chars, líneas largas). Este detector captura los intentos
 * obvios para auditoría y métricas.
 *
 * FASE 5 (seguridad): el handler llama a detectInjection() y loguea
 * con console.warn. En producción, Netlify captura los logs.
 */

const INJECTION_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /ignore (all )?(previous|prior|above) instructions/i, label: 'ignore-previous' },
  { re: /<\s*system\s*>/i, label: 'system-tag' },
  { re: /you are now/i, label: 'role-override' },
  { re: /\bDAN\b/i, label: 'dan-jailbreak' },
  { re: /\b(developer|system)\s*mode\b/i, label: 'developer-mode' },
  { re: /reveal (the )?(system|initial) prompt/i, label: 'reveal-prompt' },
  { re: /disregard (all )?(previous|prior) (rules|instructions)/i, label: 'disregard-rules' },
];

export interface InjectionMatch {
  label: string;
  index: number;
  match: string;
}

export function detectInjection(input: string): InjectionMatch[] {
  const matches: InjectionMatch[] = [];
  for (const { re, label } of INJECTION_PATTERNS) {
    const globalRe = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = globalRe.exec(input)) !== null) {
      matches.push({ label, index: m.index, match: m[0] });
      // Protección contra loops infinitos en regex con grupos vacíos.
      if (m.index === globalRe.lastIndex) globalRe.lastIndex++;
    }
  }
  return matches;
}

/**
 * Helper para loguear de forma consistente.
 * Trunca a 200 chars para no spamear los logs con payloads enormes.
 */
export function logInjectionAttempt(
  matches: InjectionMatch[],
  context: { ip?: string; diffLength: number },
): void {
  if (matches.length === 0) return;
  const labels = [...new Set(matches.map((m) => m.label))].join(',');
  const preview = matches[0]?.match.slice(0, 200) ?? '';
  console.warn(
    `[security] prompt injection attempt: labels=${labels} ip=${context.ip ?? 'unknown'} diffLength=${context.diffLength} preview=${JSON.stringify(preview)}`,
  );
}
